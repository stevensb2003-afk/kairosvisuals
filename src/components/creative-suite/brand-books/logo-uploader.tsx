'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useStorage } from '@/firebase/provider';
import { uploadFile } from '@/lib/storageService';
import { BrandBookLogoAssets } from '@/lib/types';

interface LogoUploaderProps {
  value: BrandBookLogoAssets;
  onChange: (value: BrandBookLogoAssets) => void;
  brandName?: string;
}

type LogoVariant = keyof BrandBookLogoAssets;

const VARIANTS: { key: LogoVariant; label: string; description: string }[] = [
  { key: 'primary', label: 'Logo Principal', description: 'Versión completa y principal de la marca' },
  { key: 'secondary', label: 'Secundario / Horizontal', description: 'Versión alternativa para espacios anchos' },
  { key: 'icon', label: 'Icono / Isotipo', description: 'Símbolo sin texto para avatars y favicons' },
  { key: 'monochrome', label: 'Monocromo', description: 'Versión en un solo color (blanco/negro)' },
];

export function LogoUploader({ value, onChange, brandName = 'brand' }: LogoUploaderProps) {
  const storage = useStorage();
  const [uploading, setUploading] = useState<LogoVariant | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeVariant, setActiveVariant] = useState<LogoVariant | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeVariant || !storage) return;

    setUploading(activeVariant);
    setUploadProgress(0);
    try {
      const safeBrandName = brandName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const path = `brands/${safeBrandName}/logos/${activeVariant}_${Date.now()}_${file.name}`;

      const downloadUrl = await uploadFile(storage, file, path, (pct) => setUploadProgress(Math.round(pct)));
      
      onChange({
        ...value,
        [activeVariant]: downloadUrl
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error al subir el logo. Intenta de nuevo.');
    } finally {
      setUploading(null);
      setUploadProgress(0);
      setActiveVariant(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerUpload = (variant: LogoVariant) => {
    setActiveVariant(variant);
    fileInputRef.current?.click();
  };

  const handleRemove = (variant: LogoVariant) => {
    const newValue = { ...value };
    delete newValue[variant];
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png, image/jpeg, image/svg+xml, image/webp"
        className="hidden"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {VARIANTS.map((variant) => (
          <div key={variant.key} className="relative group rounded-xl border border-primary/10 bg-muted/20 p-4 transition-all hover:bg-muted/40">
            <div className="flex justify-between items-start mb-3">
              <div>
                <Label className="text-sm font-semibold">{variant.label}</Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">{variant.description}</p>
              </div>
              {value[variant.key] && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-full"
                  onClick={() => handleRemove(variant.key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div 
              className={`
                mt-2 flex h-32 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed 
                transition-colors
                ${value[variant.key] ? 'border-transparent bg-white/5 dark:bg-black/20' : 'border-primary/20 hover:border-primary/50 cursor-pointer'}
              `}
              onClick={() => !value[variant.key] && triggerUpload(variant.key)}
            >
              {uploading === variant.key ? (
                <div className="flex flex-col items-center gap-3 w-full px-4 text-primary/70">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <div className="w-full bg-primary/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums">{uploadProgress}%</span>
                </div>
              ) : value[variant.key] ? (
                <div className="relative h-full w-full p-2 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={value[variant.key]} 
                    alt={`${variant.label} preview`} 
                    className="max-h-full max-w-full object-contain drop-shadow-md"
                  />
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <Button variant="secondary" size="sm" onClick={() => triggerUpload(variant.key)}>
                      Cambiar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground group-hover:text-primary transition-colors">
                  <UploadCloud className="h-8 w-8 mb-2 opacity-50" />
                  <span className="text-xs font-medium">Click para subir</span>
                  <span className="text-[10px] opacity-70 mt-1">SVG, PNG, JPG</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
