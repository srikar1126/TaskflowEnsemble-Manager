import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bell, Check, Search, MessageSquare, GitBranch, UserPlus, FileWarning, ShieldCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotificationsFn, markNotificationReadFn } from "@/lib/server-functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/notifications")({ component: NotificationsPage });

const iconMap: Record<string, any> = {
  "Task Assignment": UserPlus,
  "Status Change": GitBranch,
  "Comment Mention": MessageSquare,
  "RCA Submitted": FileWarning,
  "Review Decision": ShieldCheck,
};

function NotificationsPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "unread">("all");

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotificationsFn(),
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationReadFn({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Failed to mark notification as read.");
    }
  });

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map(n => markNotificationReadFn({ data: n.id })));
      toast.success("All notifications marked as read.");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err) {
      toast.error("Failed to mark all as read.");
    }
  };

  const filtered = notifications
    .filter(n => (tab === "unread" ? !n.read : true))
    .filter(n => n.message.toLowerCase().includes(q.toLowerCase()) || n.title.toLowerCase().includes(q.toLowerCase()));

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card className="glass shadow-card p-5 space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Bell className="h-5 w-5 shrink-0 text-primary" />
          <h2 className="text-lg font-bold truncate">Notifications</h2>
          <Badge variant="secondary">{unreadCount} new</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
          <Check className="h-4 w-4" /> Mark all read
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          {(["all","unread"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              tab === t ? "bg-card shadow-card" : "text-muted-foreground",
            )}>{t}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search notifications…" className="pl-9" />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(n => {
          const Icon = iconMap[n.type] || Bell;
          return (
            <div
              key={n.id}
              onClick={() => {
                if (!n.read) {
                  readMutation.mutate(n.id);
                }
              }}
              className={cn(
                "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border/50 p-3 transition-colors cursor-pointer",
                !n.read ? "bg-primary/5 border-primary/20" : "bg-card/40 hover:bg-muted/30",
              )}
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg gradient-primary text-white"><Icon className="h-5 w-5" /></div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{n.title || n.type}</span>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                </div>
                <div className="truncate text-xs text-muted-foreground">{n.message}</div>
              </div>
              <div className="shrink-0 text-xs text-muted-foreground">{new Date(n.time).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">No notifications found.</div>
        )}
      </div>
    </Card>
  );
}
