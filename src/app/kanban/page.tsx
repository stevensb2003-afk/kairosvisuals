import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const columns = ["Pendiente", "En Proceso", "En Revisión", "Entregable"];

export default function KanbanPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Kanban</h1>
        <p className="text-muted-foreground">Gestión visual del flujo de producción del día a día.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((col) => (
          <Card key={col} className="bg-muted/50">
            <CardHeader>
              <CardTitle className="font-headline">{col}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed rounded-lg text-center p-4">
                <p className="text-muted-foreground">Arrastra tareas aquí</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
