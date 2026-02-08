'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { smartTaxationToggle } from '@/ai/flows/smart-taxation-toggle';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  clientType: z.string().min(1, 'Tipo de cliente es requerido.'),
  productType: z.string().min(1, 'Tipo de producto es requerido.'),
  additionalDetails: z.string().optional(),
});

export function SmartTaxation() {
  const [useSmartTaxation, setUseSmartTaxation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{ taxBreakSuggestion: boolean; reasoning: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientType: '',
      productType: '',
      additionalDetails: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!useSmartTaxation) return;
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const result = await smartTaxationToggle(values);
      setSuggestion(result);
    } catch (e) {
      setError('Error al obtener sugerencia de impuestos.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facturación Inteligente</CardTitle>
        <CardDescription>Use IA para determinar si aplican beneficios fiscales.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch id="smart-taxation-toggle" checked={useSmartTaxation} onCheckedChange={setUseSmartTaxation} />
          <Label htmlFor="smart-taxation-toggle" className="flex items-center gap-2 cursor-pointer">
            <Sparkles className="w-4 h-4 text-primary" />
            Activar Impuestos Inteligentes
          </Label>
        </div>

        {useSmartTaxation && (
          <div className="border-t pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: non-profit, corporación" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="productType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Producto/Servicio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: servicio digital, producto físico" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="additionalDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detalles Adicionales</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Información relevante para impuestos..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Analizar Impuestos
                </Button>
              </form>
            </Form>
          </div>
        )}

        {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

        {suggestion && (
          <Alert variant={suggestion.taxBreakSuggestion ? "default" : "destructive"} className={suggestion.taxBreakSuggestion ? "bg-primary/10 border-primary/50" : ""}>
            <Sparkles className="h-4 w-4" />
            <AlertTitle className="font-headline">
              {suggestion.taxBreakSuggestion
                ? 'Sugerencia: Aplicar beneficio fiscal'
                : 'Sugerencia: No aplicar beneficio fiscal'}
            </AlertTitle>
            <AlertDescription>{suggestion.reasoning}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
