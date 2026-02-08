"use client"

import { Bar, BarChart, YAxis, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AlertCircle } from "lucide-react"

const userWorkload = [
  { name: 'Editor 1', tasks: 8, occupation: 80 },
  { name: 'Editor 2', tasks: 11, occupation: 110 },
];

const chartConfig = {
  occupation: {
    label: "Ocupación",
    color: "hsl(var(--primary))",
  },
}

export function UserWorkloadChart() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Carga por Usuario</CardTitle>
        <CardDescription>Ocupación de los editores esta semana.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="h-[250px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <BarChart accessibilityLayer data={userWorkload} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 8)}
                />
                <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                unit="%"
                />
                <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="occupation" fill="var(--color-occupation)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
        
        <div className="flex flex-col items-center space-y-2 mt-4">
          {userWorkload.map(user => (
            user.tasks > 10 && (
              <div key={user.name} className="flex items-center text-sm text-destructive font-medium">
                <AlertCircle className="w-4 h-4 mr-2"/>
                <span>{user.name} tiene {user.tasks} tareas (sobrecarga).</span>
              </div>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
