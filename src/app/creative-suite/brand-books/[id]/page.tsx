'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase/provider';
import { getBrandBookById, deleteBrandBook } from '@/lib/brandbookService';
import { BrandBook } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Loader2, Palette } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BrandBookDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const auth = useAuth();
  const [book, setBook] = useState<BrandBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const db = useFirestore();

  useEffect(() => {
    const fetchBook = async () => {
      if (!db) return;
      try {
        const data = await getBrandBookById(db, params.id);
        if (data) {
          setBook(data as BrandBook);
        } else {
          alert('Brand Book no encontrado');
          router.push('/creative-suite/brand-books');
        }
      } catch (error) {
        console.error('Error fetching brand book:', error);
        alert('Error al cargar el Brand Book');
      } finally {
        setIsLoading(false);
      }
    };

    if (auth?.currentUser) {
      fetchBook();
    }
  }, [params.id, auth, router]);

  const handleDelete = async () => {
    if (!db) return;
    if (confirm('¿Estás seguro de que deseas eliminar este Brand Book? Esta acción no se puede deshacer.')) {
      setIsDeleting(true);
      try {
        await deleteBrandBook(db, params.id);
        alert('Brand Book eliminado');
        router.push('/creative-suite/brand-books');
      } catch (error) {
        console.error('Error deleting brand book:', error);
        alert('Error al eliminar');
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-headline font-bold">{book.name}</h1>
            <p className="text-muted-foreground mt-1">
              {book.industry || 'Industria no especificada'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Eliminar
          </Button>
          {/* We'll implement Edit later */}
          <Button variant="outline" disabled>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Identidad Básica */}
        <div className="space-y-6">
          <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold font-headline border-b pb-2">Identidad Básica</h2>
            
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Misión</h3>
              <p className="text-sm bg-background/50 p-3 rounded-lg border">{book.mission || 'No definida'}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Público Meta</h3>
              <p className="text-sm bg-background/50 p-3 rounded-lg border">{book.targetAudience || 'No definido'}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tono de Voz</h3>
              <div className="flex flex-wrap gap-2">
                {book.tone && book.tone.length > 0 ? (
                  book.tone.map((t, idx) => (
                    <Badge key={idx} variant="secondary">{t}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground italic">No definido</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Identidad Visual */}
        <div className="space-y-6">
          <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold font-headline border-b pb-2 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Identidad Visual
            </h2>
            
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Colores</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-16 h-16 rounded-full border-2 shadow-md"
                    style={{ backgroundColor: book.visualIdentity?.primaryColor || '#000' }}
                  />
                  <span className="text-xs font-mono">{book.visualIdentity?.primaryColor || 'N/A'}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Primario</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-16 h-16 rounded-full border-2 shadow-md"
                    style={{ backgroundColor: book.visualIdentity?.secondaryColor || '#fff' }}
                  />
                  <span className="text-xs font-mono">{book.visualIdentity?.secondaryColor || 'N/A'}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Secundario</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-16 h-16 rounded-full border-2 shadow-md"
                    style={{ backgroundColor: book.visualIdentity?.tertiaryColor || '#aaa' }}
                  />
                  <span className="text-xs font-mono">{book.visualIdentity?.tertiaryColor || 'N/A'}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Terciario</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tipografía</h3>
              <div className="space-y-3 bg-background/50 p-4 rounded-lg border">
                <div>
                  <span className="text-xs text-muted-foreground">Principal (Títulos)</span>
                  <p className="font-medium">{book.visualIdentity?.typography?.primary || 'No definida'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Secundaria (Cuerpo)</span>
                  <p className="font-medium">{book.visualIdentity?.typography?.secondary || 'No definida'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Estilo Gráfico</h3>
              <p className="text-sm bg-background/50 p-3 rounded-lg border">{book.visualIdentity?.graphicStyle || 'No definido'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
