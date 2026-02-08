'use client';

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { Clock, Filter, MessageSquare, Palette, Search, Trash2, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCollection, useFirestore, updateDocumentNonBlocking, useUser } from "@/firebase";
import { collection, doc, query, where, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";


const KANBAN_SPRINT_ID = "next-sprint"; // Note: Using next-sprint for Kanban now as well.

const getImageUrl = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl;

export default function KanbanPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const tasksQuery = useMemo(() => 
      (firestore && !isUserLoading)
          ? query(
              collection(firestore, 'tasks'), 
              where('sprintId', '==', KANBAN_SPRINT_ID)
            ) 
          : null,
  [firestore, isUserLoading]);
  const { data: tasks, isLoading: isLoadingTasks } = useCollection<any>(tasksQuery);

  const usersQuery = useMemo(() => (firestore && !isUserLoading) ? collection(firestore, 'users') : null, [firestore, isUserLoading]);
  const { data: usersData } = useCollection<any>(usersQuery);

  const taskTypesQuery = useMemo(() => (firestore && !isUserLoading) ? collection(firestore, 'task_types') : null, [firestore, isUserLoading]);
  const { data: taskTypesData, isLoading: isLoadingTaskTypes } = useCollection<any>(taskTypesQuery);

  const taskTypeMap = useMemo(() => {
    if (!taskTypesData) return {};
    return taskTypesData.reduce((acc: any, tt: any) => {
        acc[tt.id] = tt;
        return acc;
    }, {});
  }, [taskTypesData]);

  const boardData = useMemo(() => {
    if (!tasks || !usersData) return null;

    const columns = [
        { id: "pending", title: "Pending", tasks: [] as any[] },
        { id: "in-progress", title: "In Progress", tasks: [] as any[] },
        { id: "client-review", title: "Client Review", tasks: [] as any[] },
        { id: "client-approved", title: "Aprobado por cliente", tasks: [] as any[] },
        { id: "completed", title: "Completado", tasks: [] as any[] },
    ];

    tasks.forEach(task => {
        const column = columns.find(c => c.id === task.status);
        if (column) {
            column.tasks.push(task);
        } else {
            columns.find(c => c.id === 'pending')?.tasks.push(task); // Fallback to pending
        }
    });

    return {
      sprint: {
        name: "Sprint Actual",
        status: "Active",
        dateRange: "...",
        remaining: "...",
      },
      users: usersData,
      columns: columns
    };
  }, [tasks, usersData]);


  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskType, setNewSubtaskType] = useState("");
  
  const [draggedItem, setDraggedItem] = useState<{ taskId: string } | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: any) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id }));
    setDraggedItem({ taskId: task.id });
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetColId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedData = JSON.parse(e.dataTransfer.getData('application/json'));
    if (!draggedData || !firestore) return;

    const { taskId } = draggedData;
    
    const taskDocRef = doc(firestore, 'tasks', taskId);
    updateDocumentNonBlocking(taskDocRef, { status: targetColId, updatedAt: new Date().toISOString() });

    setDraggedItem(null);
  };
  
  const handleDragEnd = () => {
    setDraggedItem(null);
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask || !firestore || !user) return;

    const newCommentObj = {
      user: user.displayName || 'Usuario',
      avatarId: 'alex-chen', //TODO: link to actual user avatar
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...(selectedTask.comments || []), newCommentObj];
    
    const taskDocRef = doc(firestore, 'tasks', selectedTask.id);
    updateDocumentNonBlocking(taskDocRef, {
      comments: updatedComments,
      commentsCount: updatedComments.length,
      updatedAt: new Date().toISOString(),
    });
    
    setSelectedTask((prev: any) => ({ ...prev, comments: updatedComments, commentsCount: updatedComments.length }));
    setNewComment("");
  };

  const handleSubtaskToggle = (subtaskId: string, completed: boolean) => {
    if (!selectedTask || selectedTask.type !== 'campaign' || !firestore) return;

    const updatedSubtasks = selectedTask.subtasks?.map((sub: any) => 
        sub.id === subtaskId ? { ...sub, completed } : sub
    ) || [];
    
    const completedCount = updatedSubtasks.filter((s: any) => s.completed).length;
    const newProgress = updatedSubtasks.length > 0 ? Math.round((completedCount / updatedSubtasks.length) * 100) : 0;

    const taskDocRef = doc(firestore, 'tasks', selectedTask.id);
    updateDocumentNonBlocking(taskDocRef, {
      subtasks: updatedSubtasks,
      progress: newProgress,
      updatedAt: new Date().toISOString(),
    });

    setSelectedTask((prev: any) => ({ ...prev, subtasks: updatedSubtasks, progress: newProgress }));
  };

  const handleSubtaskTypeChange = (subtaskId: string, newTypeKey: string) => {
    if (!selectedTask || selectedTask.type !== 'campaign' || !newTypeKey || !firestore) return;

    const updatedSubtasks = selectedTask.subtasks?.map((sub: any) => 
        sub.id === subtaskId ? { ...sub, type: newTypeKey } : sub
    ) || [];

    const taskDocRef = doc(firestore, 'tasks', selectedTask.id);
    updateDocumentNonBlocking(taskDocRef, {
      subtasks: updatedSubtasks,
      updatedAt: new Date().toISOString(),
    });
    
    setSelectedTask((prev: any) => ({ ...prev, subtasks: updatedSubtasks }));
};

  const handleSubtaskAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedTask || selectedTask.type !== 'campaign' || !newSubtaskType || !firestore) return;

    const newSubtask = {
        id: `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
        type: newSubtaskType
    };

    const updatedSubtasks = [...(selectedTask.subtasks || []), newSubtask];
    const completedCount = updatedSubtasks.filter((s: any) => s.completed).length;
    const newProgress = Math.round((completedCount / updatedSubtasks.length) * 100);

    const taskDocRef = doc(firestore, 'tasks', selectedTask.id);
    updateDocumentNonBlocking(taskDocRef, {
      subtasks: updatedSubtasks,
      progress: newProgress,
      updatedAt: new Date().toISOString(),
    });
    
    setSelectedTask((prev: any) => ({ ...prev, subtasks: updatedSubtasks, progress: newProgress }));
    setNewSubtaskTitle("");
    setNewSubtaskType("");
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (!selectedTask || selectedTask.type !== 'campaign' || !firestore) return;

    const updatedSubtasks = selectedTask.subtasks?.filter((sub: any) => sub.id !== subtaskId) || [];
    const completedCount = updatedSubtasks.filter((s: any) => s.completed).length;
    const newProgress = updatedSubtasks.length > 0 ? Math.round((completedCount / updatedSubtasks.length) * 100) : 0;

    const taskDocRef = doc(firestore, 'tasks', selectedTask.id);
    updateDocumentNonBlocking(taskDocRef, {
      subtasks: updatedSubtasks,
      progress: newProgress,
      updatedAt: new Date().toISOString(),
    });

    setSelectedTask((prev: any) => ({ ...prev, subtasks: updatedSubtasks, progress: newProgress }));
  };

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [columnToRename, setColumnToRename] = useState<any>(null);
  const [newColumnName, setNewColumnName] = useState("");

  const handleRenameClick = (column: any) => {
    setColumnToRename(column);
    setNewColumnName(column.title);
    setIsRenameDialogOpen(true);
  };
  
  const handleRenameSubmit = () => {
    // Note: Renaming columns is a UI-only feature for this implementation
    // as statuses are tied to the hardcoded column IDs.
    if (!newColumnName.trim() || !columnToRename) return;
    
    // This part would need a more complex implementation if column IDs were dynamic
    // For now, it just updates the title in the local state.
    // setBoardData(prevData => ...)
    
    setIsRenameDialogOpen(false);
  };
  
  if (isLoadingTasks || isUserLoading || !boardData || isLoadingTaskTypes) {
    return (
        <div className="flex flex-col h-full space-y-6">
            <header><Skeleton className="h-12 w-full" /></header>
            <div className="flex items-center gap-4"><Skeleton className="h-9 w-full" /></div>
            <main className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 items-start">
                {Array.from({length: 5}).map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ))}
            </main>
        </div>
    )
  }

  const { sprint, users } = boardData;

  return (
    <>
      <div className="flex flex-col h-full space-y-6">
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-headline">{sprint.name}</h1>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
                <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                {sprint.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{sprint.dateRange} • {sprint.remaining}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {users.map((user: any) => (
                <Avatar key={user.id} className="border-2 border-background h-8 w-8">
                  <AvatarImage src={getImageUrl(user.id)} alt={user.firstName} />
                  <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <Button asChild size="sm">
              <Link href="/backlog">Gestionar Backlog</Link>
            </Button>
          </div>
        </header>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks..." className="pl-10 bg-card h-9" />
          </div>
          <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
        </div>

        <main className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 items-start">
          {boardData.columns.map((col) => (
            <div 
              key={col.id} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="h-full flex flex-col space-y-4 rounded-lg"
            >
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold font-headline">{col.title}</h2>
                  <Badge variant="secondary" className="text-xs">{col.tasks.length}</Badge>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4"/>
                            <span className="sr-only">Column actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuRadioItem onClick={() => handleRenameClick(col)}>Renombrar</DropdownMenuRadioItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-4">
              {col.tasks.map((task: any) => {
                const ActionIcon = task.actionIcon;
                return (
                <div key={task.id} 
                  onDragOver={handleDragOver}
                  onDrop={(e) => {
                    e.stopPropagation(); // prevent parent drop handler
                    // drop logic for reordering within a column could go here
                  }}
                >
                  <Card 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedTask(task)}
                    className={cn(
                      "bg-card cursor-grab active:cursor-grabbing hover:bg-card/80 transition-colors",
                      draggedItem?.taskId === task.id && "opacity-30"
                    )}
                  >
                    <CardContent className="p-3 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-semibold font-headline leading-tight flex-1">{task.name}</h3>
                        {task.commentsCount > 0 && (
                          <div className="flex items-center gap-1 text-muted-foreground text-xs shrink-0">
                            <MessageSquare className="h-3 w-3" />
                            <span>{task.commentsCount}</span>
                          </div>
                        )}
                      </div>
                      
                      {task.type === 'campaign' && task.progress !== undefined && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Progreso</span>
                            <span className="font-semibold">{task.progress}%</span>
                          </div>
                          <Progress value={task.progress} className="h-1.5" />
                        </div>
                      )}

                      <div className="flex items-end justify-between pt-2">
                        <div className="flex items-center gap-2">
                           {task.userId && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={getImageUrl(task.userId)} />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                          )}
                           <div className="flex flex-col">
                            {task.category && (
                              <Badge variant="outline">{task.category}</Badge>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">{task.clientId}</p>
                           </div>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(task.dueDate), 'dd MMM', {locale: es})}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                )})}
              </div>
            </div>
          ))}
        </main>
      </div>

      <Dialog open={isRenameDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setColumnToRename(null);
          setNewColumnName("");
        }
        setIsRenameDialogOpen(open);
      }}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Renombrar Columna</DialogTitle>
                <DialogDescription>
                    Introduce el nuevo nombre para la columna &quot;{columnToRename?.title}&quot;.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Input 
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="Nuevo nombre de la columna"
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancelar</Button>
                <Button type="button" onClick={handleRenameSubmit}>Guardar</Button>
            </div>
        </DialogContent>
      </Dialog>


      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            {selectedTask && (
                <>
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">{selectedTask.name}</DialogTitle>
                        {selectedTask.category && <DialogDescription>{selectedTask.id.substring(0,7)} • <span className="font-semibold">{selectedTask.category}</span></DialogDescription>}
                    </DialogHeader>
                    <div className="flex-1 py-4 space-y-6 overflow-y-auto pr-4 -mr-2">

                        <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                            <div>
                                <p className="text-muted-foreground font-semibold">Cliente</p>
                                <p>{selectedTask.clientId}</p>
                            </div>
                            {selectedTask.type === 'task' && selectedTask.taskTypeId && (
                              <div>
                                  <p className="text-muted-foreground font-semibold">Tipo de Tarea</p>
                                  <p>{taskTypeMap[selectedTask.taskTypeId]?.name || selectedTask.taskTypeId}</p>
                              </div>
                            )}
                            <div>
                                <p className="text-muted-foreground font-semibold">Fecha de Creación</p>
                                <p>{selectedTask.createdAt ? format(new Date(selectedTask.createdAt), "dd MMM, yyyy", { locale: es }) : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground font-semibold">Última Actualización</p>
                                <p>{selectedTask.updatedAt ? format(new Date(selectedTask.updatedAt), "dd MMM, yyyy 'a las' HH:mm", { locale: es }) : 'N/A'}</p>
                            </div>
                        </div>
                        
                        {selectedTask.type === 'campaign' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-foreground">Sub-tareas</h4>
                                    <span className="text-sm text-muted-foreground">{selectedTask.progress || 0}% completado</span>
                                </div>
                                <Progress value={selectedTask.progress || 0} className="h-2" />
                                <div className="space-y-2">
                                    {selectedTask.subtasks?.map((subtask: any) => {
                                        const currentTagKey = subtask.type;
                                        return (
                                        <div key={subtask.id} className="group flex items-center justify-between gap-3 rounded-md p-2 hover:bg-secondary/50">
                                            <div className="flex items-center gap-3">
                                                <Checkbox 
                                                    id={`subtask-${subtask.id}`} 
                                                    checked={subtask.completed} 
                                                    onCheckedChange={(checked) => handleSubtaskToggle(subtask.id, !!checked)}
                                                />
                                                <label
                                                    htmlFor={`subtask-${subtask.id}`}
                                                    className={cn("cursor-pointer text-sm", subtask.completed && "text-muted-foreground line-through")}
                                                >
                                                    {subtask.title}
                                                </label>
                                            </div>
                                             <div className="flex items-center gap-2">
                                                {subtask.type && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                          {taskTypeMap[subtask.type] ? (
                                                              <Badge variant="outline" className="cursor-pointer text-xs font-semibold" style={{ backgroundColor: `${taskTypeMap[subtask.type].color}20`, color: taskTypeMap[subtask.type].color, borderColor: `${taskTypeMap[subtask.type].color}30` }}>
                                                                  {taskTypeMap[subtask.type].name}
                                                              </Badge>
                                                          ) : (
                                                              <Badge variant="secondary" className="cursor-pointer">Tipo no encontrado</Badge>
                                                          )}
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuRadioGroup value={currentTagKey} onValueChange={(newType) => handleSubtaskTypeChange(subtask.id, newType)}>
                                                                {taskTypesData?.map((taskType: any) => (
                                                                    <DropdownMenuRadioItem key={taskType.id} value={taskType.id}>{taskType.name}</DropdownMenuRadioItem>
                                                                ))}
                                                            </DropdownMenuRadioGroup>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" onClick={() => handleDeleteSubtask(subtask.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete subtask</span>
                                                </Button>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                                <form onSubmit={handleSubtaskAdd} className="flex gap-2 pt-4">
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
                                            {isLoadingTaskTypes ? (
                                                <SelectItem value="loading" disabled>Cargando...</SelectItem>
                                            ) : (
                                                taskTypesData?.map((taskType: any) => (
                                                    <SelectItem key={taskType.id} value={taskType.id}>
                                                        <Badge variant="outline" className="text-xs font-semibold border-none shadow-none" style={{ backgroundColor: `${taskType.color}20`, color: taskType.color, borderColor: `${taskType.color}30` }}>
                                                            {taskType.name}
                                                        </Badge>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Button type="submit" size="sm" disabled={!newSubtaskTitle.trim() || !newSubtaskType}>Añadir</Button>
                                </form>
                            </div>
                        )}

                        {selectedTask.description && <p className="text-muted-foreground">{selectedTask.description}</p>}
                        
                        <div className="space-y-4">
                            <h4 className="font-semibold text-foreground">Comentarios</h4>
                            <div className="space-y-4">
                                {selectedTask.comments?.map((comment: any, index: number) => (
                                    <div key={index} className="flex gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={getImageUrl(comment.avatarId)} alt={comment.user} />
                                            <AvatarFallback>{comment.user?.split(' ').map((n:string) => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm">{comment.user}</p>
                                            <div className="text-sm text-muted-foreground bg-secondary p-3 rounded-lg mt-1">
                                                {comment.text}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!selectedTask.comments || selectedTask.comments?.length === 0) && <p className="text-muted-foreground text-sm">No hay comentarios aún.</p>}
                            </div>
                            <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2">
                                <Textarea 
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="Escribe un comentario..."
                                  className="bg-secondary border-border"
                                />
                                <Button type="submit" className="self-end" disabled={!newComment.trim()}>Enviar</Button>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
