'use client';

import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useMemo, useEffect } from 'react';
import { Trash2, Plus, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';


const baseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'El color debe ser un código hexadecimal válido (ej: #RRGGBB)').optional().default('#888888'),
  useComplexityMatrix: z.boolean().default(false),
  complexityTiers: z.array(
    z.object({
      level: z.number(),
      name: z.string(),
      surcharge: z.coerce.number().min(0, 'El recargo no puede ser negativo.'),
    })
  ).optional(),
});

const fixedSchema = baseSchema.extend({
  pricingModel: z.literal('fixed'),
  price: z.coerce.number().min(0, 'El precio es requerido.'),
});

const scalableSchema = baseSchema.extend({
  pricingModel: z.literal('scalable'),
  basePrice: z.coerce.number().min(0, 'El precio base es requerido.'),
  includedUnits: z.coerce.number().min(0, 'Las unidades incluidas son requeridas.'),
  unitPrice: z.coerce.number().min(0, 'El precio por unidad adicional es requerido.'),
});

const packageSchema = baseSchema.extend({
    pricingModel: z.literal('package'),
    packages: z.array(
        z.object({
            units: z.coerce.number().min(1, "Las unidades deben ser al menos 1."),
            price: z.coerce.number().min(0, "El precio no puede ser negativo."),
        })
    ).min(1, "Debes añadir al menos un paquete."),
});

const taskTypeSchema = z.discriminatedUnion('pricingModel', [fixedSchema, scalableSchema, packageSchema]).superRefine((data, ctx) => {
    if (data.useComplexityMatrix) {
        if (!data.complexityTiers || data.complexityTiers.length !== 4) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['complexityTiers'],
                message: 'Debes definir los 4 niveles de complejidad.',
            });
        }
    }
});

type TaskType = {
    id: string;
    name: string;
    color?: string;
    useComplexityMatrix?: boolean;
    complexityTiers?: { level: number; name: string; surcharge: number; }[];
} & ({
    pricingModel: 'fixed';
    price: number;
} | {
    pricingModel: 'scalable';
    basePrice: number;
    includedUnits: number;
    unitPrice: number;
} | {
    pricingModel: 'package';
    packages: { units: number; price: number; }[];
});

export function TaskTypeManagement() {
    const firestore = useFirestore();
    const { isUserLoading } = useUser();
    const taskTypesCollection = useMemo(() => (firestore && !isUserLoading) ? collection(firestore, 'task_types') : null, [firestore, isUserLoading]);
    const { data: taskTypes, isLoading } = useCollection<TaskType>(taskTypesCollection);
    const [editingTaskType, setEditingTaskType] = useState<TaskType | null>(null);

    const form = useForm<z.infer<typeof taskTypeSchema>>({
        resolver: zodResolver(taskTypeSchema),
        defaultValues: {
            name: '',
            color: '#888888',
            pricingModel: 'fixed',
            price: 0,
            useComplexityMatrix: false,
            complexityTiers: [
                { level: 0, name: 'Estándar', surcharge: 0 },
                { level: 1, name: 'Bajo', surcharge: 500 },
                { level: 2, name: 'Medio', surcharge: 1500 },
                { level: 3, name: 'Alto', surcharge: 2000 },
            ],
        },
    });

    const editForm = useForm<z.infer<typeof taskTypeSchema>>({
        resolver: zodResolver(taskTypeSchema),
    });

    useEffect(() => {
        if (editingTaskType) {
            editForm.reset(editingTaskType);
        }
    }, [editingTaskType, editForm]);

    const { fields: packageFields, append: appendPackage, remove: removePackage } = useFieldArray({
        control: form.control,
        name: "packages"
    });
    
    const { fields: editPackageFields, append: appendEditPackage, remove: removeEditPackage } = useFieldArray({
        control: editForm.control,
        name: "packages"
    });

    const [newPackageUnits, setNewPackageUnits] = useState(1);
    const [newPackagePrice, setNewPackagePrice] = useState(0);
    const [editPackageUnits, setEditPackageUnits] = useState(1);
    const [editPackagePrice, setEditPackagePrice] = useState(0);

    const pricingModel = form.watch('pricingModel');
    const useComplexityMatrix = form.watch('useComplexityMatrix');
    const complexityTiersValues = form.watch('complexityTiers');

    const editPricingModel = editForm.watch('pricingModel');
    const editUseComplexityMatrix = editForm.watch('useComplexityMatrix');
    const editComplexityTiersValues = editForm.watch('complexityTiers');

    function handleAddPackage() {
        if (newPackageUnits <= 0 || newPackagePrice < 0) return;
        appendPackage({ units: newPackageUnits, price: newPackagePrice });
        setNewPackageUnits(1);
        setNewPackagePrice(0);
    }
    
    function handleEditAddPackage() {
        if (editPackageUnits <= 0 || editPackagePrice < 0) return;
        appendEditPackage({ units: editPackageUnits, price: editPackagePrice });
        setEditPackageUnits(1);
        setEditPackagePrice(0);
    }

    function onSubmit(values: z.infer<typeof taskTypeSchema>) {
        if (!firestore) return;
        const newDocRef = doc(collection(firestore, 'task_types'));

        const dataToSave = { ...values, id: newDocRef.id };
        if (!dataToSave.useComplexityMatrix) {
            delete (dataToSave as any).complexityTiers;
        }

        setDocumentNonBlocking(newDocRef, dataToSave, { merge: true });
        form.reset();
    }
    
    function onEditSubmit(values: z.infer<typeof taskTypeSchema>) {
        if (!firestore || !editingTaskType) return;
        const docRef = doc(firestore, 'task_types', editingTaskType.id);

        const dataToSave = { ...values, id: editingTaskType.id };
        if (!dataToSave.useComplexityMatrix) {
            delete (dataToSave as any).complexityTiers;
        }

        setDocumentNonBlocking(docRef, dataToSave, { merge: true });
        setEditingTaskType(null);
    }

    const handleDelete = (id: string) => {
        if (!firestore) return;
        if (window.confirm('¿Estás seguro de que deseas eliminar este tipo de tarea?')) {
            const docRef = doc(firestore, 'task_types', id);
            deleteDocumentNonBlocking(docRef);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Tipos de Tarea</CardTitle>
                    <CardDescription>Define los tipos de tareas y asígnales un precio fijo o variable para trabajos puntuales.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-10 md:grid-cols-2">
                    <div className="space-y-4">
                        <h3 className="font-semibold">Añadir Nuevo Tipo de Tarea</h3>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre del Servicio</FormLabel>
                                        <FormControl><Input placeholder="Ej: Landing Page" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                
                                <FormField control={form.control} name="pricingModel" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Modelo de Precios</FormLabel>
                                        <Select 
                                            onValueChange={(value) => {
                                                const newModel = value as 'fixed' | 'scalable' | 'package';
                                                field.onChange(newModel);
                                                
                                                if (newModel === 'fixed') {
                                                    form.setValue('price', 0);
                                                } else if (newModel === 'scalable') {
                                                    form.setValue('basePrice', 25000);
                                                    form.setValue('includedUnits', 4);
                                                    form.setValue('unitPrice', 4000);
                                                } else if (newModel === 'package') {
                                                    form.setValue('packages', []);
                                                }
                                            }} 
                                            defaultValue={field.value}
                                        >
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="fixed">Fijo (Único)</SelectItem>
                                                <SelectItem value="scalable">Escalable (Lineal)</SelectItem>
                                                <SelectItem value="package">Paquetes (Tiers)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                {pricingModel === 'fixed' && (
                                    <FormField control={form.control} name="price" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Precio Fijo (CRC)</FormLabel>
                                            <FormControl><Input type="number" min="0" placeholder="Ej: 40000" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}

                               {pricingModel === 'scalable' && (
                                    <div className='space-y-4 rounded-md border p-4'>
                                        <FormField control={form.control} name="basePrice" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Precio Base (CRC)</FormLabel>
                                                <FormControl><Input type="number" min="0" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="includedUnits" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Unidades Incluidas</FormLabel>
                                                <FormControl><Input type="number" min="0" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="unitPrice" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Precio por Unidad Adicional (CRC)</FormLabel>
                                                <FormControl><Input type="number" min="0" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                               )}

                                {pricingModel === 'package' && (
                                    <div className="space-y-2">
                                    <FormLabel>Configuración de Paquetes</FormLabel>
                                    <div className="p-3 border rounded-md space-y-3">
                                        {packageFields.map((field, index) => (
                                            <div key={field.id} className="flex items-center justify-between">
                                                <p className="text-sm">{field.units} unidades por ₡{field.price.toLocaleString('es-CR')}</p>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePackage(index)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                        {packageFields.length > 0 && <Separator />}
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <Label className="text-xs text-muted-foreground">Unidades</Label>
                                                <Input type="number" value={newPackageUnits} onChange={e => setNewPackageUnits(parseInt(e.target.value, 10))} className="h-9" min="1" />
                                            </div>
                                            <div className="flex-1">
                                                <Label className="text-xs text-muted-foreground">Precio (CRC)</Label>
                                                <Input type="number" value={newPackagePrice} onChange={e => setNewPackagePrice(parseInt(e.target.value, 10))} className="h-9" min="0" />
                                            </div>
                                            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={handleAddPackage} disabled={newPackageUnits <= 0 || newPackagePrice < 0}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <FormMessage>{form.formState.errors.packages?.message || form.formState.errors.packages?.root?.message}</FormMessage>
                                </div>
                                )}

                                <FormField
                                    control={form.control}
                                    name="useComplexityMatrix"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5">
                                                <FormLabel>
                                                    Usar Matriz de Complejidad
                                                </FormLabel>
                                                <FormDescription>
                                                    Añadir recargos por unidad basados en complejidad.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {useComplexityMatrix && (
                                    <div className='space-y-4 rounded-md border p-4'>
                                        <Label>Matriz de Complejidad (Recargo por unidad)</Label>
                                        {complexityTiersValues?.map((tier, index) => (
                                            <FormField key={tier.level} control={form.control} name={`complexityTiers.${index}.surcharge`} render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between">
                                                        <FormLabel className='font-normal'>{tier.name}</FormLabel>
                                                        <FormControl>
                                                            <div className='flex items-center gap-2'>
                                                                <span>+ ₡</span>
                                                                <Input type="number" min="0" className="w-32 h-8" {...field} />
                                                            </div>
                                                        </FormControl>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        ))}
                                        {form.formState.errors.complexityTiers && (
                                            <p className="text-sm font-medium text-destructive">{form.formState.errors.complexityTiers.message}</p>
                                        )}
                                    </div>
                                )}


                                <FormField
                                    control={form.control}
                                    name="color"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Color</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center gap-2">
                                                    <Input type="color" {...field} className="w-12 h-10 p-1" />
                                                    <Input type="text" {...field} placeholder="#888888" className="w-28"/>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit">Añadir Tipo de Tarea</Button>
                            </form>
                        </Form>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold">Tipos de Tarea Actuales</h3>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Servicio</TableHead>
                                        <TableHead>Modelo</TableHead>
                                        <TableHead>Detalles de Precio</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(isLoading || isUserLoading) && Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))}
                                    {taskTypes && taskTypes.map(taskType => (
                                        <TableRow key={taskType.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: taskType.color || '#888888' }} />
                                                    <span>{taskType.name}</span>
                                                    {taskType.useComplexityMatrix && <Badge variant="outline">Complejidad</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className='capitalize'>{taskType.pricingModel}</Badge>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {taskType.pricingModel === 'fixed' && `₡${taskType.price.toLocaleString('es-CR')}`}
                                                {taskType.pricingModel === 'scalable' && `Base: ₡${taskType.basePrice.toLocaleString('es-CR')}`}
                                                {taskType.pricingModel === 'package' && `${taskType.packages.length} paquetes`}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTaskType(taskType)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(taskType.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {taskTypes?.length === 0 && !(isLoading || isUserLoading) && (
                                <p className="p-4 text-center text-sm text-muted-foreground">No hay tipos de tarea.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Dialog open={!!editingTaskType} onOpenChange={(open) => !open && setEditingTaskType(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar Tipo de Tarea</DialogTitle>
                        <DialogDescription>Modifica los detalles para "{editingTaskType?.name}".</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto p-1">
                        <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4 pr-3">
                                <FormField control={editForm.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre del Servicio</FormLabel>
                                        <FormControl><Input placeholder="Ej: Landing Page" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                
                                <FormField control={editForm.control} name="pricingModel" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Modelo de Precios</FormLabel>
                                        <Select 
                                            onValueChange={(value) => {
                                                const newModel = value as 'fixed' | 'scalable' | 'package';
                                                field.onChange(newModel);
                                                
                                                if (newModel === 'fixed') {
                                                    editForm.setValue('price', 0);
                                                } else if (newModel === 'scalable') {
                                                    editForm.setValue('basePrice', 25000);
                                                    editForm.setValue('includedUnits', 4);
                                                    editForm.setValue('unitPrice', 4000);
                                                } else if (newModel === 'package') {
                                                    editForm.setValue('packages', []);
                                                }
                                            }} 
                                            defaultValue={field.value}
                                        >
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="fixed">Fijo (Único)</SelectItem>
                                                <SelectItem value="scalable">Escalable (Lineal)</SelectItem>
                                                <SelectItem value="package">Paquetes (Tiers)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                {editPricingModel === 'fixed' && (
                                    <FormField control={editForm.control} name="price" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Precio Fijo (CRC)</FormLabel>
                                            <FormControl><Input type="number" min="0" placeholder="Ej: 40000" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}

                               {editPricingModel === 'scalable' && (
                                    <div className='space-y-4 rounded-md border p-4'>
                                        <FormField control={editForm.control} name="basePrice" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Precio Base (CRC)</FormLabel>
                                                <FormControl><Input type="number" min="0" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={editForm.control} name="includedUnits" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Unidades Incluidas</FormLabel>
                                                <FormControl><Input type="number" min="0" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={editForm.control} name="unitPrice" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Precio por Unidad Adicional (CRC)</FormLabel>
                                                <FormControl><Input type="number" min="0" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                               )}

                                {editPricingModel === 'package' && (
                                    <div className="space-y-2">
                                    <FormLabel>Configuración de Paquetes</FormLabel>
                                    <div className="p-3 border rounded-md space-y-3">
                                        {editPackageFields.map((field, index) => (
                                            <div key={field.id} className="flex items-center justify-between">
                                                <p className="text-sm">{field.units} unidades por ₡{field.price.toLocaleString('es-CR')}</p>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeEditPackage(index)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                        {editPackageFields.length > 0 && <Separator />}
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <Label className="text-xs text-muted-foreground">Unidades</Label>
                                                <Input type="number" value={editPackageUnits} onChange={e => setEditPackageUnits(parseInt(e.target.value, 10))} className="h-9" min="1" />
                                            </div>
                                            <div className="flex-1">
                                                <Label className="text-xs text-muted-foreground">Precio (CRC)</Label>
                                                <Input type="number" value={editPackagePrice} onChange={e => setEditPackagePrice(parseInt(e.target.value, 10))} className="h-9" min="0" />
                                            </div>
                                            <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={handleEditAddPackage} disabled={editPackageUnits <= 0 || editPackagePrice < 0}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <FormMessage>{editForm.formState.errors.packages?.message || editForm.formState.errors.packages?.root?.message}</FormMessage>
                                </div>
                                )}

                                <FormField
                                    control={editForm.control}
                                    name="useComplexityMatrix"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5">
                                                <FormLabel>
                                                    Usar Matriz de Complejidad
                                                </FormLabel>
                                                <FormDescription>
                                                    Añadir recargos por unidad basados en complejidad.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {editUseComplexityMatrix && (
                                    <div className='space-y-4 rounded-md border p-4'>
                                        <Label>Matriz de Complejidad (Recargo por unidad)</Label>
                                        {editComplexityTiersValues?.map((tier, index) => (
                                            <FormField key={tier.level} control={editForm.control} name={`complexityTiers.${index}.surcharge`} render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between">
                                                        <FormLabel className='font-normal'>{tier.name}</FormLabel>
                                                        <FormControl>
                                                            <div className='flex items-center gap-2'>
                                                                <span>+ ₡</span>
                                                                <Input type="number" min="0" className="w-32 h-8" {...field} />
                                                            </div>
                                                        </FormControl>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        ))}
                                        {editForm.formState.errors.complexityTiers && (
                                            <p className="text-sm font-medium text-destructive">{editForm.formState.errors.complexityTiers.message}</p>
                                        )}
                                    </div>
                                )}


                                <FormField
                                    control={editForm.control}
                                    name="color"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Color</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center gap-2">
                                                    <Input type="color" {...field} className="w-12 h-10 p-1" />
                                                    <Input type="text" {...field} placeholder="#888888" className="w-28"/>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end">
                                    <Button type="submit">Guardar Cambios</Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
