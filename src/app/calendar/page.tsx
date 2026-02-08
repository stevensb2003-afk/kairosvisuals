'use client';

import { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

type Task = {
  title: string;
  color: string;
};

const generateSampleTasks = (date: Date): { [key: string]: Task[] } => {
    const tasks: { [key: string]: Task[] } = {};
    const month = date.getMonth();
    const year = date.getFullYear();

    const addTask = (day: number, task: Task) => {
        const key = format(new Date(year, month, day), 'yyyy-MM-dd');
        if (!tasks[key]) {
            tasks[key] = [];
        }
        tasks[key].push(task);
    };

    addTask(5, { title: 'Planificación Sprint', color: 'bg-purple-500' });
    addTask(8, { title: 'Revisión Diseño UI', color: 'bg-blue-500' });
    addTask(15, { title: 'Entrega Prototipo', color: 'bg-green-500' });
    addTask(15, { title: 'Llamada con cliente X', color: 'bg-yellow-500' });
    addTask(22, { title: 'Demo interna', color: 'bg-indigo-500' });
    addTask(28, { title: 'Facturación mensual', color: 'bg-pink-500' });

    return tasks;
};

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());

    const tasks = useMemo(() => generateSampleTasks(currentDate), [currentDate]);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekdays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                 <div>
                    <h1 className="text-3xl font-bold font-headline capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </h1>
                    <p className="text-muted-foreground">Visualiza entregas e hitos para evitar cuellos de botella.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Mes anterior">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                        Hoy
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Siguiente mes">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card className="flex-1 flex flex-col">
              <CardContent className="p-0 flex flex-col flex-1">
                <div className="grid grid-cols-7">
                    {weekdays.map(day => (
                        <div key={day} className="p-2 border-b border-r text-center font-medium text-sm text-muted-foreground first:border-l">
                            {day.substring(0,3)}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 auto-rows-fr flex-1">
                    {days.map((day, dayIdx) => (
                        <div
                            key={day.toString()}
                            className={cn(
                                "border-b border-r p-2 flex flex-col",
                                !isSameMonth(day, currentDate) && "bg-muted/30",
                                dayIdx % 7 === 0 && "border-l"
                            )}
                        >
                            <span className={cn(
                                "font-semibold self-start p-1",
                                 isToday(day) && "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center leading-none",
                                 !isSameMonth(day, currentDate) && "text-muted-foreground"
                            )}>
                                {format(day, 'd')}
                            </span>
                             <div className="flex-1 mt-1 space-y-1 overflow-hidden hover:overflow-y-auto">
                               {tasks[format(day, 'yyyy-MM-dd')]?.map((task, index) => (
                                    <div key={index} className={cn("p-1.5 rounded-md text-xs text-white", task.color)}>
                                       {task.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
              </CardContent>
            </Card>
        </div>
    );
}
