'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Plus, ArrowLeft, ClipboardCheck, Layers, Trash2 } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const allInitialTasks = [
    {
        id: "TSK-001",
        title: "Diseño de Landing Page",
        description: "Crear un diseño moderno y responsive para la nueva página de aterrizaje.",
        tag: { text: "Diseño UI/UX", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
        points: 5,
        type: 'task',
        client: 'SynthWave Co.',
        taskType: 'Diseño Web',
        subtasks: [],
    },
    {
        id: "TSK-002",
        title: "Desarrollo API de Autenticación",
        description: "Implementar endpoints para registro, login y logout usando JWT.",
        tag: { text: "Backend", className: "bg-green-500/10 text-green-400 border-green-500/20" },
        points: 8,
        type: 'task',
        client: 'SecureAuth',
        taskType: 'Desarrollo API',
        subtasks: [],
    },
    {
        id: "TSK-003",
        title: "Configuración de CI/CD",
        description: "Crear un pipeline en GitHub Actions para despliegue automático.",
        tag: { text: "DevOps", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
        points: 5,
        type: 'task',
        client: 'Internal',
        taskType: 'Infraestructura',
        subtasks: [],
    },
    {
        id: "TSK-004",
        title: "Creación de Componentes React",
        description: "Desarrollar componentes reutilizables para el design system.",
        tag: { text: "Frontend", className: "bg-purple-600/10 text-purple-400 border-purple-600/20" },
        points: 3,
        type: 'task',
        client: 'Componentify',
        taskType: 'Desarrollo UI',
        subtasks: [],
    },
    {
        id: "TSK-005",
        title: "Investigación de Mercado",
        description: "Analizar competidores y identificar oportunidades de mercado.",
        tag: { text: "Estrategia", className: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
        points: 3,
        type: 'task',
        client: 'Visionary Inc.',
        taskType: 'Investigación',
        subtasks: [],
    }
];

const initialSprintTaskIds = ["TSK-002", "TSK-004"];
const backlogTasksData = allInitialTasks.filter(t => !initialSprintTaskIds.includes(t.id));
const sprintTasksData = allInitialTasks.filter(t => initialSprintTaskIds.includes(t.id));


const subtaskTypes: Record<string, { text: string; className: string }> = {
    task: { text: 'Task', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
    footage: { text: 'Footage', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
    reel: { text: 'Reel', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    graphics: { text: 'Graphics', className: 'bg-purple-600/10 text-purple-400 border-purple-600/20' },
    audio: { text: 'Audio', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    export: { text: 'Export', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
    post: { text: 'Post', className: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
    image: { text: 'Image', className: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
};

export default function BacklogPage() {
    const [tasks, setTasks] = useState(backlogTasksData);
    const [sprintTasks, setSprintTasks] = useState(sprintTasksData);
    
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<'task' | 'campaign' | null>(null);

    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [newSubtaskType, setNewSubtaskType] = useState(Object.keys(subtaskTypes)[0]);

    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [draggedItem, setDraggedItem] = useState<{ id: string; source: 'backlog' | 'sprint' } | null>(null);

    const taskFormSchema = z.object({
      title: z.string().min(1, 'El título es requerido.'),
      description: z.string().optional(),
      client: z.string().min(1, 'El cliente es requerido.'),
      taskType: z.string().optional(),
      category: z.string().min(1, 'La categoría es requerida.'),
      points: z.coerce.number().min(0, 'Los puntos deben ser un número no negativo.'),
      subtasks: z.array(z.object({
        title: z.string(),
        type: z.string(),
      })).optional(),
    }).superRefine((data, ctx) => {
        if (selectedType === 'task') {
            if (!data.taskType || data.taskType.trim().length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['taskType'],
                    message: "El tipo de tarea es requerido.",
                });
            }
        }
    });

    const form = useForm<z.infer<typeof taskFormSchema>>({
        resolver: zodResolver(taskFormSchema),
        defaultValues: {
            title: "",
            description: "",
            client: "",
            taskType: "",
            category: "",
            points: 0,
            subtasks: [],
        },
    });
    
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "subtasks",
    });

    const handleTypeSelect = (type: 'task' | 'campaign') => {
        setSelectedType(type);
        setStep(2);
    };
    
    const handleDialogReset = () => {
        setStep(1);
        setSelectedType(null);
        form.reset();
        setNewSubtaskTitle("");
        setNewSubtaskType(Object.keys(subtaskTypes)[0]);
    };

    const handleSubtaskAdd = () => {
        if (!newSubtaskTitle.trim() || !subtaskTypes[newSubtaskType]) return;

        append({
            title: newSubtaskTitle.trim(),
            type: newSubtaskType
        });

        setNewSubtaskTitle("");
        setNewSubtaskType(Object.keys(subtaskTypes)[0]);
    };

    function onSubmit(values: z.infer<typeof taskFormSchema>) {
        if (!selectedType) return;

        const formattedSubtasks = values.subtasks?.map(sub => ({
            id: `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            title: sub.title,
            completed: false,
            tag: subtaskTypes[sub.type as keyof typeof subtaskTypes]
        })) || [];
        
        const newTask = {
            id: `TSK-${Math.floor(Math.random() * 9000) + 1000}`,
            title: values.title,
            description: values.description,
            tag: {
                text: values.category,
                className: "bg-gray-500/10 text-gray-400 border-gray-500/20"
            },
            points: values.points,
            type: selectedType,
            client: values.client,
            taskType: values.taskType ?? '',
            subtasks: formattedSubtasks,
        };
        
        // @ts-ignore
        setTasks(prevTasks => [...prevTasks, newTask]);
        setIsCreateDialogOpen(false);
    }


    const handleDragStart = (e: React.DragEvent, task: any, source: 'backlog' | 'sprint') => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({ id: task.id, source }));
        setDraggedItem({ id: task.id, source });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, target: 'backlog' | 'sprint') => {
        e.preventDefault();
        const { id, source } = JSON.parse(e.dataTransfer.getData('application/json'));

        if (source === target) {
            setDraggedItem(null);
            return;
        }

        if (source === 'backlog' && target === 'sprint') {
            const taskToMove = tasks.find(t => t.id === id);
            if (taskToMove) {
                setTasks(tasks.filter(t => t.id !== id));
                setSprintTasks(prev => [...prev, taskToMove]);
            }
        } else if (source === 'sprint' && target === 'backlog') {
            const taskToMove = sprintTasks.find(t => t.id === id);
            if (taskToMove) {
                setSprintTasks(sprintTasks.filter(t => t.id !== id));
                setTasks(prev => [...prev, taskToMove]);
            }
        }
        setDraggedItem(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const totalPoints = sprintTasks.reduce((sum, task) => sum + task.points, 0);

    return (
        <div className="space-y-6">
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
                 <Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => {
                    setIsCreateDialogOpen(isOpen);
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
                                                        <Input placeholder={`Ej: ${selectedType === 'task' ? 'Diseño de la nueva landing' : 'Campaña de Verano 2024'}`} {...field} />
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
                                        {selectedType === 'task' && (
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
                                        )}
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
                                        
                                        {selectedType === 'campaign' && (
                                            <div className="space-y-4 rounded-md border p-4">
                                                <h4 className="font-semibold text-foreground">Sub-tareas de la Campaña</h4>
                                                <div className="space-y-2">
                                                    {fields.map((field, index) => (
                                                        <div key={field.id} className="group flex items-center justify-between gap-3 rounded-md p-2 hover:bg-secondary/50">
                                                            <div className="flex items-center gap-3">
                                                                <Badge variant="outline" className={cn("text-xs font-semibold", subtaskTypes[field.type]?.className)}>{subtaskTypes[field.type]?.text}</Badge>
                                                                <span className="text-sm">{field.title}</span>
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" onClick={() => remove(index)}>
                                                                <Trash2 className="h-4 w-4" />
                                                                <span className="sr-only">Eliminar subtarea</span>
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    {fields.length === 0 && (
                                                        <p className="text-sm text-muted-foreground text-center py-2">No hay sub-tareas añadidas.</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 pt-2">
                                                    <Input
                                                        placeholder="Añadir nueva sub-tarea..."
                                                        value={newSubtaskTitle}
                                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                                        className="h-9 flex-grow"
                                                    />
                                                    <Select value={newSubtaskType} onValueChange={setNewSubtaskType}>
                                                        <SelectTrigger className="w-[120px] h-9 shrink-0">
                                                            <SelectValue placeholder="Tipo" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(subtaskTypes).map(([key, { text, className }]) => (
                                                                <SelectItem key={key} value={key}>
                                                                    <Badge variant="outline" className={cn("text-xs font-semibold border-none shadow-none", className)}>{text}</Badge>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button type="button" size="sm" disabled={!newSubtaskTitle.trim()} onClick={handleSubtaskAdd}>
                                                        Añadir
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

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

            <div className="grid lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cajón de Tareas</CardTitle>
                            <CardDescription>Aquí están todas las tareas pendientes. Arrastra para añadirlas al sprint.</CardDescription>
                        </CardHeader>
                        <CardContent 
                            className="space-y-3"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'backlog')}
                        >
                            {tasks.map(task => (
                                <Card 
                                    key={task.id} 
                                    className={cn(
                                        "p-3 flex items-start gap-3 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing",
                                        draggedItem?.id === task.id && "opacity-30"
                                    )}
                                    onClick={() => setSelectedTask(task)}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task, 'backlog')}
                                    onDragEnd={handleDragEnd}
                                >
                                    <GripVertical className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-semibold leading-tight">{task.title}</h3>
                                            <Badge variant="secondary" className="font-mono text-xs shrink-0">{task.points} pts</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1 truncate">{task.client} {task.type === 'task' && `• ${task.taskType}`}</p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                            {task.tag && <Badge variant="outline" className={cn("text-xs font-semibold", task.tag.className)}>{task.tag.text}</Badge>}
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
                            <div 
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'sprint')}
                                className="min-h-[200px] border-2 border-dashed rounded-lg p-4 space-y-2 bg-secondary/20"
                            >
                               {sprintTasks.length > 0 ? (
                                    sprintTasks.map(task => (
                                         <Card 
                                            key={task.id} 
                                            className={cn(
                                                "p-2 flex items-center justify-between text-sm cursor-grab active:cursor-grabbing",
                                                draggedItem?.id === task.id && "opacity-30"
                                            )}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task, 'sprint')}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => setSelectedTask(task)}
                                         >
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

            <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
                <DialogContent className="sm:max-w-xl">
                    {selectedTask && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="font-headline text-xl">{selectedTask.title}</DialogTitle>
                                <DialogDescription>{selectedTask.id} • {selectedTask.client}</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                                {selectedTask.description && <p className="text-sm text-muted-foreground">{selectedTask.description}</p>}
                                
                                <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                                    {selectedTask.type === 'task' ? (
                                        <div>
                                            <p className="text-muted-foreground font-semibold">Tipo de Tarea</p>
                                            <p>{selectedTask.taskType}</p>
                                        </div>
                                    ) : null}
                                    <div>
                                        <p className="text-muted-foreground font-semibold">Categoría</p>
                                        <Badge variant="outline" className={cn("text-xs font-semibold", selectedTask.tag.className)}>{selectedTask.tag.text}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground font-semibold">Puntos</p>
                                        <p>{selectedTask.points} pts</p>
                                    </div>
                                </div>

                                {selectedTask.type === 'campaign' && selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                                    <div className="space-y-3 border-t pt-4">
                                        <h4 className="font-semibold text-foreground">Sub-tareas</h4>
                                        <div className="space-y-2">
                                            {selectedTask.subtasks.map((sub: any) => (
                                                <div key={sub.id} className="flex items-center gap-3 rounded-md p-2 bg-secondary/50">
                                                    <Badge variant="outline" className={cn("text-xs font-semibold", sub.tag.className)}>{sub.tag.text}</Badge>
                                                    <span className="text-sm">{sub.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
