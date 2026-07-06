import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Eye, Pencil, Trash2, Search, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjectsFn, getUsersFn, createProjectFn } from "@/lib/server-functions";
import { initials } from "@/lib/utils";
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
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_app/projects")({ component: ProjectsPage });

function ProjectsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjectsFn(),
  });

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsersFn(),
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: { name: string; description: string; dueDate: string; memberIds: string[] }) =>
      createProjectFn({ data }),
    onSuccess: () => {
      toast.success("Project created successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setName("");
      setDescription("");
      setDueDate("");
      setSelectedMembers([]);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create project.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !dueDate) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    createProjectMutation.mutate({
      name,
      description,
      dueDate,
      memberIds: selectedMembers,
    });
    setSubmitting(false);
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const list = projects.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  const isLoading = isProjectsLoading || isUsersLoading;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="relative min-w-0 sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects…" className="pl-9" />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white shadow-glow shrink-0">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="glass sm:max-w-[475px]">
            <DialogHeader>
              <DialogTitle className="font-bold text-xl">Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="proj-name">Project Name</Label>
                <Input
                  id="proj-name"
                  placeholder="Enter project name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-desc">Description</Label>
                <Textarea
                  id="proj-desc"
                  placeholder="Enter project details"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-due">Due Date</Label>
                <Input
                  id="proj-due"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Team Members</Label>
                <div className="max-h-40 overflow-y-auto rounded-md border border-border/50 p-2.5 space-y-2 bg-muted/20">
                  {users.map(u => (
                    <label key={u.id} className="flex items-center gap-3 cursor-pointer select-none">
                      <Checkbox
                        checked={selectedMembers.includes(u.id)}
                        onCheckedChange={() => toggleMember(u.id)}
                      />
                      <div
                        className="grid h-6 w-6 place-items-center rounded-full text-[9px] font-bold text-white shadow-sm"
                        style={{ background: u.avatarColor }}
                      >
                        {initials(u.name)}
                      </div>
                      <span className="text-sm font-medium">{u.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="gradient-primary text-white shadow-glow">
                  {submitting ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map(p => (
          <Card key={p.id} className="glass shadow-card group overflow-hidden p-5 transition-all hover:-translate-y-1 hover:shadow-glow">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
              </div>
              <Badge variant={p.status === "Active" ? "default" : "outline"} className={p.status === "Active" ? "gradient-primary text-white border-0" : ""}>{p.status}</Badge>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">{p.progress}%</span>
              </div>
              <Progress value={p.progress} className="h-2" />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex -space-x-2">
                {p.memberIds.slice(0, 5).map(id => {
                  const u = users.find(x => x.id === id);
                  if (!u) return null;
                  return (
                    <div key={id} className="grid h-7 w-7 place-items-center rounded-full border-2 border-background text-[10px] font-bold text-white shadow-sm" style={{ background: u.avatarColor }}>
                      {initials(u.name)}
                    </div>
                  );
                })}
                {p.memberIds.length > 5 && <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-muted text-[10px] font-bold">+{p.memberIds.length - 5}</div>}
              </div>
              <div className="text-xs text-muted-foreground">{p.taskCount} tasks</div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(p.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button size="icon" variant="ghost" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </Card>
        ))}
        {list.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground">No projects found.</div>
        )}
      </div>
    </div>
  );
}
