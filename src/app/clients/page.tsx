import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Contact } from "lucide-react";

export default function ClientsPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-headline">Clientes</h1>
          <p className="text-muted-foreground">Centraliza la información y personaliza el trato comercial.</p>
        </div>
        <Button><UserPlus className="mr-2"/> Nuevo Cliente</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Fichas de Cliente</CardTitle>
          <CardDescription>Gestiona datos de contacto, packs asignados y tarifas especiales.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-center p-4">
            <Contact className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold font-headline mb-2">CRM Integrado</h3>
            <p className="text-muted-foreground">Aquí verás la lista de tus clientes con su información relevante, progreso de packs y más.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
