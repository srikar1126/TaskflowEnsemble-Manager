import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { loginUserFn } from "@/lib/server-functions";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/login")({ component: LoginPage });

function LoginPage() {
  const nav = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("alex.kim@teamflow.io");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginUserFn({ data: { email, password } });
      toast.success("Successfully logged in!");
      // Invalidate current router state so beforeLoad checks refresh
      await router.invalidate();
      await nav({ to: "/dashboard" });
    } catch (error: any) {
      toast.error(error.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass shadow-card p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your TeamFlow workspace</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label>Email</Label>
          <Input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <Label>Password</Label>
          <Input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2"><Checkbox defaultChecked /> Remember me</label>
          <Link to="/auth/forgot" className="font-medium text-primary hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" disabled={loading} className="w-full gradient-primary text-white shadow-glow">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div className="text-center text-sm text-muted-foreground">
        Don't have an account? <Link to="/auth/register" className="font-semibold text-primary hover:underline">Create one</Link>
      </div>
    </Card>
  );
}

