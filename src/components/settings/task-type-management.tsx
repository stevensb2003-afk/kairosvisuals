'use client';

import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useMemo } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';


const baseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'El color debe ser un código hexadecimal válido (ej: #RRGGBB)').optional().default('#888888'),
});

const fixedSchema = baseSchema.extend({
  pricingModel: z.literal('fixed'),
  price: z.coerce.number().min(0, 'El precio debe ser un número no negativo.'),
});

const variableSchema = baseSchema.extend({
  pricingModel: z.literal('variable'),
  basePrice: z.coerce.number().min(0, 'El precio base es requerido.'),
  includedPages: z.coerce.number().min(0, 'Las páginas incluidas son requeridas.'),
  additionalPageCost: z.coerce.number().min(0, 'El costo por página adicional es requerido.'),
  complexityTiers: z.array(
    z.object({
      level: z.number(),
      name: z.string(),
      surcharge: z.coerce.number().min(0, 'El recargo no puede ser negativo.'),
    })
  ).length(4, 'Debes definir los 4 niveles de complejidad.'),
});

const taskTypeSchema = z.discriminatedUnion('pricingModel', [fixedSchema, variableSchema]);


type ComplexityTier = {
    level: number;
    name: string;
    surcharge: number;
};

type TaskType = {
    id: string;
    name: string;
    color?: string;
} & ({
    pricingModel: 'fixed';
    price: number;
} | {
    pricingModel: 'variable';
    basePrice: number;
    includedPages: number;
    additionalPageCost: number;
    complexityTiers: ComplexityTier[];
});

export function TaskTypeManagement() {
    const firestore = useFirestore();
    const { isUserLoading } = useUser();
    const taskTypesCollection = useMemo(() => (firestore && !isUserLoading) ? collection(firestore, 'task_types') : null, [firestore, isUserLoading]);
    const { data: taskTypes, isLoading } = useCollection<TaskType>(taskTypesCollection);

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', price: 0, color: '#888888' });

    const form = useForm<z.infer<typeof taskTypeSchema>>({
        resolver: zodResolver(taskTypeSchema),
        defaultValues: {
            name: '',
            color: '#888888',
            pricingModel: 'fixed',
            price: 0,
        },
    });

    const pricingModel = form.watch('pricingModel');
    const complexityTiersValues = form.watch('complexityTiers');

    function onSubmit(values: z.infer<typeof taskTypeSchema>) {
        if (!firestore) return;
        const newDocRef = doc(collection(firestore, 'task_types'));
        setDocumentNonBlocking(newDocRef, { ...values, id: newDocRef.id }, { merge: true });
        form.reset({
            name: '',
            color: '#888888',
            pricingModel: 'fixed',
            price: 0,
        });
    }

    const handleEditClick = (taskType: TaskType) => {
        if (taskType.pricingModel === 'variable') return;
        setEditingTaskId(taskType.id);
        setEditForm({ name: taskType.name, price: taskType.price || 0, color: taskType.color || '#888888' });
    };

    const handleCancelEdit = () => {
        setEditingTaskId(null);
    };

    const handleSaveEdit = (id: string) => {
        if (!firestore) return;
        const docRef = doc(firestore, 'task_types', id);
        updateDocumentNonBlocking(docRef, editForm);
        setEditingTaskId(null);
    };

    const handleDelete = (id: string) => {
        if (!firestore) return;
        if (window.confirm('¿Estás seguro de que deseas eliminar este tipo de tarea?')) {
            const docRef = doc(firestore, 'task_types', id);
            deleteDocumentNonBlocking(docRef);
        }
    };

    return (
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
                                    <FormLabel>Nombre del Task</FormLabel>
                                    <FormControl><Input placeholder="Ej: Landing Page" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                             <FormField control={form.control} name="pricingModel" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Modelo de Precios</FormLabel>
                                    <Select 
                                        onValueChange={(value) => {
                                            const newModel = value as 'fixed' | 'variable';
                                            field.onChange(newModel);
                                            if (newModel === 'variable') {
                                                form.setValue('basePrice', 25000);
                                                form.setValue('includedPages', 4);
                                                form.setValue('additionalPageCost', 4000);
                                                form.setValue('complexityTiers', [
                                                    { level: 0, name: 'Básico', surcharge: 0 },
                                                    { level: 1, name: 'Bajo', surcharge: 500 },
                                                    { level: 2, name: 'Medio', surcharge: 1500 },
                                                    { level: 3, name: 'Alto', surcharge: 2000 },
                                                ]);
                                            } else {
                                                form.setValue('price', 0);
                                            }
                                        }} 
                                        defaultValue={field.value}
                                    >
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="fixed">Fijo</SelectItem>
                                            <SelectItem value="variable">Variable</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {pricingModel === 'fixed' && (
                                 <FormField control={form.control} name="price" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio Individual (CRC)</FormLabel>
                                        <FormControl><Input type="number" min="0" placeholder="Ej: 85000" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            )}

                           {pricingModel === 'variable' && (
                                <div className='space-y-4 rounded-md border p-4'>
                                    <FormField control={form.control} name="basePrice" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Precio Base (CRC)</FormLabel>
                                            <FormControl><Input type="number" min="0" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="includedPages" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Páginas Incluidas</FormLabel>
                                            <FormControl><Input type="number" min="0" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name="additionalPageCost" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Costo Página Adicional (CRC)</FormLabel>
                                            <FormControl><Input type="number" min="0" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Separator />
                                    <Label>Recargos por Complejidad (por página)</Label>
                                    {complexityTiersValues?.map((tier, index) => (
                                        <FormField key={tier.level} control={form.control} name={`complexityTiers.${index}.surcharge`} render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center justify-between">
                                                    <FormLabel>{tier.name}</FormLabel>
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
                                    <TableHead>Color</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Precio</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(isLoading || isUserLoading) && Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-5 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))}
                                {taskTypes && taskTypes.map(taskType => (
                                    <TableRow key={taskType.id}>
                                        {editingTaskId === taskType.id ? (
                                            <>
                                                <TableCell>
                                                    <Input
                                                        type="color"
                                                        value={editForm.color}
                                                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                                                        className="h-8 w-10 p-1"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        value={editForm.price}
                                                        onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSaveEdit(taskType.id)}>
                                                            <Check className="h-4 w-4 text-green-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                                                            <X className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        ) : (
                                            <>
                                                <TableCell>
                                                    <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: taskType.color || '#888888' }} />
                                                </TableCell>
                                                <TableCell className="font-medium">{taskType.name}</TableCell>
                                                <TableCell>
                                                    {taskType.pricingModel === 'fixed' ? (
                                                        <span className="font-mono text-sm">₡{(taskType.price || 0).toLocaleString('es-CR')}</span>
                                                    ) : (
                                                        <Badge variant="outline">Variable</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                     <div className="flex items-center justify-end gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                {/* Wrapper div for Tooltip to correctly handle disabled state */}
                                                                <div>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-8 w-8" 
                                                                        onClick={() => handleEditClick(taskType)} 
                                                                        disabled={taskType.pricingModel === 'variable'}
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TooltipTrigger>
                                                            {taskType.pricingModel === 'variable' && (
                                                                <TooltipContent>
                                                                    <p>La edición de precios variables no está disponible aquí.</p>
                                                                </TooltipContent>
                                                            )}
                                                        </Tooltip>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(taskType.id)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        )}
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
    );
}
