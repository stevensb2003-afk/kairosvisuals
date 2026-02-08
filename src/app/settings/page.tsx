'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Palette, Package } from 'lucide-react';
import { UserManagement } from '@/components/settings/user-management';
import { TaskTypeManagement } from '@/components/settings/task-type-management';
import { PackManagement } from '@/components/settings/pack-management';
import { useUser, useAuth } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  if (isUserLoading || !user) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Configuraciones</h1>
        <p className="text-muted-foreground">
          Administración general para personalizar y escalar el negocio.
        </p>
      </div>
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Gestor de Usuarios
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <Palette className="mr-2 h-4 w-4" />
            Gestor de Tasks
          </TabsTrigger>
          <TabsTrigger value="packs">
            <Package className="mr-2 h-4 w-4" />
            Gestor de Packs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        <TabsContent value="tasks">
          <TaskTypeManagement />
        </TabsContent>
        <TabsContent value="packs">
          <PackManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

    