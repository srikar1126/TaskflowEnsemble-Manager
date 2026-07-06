import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban, CheckCircle2, ListChecks, AlertTriangle, Users, Bell, TrendingUp, ArrowUpRight, Loader2,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, LineChart, Line, Cell, Legend, RadialBarChart, RadialBar,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStatsFn, getProjectsFn, getUsersFn } from "@/lib/server-functions";
import { initials } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

const COLORS = ["#6366F1", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4"];

const icons: Record<string, any> = {
  "Total Projects": FolderKanban,
  "Active Tasks": ListChecks,
  "Completed Tasks": CheckCircle2,
  "Open RCA Reports": AlertTriangle,
  "Team Members": Users,
  "Notifications": Bell,
};

const tones: Record<string, string> = {
  "Total Projects": "from-indigo-500 to-violet-500",
  "Active Tasks": "from-violet-500 to-fuchsia-500",
  "Completed Tasks": "from-emerald-500 to-teal-500",
  "Open RCA Reports": "from-amber-500 to-orange-500",
  "Team Members": "from-cyan-500 to-blue-500",
  "Notifications": "from-rose-500 to-pink-500",
};

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="glass shadow-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <TrendingUp className="h-4 w-4 text-primary" />
      </div>
      <div className="h-64">{children}</div>
    </Card>
  );
}

function Dashboard() {
  const { data: dashboardData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => getDashboardStatsFn(),
  });

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjectsFn(),
  });

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsersFn(),
  });

  const isLoading = isStatsLoading || isProjectsLoading || isUsersLoading;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = dashboardData?.stats || [];
  const velocityData = dashboardData?.velocityData || [];
  const workloadData = dashboardData?.workloadData || [];
  const rcaTrend = dashboardData?.rcaTrend || [];
  
  const completionData = projects.slice(0, 6).map(p => ({
    name: p.name.split(" ")[0],
    value: p.progress,
  }));

  const activeProjects = projects.filter(p => p.status === "Active" || p.status === "Planning").slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(s => {
          const Icon = icons[s.label] || FolderKanban;
          const tone = tones[s.label] || "from-indigo-500 to-violet-500";
          return (
            <Card key={s.label} className="glass shadow-card group relative overflow-hidden p-4 transition-transform hover:-translate-y-0.5">
              <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${tone} opacity-20 blur-2xl`} />
              <div className="flex items-center justify-between">
                <div className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${tone} text-white shadow-sm`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-500">{s.delta}</span>
              </div>
              <div className="mt-3 text-2xl font-black tracking-tight">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Velocity Trend" subtitle="Planned vs completed story points">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={velocityData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="sprint" stroke="currentColor" fontSize={11} />
              <YAxis stroke="currentColor" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="planned" stroke="#6366F1" fill="url(#g1)" strokeWidth={2} />
              <Area type="monotone" dataKey="completed" stroke="#8B5CF6" fill="url(#g2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Team Workload Distribution" subtitle="Active tasks per member">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Bar dataKey="tasks" fill="#6366F1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Project Completion Rate">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={completionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" fontSize={11} />
              <YAxis type="category" dataKey="name" fontSize={11} width={70} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {completionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="RCA Trend" subtitle="Opened vs closed by month">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rcaTrend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="opened" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="closed" stroke="#22C55E" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass shadow-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Active Projects</h3>
            <Link to="/projects"><Button variant="ghost" size="sm">View all <ArrowUpRight className="h-3 w-3" /></Button></Link>
          </div>
          <div className="space-y-4">
            {activeProjects.map(p => (
              <div key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg p-2 transition-colors hover:bg-muted/50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{p.name}</span>
                    <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <Progress value={p.progress} className="h-1.5 flex-1" />
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">{p.progress}%</span>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {p.memberIds.slice(0, 4).map(id => {
                    const u = users.find(x => x.id === id);
                    if (!u) return null;
                    return (
                      <div key={id} className="grid h-7 w-7 place-items-center rounded-full border-2 border-background text-[10px] font-bold text-white shadow-sm" style={{ background: u.avatarColor }}>
                        {initials(u.name)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {activeProjects.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">No active projects found.</div>
            )}
          </div>
        </Card>

        <Card className="glass shadow-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Project Health Score</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart innerRadius="30%" outerRadius="100%" data={projects.slice(0, 5).map((p, i) => ({ name: p.name, value: p.health, fill: COLORS[i % COLORS.length] }))}>
              <RadialBar dataKey="value" background cornerRadius={8} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
