'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Plus, ArrowLeft, ClipboardCheck, Layers } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialTasks = [
    {
        id: "TSK-001",
        title: "Diseño de Landing Page",
        description: "Crear un diseño moderno y responsive para la nueva página de aterrizaje.",
        tag: { text: "Diseño UI/UX", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
        points: 5,
        assignee: null,
        type: 'task',
        client: 'SynthWave Co.',
        taskType: 'Diseño Web',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        commentsCount: 0,
    },
    {
        id: "TSK-002",
        title: "Desarrollo API de Autenticación",
        description: "Implementar endpoints para registro, login y logout usando JWT.",
        tag: { text: "Backend", className: "bg-green-500/10 text-green-400 border-green-500/20" },
        points: 8,
        assignee: { name: "Alex C.", avatar: "https://picsum.photos/seed/alex/40/40" },
        type: 'task',
        client: 'SecureAuth',
        taskType: 'Desarrollo API',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        commentsCount: 0,
    },
    {
        id: "TSK-003",
        title: "Configuración de CI/CD",
        description: "Crear un pipeline en GitHub Actions para despliegue automático.",
        tag: { text: "DevOps", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
        points: 5,
        assignee: null,
        type: 'task',
        client: 'Internal',
        taskType: 'Infraestructura',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        commentsCount: 0,
    },
    {
        id: "TSK-004",
        title: "Creación de Componentes React",
        description: "Desarrollar componentes reutilizables para el design system.",
        tag: { text: "Frontend", className: "bg-purple-600/10 text-purple-400 border-purple-600/20" },
        points: 3,
        assignee: { name: "Sarah J.", avatar: "https://picsum.photos/seed/sarah/40/40" },
        type: 'task',
        client: 'Componentify',
        taskType: 'Desarrollo UI',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        commentsCount: 0,
    },
    {
        id: "TSK-005",
        title: "Investigación de Mercado",
        description: "Analizar competidores y identificar oportunidades de mercado.",
        tag: { text: "Estrategia", className: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
        points: 3,
        assignee: null,
        type: 'task',
        client: 'Visionary Inc.',
        taskType: 'Investigación',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        commentsCount: 0,
    }
];


const initialSprintTasks = [
    initialTasks[1],
    initialTasks[3],
];

const taskFormSchema = z.object({
  title: z.string().min(1, 'El título es requerido.'),
  description: z.string().optional(),
  client: z.string().min(1, 'El cliente es requerido.'),
  taskType: z.string().min(1, 'El tipo de tarea es requerido.'),
  category: z.string().min(1, 'La categoría es requerida.'),
  points: z.coerce.number().min(0, 'Los puntos deben ser un número no negativo.'),
});

export default function BacklogPage() {
    const [tasks, setTasks] = useState(initialTasks);
    const [sprintTasks, setSprintTasks] = useState(initialSprintTasks);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<'task' | 'campaign' | null>(null);

    const form = useForm<z.infer<typeof taskFormSchema>>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: {
            title: "",
            description: "",
            client: "",
            taskType: "",
            category: "",
            points: 0,
        },
    });

    const handleTypeSelect = (type: 'task' | 'campaign') => {
        setSelectedType(type);
        setStep(2);
    };
    
    const handleDialogReset = () => {
        setStep(1);
        setSelectedType(null);
        form.reset();
    };

    function onSubmit(values: z.infer<typeof taskFormSchema>) {
        if (!selectedType) return;

        const newTask = {
            id: `TSK-${Math.floor(Math.random() * 9000) + 1000}`,
            title: values.title,
            description: values.description,
            tag: {
                text: values.category,
                className: "bg-gray-500/10 text-gray-400 border-gray-500/20" // Default style
            },
            points: values.points,
            assignee: null,
            type: selectedType,
            client: values.client,
            taskType: values.taskType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            comments: [],
            commentsCount: 0,
            ...(selectedType === 'campaign' && { progress: 0, subtasks: [] })
        };
        
        // @ts-ignore
        setTasks(prevTasks => [...prevTasks, newTask]);
        setIsDialogOpen(false);
    }


    const totalPoints = sprintTasks.reduce((sum, task) => sum + task.points, 0);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon" aria-label="Volver al Kanban">
                        <Link href="/kanban">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Backlog</h1>
                        <p className="text-muted-foreground">Planifica y organiza el trabajo futuro de forma visual.</p>
                    </div>
                </div>
                 <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
                    setIsDialogOpen(isOpen);
                    if (!isOpen) {
                        handleDialogReset();
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Tarea
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                        {step === 1 && (
                             <>
                                <DialogHeader>
                                    <DialogTitle>Crear Nuevo Elemento</DialogTitle>
                                    <DialogDescription>¿Qué te gustaría crear?</DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                    <Card className="cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleTypeSelect('task')}>
                                        <CardHeader className="items-center text-center">
                                            <ClipboardCheck className="h-10 w-10 mb-2 text-primary"/>
                                            <CardTitle className="font-headline text-lg">Tarea</CardTitle>
                                            <CardDescription>Una tarea individual y específica.</CardDescription>
                                        </CardHeader>
                                    </Card>
                                    <Card className="cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => handleTypeSelect('campaign')}>
                                        <CardHeader className="items-center text-center">
                                            <Layers className="h-10 w-10 mb-2 text-primary"/>
                                            <CardTitle className="font-headline text-lg">Campaña</CardTitle>
                                            <CardDescription>Un proyecto grande con subtareas.</CardDescription>
                                        </CardHeader>
                                    </Card>
                                </div>
                            </>
                        )}
                        {step === 2 && selectedType && (
                            <>
                                <DialogHeader>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setStep(1)}>
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                        <DialogTitle>Detalles de la {selectedType === 'task' ? 'Tarea' : 'Campaña'}</DialogTitle>
                                    </div>
                                    <DialogDescription>Completa la información para crear el nuevo elemento.</DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto pr-2">
                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Título</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ej: Diseño de la nueva landing" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Descripción</FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder="Añade detalles sobre la tarea..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="client"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cliente</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ej: Spring & Co." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="taskType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tipo de Tarea</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ej: Motion Graphics" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Categoría (Tag)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ej: Diseño UI/UX" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="points"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Puntos de Esfuerzo</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" placeholder="Ej: 5" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex justify-end pt-2">
                                            <Button type="submit">Crear Elemento</Button>
                                        </div>
                                    </form>
                                </Form>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
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
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{task.title}</h3>
                                                {task.description && <p className="text-sm text-muted-foreground mt-1 truncate">{task.description}</p>}
                                            </div>
                                            <Badge variant="secondary" className="font-mono text-xs shrink-0">{task.points} pts</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                            {task.tag && <Badge variant="outline" className={cn("text-xs font-semibold", task.tag.className)}>{task.tag.text}</Badge>}
                                            {task.assignee && (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                                                        <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{task.assignee.name}</span>
                                                </div>
                                            )}
                                            {task.type === 'campaign' && (
                                                <Badge variant="outline" className="bg-purple-600/10 text-purple-400 border-purple-600/20">Campaña</Badge>
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
