'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Laptop, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    deferredPrompt: BeforeInstallPromptEvent | null;
  }
}

export function PwaInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.deferredPrompt = e as BeforeInstallPromptEvent;
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
        window.deferredPrompt = null;
      }
    }
  };

  const handleDismissClick = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Alert className="flex items-center justify-between p-4 bg-card border-border">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-secondary rounded-lg">
            <Laptop className="h-5 w-5 text-primary" />
        </div>
        <div>
          <AlertTitle className="font-semibold text-card-foreground">Instala la App de Escritorio</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Accede sin conexión y obtén una experiencia de usuario mejorada.
          </AlertDescription>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={handleDismissClick}>Omitir</Button>
        <Button size="sm" onClick={handleInstallClick}>Instalar</Button>
      </div>
    </Alert>
  );
}
