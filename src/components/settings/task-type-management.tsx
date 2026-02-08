'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const taskTypeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  price: z.coerce.number().min(0, 'El precio debe ser un número no negativo.'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Debe ser un color hexadecimal válido (ej: #RRGGBB).'),
});

export function TaskTypeManagement() {
    const firestore = useFirestore();
    const taskTypesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'task_types') : null, [firestore]);
    const { data: taskTypes, isLoading } = useCollection<{name: string, color: string, price: number}>(taskTypesCollection);

    const form = useForm<z.infer<typeof taskTypeSchema>>({
        resolver: zodResolver(taskTypeSchema),
        defaultValues: {
            name: '',
            price: 0,
            color: '#6A29EA',
        }
    });

    function onSubmit(values: z.infer<typeof taskTypeSchema>) {
        if (!firestore) return;
        const newDocRef = doc(collection(firestore, 'task_types'));
        setDocumentNonBlocking(newDocRef, { ...values, id: newDocRef.id }, { merge: true });
        form.reset();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tipos de Tarea</CardTitle>
                <CardDescription>Define los tipos de tareas, asígnales un precio individual y un color para una mejor organización.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-10 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="font-semibold">Añadir Nuevo Tipo de Tarea</h3>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Task</FormLabel>
                                    <FormControl><Input placeholder="Ej: Reel" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="price" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Precio Individual</FormLabel>
                                    <FormControl><Input type="number" min="0" placeholder="Ej: 150" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="color" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color</FormLabel>
                                    <div className="flex items-center gap-2">
                                      <FormControl><Input type="color" className="w-12 h-10 p-1" {...field} /></FormControl>
                                      <FormControl><Input placeholder="#RRGGBB" {...field} /></FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />
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
                                    <TableHead>Muestra</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Precio</TableHead>
                                    <TableHead>Color (Hex)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-5 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    </TableRow>
                                ))}
                                {taskTypes && taskTypes.map(taskType => (
                                    <TableRow key={taskType.id}>
                                        <TableCell><div className="h-5 w-5 rounded-full" style={{ backgroundColor: taskType.color }} /></TableCell>
                                        <TableCell className="font-medium">{taskType.name}</TableCell>
                                        <TableCell><span className="font-mono text-sm">${taskType.price}</span></TableCell>
                                        <TableCell><span className="font-mono text-sm">{taskType.color}</span></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {taskTypes?.length === 0 && !isLoading && (
                            <p className="p-4 text-center text-sm text-muted-foreground">No hay tipos de tarea.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
