import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Landmark } from "lucide-react";

export default function ExpensesPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-headline">Gastos y Créditos</h1>
          <p className="text-muted-foreground">Tracking contable para la transparencia entre socios.</p>
        </div>
        <Button>Registrar Gasto</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tracking de Gastos</CardTitle>
            <CardDescription>Registro de licencias, internet y pagos a socios.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center p-4">
              <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aquí se registrarán los gastos operativos.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compras a Crédito</CardTitle>
            <CardDescription>Seguimiento de pagos mensuales y deuda restante.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center p-4">
              <Landmark className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Monitoriza compras a crédito y alertas de pago.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
