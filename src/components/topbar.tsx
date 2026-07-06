import { Bell, Search, Moon, Sun, Plus, Loader2 } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotificationsFn, getProjectsFn, getUsersFn, createTaskFn } from "@/lib/server-functions";
import { initials } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Topbar({ title, user }: { title: string; user: any }) {
  const { theme, toggle } = useTheme();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotificationsFn(),
    refetchInterval: 10000,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjectsFn(),
    enabled: open, // Fetch only when dialog is opened
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsersFn(),
    enabled: open, // Fetch only when dialog is opened
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: { title: string; description: string; priority: string; projectId: string; assigneeId: string; dueDate: string }) =>
      createTaskFn({ data }),
    onSuccess: () => {
      toast.success("Task created successfully!");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setOpen(false);
      setTaskTitle("");
      setDescription("");
      setPriority("Medium");
      setProjectId("");
      setAssigneeId("");
      setDueDate("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create task.");
    },
    onSettled: () => {
      setSubmitting(false);
    }
  });

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !projectId || !assigneeId || !dueDate) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    createTaskMutation.mutate({
      title: taskTitle,
      description,
      priority,
      projectId,
      assigneeId,
      dueDate,
    });
  };

  const unread = notifs.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight md:text-xl">{title}</h1>
        </div>
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search projects, tasks, people…" className="w-72 pl-9 bg-muted/50 border-0" />
        </div>

        {/* Create Task Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-white shadow-glow hidden sm:inline-flex">
              <Plus className="h-4 w-4" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="glass sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleTaskSubmit} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="title" className="text-sm font-semibold">Title *</Label>
                <Input
                  id="title"
                  placeholder="Task title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="desc" className="text-sm font-semibold">Description</Label>
                <Textarea
                  id="desc"
                  placeholder="Enter task details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">Project *</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-semibold">Assignee *</Label>
                  <Select value={assigneeId} onValueChange={setAssigneeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">Priority *</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Low", "Medium", "High", "Critical"].map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="dueDate" className="text-sm font-semibold">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-primary text-white shadow-glow" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Task"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Link to="/notifications" className="relative">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </Link>
        <div 
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow-glow"
          style={{ background: user?.avatarColor || "#6366F1" }}
        >
          {user ? initials(user.name) : "U"}
        </div>
      </div>
    </header>
  );
}
