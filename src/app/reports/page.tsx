import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, PieChart } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-headline">Reportes</h1>
          <p className="text-muted-foreground">Transparencia entre socios y toma de decisiones basada en datos.</p>
        </div>
        <Button>Exportar Reporte</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reporte Financiero</CardTitle>
            <CardDescription>Filtra por fecha y cliente para ver ingresos totales.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center p-4">
              <AreaChart className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Gráficos de ingresos y filtros aparecerán aquí.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reporte de Productividad</CardTitle>
            <CardDescription>Analiza tiempos de entrega y volumen de trabajo por usuario.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg text-center p-4">
              <PieChart className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Métricas de productividad se visualizarán aquí.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
