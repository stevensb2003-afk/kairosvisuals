import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PwaInstallBanner } from '@/components/dashboard/pwa-install-banner';
import UserWorkloadChart from "@/components/dashboard/user-workload-chart-dynamic";
import { Button } from "@/components/ui/button";
import { ArrowUp, Clock, MoreHorizontal, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

const weeklyThroughput = {
  value: 75,
  change: 12,
  goal: 95
};

const activeProjects = {
  count: 14,
  change: 2,
  reviewCount: 3,
  stages: [
    { color: 'bg-primary', value: 50 },
    { color: 'bg-chart-1', value: 30 },
    { color: 'bg-chart-2', value: 20 },
  ]
};

const criticalDeliveries = [
  {
    taskName: 'Nike Air Promo - v3',
    taskMeta: 'Video Editing • 4K Export',
    client: 'Nike Inc.',
    clientLogoId: 'nike-logo',
    editorAvatarId: 'editor-nike',
    deadline: '4h 32m',
    status: 'Rendering',
    statusColor: 'bg-chart-3'
  },
  {
    taskName: 'Summer Campaign Teaser',
    taskMeta: 'Color Grading • Rush',
    client: 'Spotify',
    clientLogoId: 'spotify-logo',
    editorAvatarId: 'editor-spotify',
    deadline: '18h 15m',
    status: 'Editing',
    statusColor: 'bg-chart-1'
  }
];

export default function Home() {
  const getImageUrl = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl;

  return (
    <div className="space-y-6">
      <PwaInstallBanner />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Weekly Throughput</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold font-headline">{weeklyThroughput.value}%</span>
              <span className="flex items-center text-chart-2 font-medium">
                <ArrowUp className="h-4 w-4" />
                {weeklyThroughput.change}%
              </span>
            </div>
            <Progress value={weeklyThroughput.value} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">Goal: {weeklyThroughput.goal}% completion by Friday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold font-headline">{activeProjects.count}</span>
              <span className="flex items-center text-chart-2 font-medium">
                <ArrowUp className="h-4 w-4" />
                {activeProjects.change}
              </span>
            </div>
            <div className="flex w-full h-2 rounded-full overflow-hidden mt-2 bg-secondary">
              {activeProjects.stages.map((stage, index) => (
                <div key={index} className={stage.color} style={{ width: `${stage.value}%` }} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{activeProjects.reviewCount} in review stage</p>
          </CardContent>
        </Card>
      </div>
      
      <UserWorkloadChart />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-md">
                <AlertTriangle className="text-destructive h-5 w-5" />
              </div>
              <div>
                <CardTitle>Critical Deliveries</CardTitle>
                <CardDescription>Tasks due within 48 hours</CardDescription>
              </div>
            </div>
            <Button variant="link" className="text-sm text-primary">View All Tasks</Button>
          </div>
        </CardHeader>
        <CardContent className="!pt-0">
           <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-border/50">
                  <TableHead className="w-[30%] text-muted-foreground">TASK NAME</TableHead>
                  <TableHead className="text-muted-foreground">CLIENT</TableHead>
                  <TableHead className="text-muted-foreground">EDITOR</TableHead>
                  <TableHead className="text-muted-foreground">DEADLINE</TableHead>
                  <TableHead className="text-muted-foreground">STATUS</TableHead>
                  <TableHead className="text-right text-muted-foreground">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalDeliveries.map((task, index) => (
                  <TableRow key={index} className="[&_td]:py-3">
                    <TableCell>
                      <div className="font-bold font-headline">{task.taskName}</div>
                      <div className="text-xs text-muted-foreground">{task.taskMeta}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={getImageUrl(task.clientLogoId)} alt={task.client} />
                          <AvatarFallback>{task.client.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{task.client}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Avatar className="h-6 w-6">
                          <AvatarImage src={getImageUrl(task.editorAvatarId)} />
                           <AvatarFallback>E</AvatarFallback>
                        </Avatar>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs text-orange-400 border-orange-500/50 bg-orange-500/10">
                        <Clock className="h-3 w-3 mr-1.5" />
                        {task.deadline}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <Badge className={cn("text-primary-foreground", task.statusColor)}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
