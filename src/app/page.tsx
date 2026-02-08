import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PwaInstallBanner } from '@/components/dashboard/pwa-install-banner';
import UserWorkloadChart from "@/components/dashboard/user-workload-chart-dynamic";

const weeklyKpi = {
  pending: 12,
  completed: 28,
};

const criticalTasks = [
  { id: 'TSK-001', name: 'Edición video corporativo', deadline: 'En 1 día', priority: 'Alta' },
  { id: 'TSK-003', name: 'Diseño de logo para Startup', deadline: 'En 2 días', priority: 'Alta' },
  { id: 'TSK-005', name: 'Revisión final de campaña', deadline: 'En 2 días', priority: 'Media' },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-headline">{weeklyKpi.pending}</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-headline">{weeklyKpi.completed}</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UserWorkloadChart />
        
        <Card>
          <CardHeader>
            <CardTitle>Tareas Críticas</CardTitle>
            <CardDescription>Entregas en las próximas 48 horas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarea</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead className="text-right">Prioridad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium font-headline">{task.name}</div>
                      <div className="text-sm text-muted-foreground">{task.id}</div>
                    </TableCell>
                    <TableCell>{task.deadline}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={task.priority === 'Alta' ? 'destructive' : 'secondary'}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <PwaInstallBanner />
    </div>
  );
}
