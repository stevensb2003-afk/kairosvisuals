import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export function SuccessView() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full scale-150" />
      <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        <CardContent className="pt-12 pb-10 px-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20 animate-bounce">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold font-headline mb-3 text-card-foreground">¡Todo listo!</h2>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            Hemos recibido los detalles de tu negocio. El equipo de <span className="text-primary font-semibold">Kairos Visuals</span> revisará tu briefing y te contactará en las próximas 24 horas.
          </p>
          <Button className="w-full h-12 text-base font-semibold" onClick={() => window.location.href = '/'}>
            Volver al Inicio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
