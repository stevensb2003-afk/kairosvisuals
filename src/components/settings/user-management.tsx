'use client';

import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemo } from 'react';
import { collection } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function UserManagement() {
    const firestore = useFirestore();
    const { isUserLoading } = useUser();
    const usersCollection = useMemo(() => (firestore && !isUserLoading) ? collection(firestore, 'users') : null, [firestore, isUserLoading]);
    const { data: users, isLoading } = useCollection<{id: string, firstName: string, lastName: string, email: string, role: string}>(usersCollection);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Perfiles de Usuario</CardTitle>
                <CardDescription>Aquí se listan los perfiles de los socios y colaboradores registrados.</CardDescription>
            </CardHeader>
            <CardContent>
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
                                            <Badge variant={user.role === 'Administrador' ? 'default' : 'secondary'}>{user.role}</Badge>
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
