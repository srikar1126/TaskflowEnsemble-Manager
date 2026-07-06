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
import { getProjectsFn, getUsersFn, createProjectFn, deleteProjectFn, updateProjectFn, getTasksFn } from "@/lib/server-functions";
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

const taskStatusTone: Record<string, string> = {
  "Backlog": "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  "Todo": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "In Progress": "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "Review": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "Done": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "Blocked": "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

function ProjectsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // State for project viewing modal
  const [viewOpen, setViewOpen] = useState(false);
  const [viewProject, setViewProject] = useState<any>(null);

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjectsFn(),
  });

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsersFn(),
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasksFn(),
  });

  const createProjectMutation = useMutation({
    onMutate: () => setSubmitting(true),
    mutationFn: (data: { name: string; description: string; dueDate: string; memberIds: string[] }) =>
      createProjectFn({ data }),
    onSuccess: () => {
      toast.success("Project created successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create project.");
    },
    onSettled: () => setSubmitting(false)
  });

  const updateProjectMutation = useMutation({
    onMutate: () => setSubmitting(true),
    mutationFn: (data: { id: string; name: string; description: string; dueDate: string; memberIds: string[] }) =>
      updateProjectFn({ data }),
    onSuccess: () => {
      toast.success("Project updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update project.");
    },
    onSettled: () => setSubmitting(false)
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => deleteProjectFn({ data: projectId }),
    onSuccess: () => {
      toast.success("Project deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete project.");
    }
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setDueDate("");
    setSelectedMembers([]);
    setIsEditing(false);
    setEditingProjectId("");
  };

  const handleCreateClick = () => {
    resetForm();
    setOpen(true);
  };

  const handleEditClick = (p: any) => {
    setIsEditing(true);
    setEditingProjectId(p.id);
    setName(p.name);
    setDescription(p.description);
    setDueDate(p.dueDate ? p.dueDate.slice(0, 10) : "");
    setSelectedMembers(p.memberIds || []);
    setOpen(true);
  };

  const handleViewClick = (p: any) => {
    setViewProject(p);
    setViewOpen(true);
  };

  const handleDeleteClick = (p: any) => {
    if (confirm(`Are you sure you want to delete the project "${p.name}"?`)) {
      deleteProjectMutation.mutate(p.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !dueDate) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (isEditing) {
      updateProjectMutation.mutate({
        id: editingProjectId,
        name,
        description,
        dueDate,
        memberIds: selectedMembers,
      });
    } else {
      createProjectMutation.mutate({
        name,
        description,
        dueDate,
        memberIds: selectedMembers,
      });
    }
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

  // Filter tasks for detail modal
  const projectTasks = viewProject ? allTasks.filter(t => t.projectId === viewProject.id) : [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="relative min-w-0 sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects…" className="pl-9" />
        </div>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <Button onClick={handleCreateClick} className="gradient-primary text-white shadow-glow shrink-0">
            <Plus className="h-4 w-4" /> New Project
          </Button>
          <DialogContent className="glass sm:max-w-[475px]">
            <DialogHeader>
              <DialogTitle className="font-bold text-xl">
                {isEditing ? "Edit Project" : "Create New Project"}
              </DialogTitle>
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
                  {submitting ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create Project")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project Details Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="glass sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          {viewProject && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3 pr-6">
                  <DialogTitle className="font-bold text-2xl truncate">{viewProject.name}</DialogTitle>
                  <Badge variant={viewProject.status === "Active" ? "default" : "outline"} className={viewProject.status === "Active" ? "gradient-primary text-white border-0" : ""}>
                    {viewProject.status}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-5 py-4">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold text-muted-foreground">Description</h4>
                  <p className="text-sm leading-relaxed">{viewProject.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-muted-foreground">Due Date</h4>
                    <div className="flex items-center gap-1.5 text-sm">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {new Date(viewProject.dueDate).toLocaleDateString(undefined, { dateStyle: "long" })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-muted-foreground">Progress</h4>
                    <div className="flex items-center gap-3">
                      <Progress value={viewProject.progress} className="h-2 flex-1" />
                      <span className="text-xs font-bold">{viewProject.progress}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Team Members ({viewProject.memberIds.length})</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {viewProject.memberIds.map((id: string) => {
                      const u = users.find(x => x.id === id);
                      if (!u) return null;
                      return (
                        <div key={id} className="flex items-center gap-1.5 rounded-full bg-muted/40 px-2.5 py-1 text-xs border border-border/20 shadow-sm">
                          <div className="grid h-4 w-4 place-items-center rounded-full text-[7px] font-bold text-white" style={{ background: u.avatarColor }}>
                            {initials(u.name)}
                          </div>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Project Tasks ({projectTasks.length})</h4>
                  <div className="max-h-56 overflow-y-auto space-y-2 rounded-lg border border-border/40 p-2 bg-muted/10">
                    {projectTasks.map((t: any) => {
                      const assignee = users.find(x => x.id === t.assigneeId) || { name: "Unassigned", avatarColor: "#64748B" };
                      return (
                        <div key={t.id} className="flex items-center justify-between gap-3 rounded-md bg-background/50 border border-border/30 p-2.5 text-xs transition-colors hover:bg-muted/10">
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold block truncate">{t.title}</span>
                            <span className="text-[10px] text-muted-foreground">Assignee: {assignee.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase">{t.priority}</span>
                            <Badge className={taskStatusTone[t.status] || ""}>{t.status}</Badge>
                          </div>
                        </div>
                      );
                    })}
                    {projectTasks.length === 0 && (
                      <p className="text-center py-6 text-xs text-muted-foreground">No tasks assigned to this project yet.</p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setViewOpen(false)} className="gradient-primary text-white shadow-glow">Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map(p => (
          <Card key={p.id} className="glass shadow-card group overflow-hidden p-5 transition-all hover:-translate-y-1 hover:shadow-glow">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
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
                <Button onClick={() => handleViewClick(p)} size="icon" variant="ghost" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                <Button onClick={() => handleEditClick(p)} size="icon" variant="ghost" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
                <Button onClick={() => handleDeleteClick(p)} size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
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
