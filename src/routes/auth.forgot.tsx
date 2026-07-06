import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/forgot")({ component: ForgotPage });

function ForgotPage() {
  const [sent, setSent] = useState(false);
  return (
    <Card className="glass shadow-card p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">We'll email you a secure reset link</p>
      </div>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); setSent(true); toast.success("Reset link sent"); }}>
        <div><Label>Email</Label><Input type="email" required /></div>
        <Button type="submit" className="w-full gradient-primary text-white shadow-glow">{sent ? "Sent!" : "Send reset link"}</Button>
      </form>
      <div className="text-center text-sm text-muted-foreground">
        Remembered it? <Link to="/auth/login" className="font-semibold text-primary hover:underline">Sign in</Link>
      </div>
    </Card>
  );
}
