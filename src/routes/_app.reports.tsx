import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { Trophy, TrendingUp, Activity, ShieldAlert, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProjectsFn, getUsersFn, getDashboardStatsFn } from "@/lib/server-functions";
import { initials } from "@/lib/utils";

export const Route = createFileRoute("/_app/reports")({ component: ReportsPage });

const COLORS = ["#6366F1","#8B5CF6","#22C55E","#F59E0B","#EF4444","#06B6D4"];

function ReportsPage() {
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsersFn(),
  });

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjectsFn(),
  });

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => getDashboardStatsFn(),
  });

  const isLoading = isUsersLoading || isProjectsLoading || isDashboardLoading;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const leaderboard = [...users].sort((a, b) => b.workload - a.workload).slice(0, 6);
  const health = projects.slice(0, 6).map(p => ({ name: p.name.split(" ")[0], health: p.health, risk: 100 - p.health }));
  const burndown = Array.from({ length: 10 }, (_, i) => ({ day: `D${i + 1}`, remaining: 100 - i * 9 + Math.floor(Math.random() * 6) }));
  const capacity = users.slice(0, 8).map(u => ({ name: u.name.split(" ")[0], capacity: 100, used: u.workload }));
  
  const velocityData = dashboardData?.velocityData || [];
  const rcaTrend = dashboardData?.rcaTrend || [];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass shadow-card p-5">
          <div className="mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Team Leaderboard</h3></div>
          <div className="space-y-3">
            {leaderboard.map((u, i) => (
              <div key={u.id} className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-muted text-xs font-bold">#{i + 1}</div>
                <div className="grid h-8 w-8 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: u.avatarColor }}>{initials(u.name)}</div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.role}</div>
                </div>
                <div className="text-sm font-black gradient-text">{u.workload}pt</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass shadow-card p-5">
          <div className="mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Velocity Trend</h3></div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="sprint" fontSize={11} /><YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Area dataKey="completed" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass shadow-card p-5">
          <div className="mb-3 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Project Health & Risk</h3></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={health}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="health" stackId="a" fill="#22C55E" radius={[0,0,0,0]} />
              <Bar dataKey="risk" stackId="a" fill="#EF4444" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass shadow-card p-5">
          <div className="mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Burn Down</h3></div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={burndown}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Line dataKey="remaining" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass shadow-card p-5">
          <h3 className="mb-3 text-sm font-semibold">Capacity Utilization</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={capacity}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Bar dataKey="used" fill="#8B5CF6" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass shadow-card p-5">
          <h3 className="mb-3 text-sm font-semibold">RCA Statistics</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={rcaTrend} dataKey="opened" nameKey="month" cx="50%" cy="50%" outerRadius={90} label>
                {rcaTrend.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
