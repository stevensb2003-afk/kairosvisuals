'use client';

import React, { useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilePlus2, Search, Filter, FileText, Loader2 } from "lucide-react";
import { cn } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Quotation } from '@/lib/types';
import { useQuotationsList } from './_hooks/useQuotationsList';
import { QuotationsTable } from './_components/QuotationsTable';
import { QuotationPreviewDialog } from './_components/QuotationPreviewDialog';

export default function SolicitudesPage() {
  const {
    loading,
    quotations,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    companySettings,
    isExporting,
    isAccepting,
    handleDelete,
    handlePublish,
    handleAccept,
    handleShare,
    handleDownload
  } = useQuotationsList();

  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = (q: Quotation) => {
    setPreviewQuotation(q);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight text-primary">Propuestas</h1>
          <p className="text-muted-foreground mt-1">Gestión centralizada de cotizaciones y presentaciones comerciales.</p>
        </div>
        <Link href="/solicitudes/create">
          <Button className="rounded-full px-6 shadow-lg shadow-primary/20 hover:scale-105 transition-all font-bold">
            <FilePlus2 className="mr-2 w-5 h-5"/> Nueva Propuesta
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center mb-2">
        <div className="relative flex-1 w-full max-w-xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Buscar por cliente o título de propuesta..." 
            className="pl-12 h-12 bg-slate-900/50 border-white/5 focus:border-primary/50 transition-all rounded-2xl placeholder:text-muted-foreground/40 shadow-sm text-base text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-muted/20 p-1.5 rounded-2xl border border-border/40 backdrop-blur-sm">
          <div className="px-3 py-1 flex items-center gap-2 border-r border-border/40 sm:flex hidden">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/70">Estado</span>
          </div>
          <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[calc(100vw-4rem)]">
            {['all', 'draft', 'published', 'accepted'].map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "rounded-xl text-[10px] font-bold uppercase tracking-wider h-9 px-4 transition-all whitespace-nowrap",
                  statusFilter === s 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                    : "text-muted-foreground hover:bg-white/10 hover:text-white"
                )}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'Todos' : s === 'draft' ? 'Borradores' : s === 'published' ? 'Enviadas' : 'Aceptadas'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="border-none bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center h-80">
            <Loader2 className="w-10 h-10 animate-spin text-primary/40 mb-4" />
            <p className="text-muted-foreground animate-pulse font-medium">Cargando propuestas comerciales...</p>
          </CardContent>
        </Card>
      ) : quotations.length === 0 ? (
        <Card className="border-2 border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center h-80 text-center p-8">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-primary/20" />
            </div>
            <h3 className="text-xl font-bold font-headline mb-2">No se encontraron propuestas</h3>
            <p className="max-w-[400px] text-muted-foreground mb-8">
              {searchTerm || statusFilter !== 'all' 
                ? "No hay resultados para los filtros aplicados. Intenta con otros términos." 
                : "Aún no has creado ninguna propuesta comercial. Comienza una ahora para formalizar tus servicios."}
            </p>
            {!(searchTerm || statusFilter !== 'all') && (
              <Link href="/solicitudes/create">
                <Button variant="outline" className="rounded-full px-8 border-primary/20 text-primary hover:bg-primary/5 font-bold">
                  <FilePlus2 className="mr-2 w-4 h-4" /> Crear mi primera propuesta
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-border/50 shadow-sm rounded-2xl">
          <QuotationsTable 
            quotations={quotations}
            isAccepting={isAccepting}
            onPreview={handlePreview}
            onDelete={handleDelete}
            onPublish={handlePublish}
            onAccept={handleAccept}
          />
        </Card>
      )}

      <QuotationPreviewDialog 
        isOpen={isPreviewOpen}
        setIsOpen={setIsPreviewOpen}
        quotation={previewQuotation}
        companySettings={companySettings}
        isExporting={isExporting}
        onShare={handleShare}
        onDownload={handleDownload}
      />
    </div>
  );
}
