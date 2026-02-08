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
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useUser } from "@/firebase";
import { collection, doc, query, where, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";


const KANBAN_SPRINT_ID = "current-sprint"; // Example sprint ID

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

const getImageUrl = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl;

export default function KanbanPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const tasksQuery = useMemoFirebase(() => 
      (firestore && !isUserLoading)
          ? query(
              collection(firestore, 'tasks'), 
              where('sprintId', '==', KANBAN_SPRINT_ID),
              orderBy('updatedAt', 'desc')
            ) 
          : null,
  [firestore, isUserLoading]);
  const { data: tasks, isLoading: isLoadingTasks } = useCollection<any>(tasksQuery);

  const usersQuery = useMemoFirebase(() => (firestore && !isUserLoading) ? collection(firestore, 'users') : null, [firestore, isUserLoading]);
  const { data: usersData } = useCollection<any>(usersQuery);

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
  const [newSubtaskType, setNewSubtaskType] = useState(Object.keys(subtaskTypes)[0]);
  
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
    if (!selectedTask || selectedTask.type !== 'campaign' || !subtaskTypes[newTypeKey] || !firestore) return;

    const updatedSubtasks = selectedTask.subtasks?.map((sub: any) => 
        sub.id === subtaskId ? { ...sub, type: newTypeKey } : sub
    ) || [];

    const taskDocRef = doc(firestore, 'tasks', selectedTask.id);
    updateDocumentNonBlocking(taskDocRef, {
      subtasks: updatedSubtasks,
      updatedAt: new Date().toISOString(),
    });
    
    setSelectedTask((prev: any) => ({ ...prev, subtasks: updatedSubtasks.map((s:any) => s.id === subtaskId ? {...s, tag: subtaskTypes[newTypeKey]} : s) }));
};

  const handleSubtaskAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedTask || selectedTask.type !== 'campaign' || !subtaskTypes[newSubtaskType] || !firestore) return;

    const newSubtask = {
        id: `SUB-${Date.now()}`,
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
    setNewSubtaskType(Object.keys(subtaskTypes)[0]);
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
    // To make it persistent, one might store column configurations in Firestore.
    // setBoardData(prevData => ...)
    
    setIsRenameDialogOpen(false);
  };
  
  if (isLoadingTasks || isUserLoading || !boardData) {
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
              <Link href="/backlog">Review Backlog</Link>
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
                      "bg-card cursor-grab active:cursor-grabbing",
                      draggedItem?.taskId === task.id && "opacity-30"
                    )}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs text-muted-foreground truncate">{task.id.substring(0, 7)} {task.clientId && `• ${task.clientId}`}</p>
                          <h3 className="font-semibold font-headline leading-tight truncate">{task.name}</h3>
                        </div>
                        <div className="flex items-center shrink-0">
                          {ActionIcon ? <ActionIcon className="w-5 h-5 text-muted-foreground" /> : 
                          task.commentsCount > 0 ? (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-xs">{task.commentsCount}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                           {task.userId && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={getImageUrl(task.userId)} />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                          )}
                          {task.category && (
                            <Badge variant="outline">{task.category}</Badge>
                          )}
                        </div>
                        {task.deadline && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(task.dueDate), 'dd MMM', {locale: es})}</span>
                          </div>
                        )}
                      </div>
                      
                      {task.type === 'campaign' && task.progress !== undefined && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span className="font-semibold">{task.progress}%</span>
                          </div>
                          <Progress value={task.progress} className="h-1.5" />
                        </div>
                      )}
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
                                  <p>{selectedTask.taskTypeId}</p>
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
                                                            <Badge variant="outline" className={cn("cursor-pointer text-xs font-semibold", subtaskTypes[subtask.type]?.className)}>{subtaskTypes[subtask.type]?.text}</Badge>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuRadioGroup value={currentTagKey} onValueChange={(newType) => handleSubtaskTypeChange(subtask.id, newType)}>
                                                                {Object.entries(subtaskTypes).map(([key, { text }]) => (
                                                                    <DropdownMenuRadioItem key={key} value={key}>{text}</DropdownMenuRadioItem>
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
                                            {Object.entries(subtaskTypes).map(([key, { text, className }]) => (
                                                <SelectItem key={key} value={key}>
                                                  <Badge variant="outline" className={cn("text-xs font-semibold border-none shadow-none", className)}>{text}</Badge>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="submit" size="sm" disabled={!newSubtaskTitle.trim()}>Añadir</Button>
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
