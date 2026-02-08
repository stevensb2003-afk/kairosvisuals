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

// Data
const kanbanData = {
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
        },
        {
          id: "KV-1033",
          title: "Podcast Ep 4 - Rough Cut",
          description: null,
          icon: { id: "audio-icon", hint: "sound wave" },
          tag: { text: "AUDIO", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
        },
      ],
    },
    {
      id: "in-progress",
      title: "In Progress",
      tasks: [
        {
          id: 'KV-1025-cover', // special id for the cover image
          title: '16s Teaser',
          image: { id: 'nike-teaser', hint: 'abstract video' },
          isCover: true,
        },
        {
          id: "KV-1011",
          title: "Nike Campaign - Social Reel",
          description: null,
          progress: 60,
          editor: { id: "editor-nike", name: "Nike Editor" },
          tag: { text: "EDITING", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
          deadline: "2d",
          comments: 1,
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
        },
      ],
    },
  ],
};

const getImageUrl = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl;

export default function KanbanPage() {
  const { sprint, users, columns } = kanbanData;

  return (
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
        {columns.map((col) => (
          <div key={col.id} className="h-full flex flex-col space-y-4">
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
              <Card key={task.id} className={cn("bg-card", task.isCover && "p-0 overflow-hidden")}>
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
                      {task.actionIcon ? <task.actionIcon className="w-5 h-5 text-muted-foreground shrink-0" /> : 
                       task.comments ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-3 shrink-0">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        ) : null}
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
            ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
