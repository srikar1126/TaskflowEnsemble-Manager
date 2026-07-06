import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { cn, initials } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasksFn, getUsersFn, getProjectsFn, bulkDeleteTasksFn, bulkAssignTasksFn, bulkUpdateTasksStatusFn } from "@/lib/server-functions";
import { type Priority, type TaskStatus, type Task } from "@/lib/mock-data";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_app/list")({ component: ListPage });

const statusTone: Record<TaskStatus, string> = {
  "Backlog": "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  "Todo": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "In Progress": "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "Review": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "Done": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "Blocked": "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};
const priorityTone: Record<Priority, string> = {
  Low: "bg-slate-500", Medium: "bg-amber-500", High: "bg-orange-500", Critical: "bg-rose-500",
};

function ListPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"title" | "dueDate" | "priority">("dueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const perPage = 12;

  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasksFn(),
  });

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsersFn(),
  });

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjectsFn(),
  });

  const isLoading = isTasksLoading || isUsersLoading || isProjectsLoading;

  const queryClient = useQueryClient();

  const bulkDeleteMutation = useMutation({
    mutationFn: (data: { taskIds: string[] }) => bulkDeleteTasksFn({ data }),
    onSuccess: () => {
      toast.success("Tasks deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelected(new Set());
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete tasks.");
    }
  });

  const bulkAssignMutation = useMutation({
    mutationFn: (data: { taskIds: string[]; assigneeId: string }) => bulkAssignTasksFn({ data }),
    onSuccess: () => {
      toast.success("Tasks assigned successfully!");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelected(new Set());
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign tasks.");
    }
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: (data: { taskIds: string[]; status: string }) => bulkUpdateTasksStatusFn({ data }),
    onSuccess: () => {
      toast.success("Tasks status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelected(new Set());
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update tasks status.");
    }
  });

  const filtered = useMemo(() => {
    let list = tasks.filter(t => t.title.toLowerCase().includes(q.toLowerCase()));
    if (status !== "all") list = list.filter(t => t.status === status);
    if (priority !== "all") list = list.filter(t => t.priority === priority);
    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      return av < bv ? -dir : av > bv ? dir : 0;
    });
    return list;
  }, [tasks, q, status, priority, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function exportCsv() {
    const header = ["Task","Status","Priority","Assignee","Due Date","Project"];
    const rows = filtered.map(t => [
      t.title, t.status, t.priority,
      users.find(u => u.id === t.assigneeId)?.name ?? "",
      new Date(t.dueDate).toISOString().slice(0, 10),
      projects.find(p => p.id === t.projectId)?.name ?? "",
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "tasks.csv"; a.click(); URL.revokeObjectURL(url);
  }

  const allSelected = paged.length > 0 && paged.every(t => selected.has(t.id));

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="glass shadow-card p-5 space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search tasks…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(["Backlog","Todo","In Progress","Review","Done","Blocked"] as const).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={v => { setPriority(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {(["Low","Medium","High","Critical"] as const).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-2 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="font-medium">{selected.size} selected</span>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">Assign</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass">
                {users.map(u => (
                  <DropdownMenuItem
                    key={u.id}
                    onClick={() => bulkAssignMutation.mutate({ taskIds: Array.from(selected), assigneeId: u.id })}
                  >
                    {u.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">Change status</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass">
                {(["Backlog", "Todo", "In Progress", "Review", "Done", "Blocked"] as const).map(s => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => bulkUpdateStatusMutation.mutate({ taskIds: Array.from(selected), status: s })}
                  >
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                if (confirm(`Are you sure you want to delete the ${selected.size} selected tasks?`)) {
                  bulkDeleteMutation.mutate({ taskIds: Array.from(selected) });
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="p-3"><Checkbox checked={allSelected} onCheckedChange={v => {
                const s = new Set(selected);
                if (v) paged.forEach(t => s.add(t.id)); else paged.forEach(t => s.delete(t.id));
                setSelected(s);
              }} /></th>
              <th className="p-3"><button className="inline-flex items-center gap-1" onClick={() => toggleSort("title")}>Task <ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="p-3">Status</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Assignee</th>
              <th className="p-3"><button className="inline-flex items-center gap-1" onClick={() => toggleSort("dueDate")}>Due Date <ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="p-3">Project</th>
              <th className="p-3">Deps</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((t: Task) => {
              const u = users.find(x => x.id === t.assigneeId) || { name: "Unassigned", avatarColor: "#64748B" };
              const p = projects.find(x => x.id === t.projectId) || { name: "General" };
              return (
                <tr key={t.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                  <td className="p-3"><Checkbox checked={selected.has(t.id)} onCheckedChange={v => {
                    const s = new Set(selected);
                    if (v) s.add(t.id); else s.delete(t.id);
                    setSelected(s);
                  }} /></td>
                  <td className="p-3 font-medium">{t.title}</td>
                  <td className="p-3"><Badge className={cn("border-0", statusTone[t.status])}>{t.status}</Badge></td>
                  <td className="p-3"><span className="inline-flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", priorityTone[t.priority])} />{t.priority}</span></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-6 w-6 place-items-center rounded-full text-[9px] font-bold text-white shadow-sm" style={{ background: u.avatarColor }}>{initials(u.name)}</div>
                      <span className="truncate">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{new Date(t.dueDate).toLocaleDateString()}</td>
                  <td className="p-3 text-muted-foreground">{p.name}</td>
                  <td className="p-3 text-muted-foreground">{t.dependencies.length || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span>Page {page} / {pages}</span>
          <Button size="icon" variant="outline" disabled={page >= pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </Card>
  );
}
