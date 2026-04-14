'use client';

import React, { useMemo } from 'react';
import { initializeFirebase } from '@/firebase/init';
import { collection, query, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { ServiceRequest } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Eye, 
  Mail, 
  Phone, 
  MessageSquare, 
  Snowflake, 
  Clock, 
  Inbox, 
  RotateCcw,
  UserCheck,
  CheckCircle
} from "lucide-react";

export default function RequestsPage() {
  const { firestore } = initializeFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  
  const requestsQuery = useMemo(() => {
    return query(collection(firestore, 'requests'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: requests, isLoading } = useCollection<ServiceRequest>(requestsQuery);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Reciente';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Reciente';
    return format(date, "PPP", { locale: es });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30 font-bold px-3 py-1">Pendiente</Badge>;
      case 'reviewed': return <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 font-bold px-3 py-1">Revisado</Badge>;
      case 'frozen': return <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-600 hover:bg-cyan-500/30 font-bold px-3 py-1">Congelado</Badge>;
      case 'converted': return <Badge variant="secondary" className="bg-green-500/20 text-green-600 hover:bg-green-500/30 font-bold px-3 py-1">Convertido</Badge>;
      case 'rejected': return <Badge variant="destructive" className="bg-red-500/20 text-red-600 hover:bg-red-500/30 font-bold px-3 py-1">Rechazado</Badge>;
      default: return <Badge variant="outline" className="font-bold px-3 py-1">{status}</Badge>;
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    // Safeguard: Check if request is already converted
    const currentRequest = requests?.find(r => r.id === id);
    if (currentRequest?.status === 'converted') {
      toast({
        title: "Acción no permitida",
        description: "No se puede cambiar el estado de una solicitud ya convertida.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingId(id);
    try {
      const docRef = doc(firestore, 'requests', id);
      await updateDoc(docRef, { status: newStatus });
      toast({
        title: "Estado actualizado",
        description: `La solicitud ha sido marcada como ${newStatus === 'reviewed' ? 'Revisada' : newStatus === 'pending' ? 'Pendiente' : newStatus === 'frozen' ? 'Congelada' : newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating request status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la solicitud.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const activeRequests = useMemo(() => {
    return requests?.filter(r => r.status === 'pending' || r.status === 'reviewed') || [];
  }, [requests]);

  const frozenRequests = useMemo(() => {
    return requests?.filter(r => r.status === 'frozen') || [];
  }, [requests]);

  const allRequests = useMemo(() => {
    return requests || [];
  }, [requests]);

  const renderTable = (data: ServiceRequest[]) => (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden scale-in">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="font-bold py-4 indent-4">Fecha</TableHead>
            <TableHead className="font-bold py-4">Lead / Persona</TableHead>
            <TableHead className="font-bold py-4">Negocio / Industria</TableHead>
            <TableHead className="font-bold py-4">Medio Contacto</TableHead>
            <TableHead className="font-bold py-4">Estado</TableHead>
            <TableHead className="text-right py-4 pr-8">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-64 text-center">
                <div className="flex flex-col justify-center items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-muted-foreground animate-pulse font-medium">Cargando prospectos...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-64 text-center">
                 <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground font-medium">No hay solicitudes en esta categoría.</p>
                 </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((req) => (
              <TableRow 
                key={req.id} 
                className="hover:bg-primary/5 transition-colors group cursor-pointer" 
                onClick={() => router.push(`/requests/${req.id}`)}
              >
                <TableCell className="font-medium indent-4 border-none py-6">{formatDate(req.createdAt)}</TableCell>
                <TableCell className="border-none py-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-base">{req.firstName} {req.lastName}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {req.phone}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="border-none py-6">
                  <div className="flex flex-col">
                    <span className="font-semibold">{req.companyName || 'Sin Nombre'}</span>
                    <Badge variant="secondary" className="w-fit mt-1 text-[10px] font-bold uppercase tracking-tighter bg-primary/10 text-primary border-none">
                      {req.industry}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="capitalize border-none py-6">
                  <div className="flex items-center gap-2">
                     {req.contactPreference === 'whatsapp' ? <MessageSquare className="w-4 h-4 text-green-500" /> : <Mail className="w-4 h-4 text-primary" />}
                     <span className="font-medium">{req.contactPreference}</span>
                  </div>
                </TableCell>
                <TableCell className="border-none py-6">{getStatusBadge(req.status)}</TableCell>
                <TableCell className="text-right border-none py-6 pr-8">
                  <div className="flex items-center justify-end gap-2">
                    {req.status === 'frozen' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500 hover:text-white rounded-xl font-bold h-9 gap-2 transition-all shadow-sm border border-cyan-500/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(req.id, 'reviewed');
                        }}
                        disabled={updatingId === req.id}
                      >
                        {updatingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                        Reactivar
                      </Button>
                    )}
                    
                    {req.status === 'pending' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white rounded-xl font-bold h-9 gap-2 transition-all shadow-sm border border-blue-500/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(req.id, 'reviewed');
                        }}
                        disabled={updatingId === req.id}
                      >
                        {updatingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Revisar
                      </Button>
                    )}

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="group-hover:bg-primary group-hover:text-primary-foreground rounded-xl transition-all h-9 w-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/requests/${req.id}`);
                      }}
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 px-4 py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-headline font-bold tracking-tight mb-2">Bandeja de Entrada (Leads)</h2>
          <p className="text-muted-foreground text-lg">
            Revisa y gestiona los briefings enviados por prospectos.
          </p>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-background border border-border/50 p-1 rounded-xl mb-6">
          <TabsTrigger value="active" className="rounded-lg px-6 py-2 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 font-bold">
            <Clock className="w-4 h-4" /> Activos
            {activeRequests.length > 0 && <Badge variant="outline" className="ml-1 bg-primary-foreground/10 border-none text-[10px]">{activeRequests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="frozen" className="rounded-lg px-6 py-2 transition-all data-[state=active]:bg-cyan-600 data-[state=active]:text-white flex items-center gap-2 font-bold">
            <Snowflake className="w-4 h-4" /> Congelados
            {frozenRequests.length > 0 && <Badge variant="outline" className="ml-1 bg-cyan-100 text-cyan-700 border-none text-[10px]">{frozenRequests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg px-6 py-2 transition-all data-[state=active]:bg-foreground data-[state=active]:text-background flex items-center gap-2 font-bold">
            <Inbox className="w-4 h-4" /> Todos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          {renderTable(activeRequests)}
        </TabsContent>
        
        <TabsContent value="frozen" className="mt-0">
          {renderTable(frozenRequests)}
        </TabsContent>

        <TabsContent value="all" className="mt-0">
          {renderTable(allRequests)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
