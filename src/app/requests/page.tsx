'use client';

import React, { useMemo, useState } from 'react';
import { initializeFirebase } from '@/firebase/init';
import { collection, query, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { ServiceRequest } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, Mail, Phone, MessageSquare, Snowflake, Clock, Inbox, RotateCcw, CheckCircle, Building2, Calendar, Search } from "lucide-react";

export default function RequestsPage() {
  const { firestore } = initializeFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const requestsQuery = useMemo(() => query(collection(firestore, 'requests'), orderBy('createdAt', 'desc')), [firestore]);
  const { data: requests, isLoading } = useCollection<ServiceRequest>(requestsQuery);

  const filterBySearch = (list: ServiceRequest[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(r =>
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
      (r.companyName || '').toLowerCase().includes(q) ||
      (r.industry || '').toLowerCase().includes(q) ||
      (r.phone || '').includes(q)
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Reciente';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Reciente';
    return format(date, "d MMM yy", { locale: es });
  };

  const getStatusBadge = (status: string) => {
    const cls = "font-bold px-2 py-0.5 text-xs";
    switch (status) {
      case 'pending':   return <Badge variant="secondary" className={`bg-yellow-500/20 text-yellow-600 ${cls}`}>Pendiente</Badge>;
      case 'reviewed':  return <Badge variant="secondary" className={`bg-blue-500/20 text-blue-600 ${cls}`}>Revisado</Badge>;
      case 'frozen':    return <Badge variant="secondary" className={`bg-cyan-500/20 text-cyan-600 ${cls}`}>Congelado</Badge>;
      case 'converted': return <Badge variant="secondary" className={`bg-green-500/20 text-green-600 ${cls}`}>Convertido</Badge>;
      case 'rejected':  return <Badge variant="destructive" className={`bg-red-500/20 text-red-600 ${cls}`}>Rechazado</Badge>;
      default:          return <Badge variant="outline" className={cls}>{status}</Badge>;
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    if (requests?.find(r => r.id === id)?.status === 'converted') {
      toast({ title: "Acción no permitida", description: "No se puede cambiar el estado de una solicitud ya convertida.", variant: "destructive" });
      return;
    }
    setUpdatingId(id);
    try {
      await updateDoc(doc(firestore, 'requests', id), { status: newStatus });
      toast({ title: "Estado actualizado" });
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const activeRequests  = useMemo(() => filterBySearch(requests?.filter(r => r.status === 'pending' || r.status === 'reviewed') || []), [requests, searchQuery]);
  const frozenRequests  = useMemo(() => filterBySearch(requests?.filter(r => r.status === 'frozen') || []), [requests, searchQuery]);
  const allRequests     = useMemo(() => filterBySearch(requests || []), [requests, searchQuery]);

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <span className="text-muted-foreground animate-pulse font-medium">Cargando prospectos...</span>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
        <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <p className="text-muted-foreground font-medium">No hay solicitudes en esta categoría.</p>
    </div>
  );

  const ActionButtons = ({ req, size = 'default' }: { req: ServiceRequest; size?: 'sm' | 'default' }) => {
    const isSm = size === 'sm';
    return (
      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
        {req.status === 'frozen' && (
          <Button variant="secondary" size="sm"
            className={`bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500 hover:text-white rounded-xl font-bold gap-1 transition-all border border-cyan-500/20 ${isSm ? 'h-8 text-xs px-2.5' : 'h-9 px-3'}`}
            onClick={() => handleStatusUpdate(req.id, 'reviewed')} disabled={updatingId === req.id}>
            {updatingId === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Reactivar
          </Button>
        )}
        {req.status === 'pending' && (
          <Button variant="secondary" size="sm"
            className={`bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white rounded-xl font-bold gap-1 transition-all border border-blue-500/20 ${isSm ? 'h-8 text-xs px-2.5' : 'h-9 px-3'}`}
            onClick={() => handleStatusUpdate(req.id, 'reviewed')} disabled={updatingId === req.id}>
            {updatingId === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
            Revisar
          </Button>
        )}
        <Button variant="ghost" size="icon"
          className={`rounded-xl hover:bg-primary/10 hover:text-primary ${isSm ? 'h-8 w-8' : 'h-9 w-9'}`}
          onClick={() => router.push(`/requests/${req.id}`)}>
          <Eye className={isSm ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </Button>
      </div>
    );
  };

  // Mobile card view
  const renderCards = (data: ServiceRequest[]) => {
    if (isLoading) return <LoadingState />;
    if (data.length === 0) return <EmptyState />;
    return (
      <div className="space-y-3">
        {data.map(req => (
          <Card key={req.id} className="border-border/50 bg-card shadow-sm rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 transition-all active:scale-[0.99]"
            onClick={() => router.push(`/requests/${req.id}`)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base leading-tight truncate">{req.firstName} {req.lastName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" /> {formatDate(req.createdAt)}
                  </p>
                </div>
                {getStatusBadge(req.status)}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-semibold truncate flex-1">{req.companyName || 'Sin nombre'}</span>
                <Badge variant="secondary" className="text-[10px] font-bold uppercase bg-primary/10 text-primary border-none shrink-0">{req.industry}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {req.contactPreference === 'whatsapp' ? <MessageSquare className="w-3.5 h-3.5 text-green-500" /> : <Mail className="w-3.5 h-3.5 text-primary" />}
                  <span className="capitalize font-medium">{req.contactPreference}</span>
                  <span className="mx-0.5">·</span>
                  <Phone className="w-3 h-3" />
                  <span>{req.phone}</span>
                </div>
                <ActionButtons req={req} size="sm" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Desktop table view
  const renderTable = (data: ServiceRequest[]) => (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="font-bold py-4 indent-4">Fecha</TableHead>
            <TableHead className="font-bold py-4">Lead / Persona</TableHead>
            <TableHead className="font-bold py-4">Negocio / Industria</TableHead>
            <TableHead className="font-bold py-4">Medio</TableHead>
            <TableHead className="font-bold py-4">Estado</TableHead>
            <TableHead className="text-right py-4 pr-8">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={6} className="h-64 text-center"><LoadingState /></TableCell></TableRow>
          ) : data.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="h-64 text-center"><EmptyState /></TableCell></TableRow>
          ) : data.map(req => (
            <TableRow key={req.id} className="hover:bg-primary/5 transition-colors group cursor-pointer" onClick={() => router.push(`/requests/${req.id}`)}>
              <TableCell className="font-medium indent-4 border-none py-5">{formatDate(req.createdAt)}</TableCell>
              <TableCell className="border-none py-5">
                <div className="flex flex-col">
                  <span className="font-bold">{req.firstName} {req.lastName}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {req.phone}</span>
                </div>
              </TableCell>
              <TableCell className="border-none py-5">
                <div className="flex flex-col">
                  <span className="font-semibold">{req.companyName || 'Sin Nombre'}</span>
                  <Badge variant="secondary" className="w-fit mt-1 text-[10px] font-bold uppercase bg-primary/10 text-primary border-none">{req.industry}</Badge>
                </div>
              </TableCell>
              <TableCell className="capitalize border-none py-5">
                <div className="flex items-center gap-2">
                  {req.contactPreference === 'whatsapp' ? <MessageSquare className="w-4 h-4 text-green-500" /> : <Mail className="w-4 h-4 text-primary" />}
                  <span className="font-medium">{req.contactPreference}</span>
                </div>
              </TableCell>
              <TableCell className="border-none py-5">{getStatusBadge(req.status)}</TableCell>
              <TableCell className="text-right border-none py-5 pr-6">
                <ActionButtons req={req} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const tabs = [
    { value: 'active', label: 'Activos', icon: Clock, data: activeRequests, count: activeRequests.length, activeClass: 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground' },
    { value: 'frozen', label: 'Congelados', icon: Snowflake, data: frozenRequests, count: frozenRequests.length, activeClass: 'data-[state=active]:bg-cyan-600 data-[state=active]:text-white' },
    { value: 'all', label: 'Todos', icon: Inbox, data: allRequests, count: 0, activeClass: 'data-[state=active]:bg-foreground data-[state=active]:text-background' },
  ];

  const totalActive = useMemo(() => requests?.filter(r => r.status === 'pending' || r.status === 'reviewed').length || 0, [requests]);
  const totalFrozen = useMemo(() => requests?.filter(r => r.status === 'frozen').length || 0, [requests]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300 px-4 py-6 sm:px-6 sm:py-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl sm:text-4xl font-headline font-bold tracking-tight mb-1">Bandeja de Leads</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Revisa y gestiona los briefings enviados por prospectos.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-xl font-bold">
            {totalActive} activos
          </div>
          {totalFrozen > 0 && (
            <div className="px-3 py-1.5 bg-cyan-500/10 text-cyan-600 rounded-xl font-bold">
              {totalFrozen} congelados
            </div>
          )}
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por nombre, empresa, industria o teléfono..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 h-11 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold"
          >✕</button>
        )}
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-background border border-border/50 p-1 rounded-xl mb-5 w-full sm:w-fit flex sm:mr-auto">
          {tabs.map(({ value, label, icon: Icon, count, activeClass }) => (
            <TabsTrigger key={value} value={value}
              className={`flex-1 sm:flex-none rounded-lg px-3 sm:px-5 py-2 transition-all flex items-center justify-center gap-1.5 font-bold text-sm ${activeClass}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {count > 0 && <Badge variant="outline" className="ml-0.5 bg-current/10 border-none text-[10px] px-1.5">{count}</Badge>}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(({ value, data }) => (
          <TabsContent key={value} value={value} className="mt-0">
            <div className="md:hidden">{renderCards(data)}</div>
            <div className="hidden md:block">{renderTable(data)}</div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
