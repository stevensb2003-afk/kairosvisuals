"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlaceHolderImages } from "@/lib/placeholder-images"

const userWorkload = [
  { name: 'Sarah J.', tasks: 8, avatarId: 'sarah-j' },
  { name: 'Marcus T.', tasks: 12, avatarId: 'marcus-t' },
];

const MAX_TASKS = 15;
const OVERLOAD_THRESHOLD = 10;

export function UserWorkloadChart() {
  const getAvatarUrl = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Editor Capacity</CardTitle>
                <p className="text-2xl font-bold font-headline">Current Load</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-chart-2"></span>Safe</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive"></span>Overload (&gt;10)</span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-2">
        {userWorkload.map(user => {
            const isOverload = user.tasks > OVERLOAD_THRESHOLD;
            const progressValue = Math.min((user.tasks / MAX_TASKS) * 100, 100);
            return (
                <div key={user.name} className="flex items-center gap-4">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={getAvatarUrl(user.avatarId)} alt={user.name} />
                        <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                     <div className="w-full">
                        <span className="text-sm font-medium">{user.name}</span>
                        <div className="relative h-6 mt-1 rounded-md overflow-hidden bg-secondary">
                           <div 
                                className={`absolute h-full ${isOverload ? 'bg-destructive' : 'bg-chart-2'}`}
                                style={{ width: `${progressValue}%` }}
                            ></div>
                            <span className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-bold text-primary-foreground">
                                {user.tasks} Tasks
                            </span>
                        </div>
                    </div>
                </div>
            )
        })}
      </CardContent>
    </Card>
  )
}
