import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, FolderKanban, ListChecks, KanbanSquare, Calendar,
  ListTodo, AlertTriangle, Bell, BarChart3, Users, Settings, LogOut,
  ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Kanban Board", icon: KanbanSquare },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/list", label: "List View", icon: ListTodo },
  { to: "/rca", label: "RCA Management", icon: AlertTriangle },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/users", label: "Users", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

import { logoutUserFn } from "@/lib/server-functions";
import { useNavigate } from "@tanstack/react-router";

export function AppSidebar({ collapsed, setCollapsed, user }: { collapsed: boolean; setCollapsed: (v: boolean) => void; user: any }) {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const navigate = useNavigate();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await logoutUserFn();
      navigate({ to: "/auth/login" });
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-card transition-[width] duration-300 md:flex",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary shadow-glow">
          <ListChecks className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-base font-bold tracking-tight">TeamFlow</div>
            <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">Enterprise</div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map(item => {
          const active = pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "gradient-primary text-white shadow-glow"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-1">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronsRight className="h-[18px] w-[18px]" /> : <ChevronsLeft className="h-[18px] w-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const items = nav.slice(0, 5);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-card/80 backdrop-blur-xl px-2 py-2 md:hidden">
      {items.map(item => {
        const active = pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);
  return { collapsed, setCollapsed };
}
