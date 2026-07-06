import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type Task, type TaskStatus } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Paperclip, CalendarDays, Loader2 } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasksFn, getUsersFn, updateTaskStatusFn } from "@/lib/server-functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tasks")({ component: KanbanPage });

const columns: TaskStatus[] = ["Backlog","Todo","In Progress","Review","Done","Blocked"];
const priorityTone: Record<string, string> = {
  Low: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  Medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  High: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  Critical: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};
const colTone: Record<TaskStatus, string> = {
  "Backlog": "from-slate-500/20",
  "Todo": "from-indigo-500/20",
  "In Progress": "from-violet-500/20",
  "Review": "from-amber-500/20",
  "Done": "from-emerald-500/20",
  "Blocked": "from-rose-500/20",
};

function TaskCard({ task, users, dragging }: { task: Task; users: any[]; dragging?: boolean }) {
  const assignee = users.find(u => u.id === task.assigneeId) || { name: "Unassigned", avatarColor: "#64748B" };
  return (
    <Card className={cn("glass p-3 space-y-2.5 cursor-grab active:cursor-grabbing", dragging && "rotate-2 shadow-glow")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 text-sm font-semibold leading-snug">{task.title}</div>
        <Badge className={cn("shrink-0 border-0 text-[10px]", priorityTone[task.priority])}>{task.priority}</Badge>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" />{task.comments}</span>
          <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />{task.attachments}</span>
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        </div>
        <div className="grid h-6 w-6 place-items-center rounded-full text-[9px] font-bold text-white shadow-sm" style={{ background: assignee.avatarColor }}>{initials(assignee.name)}</div>
      </div>
    </Card>
  );
}

function SortableCard({ task, users }: { task: Task; users: any[] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} users={users} />
    </div>
  );
}

function KanbanPage() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasksFn(),
  });

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsersFn(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { taskId: string; status: string }) => updateTaskStatusFn({ data: payload }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      queryClient.setQueryData<Task[]>(["tasks"], old =>
        old?.map(t => t.id === taskId ? { ...t, status: status as TaskStatus } : t)
      );

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
      toast.error("Failed to update task status.");
    },
    onSuccess: () => {
      toast.success("Task status updated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = { "Backlog":[], "Todo":[], "In Progress":[], "Review":[], "Done":[], "Blocked":[] };
    tasks.forEach((t: Task) => {
      if (g[t.status]) {
        g[t.status].push(t);
      }
    });
    return g;
  }, [tasks]);

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;
    const overCol = columns.find(c => c === over.id) ?? tasks.find(t => t.id === over.id)?.status;
    if (overCol && overCol !== activeTask.status) {
      updateStatusMutation.mutate({ taskId: String(active.id), status: overCol });
    }
  }

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;
  const isLoading = isTasksLoading || isUsersLoading;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <Column key={col} status={col} tasks={grouped[col]} users={users} />
        ))}
      </div>
      <DragOverlay>{activeTask && <TaskCard task={activeTask} users={users} dragging />}</DragOverlay>
    </DndContext>
  );
}

function Column({ status, tasks, users }: { status: TaskStatus; tasks: Task[]; users: any[] }) {
  const { setNodeRef } = useSortable({ id: status });
  return (
    <div ref={setNodeRef} className="w-72 shrink-0">
      <Card className={cn("glass shadow-card overflow-hidden bg-gradient-to-b to-transparent", colTone[status])}>
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{status}</span>
            <Badge variant="secondary" className="text-[10px]">{tasks.length}</Badge>
          </div>
        </div>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy} id={status}>
          <div className="flex min-h-[200px] flex-col gap-2 p-3">
            {tasks.map(t => <SortableCard key={t.id} task={t} users={users} />)}
          </div>
        </SortableContext>
      </Card>
    </div>
  );
}
