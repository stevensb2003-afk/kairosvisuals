'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
    setIsVisible(false);
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      await window.deferredPrompt.userChoice;
      window.deferredPrompt = null;
    }
  };

  const handleDismissClick = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md">
        <Card className="shadow-2xl animate-in fade-in-0 slide-in-from-bottom-10">
        <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
                <Download className="h-6 w-6 text-primary" />
            </div>
            <div>
                <p className="font-semibold font-headline">Instalar Kairos OS</p>
                <p className="text-sm text-muted-foreground">Acceso rápido desde tu dispositivo.</p>
            </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={handleInstallClick}>Instalar</Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleDismissClick}>
                <X className="h-4 w-4" />
            </Button>
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
