import { createFileRoute, Outlet, useRouterState, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar, MobileBottomNav } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { getCurrentUserFn } from "@/lib/server-functions";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/tasks": "Kanban Board",
  "/calendar": "Calendar",
  "/list": "Task List",
  "/rca": "RCA Management",
  "/notifications": "Notifications",
  "/reports": "Reports & Analytics",
  "/users": "User Directory",
  "/settings": "Settings",
};

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({
        to: "/auth/login",
      });
    }
    return { user };
  },
  component: AppLayout,
});

function AppLayout() {
  const { user } = Route.useRouteContext();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: s => s.location.pathname });
  const title = Object.entries(titles).find(([k]) => pathname.startsWith(k))?.[1] ?? "TeamFlow";

  return (
    <div className="flex min-h-screen w-full bg-background mesh-bg">
      <AppSidebar collapsed={collapsed} setCollapsed={setCollapsed} user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} user={user} />
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

