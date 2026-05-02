'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase/provider';
import { getBrandBookById, deleteBrandBook, updateBrandBook } from '@/lib/brandbookService';
import { BrandBook } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Loader2, Palette } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InlineTextField } from '@/components/creative-suite/brand-books/inline-text-field';
import { InlineTagEditor } from '@/components/creative-suite/brand-books/inline-tag-editor';

/** Retrocompatibilidad: values puede venir como string legacy o string[] */
function normalizeValuesArray(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return String(raw).split(',').map((s: string) => s.trim()).filter(Boolean);
}

export default function BrandBookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const auth = useAuth();
  const db = useFirestore();
  const [book, setBook] = useState<BrandBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      if (!db) return;
      try {
        const data = await getBrandBookById(db, id);
        if (data) {
          setBook({ ...data, values: normalizeValuesArray((data as any).values) });
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
    if (auth?.currentUser) fetchBook();
  }, [id, auth, router, db]);

  // Auto-save: updates a specific field and reflects it locally
  const saveField = useCallback(
    async (patch: Partial<BrandBook>) => {
      if (!db) return;
      await updateBrandBook(db, id, patch);
      setBook(prev => prev ? { ...prev, ...patch } : prev);
    },
    [db, id]
  );

  const handleDelete = async () => {
    if (!db) return;
    if (confirm('¿Estás seguro de que deseas eliminar este Brand Book? Esta acción no se puede deshacer.')) {
      setIsDeleting(true);
      try {
        await deleteBrandBook(db, id);
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

  const valuesArray = Array.isArray(book.values) ? book.values : normalizeValuesArray(book.values);
  const toneArray = Array.isArray(book.tone) ? book.tone : [];

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-32 px-4 sm:px-8 mt-4">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-primary/10">
        <div className="space-y-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full mb-2 bg-muted/50 hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="border-primary/20 text-primary uppercase tracking-widest text-[10px] font-black">
                Manual de Marca
              </Badge>
              {book.industry && (
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{book.industry}</span>
              )}
            </div>
            {/* Brand name — inline editable */}
            <InlineTextField
              value={book.name}
              onSave={(v) => saveField({ name: v })}
              displayClassName="text-5xl md:text-6xl font-headline font-bold tracking-tight -mx-3"
            />
            {/* Slogan — inline editable tagline */}
            <div className="mt-2 -mx-3">
              <InlineTextField
                value={book.slogan || ''}
                onSave={(v) => saveField({ slogan: v })}
                placeholder="Agrega un slogan..."
                emptyLabel="Sin slogan — click para agregar"
                displayClassName="text-xl text-muted-foreground font-medium italic"
              />
            </div>
          </div>
        </div>

        <Button
          variant="destructive"
          className="rounded-full px-6 self-start md:self-auto"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
          Eliminar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* ── Left Column: Brand Identity ─────────────────────────────── */}
        <div className="lg:col-span-5 space-y-12">

          {/* Section 01: Core */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-headline font-light text-primary/20">01</span>
              <h2 className="text-2xl font-bold font-headline tracking-tight">Identidad Core</h2>
            </div>

            <div className="space-y-8">
              {/* Propuesta de Valor */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-px bg-primary/30" /> Propuesta de Valor
                </h3>
                <InlineTextField
                  value={book.valueProposition || ''}
                  onSave={(v) => saveField({ valueProposition: v })}
                  multiline
                  rows={3}
                  placeholder="¿Qué valor único ofrece esta marca?"
                  emptyLabel="Sin definir — click para agregar"
                  displayClassName="text-lg font-semibold text-primary/90 leading-relaxed"
                />
              </div>

              {/* Concepto */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-px bg-primary/30" /> Concepto de Marca
                </h3>
                <InlineTextField
                  value={book.concept || ''}
                  onSave={(v) => saveField({ concept: v })}
                  multiline
                  rows={3}
                  placeholder="¿Cuál es el concepto central de la marca?"
                  emptyLabel="Sin definir — click para agregar"
                  displayClassName="text-base text-foreground/90 leading-relaxed"
                />
              </div>

              {/* Misión */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-px bg-primary/30" /> Misión
                </h3>
                <InlineTextField
                  value={book.mission || ''}
                  onSave={(v) => saveField({ mission: v })}
                  multiline
                  rows={3}
                  placeholder="¿Cuál es la misión de la marca?"
                  emptyLabel="Sin definir — click para agregar"
                  displayClassName="text-base text-foreground/90 font-medium leading-relaxed"
                />
              </div>

              {/* Visión */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-px bg-primary/30" /> Visión
                </h3>
                <InlineTextField
                  value={book.vision || ''}
                  onSave={(v) => saveField({ vision: v })}
                  multiline
                  rows={3}
                  placeholder="¿A dónde aspira llegar la marca?"
                  emptyLabel="Sin definir — click para agregar"
                  displayClassName="text-base text-foreground/90 font-medium leading-relaxed"
                />
              </div>

              {/* Valores — Tag Editor */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-px bg-primary/30" /> Valores
                </h3>
                <InlineTagEditor
                  tags={valuesArray}
                  onSave={(v) => saveField({ values: v })}
                  placeholder="Agregar valor..."
                  emptyLabel="Sin valores definidos — agrega uno"
                />
              </div>
            </div>
          </section>

          {/* Section 02: Audience & Voice */}
          <section className="space-y-6 pt-6 border-t border-primary/10">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-headline font-light text-primary/20">02</span>
              <h2 className="text-2xl font-bold font-headline tracking-tight">Audiencia y Voz</h2>
            </div>

            <div className="space-y-8">
              {/* Público Meta */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-px bg-primary/30" /> Público Meta
                </h3>
                <InlineTextField
                  value={book.targetAudience || ''}
                  onSave={(v) => saveField({ targetAudience: v })}
                  multiline
                  rows={3}
                  placeholder="Describe al público objetivo..."
                  emptyLabel="Sin definir — click para agregar"
                  displayClassName="text-base text-muted-foreground leading-relaxed"
                />
              </div>

              {/* Tono de Voz — Tag Editor */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-px bg-primary/30" /> Tono de Voz
                </h3>
                <InlineTagEditor
                  tags={toneArray}
                  onSave={(v) => saveField({ tone: v })}
                  placeholder="Agregar tono..."
                  emptyLabel="Sin tonos definidos"
                  tagClassName="bg-primary/5 border-primary/20 text-primary"
                />
              </div>
            </div>
          </section>
        </div>

        {/* ── Right Column: Visual Assets ─────────────────────────────── */}
        <div className="lg:col-span-7 space-y-12">

          {/* Section 03: Visual Assets (Logos) */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-headline font-light text-primary/20">03</span>
              <h2 className="text-2xl font-bold font-headline tracking-tight flex items-center gap-3">
                <Palette className="w-6 h-6 text-primary" /> Activos Visuales
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {book.logoAssets?.primary ? (
                <div className="col-span-2 aspect-[21/9] bg-white dark:bg-black/40 rounded-3xl border border-primary/10 flex items-center justify-center p-8 relative group overflow-hidden shadow-sm">
                  <div className="absolute top-4 left-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/50">Logo Principal</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={book.logoAssets.primary} alt="Logo Principal" className="max-h-full max-w-full object-contain drop-shadow-xl transition-transform duration-700 group-hover:scale-105" />
                </div>
              ) : book.logoUrl ? (
                <div className="col-span-2 aspect-[21/9] bg-white dark:bg-black/40 rounded-3xl border border-primary/10 flex items-center justify-center p-8 relative group overflow-hidden shadow-sm">
                  <div className="absolute top-4 left-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/50">Logo Principal</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={book.logoUrl} alt="Logo Principal" className="max-h-full max-w-full object-contain drop-shadow-xl transition-transform duration-700 group-hover:scale-105" />
                </div>
              ) : null}

              {book.logoAssets?.secondary && (
                <div className="col-span-1 aspect-square bg-muted/20 rounded-3xl border border-primary/5 flex items-center justify-center p-6 relative group overflow-hidden">
                  <div className="absolute top-4 left-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Secundario</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={book.logoAssets.secondary} alt="Secundario" className="max-h-full max-w-full object-contain drop-shadow-lg transition-transform duration-500 group-hover:scale-110" />
                </div>
              )}

              {book.logoAssets?.icon && (
                <div className="col-span-1 aspect-square bg-muted/20 rounded-3xl border border-primary/5 flex items-center justify-center p-6 relative group overflow-hidden">
                  <div className="absolute top-4 left-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Isotipo</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={book.logoAssets.icon} alt="Icono" className="max-h-full max-w-full object-contain drop-shadow-lg transition-transform duration-500 group-hover:scale-110" />
                </div>
              )}
            </div>
          </section>

          {/* Section 04: Palette & Typography */}
          <section className="space-y-6 pt-6 border-t border-primary/10">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-headline font-light text-primary/20">04</span>
              <h2 className="text-2xl font-bold font-headline tracking-tight">Estilo y Color</h2>
            </div>

            <div className="space-y-10">
              {/* Color Palette */}
              <div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Paleta Cromática</h3>
                <div className="flex flex-col sm:flex-row h-auto sm:h-32 rounded-3xl overflow-hidden shadow-sm border border-primary/10">
                  <div className="flex-1 min-h-[100px] p-4 flex flex-col justify-end transition-all hover:flex-[1.5]" style={{ backgroundColor: book.visualIdentity?.primaryColor || '#000' }}>
                    <div className="bg-background/90 backdrop-blur self-start px-3 py-1.5 rounded-lg shadow-sm">
                      <span className="text-xs font-bold uppercase block text-foreground">Primario</span>
                      <span className="text-xs font-mono text-muted-foreground">{book.visualIdentity?.primaryColor || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[100px] p-4 flex flex-col justify-end transition-all hover:flex-[1.5]" style={{ backgroundColor: book.visualIdentity?.secondaryColor || '#fff' }}>
                    <div className="bg-background/90 backdrop-blur self-start px-3 py-1.5 rounded-lg shadow-sm">
                      <span className="text-xs font-bold uppercase block text-foreground">Secundario</span>
                      <span className="text-xs font-mono text-muted-foreground">{book.visualIdentity?.secondaryColor || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[100px] p-4 flex flex-col justify-end transition-all hover:flex-[1.5]" style={{ backgroundColor: book.visualIdentity?.tertiaryColor || '#aaa' }}>
                    <div className="bg-background/90 backdrop-blur self-start px-3 py-1.5 rounded-lg shadow-sm">
                      <span className="text-xs font-bold uppercase block text-foreground">Terciario</span>
                      <span className="text-xs font-mono text-muted-foreground">{book.visualIdentity?.tertiaryColor || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Tipografía</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-card border border-primary/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute -right-4 -top-8 text-[120px] font-bold text-primary/5 select-none pointer-events-none">Aa</div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-4">Títulos (Primaria)</span>
                    <h4 className="text-3xl font-bold truncate">{book.visualIdentity?.typography?.primary || 'No definida'}</h4>
                    <p className="mt-4 text-2xl font-medium tracking-tight">La rápida zorra marrón salta.</p>
                  </div>
                  <div className="bg-muted/30 border border-primary/5 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-6 text-[100px] font-bold text-primary/5 select-none pointer-events-none">g</div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-4">Cuerpo (Secundaria)</span>
                    <h4 className="text-xl font-semibold truncate">{book.visualIdentity?.typography?.secondary || 'No definida'}</h4>
                    <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                      El veloz murciélago hindú comía feliz cardillo y kiwi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Graphic Style */}
              {book.visualIdentity?.graphicStyle && (
                <div>
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Estilo Gráfico y Dirección de Arte</h3>
                  <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
                    <p className="text-base text-foreground/80 leading-relaxed italic">
                      "{book.visualIdentity.graphicStyle}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
