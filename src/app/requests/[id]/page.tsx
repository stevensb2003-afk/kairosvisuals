'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { initializeFirebase } from '@/firebase/init';
import { collection, doc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { ServiceRequest, DEFAULT_CLIENT_BUSINESS_FIELDS } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Mail, 
  Phone, 
  MessageSquare, 
  Building, 
  Target, 
  Calendar,
  Globe,
  ExternalLink,
  Loader2,
  Trash2,
  Snowflake,
  UserCheck,
  Eye
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { firestore } = initializeFirebase();
  
  const docRef = useMemo(() => doc(firestore, 'requests', id), [firestore, id]);
  const { data: request, isLoading } = useDoc<ServiceRequest>(docRef);
  
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Reciente';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Reciente';
    return format(date, "PPP p", { locale: es });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30 font-bold px-4 py-1">Pendiente</Badge>;
      case 'reviewed': return <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 font-bold px-4 py-1">Revisado</Badge>;
      case 'frozen': return <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-600 hover:bg-cyan-500/30 font-bold px-4 py-1">Congelado</Badge>;
      case 'converted': return <Badge variant="secondary" className="bg-green-500/20 text-green-600 hover:bg-green-500/30 font-bold px-4 py-1">Convertido</Badge>;
      case 'rejected': return <Badge variant="destructive" className="bg-red-500/20 text-red-600 hover:bg-red-500/30 font-bold px-4 py-1">Rechazado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const convertToClient = async () => {
    if (!request) return;
    setIsUpdating(true);
    try {
      // 1. Create client document with standardized ID
      const newClientId = `cli_${Date.now()}`;
      const clientData = {
        id: newClientId,
        requestId: id, // Original request ID for reference
        onboardingType: 'briefing' as const,
        firstName: request.firstName,
        lastName: request.lastName,
        clientName: `${request.firstName} ${request.lastName}`,
        company: request.companyName || '',
        clientEmail: request.email || '',
        clientPhone: request.phone || '',
        
        // Briefing data (transferred from ServiceRequest)
        industry: request.industry || '',
        aboutBusiness: request.aboutBusiness || '',
        hasSocials: request.hasSocials || false,
        socials: request.socials || [],
        expectations: request.expectations || [],
        mainGoals: request.mainGoals || [],
        motivation: request.motivation || '',
        contactSource: request.contactSource || '',
        contactPreference: request.contactPreference || 'whatsapp',
        
        // Default business fields
        ...DEFAULT_CLIENT_BUSINESS_FIELDS,
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const newClientRef = doc(collection(firestore, 'clients'), newClientId);
      await setDoc(newClientRef, clientData);
      
      // 2. Update request status
      await updateDoc(docRef, { 
        status: 'converted',
        updatedAt: new Date().toISOString()
      });
      
      toast({
        title: "¡Conversión Exitosa!",
        description: `${request.firstName} ahora es un cliente. Redirigiendo...`,
      });
      
      // 3. Redirect to clients list
      setTimeout(() => router.push('/clients'), 2000);
      
    } catch (error) {
      console.error("Error en conversión:", error);
      toast({
        title: "Error en conversión",
        description: "No se pudo crear el perfil del cliente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (isConverted) {
      toast({
        title: "Acción bloqueada",
        description: "No se puede cambiar el estado de una solicitud ya convertida.",
        variant: "destructive",
      });
      return;
    }

    if (newStatus === 'converted') {
      const confirmConversion = window.confirm("¿Seguro que deseas convertir este prospecto en cliente? Se generará un perfil de cliente con toda la información del briefing.");
      if (confirmConversion) {
        await convertToClient();
      }
      return;
    }

    setIsUpdating(true);
    try {
      await updateDoc(docRef, { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast({
        title: "Estado actualizado",
        description: `Se ha cambiado el estado a ${newStatus} correctamente.`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la solicitud.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "✅ Información Copiada",
      description: `Se ha copiado el ${field === 'phone' ? 'teléfono' : 'correo'} al portapapeles.`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isConverted = request?.status === 'converted';

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-muted/5">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse text-lg">Cargando detalles del prospecto...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-6 bg-muted/5">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center shadow-inner">
          <Trash2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold font-headline mb-2">Solicitud no encontrada</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Es posible que el prospecto haya sido eliminado o que el ID sea incorrecto.</p>
        </div>
        <Button onClick={() => router.push('/requests')} variant="outline" className="rounded-2xl px-8 h-12 font-bold border-primary/20 hover:bg-primary/5 transition-all">
          <ArrowLeft className="mr-2 h-5 w-5" /> Volver a la Bandeja
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/5 pb-20 selection:bg-primary/20">
      {/* Header Sticky */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/5 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/requests')}
              className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all shrink-0"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold font-headline leading-none mb-1">
                {request.firstName} {request.lastName}
              </h1>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Recibido el {formatDate(request.createdAt)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="hidden md:block mr-2 text-right">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Gestión de Lead</p>
              <p className="text-xs font-medium text-muted-foreground">Última actualización: hoy</p>
            </div>
            <div className="flex items-center gap-2">
              <Select 
                value={request.status} 
                onValueChange={handleStatusChange}
                disabled={isUpdating || isConverted}
              >
                <SelectTrigger className="w-[180px] h-12 bg-background border-primary/10 rounded-xl font-bold shadow-sm focus:ring-primary/20">
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="reviewed">Revisado</SelectItem>
                  <SelectItem value="frozen" className="text-cyan-600 font-bold">
                    <div className="flex items-center gap-2">
                      <Snowflake className="w-3 h-3" /> Congelar
                    </div>
                  </SelectItem>
                  <SelectItem value="converted" className="text-green-600 font-bold">
                    <div className="flex items-center gap-2">
                       <UserCheck className="w-3 h-3" /> Convertir en Cliente
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected" className="text-red-600">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {isConverted && (
        <div className="bg-green-600/10 border-b border-green-500/20 py-3 px-6 animate-in slide-in-from-top duration-500 overflow-hidden relative">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-green-700 font-bold">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/20">
                <Check className="w-5 h-5" />
              </div>
              <p className="text-sm">¡Este prospecto ya es un cliente oficial! Toda la información ha sido migrada.</p>
            </div>
            <Button 
               variant="outline" 
               size="sm" 
               className="bg-background border-green-500/20 hover:bg-green-500/10 text-green-700 font-bold rounded-xl"
               onClick={() => router.push(`/clients?openLead=${id}`)}
            >
              <Eye className="mr-2 h-4 w-4" /> Ver Ficha de Cliente
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Lado Izquierdo: Información de Contacto y Perfil */}
          <div className="lg:col-span-4 space-y-8">
            {/* Tarjeta de Contacto */}
            <Card className="rounded-[2.5rem] border-primary/5 shadow-xl shadow-primary/5 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/10 to-transparent pb-6">
                <CardTitle className="flex items-center gap-2 text-xl font-headline font-black uppercase tracking-tight">
                  <Mail className="w-6 h-6 text-primary" /> Contacto Directo
                </CardTitle>
                <CardDescription className="font-medium">Vías de comunicación rápidas.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                {/* Teléfono */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Teléfono / WhatsApp</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-5 bg-muted/40 rounded-2xl border border-primary/10 font-bold text-lg flex items-center justify-between group hover:border-primary/30 transition-all cursor-default shadow-sm">
                      <span className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                          <Phone className="w-5 h-5" />
                        </div>
                        <span className="text-xl tracking-tight">{request.phone}</span>
                      </span>
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className={`rounded-xl h-12 w-12 transition-all shadow-sm ${copiedField === 'phone' ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-background hover:bg-primary/10 hover:text-primary'}`}
                        onClick={() => copyToClipboard(request.phone, 'phone')}
                      >
                        {copiedField === 'phone' ? <Check className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    className="w-full h-12 rounded-2xl font-bold bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg shadow-green-500/20 flex items-center gap-2"
                    onClick={() => window.open(`https://wa.me/${(request?.phone || '').replace(/\D/g, '')}`, '_blank')}
                    disabled={!request?.phone}
                  >
                    <MessageSquare className="w-5 h-5" /> Iniciar Chat WhatsApp
                  </Button>
                </div>

                <Separator className="bg-primary/5" />

                {/* Email */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Correo Electrónico</p>
                  <div className="flex-1 p-5 bg-muted/40 rounded-2xl border border-primary/10 font-bold flex items-center justify-between group hover:border-primary/30 transition-all cursor-default shadow-sm">
                    <span className="flex items-center gap-4 truncate pr-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                        <Mail className="w-5 h-5" />
                      </div>
                      <span className="truncate text-base">{request.email || 'No proporcionado'}</span>
                    </span>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className={`rounded-xl h-12 w-12 transition-all shadow-sm ${copiedField === 'email' ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-background hover:bg-primary/10 hover:text-primary'}`}
                      onClick={() => request.email && copyToClipboard(request.email, 'email')}
                    >
                      {copiedField === 'email' ? <Check className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
                    </Button>
                  </div>
                  {request.email && (
                    <Button 
                        variant="ghost"
                        className="w-full h-12 rounded-2xl font-bold text-primary hover:bg-primary/5 flex items-center gap-3 transition-colors group"
                        onClick={() => window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${request.email}`, '_blank')}
                    >
                        <Mail className="w-4 h-4 group-hover:animate-bounce" />
                        Redactar en Gmail Directo
                    </Button>
                  )}
                </div>

                <Separator className="bg-primary/5" />

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Fuente</span>
                    <Badge variant="outline" className="text-xs font-bold bg-background border-primary/20 text-primary">{request.contactSource}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Preferencia</span>
                    <Badge variant="outline" className="text-xs font-bold bg-primary/20 text-primary border-none flex items-center gap-2">
                      {request.contactPreference === 'whatsapp' ? <MessageSquare className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                      {(request?.contactPreference || 'No especificado').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Redes Sociales */}
            {request.hasSocials && (
              <Card className="rounded-[2.5rem] border-primary/5 shadow-xl shadow-primary/5">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-headline font-bold">Presencia Digital</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {request.socials.map((social, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/30 group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
                          {social.platform[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">{social.platform}</span>
                          <span className="font-bold text-sm tracking-tight">{social.handle}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Lado Derecho: Cuerpo Principal del Briefing */}
          <div className="lg:col-span-8 space-y-10">
            {isConverted ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center bg-green-500/5 rounded-[3rem] border-2 border-dashed border-green-500/20 gap-8 animate-in mt-2 duration-700">
                <div className="w-24 h-24 rounded-full bg-green-500 text-white flex items-center justify-center shadow-2xl shadow-green-500/40">
                  <UserCheck className="w-12 h-12" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl font-headline font-black tracking-tight text-green-800">Briefing Migrado</h2>
                  <p className="text-green-700/70 font-medium max-w-md mx-auto text-lg leading-relaxed">
                    Esta solicitud ha sido convertida satisfactoriamente. Los datos ahora residen en el expediente maestro del CRM.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <Button 
                    size="lg" 
                    className="rounded-2xl font-black px-10 h-16 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                    onClick={() => router.push(`/clients?openLead=${id}`)}
                  >
                    Abrir Perfil del Cliente
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Sección: El Negocio */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                      <Building className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-headline font-black text-foreground tracking-tight">Análisis del Negocio</h2>
                      <p className="text-muted-foreground font-medium">Contexto comercial e identidad industrial.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-card border border-primary/5 rounded-[2rem] shadow-sm space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Nombre de Marca</p>
                        <p className="text-2xl font-black text-primary font-headline tracking-tighter">{request.companyName || 'Sin Nombre Específico'}</p>
                    </div>
                    <div className="p-8 bg-card border border-primary/5 rounded-[2rem] shadow-sm space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Sector / Industria</p>
                        <Badge className="text-lg font-bold bg-primary/10 text-primary border-none px-4 py-2 rounded-2xl">
                            {request.industry}
                        </Badge>
                    </div>
                  </div>

                  <div className="group p-10 bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-[3rem] shadow-inner">
                    <div className="flex items-center gap-3 mb-6">
                       <Target className="w-5 h-5 text-primary" />
                       <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ADN del Negocio y Actividad</h3>
                    </div>
                    <p className="text-xl leading-relaxed font-medium text-foreground/90 italic decoration-primary/20 decoration-2 underline-offset-8">
                      "{request.aboutBusiness}"
                    </p>
                  </div>
                </section>

                <Separator className="bg-primary/5" />

                {/* Sección: Metas y Aspiraciones */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                      <Target className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-headline font-black text-foreground tracking-tight">Objetivos Estratégicos</h2>
                      <p className="text-muted-foreground font-medium">Lo que el cliente busca lograr con Kairos.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Expectativas */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Check className="w-4 h-4" />
                            </div>
                            <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">¿Qué espera lograr?</h4>
                        </div>
                        <div className="space-y-3">
                            {(request?.expectations || []).map((e, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-background border border-border/50 rounded-2xl shadow-sm hover:border-primary/20 transition-all">
                                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                    <span className="font-bold text-sm">{e}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Objetivos de Crecimiento */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent-foreground">
                                <Target className="w-4 h-4" />
                            </div>
                            <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Metas de Crecimiento</h4>
                        </div>
                        <div className="space-y-3">
                            {(request?.mainGoals || []).map((g, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-background border border-border/50 rounded-2xl shadow-sm hover:border-accent/20 transition-all">
                                    <div className="w-2 h-2 rounded-full bg-accent-foreground/50 shrink-0" />
                                    <span className="font-bold text-sm">{g}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>

                  {/* Motivación */}
                  <div className="p-10 bg-primary/10 rounded-[3rem] border border-primary/20 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4 opacity-70">Factor de Conversión / Dolores</p>
                        <h3 className="text-2xl font-black text-primary leading-tight font-headline">
                          {request.motivation}
                        </h3>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-all duration-700" />
                  </div>
                </section>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
