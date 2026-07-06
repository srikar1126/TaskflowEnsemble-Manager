import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getTasksFn } from "@/lib/server-functions";

export const Route = createFileRoute("/_app/calendar")({ component: CalendarPage });

const priorityTone: Record<string, string> = {
  Low: "bg-slate-500", Medium: "bg-amber-500", High: "bg-orange-500", Critical: "bg-rose-500",
};

function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasksFn(),
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: startWeekday }, () => null as Date | null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1) as Date | null),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const tasksByDate: Record<string, typeof tasks> = {};
  tasks.forEach(t => {
    const key = new Date(t.dueDate).toDateString();
    (tasksByDate[key] ||= []).push(t);
  });

  return (
    <Card className="glass shadow-card p-5">
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <h2 className="truncate text-xl font-bold">{first.toLocaleString(undefined, { month: "long", year: "numeric" })}</h2>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="icon" variant="outline" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
          <Button size="icon" variant="outline" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="p-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const isToday = d && d.toDateString() === new Date().toDateString();
          const dayTasks = d ? tasksByDate[d.toDateString()] ?? [] : [];
          return (
            <div key={i} className={cn(
              "min-h-24 rounded-lg border border-border/50 p-1.5 text-left",
              d ? "bg-card/50 hover:bg-muted/30" : "bg-transparent border-transparent",
              isToday && "ring-2 ring-primary",
            )}>
              {d && (
                <>
                  <div className={cn("text-xs font-bold", isToday && "text-primary")}>{d.getDate()}</div>
                  <div className="mt-1 space-y-1">
                    {dayTasks.slice(0, 2).map(t => (
                      <div key={t.id} className="flex items-center gap-1 rounded bg-muted/50 px-1 py-0.5 text-[10px]">
                        <span className={cn("h-1.5 w-1.5 rounded-full", priorityTone[t.priority])} />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 2 && <div className="text-[10px] text-muted-foreground">+{dayTasks.length - 2} more</div>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
