"use client"
import { Calendar } from "@/components/ui/calendar"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button";

export default function CalendarPage() {
    const [date, setDate] = useState<Date | undefined>()

    useEffect(() => {
        setDate(new Date());
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Calendario</h1>
                    <p className="text-muted-foreground">Visualiza entregas e hitos para evitar cuellos de botella.</p>
                </div>
                <Button>Crear Tarea</Button>
            </div>
            <Card>
                <CardContent className="p-0">
                  <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md w-full"
                  />
                </CardContent>
            </Card>
            <p className="text-sm text-center text-muted-foreground">Haz clic en una fecha para crear una tarea asignada a ese día.</p>
        </div>
    )
}
