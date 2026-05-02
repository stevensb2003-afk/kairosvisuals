"use client"

import * as React from "react"
import { Calendar as CalendarIcon, CalendarX, ChevronLeft, ChevronRight, Clock, Check, X } from "lucide-react"
import { format, addDays, startOfToday, setYear, isSameDay } from "date-fns"
import { es } from "date-fns/locale/es"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PremiumDatePickerProps {
  date?: Date
  onSelect: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function PremiumDatePicker({
  date,
  onSelect,
  placeholder = "Seleccionar fecha",
  className,
  disabled
}: PremiumDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [view, setView] = React.useState<"calendar" | "year">("calendar")
  const [month, setMonth] = React.useState<Date>(date || new Date())

  // Configuración de años: 10 atrás, 10 adelante
  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear()
    const startYear = currentYear
    const endYear = currentYear + 10
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
  }, [])

  const handleSelect = (selectedDate: Date | undefined) => {
    onSelect(selectedDate)
    if (selectedDate) {
      setIsOpen(false)
    }
  }

  const handleShortcut = (type: "today" | "tomorrow") => {
    const newDate = type === "today" ? startOfToday() : addDays(startOfToday(), 1)
    onSelect(newDate)
    setMonth(newDate)
    setIsOpen(false)
  }

  const handleYearMonthSelect = (year: number, monthIndex: number) => {
    const newMonth = new Date(year, monthIndex, 1)
    setMonth(newMonth)
    setView("calendar")
  }

  const getCompactMonthName = (date: Date) => {
    const monthName = format(date, "MMMM", { locale: es })
    const formattedMonth = monthName.length <= 4 
      ? monthName 
      : monthName.slice(0, 3)
    return `${formattedMonth} '${format(date, "yy")}`
  }

  // Obtenemos los manejadores de navegación para pasarlos al componente personalizado
  const goToPreviousMonth = () => {
    const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1)
    setMonth(prevMonth)
  }

  const goToNextMonth = () => {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1)
    setMonth(nextMonth)
  }

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) setView("calendar")
    }}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10 transition-all border-border hover:border-primary/50 hover:bg-primary/5",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
          {date ? (
            <span className="font-medium">{format(date, "d MMM ''yy", { locale: es })}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[280px] p-0 overflow-hidden rounded-2xl border-border shadow-2xl bg-popover/95 backdrop-blur-sm" 
        align="start"
        sideOffset={8}
      >
        {/* Header con información rápida */}
        <div className="bg-primary/5 p-3 border-b border-border/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">
              {date ? format(date, "EEEE", { locale: es }) : "Próximo Servicio"}
            </span>
          </div>
          <div className="text-lg font-bold text-foreground">
            {date ? format(date, "d 'de' MMMM", { locale: es }) : "Sin fecha"}
          </div>
        </div>



        <div>
          {view === "calendar" ? (
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              month={month}
              onMonthChange={setMonth}
              initialFocus
              locale={es}
              startMonth={new Date()}
              disabled={{ before: startOfToday() }}
              className="p-0"
              classNames={{
                months: "w-full flex justify-center",
                month: "space-y-4 w-full px-[14px] py-4",
                month_caption: "flex justify-center relative items-center mb-0",
                caption_label: "hidden", 
                nav: "hidden", 
                day: "h-9 w-9 text-center text-sm p-0 relative hover:bg-primary/20 rounded-xl transition-all font-medium",
                selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-xl shadow-lg shadow-primary/20 scale-105",
                today: "text-primary font-bold bg-primary/10 rounded-xl",
                weekday: "text-muted-foreground w-9 text-center font-medium text-[0.7rem] uppercase tracking-tighter",
                month_grid: "w-full border-collapse mx-auto",
              }}
              components={{
                MonthCaption: ({ calendarMonth }) => (
                  <div className="flex items-center justify-between w-full px-2 py-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-full text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPreviousMonth();
                      }}
                    >
                      <ChevronLeft className="h-4 w-4 stroke-[2.5px]" />
                    </Button>
                    
                    <div 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-primary/5 transition-colors cursor-pointer border border-border/30 hover:border-primary/40 shadow-sm"
                      onClick={() => setView("year")}
                    >
                      <span className="text-[13px] font-bold text-primary capitalize tracking-tight">
                        {getCompactMonthName(calendarMonth.date)}
                      </span>
                      <ChevronRight className="h-3 w-3 text-primary/50 group-hover:text-primary transition-transform rotate-90" />
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-full text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToNextMonth();
                      }}
                    >
                      <ChevronRight className="h-4 w-4 stroke-[2.5px]" />
                    </Button>
                  </div>
                )
              }}
            />
          ) : (
            <div className="h-[320px] p-0 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-primary/5">
                <span className="text-sm font-bold text-primary">Seleccionar Mes</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setView("calendar")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1 px-[14px]">
                <div className="space-y-6 py-4">
                  {years.map((year) => (
                    <div key={year} className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-xs font-bold text-muted-foreground/60">{year}</span>
                        <div className="h-[1px] flex-1 bg-border/40" />
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((monthName, idx) => {
                          const isCurrent = month.getFullYear() === year && month.getMonth() === idx;
                          return (
                            <Button
                              key={idx}
                              variant={isCurrent ? "default" : "ghost"}
                              className={cn(
                                "h-9 text-[11px] font-semibold transition-all px-0 rounded-lg",
                                isCurrent && "shadow-md bg-primary hover:bg-primary",
                                !isCurrent && "hover:bg-primary/5 hover:text-primary"
                              )}
                              onClick={() => handleYearMonthSelect(year, idx)}
                            >
                              {monthName}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-[14px] py-2.5 border-t border-border/50 flex items-center justify-between bg-muted/5">
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] h-7 gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
            onClick={() => {
              onSelect(undefined)
              setIsOpen(false)
            }}
          >
            <CalendarX className="w-3.5 h-3.5" />
            Sin fecha definida
          </Button>

          {date && (
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border/50">
              <Check className="w-2.5 h-2.5 text-green-500" />
              Seleccionado
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
