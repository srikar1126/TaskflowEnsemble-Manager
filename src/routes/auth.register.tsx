import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { registerUserFn } from "@/lib/server-functions";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/register")({ component: RegisterPage });

function RegisterPage() {
  const nav = useNavigate();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Developer");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await registerUserFn({ data: { name, email, password, role } });
      toast.success("Account created successfully!");
      await router.invalidate();
      await nav({ to: "/dashboard" });
    } catch (error: any) {
      toast.error(error.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass shadow-card p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Get your team up and running in minutes</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label>Full name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div>
            <Label>Confirm</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
        </div>
        <div>
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Admin","Manager","Developer","Reviewer","Viewer"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={loading} className="w-full gradient-primary text-white shadow-glow">
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>
      <div className="text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/auth/login" className="font-semibold text-primary hover:underline">Sign in</Link>
      </div>
    </Card>
  );
}

