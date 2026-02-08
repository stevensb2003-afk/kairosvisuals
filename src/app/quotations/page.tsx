import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilePlus2 } from "lucide-react";

export default function QuotationsPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-headline">Cotizaciones</h1>
          <p className="text-muted-foreground">Captura nuevos clientes y formaliza pedidos puntuales.</p>
        </div>
        <Button><FilePlus2 className="mr-2"/> Crear Cotización</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Creador de Propuestas</CardTitle>
          <CardDescription>Busca clientes, selecciona packs y genera PDFs automáticos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-center p-4">
            <FilePlus2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold font-headline mb-2">Generador de Cotizaciones</h3>
            <p className="text-muted-foreground">Aquí podrás crear propuestas comerciales, definir su vigencia y convertirlas en proyectos con un solo clic.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
