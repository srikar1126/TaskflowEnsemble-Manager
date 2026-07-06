import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUsersFn, getProjectsFn } from "@/lib/server-functions";
import { initials } from "@/lib/utils";

export const Route = createFileRoute("/_app/users")({ component: UsersPage });

const roleTone: Record<string, string> = {
  Admin: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  Manager: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  Developer: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  Reviewer: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Viewer: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

function UsersPage() {
  const [q, setQ] = useState("");

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsersFn(),
  });

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjectsFn(),
  });

  const isLoading = isUsersLoading || isProjectsLoading;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = users.filter(u =>
    (u.name + u.email + u.role).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="relative sm:w-96">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search users…" className="pl-9" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(u => {
          const userProjects = projects.filter(p => p.memberIds.includes(u.id));
          return (
            <Card key={u.id} className="glass shadow-card p-4 transition-transform hover:-translate-y-0.5">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow-glow"
                  style={{ background: u.avatarColor }}
                >
                  {initials(u.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{u.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                </div>
                <Badge className={(roleTone[u.role] || "bg-slate-500/15 text-slate-700") + " border-0"}>
                  {u.role}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-muted/40 p-2">
                  <div className="text-lg font-black gradient-text">{userProjects.length}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Projects</div>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <div className="text-lg font-black gradient-text">{u.workload}%</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Workload</div>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground">No users found.</div>
        )}
      </div>
    </div>
  );
}
