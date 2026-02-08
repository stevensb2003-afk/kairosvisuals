import { SmartTaxation } from "@/components/invoicing/smart-taxation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InvoicingPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-headline">Facturador</h1>
          <p className="text-muted-foreground">Crea y gestiona facturas de forma inteligente.</p>
        </div>
        <Button>Crear Nueva Factura</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <Card>
            <CardHeader>
                <CardTitle>Facturas Recientes</CardTitle>
                <CardDescription>Aquí se mostrará una lista de facturas pendientes y pagadas.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-16">No hay facturas recientes.</p>
            </CardContent>
           </Card>
        </div>
        <div>
          <SmartTaxation />
        </div>
      </div>
    </div>
  );
}
