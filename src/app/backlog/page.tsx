import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListPlus } from "lucide-react";

export default function BacklogPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-headline">Backlog</h1>
          <p className="text-muted-foreground">Organiza el trabajo futuro sin saturar el presente.</p>
        </div>
        <Button>Iniciar Sprint</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gestor de Tareas</CardTitle>
          <CardDescription>Aquí podrás crear y organizar tareas para futuros sprints.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-center p-4">
            <ListPlus className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold font-headline mb-2">Planificación de Sprints</h3>
            <p className="text-muted-foreground">Crea tareas, agrúpalas en sprints de 2 semanas y muévelas al Kanban para iniciar la producción.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
