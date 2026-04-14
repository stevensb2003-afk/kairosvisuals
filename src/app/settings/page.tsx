'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Palette, Package, Building2, ClipboardList, ShieldAlert } from 'lucide-react';
import { UserManagement } from '@/components/settings/user-management';
import { CompanySettings } from '@/components/settings/company-settings';
import { BriefingConfig } from '@/components/settings/briefing-config';
import { SecurityConfig } from '@/components/settings/security-config';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();

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
      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full lg:max-w-5xl max-w-full grid-cols-4 h-auto">
          <TabsTrigger value="company" className="py-2">
            <Building2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Empresa e Impuestos</span>
            <span className="sm:hidden">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="py-2">
            <Users className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Gestor de Usuarios</span>
            <span className="sm:hidden">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="briefing" className="py-2">
            <ClipboardList className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Briefing Form</span>
            <span className="sm:hidden">Briefing</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="py-2">
            <ShieldAlert className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Seguridad (Team Code)</span>
            <span className="sm:hidden">Seguridad</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="company" className="mt-4">
          <CompanySettings />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UserManagement />
        </TabsContent>
        <TabsContent value="briefing" className="mt-4">
          <BriefingConfig />
        </TabsContent>
        <TabsContent value="security" className="mt-4">
          <SecurityConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
