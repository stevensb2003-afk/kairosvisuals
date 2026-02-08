'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const packSchema = z.object({
  name: z.string().min(1, 'El nombre del pack es requerido.'),
  price: z.coerce.number().min(0, 'El precio debe ser un número positivo.'),
  taskTypeQuantities: z.array(z.object({
      taskTypeId: z.string().min(1, 'Debes seleccionar un tipo de tarea.'),
      quantity: z.coerce.number().min(1, 'La cantidad debe ser al menos 1.'),
  })).min(1, 'Debes incluir al menos un tipo de tarea.'),
});

type TaskType = { id: string; name: string; };
type Pack = { id: string; name: string; price: number; taskTypeQuantities: { taskTypeId: string; quantity: number }[]; };

export function PackManagement() {
    const firestore = useFirestore();
    const { isUserLoading } = useUser();
    const packsCollection = useMemo(() => (firestore && !isUserLoading) ? collection(firestore, 'packs') : null, [firestore, isUserLoading]);
    const { data: packs, isLoading: isLoadingPacks } = useCollection<Pack>(packsCollection);
    
    const taskTypesCollection = useMemo(() => (firestore && !isUserLoading) ? collection(firestore, 'task_types') : null, [firestore, isUserLoading]);
    const { data: taskTypes, isLoading: isLoadingTaskTypes } = useCollection<TaskType>(taskTypesCollection);

    const [newTaskType, setNewTaskType] = useState('');
    const [newQuantity, setNewQuantity] = useState(1);
    
    const form = useForm<z.infer<typeof packSchema>>({
        resolver: zodResolver(packSchema),
        defaultValues: {
            name: '',
            price: 0,
            taskTypeQuantities: [],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "taskTypeQuantities"
    });

    function handleAddTask() {
        if (!newTaskType || newQuantity < 1) return;
        append({ taskTypeId: newTaskType, quantity: newQuantity });
        setNewTaskType('');
        setNewQuantity(1);
    }
    
    function onSubmit(values: z.infer<typeof packSchema>) {
        if (!firestore) return;
        const newDocRef = doc(collection(firestore, 'packs'));
        setDocumentNonBlocking(newDocRef, { ...values, id: newDocRef.id }, { merge: true });
        form.reset();
    }

    const getTaskTypeName = (id: string) => taskTypes?.find(t => t.id === id)?.name || 'Desconocido';
    const isLoading = isUserLoading || isLoadingPacks || isLoadingTaskTypes;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestor de Packs</CardTitle>
                <CardDescription>Configura los planes mensuales, define qué tareas incluyen y establece sus precios.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-10 md:grid-cols-2">
                <div className="space-y-4">
                     <h3 className="font-semibold">Añadir Nuevo Pack</h3>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Pack</FormLabel>
                                    <FormControl><Input placeholder="Ej: Pack Social Media Starter" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="price" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Precio Base (CRC Mensual)</FormLabel>
                                    <FormControl><Input type="number" placeholder="Ej: 300000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <div className="space-y-2">
                                <FormLabel>Inclusiones del Pack</FormLabel>
                                <div className="p-3 border rounded-md space-y-3">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex items-center justify-between">
                                            <p className="text-sm">{getTaskTypeName(field.taskTypeId)} x {field.quantity}</p>
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                     {fields.length > 0 && <Separator />}
                                     <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <Label className="text-xs text-muted-foreground">Tipo de Tarea</Label>
                                            <Select value={newTaskType} onValueChange={setNewTaskType}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Seleccionar..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {isLoadingTaskTypes && <SelectItem value="loading" disabled>Cargando...</SelectItem>}
                                                    {taskTypes?.map(tt => <SelectItem key={tt.id} value={tt.id}>{tt.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-20">
                                            <Label className="text-xs text-muted-foreground">Cantidad</Label>
                                            <Input type="number" value={newQuantity} onChange={e => setNewQuantity(parseInt(e.target.value, 10))} className="h-9" min="1" />
                                        </div>
                                        <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={handleAddTask} disabled={!newTaskType || newQuantity < 1}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <FormMessage>{form.formState.errors.taskTypeQuantities?.message || form.formState.errors.taskTypeQuantities?.root?.message}</FormMessage>
                            </div>
                            
                            <Button type="submit">Crear Pack</Button>
                        </form>
                    </Form>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold">Packs Actuales</h3>
                    <div className="space-y-4">
                         {isLoading && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                         {packs && packs.map(pack => (
                             <Card key={pack.id}>
                                <CardHeader className="flex-row items-start justify-between p-4">
                                    <div>
                                        <CardTitle className="text-lg">{pack.name}</CardTitle>
                                        <CardDescription className="text-primary font-bold text-lg">₡{pack.price.toLocaleString('es-CR')}/mes</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <h4 className="text-sm font-semibold mb-2">Incluye:</h4>
                                    <div className="space-y-1">
                                        {pack.taskTypeQuantities.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center text-sm">
                                                <span>{getTaskTypeName(item.taskTypeId)}</span>
                                                <Badge variant="secondary">{item.quantity} / mes</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                             </Card>
                         ))}
                         {packs?.length === 0 && !isLoading && (
                            <div className="border rounded-md p-4 text-center text-sm text-muted-foreground">
                                No hay packs configurados.
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

    
