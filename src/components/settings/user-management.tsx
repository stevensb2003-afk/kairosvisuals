'use client';

import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemo } from 'react';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const userSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido.'),
  lastName: z.string().min(1, 'El apellido es requerido.'),
  email: z.string().email('Email inválido.'),
  role: z.enum(['Administrativo', 'Creativo'], { required_error: 'El rol es requerido.' }),
});

export function UserManagement() {
    const firestore = useFirestore();
    const { isUserLoading } = useUser();
    const usersCollection = useMemo(() => (firestore && !isUserLoading) ? collection(firestore, 'users') : null, [firestore, isUserLoading]);
    const { data: users, isLoading } = useCollection<{firstName: string, lastName: string, email: string, role: string}>(usersCollection);

    const form = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            role: 'Creativo',
        }
    });

    function onSubmit(values: z.infer<typeof userSchema>) {
        if (!firestore) return;
        const newDocRef = doc(collection(firestore, 'users'));
        
        setDocumentNonBlocking(newDocRef, { ...values, id: newDocRef.id }, { merge: true });

        form.reset();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Perfiles de Usuario</CardTitle>
                <CardDescription>Crea y gestiona los perfiles de los socios y colaboradores.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-10 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="font-semibold">Añadir Nuevo Usuario</h3>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                             <FormField control={form.control} name="firstName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl><Input placeholder="Ej: Juan" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="lastName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Apellido</FormLabel>
                                    <FormControl><Input placeholder="Ej: Pérez" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl><Input placeholder="Ej: juan.perez@example.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="role" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rol</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Administrativo">Administrativo</SelectItem>
                                            <SelectItem value="Creativo">Creativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit">Añadir Usuario</Button>
                        </form>
                    </Form>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold">Usuarios Actuales</h3>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rol</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(isLoading || isUserLoading) && Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    </TableRow>
                                ))}
                                {users && users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'Administrativo' ? 'default' : 'secondary'}>{user.role}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {users?.length === 0 && !(isLoading || isUserLoading) && (
                            <p className="p-4 text-center text-sm text-muted-foreground">No hay usuarios.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
