import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { ListChecks } from "lucide-react";
import { getCurrentUserFn } from "@/lib/server-functions";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (user) {
      throw redirect({
        to: "/dashboard",
      });
    }
  },
  component: AuthLayout
});

function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden overflow-hidden gradient-primary text-white lg:flex lg:flex-col lg:justify-between p-12">
        <div className="absolute inset-0 mesh-bg opacity-40" />
        <Link to="/dashboard" className="relative flex items-center gap-2 text-lg font-bold">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur"><ListChecks className="h-5 w-5" /></div>
          TeamFlow
        </Link>
        <div className="relative space-y-6">
          <h2 className="text-4xl font-black leading-tight">Ship faster.<br />Together.</h2>
          <p className="max-w-md text-white/80">The enterprise workspace for modern engineering teams. Kanban, RCA, analytics — one home for the whole delivery lifecycle.</p>
          <div className="flex gap-2">
            {["Atlas","Nebula","Orion","Vertex"].map(n => (
              <div key={n} className="rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">{n}</div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-white/60">© 2026 TeamFlow. Built for teams that ship.</div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 mesh-bg">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
