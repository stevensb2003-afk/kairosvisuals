
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Plus, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

const tasks = [
    {
        id: "TSK-001",
        title: "Diseño de Landing Page",
        category: "Diseño UI/UX",
        categoryClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        points: 5,
        assignee: null,
    },
    {
        id: "TSK-002",
        title: "Desarrollo API de Autenticación",
        category: "Backend",
        categoryClass: "bg-green-500/10 text-green-400 border-green-500/20",
        points: 8,
        assignee: { name: "Alex C.", avatar: "https://picsum.photos/seed/alex/40/40" },
    },
    {
        id: "TSK-003",
        title: "Configuración de CI/CD",
        category: "DevOps",
        categoryClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        points: 5,
        assignee: null,
    },
    {
        id: "TSK-004",
        title: "Creación de Componentes React",
        category: "Frontend",
        categoryClass: "bg-purple-600/10 text-purple-400 border-purple-600/20",
        points: 3,
        assignee: { name: "Sarah J.", avatar: "https://picsum.photos/seed/sarah/40/40" },
    },
    {
        id: "TSK-005",
        title: "Investigación de Mercado",
        category: "Estrategia",
        categoryClass: "bg-pink-500/10 text-pink-400 border-pink-500/20",
        points: 3,
        assignee: null,
    }
];

const sprintTasks = [
    tasks[1],
    tasks[3],
];

export default function BacklogPage() {
    const totalPoints = sprintTasks.reduce((sum, task) => sum + task.points, 0);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Backlog</h1>
                    <p className="text-muted-foreground">Planifica y organiza el trabajo futuro de forma visual.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline">
                        <Link href="/kanban">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver al Kanban
                        </Link>
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Tarea
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cajón de Tareas</CardTitle>
                            <CardDescription>Aquí están todas las tareas pendientes. Arrastra y suelta para añadirlas al próximo sprint.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {tasks.map(task => (
                                <Card key={task.id} className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-grab">
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold">{task.title}</h3>
                                            <Badge variant="secondary" className="font-mono text-xs">{task.points} pts</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className={task.categoryClass}>{task.category}</Badge>
                                            {task.assignee && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                                                        <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{task.assignee.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader className="pb-2">
                            <CardTitle>Próximo Sprint</CardTitle>
                            <CardDescription>Puntos totales: <span className="font-bold text-foreground">{totalPoints}</span></CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="min-h-[200px] border-2 border-dashed rounded-lg p-4 space-y-3 bg-secondary/20">
                               {sprintTasks.length > 0 ? (
                                    sprintTasks.map(task => (
                                         <Card key={task.id} className="p-3 flex items-center justify-between text-sm">
                                            <span className="font-medium truncate pr-2">{task.title}</span>
                                            <Badge variant="secondary" className="font-mono text-xs shrink-0">{task.points} pts</Badge>
                                        </Card>
                                    ))
                               ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-10">
                                        <p>Arrastra tareas aquí</p>
                                    </div>
                               )}
                            </div>
                            <Button className="w-full mt-4">
                                Iniciar Sprint
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
