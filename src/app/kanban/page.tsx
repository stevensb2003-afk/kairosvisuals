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
import { Clock, Filter, MessageSquare, MoreHorizontal, Palette, Search } from "lucide-react";
import Image from "next/image";
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const initialKanbanData = {
  sprint: {
    name: "Sprint #42 - August Campaign",
    status: "Active",
    dateRange: "Aug 01 - Aug 14",
    remaining: "12 days remaining",
  },
  users: [
    { id: "alex-chen", name: "Alex Chen" },
    { id: "sarah-j", name: "Sarah J." },
  ],
  columns: [
    {
      id: "pending",
      title: "Pending",
      tasks: [
        {
          id: "KV-1024",
          title: "Intro Animation - Spring Collection",
          description: "Create a 5s intro animation using the new branding assets.",
          icon: { id: "motion-icon", hint: "abstract motion" },
          tag: { text: "MOTION", className: "bg-purple-600/10 text-purple-400 border-purple-600/20" },
          comments: [{ user: 'Sarah J.', avatarId: 'sarah-j', text: 'Can we get a preview by EOD?' }],
          commentsCount: 1,
        },
        {
          id: "KV-1033",
          title: "Podcast Ep 4 - Rough Cut",
          description: null,
          icon: { id: "audio-icon", hint: "sound wave" },
          tag: { text: "AUDIO", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
          comments: [],
          commentsCount: 0,
        },
      ],
    },
    {
      id: "in-progress",
      title: "In Progress",
      tasks: [
        {
          id: 'KV-1025-cover',
          title: '16s Teaser',
          image: { id: 'nike-teaser', hint: 'abstract video' },
          isCover: true,
          comments: [],
          commentsCount: 0,
        },
        {
          id: "KV-1011",
          title: "Nike Campaign - Social Reel",
          description: null,
          progress: 60,
          editor: { id: "editor-nike", name: "Nike Editor" },
          tag: { text: "EDITING", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
          deadline: "2d",
          commentsCount: 1,
          comments: [{ user: 'Alex Chen', avatarId: 'alex-chen', text: 'The client wants to see a version with a different song.' }]
        },
      ],
    },
    {
      id: "client-review",
      title: "Client Review",
      tasks: [
        {
          id: "KV-0980",
          title: "Corporate Doc v2",
          description: "Awaiting feedback on the color grade.",
          editor: { id: "editor-spotify", name: "Spotify Editor" },
          tag: { text: "GRADING", className: "bg-green-500/10 text-green-400 border-green-500/20" },
          actionIcon: Palette,
          comments: [],
          commentsCount: 0,
        },
      ],
    },
  ],
};


const getImageUrl = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl;

// Main component
export default function KanbanPage() {
  const [boardData, setBoardData] = useState(initialKanbanData);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  
  const [draggedItem, setDraggedItem] = useState<{ taskId: string } | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: any, sourceColId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, sourceColId }));
    setDraggedItem({ taskId: task.id });
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetColId: string, targetTaskId: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedData = JSON.parse(e.dataTransfer.getData('application/json'));
    if (!draggedData) return;
    
    const { taskId, sourceColId } = draggedData;

    setBoardData(prevData => {
      const newBoardData = JSON.parse(JSON.stringify(prevData));
      
      const sourceCol = newBoardData.columns.find((c: any) => c.id === sourceColId);
      if (!sourceCol) return prevData;

      const taskIndex = sourceCol.tasks.findIndex((t: any) => t.id === taskId);
      if (taskIndex === -1) return prevData;
      
      const [task] = sourceCol.tasks.splice(taskIndex, 1);

      const targetCol = newBoardData.columns.find((c: any) => c.id === targetColId);
      if (!targetCol) return prevData;
      
      if (targetTaskId) {
        const dropIndex = targetCol.tasks.findIndex((t: any) => t.id === targetTaskId);
        targetCol.tasks.splice(dropIndex, 0, task);
      } else {
        targetCol.tasks.push(task);
      }

      return newBoardData;
    });

    setDraggedItem(null);
  };
  
  const handleDragEnd = () => {
    setDraggedItem(null);
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    const newCommentObj = {
      user: 'Alex Chen', // Hardcoded current user
      avatarId: 'alex-chen',
      text: newComment.trim(),
    };

    const updatedTask = JSON.parse(JSON.stringify(selectedTask));
    if (!updatedTask.comments) updatedTask.comments = [];
    updatedTask.comments.push(newCommentObj);
    if (updatedTask.hasOwnProperty('commentsCount')) {
      updatedTask.commentsCount = updatedTask.comments.length;
    }
    setSelectedTask(updatedTask);

    setBoardData(prevData => {
        const newBoardData = JSON.parse(JSON.stringify(prevData));
        for (const col of newBoardData.columns) {
            const taskIndex = col.tasks.findIndex((t: any) => t.id === selectedTask.id);
            if (taskIndex > -1) {
                col.tasks[taskIndex] = updatedTask;
                break;
            }
        }
        return newBoardData;
    });

    setNewComment("");
  };

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
              {users.map(user => (
                <Avatar key={user.id} className="border-2 border-background h-8 w-8">
                  <AvatarImage src={getImageUrl(user.id)} alt={user.name} />
                  <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
              ))}
              <Avatar className="border-2 border-background bg-muted text-muted-foreground h-8 w-8">
                <AvatarFallback>+2</AvatarFallback>
              </Avatar>
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

        <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
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
                  <Badge variant="secondary" className="text-xs">{col.tasks.filter(t => !t.isCover).length}</Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
              {col.tasks.map((task) => (
                <div key={task.id} 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id, task.id)}
                >
                  <Card 
                    draggable={!task.isCover}
                    onDragStart={(e) => handleDragStart(e, task, col.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => !task.isCover && setSelectedTask(task)}
                    className={cn(
                      "bg-card", 
                      task.isCover ? "p-0 overflow-hidden" : "cursor-grab active:cursor-grabbing",
                      draggedItem?.taskId === task.id && "opacity-30"
                    )}
                  >
                    {task.isCover && task.image ? (
                      <div className="relative aspect-video">
                        <Image src={getImageUrl(task.image.id) || ''} alt={task.title} fill className="object-cover" data-ai-hint={task.image.hint} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <p className="absolute bottom-2 left-3 font-semibold text-sm text-white">{task.title}</p>
                      </div>
                    ) : (
                      <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-muted-foreground">{task.id}</p>
                            <h3 className="font-semibold font-headline leading-tight">{task.title}</h3>
                            {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                          </div>
                          <div className="flex items-center">
                            {task.actionIcon ? <task.actionIcon className="w-5 h-5 text-muted-foreground shrink-0" /> : 
                            task.commentsCount > 0 ? (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-xs">{task.commentsCount}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {task.icon && (
                                <div className="p-1.5 bg-secondary rounded-full flex items-center justify-center">
                                  <Image src={getImageUrl(task.icon.id) || ''} alt="" width={16} height={16} data-ai-hint={task.icon.hint} />
                                </div>
                              )}
                              {task.editor && (
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={getImageUrl(task.editor.id)} alt={task.editor.name} />
                                  <AvatarFallback>{task.editor.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                              )}
                              {task.tag && (
                                <Badge variant="outline" className={cn("text-xs font-semibold", task.tag.className)}>
                                  {task.tag.text}
                                </Badge>
                              )}
                            </div>

                            {task.deadline && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{task.deadline}</span>
                              </div>
                            )}
                        </div>
                        {task.progress !== undefined && (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-1" />
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                </div>
              ))}
              </div>
            </div>
          ))}
        </main>
      </div>

      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="sm:max-w-2xl">
            {selectedTask && (
                <>
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">{selectedTask.title}</DialogTitle>
                        {selectedTask.tag && <DialogDescription>{selectedTask.id} • <span className={cn("font-semibold", selectedTask.tag.className)}>{selectedTask.tag.text}</span></DialogDescription>}
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        {selectedTask.description && <p className="text-muted-foreground">{selectedTask.description}</p>}
                        
                        <div className="space-y-4">
                            <h4 className="font-semibold text-foreground">Comentarios</h4>
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                {selectedTask.comments?.map((comment: any, index: number) => (
                                    <div key={index} className="flex gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={getImageUrl(comment.avatarId)} alt={comment.user} />
                                            <AvatarFallback>{comment.user.split(' ').map((n:string) => n[0]).join('')}</AvatarFallback>
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