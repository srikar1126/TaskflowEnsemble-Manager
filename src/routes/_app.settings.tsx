import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { updateUserSettingsFn } from "@/lib/server-functions";
import { toast } from "sonner";
import { initials } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

function SettingsPage() {
  const { user } = Route.useRouteContext() as { user: any };
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sync form states with user context once loaded
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: { name: string; email: string; currentPassword?: string; newPassword?: string }) =>
      updateUserSettingsFn({ data }),
    onSuccess: () => {
      toast.success("Settings updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update settings.");
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Name and email are required.");
      return;
    }
    setSubmitting(true);
    updateSettingsMutation.mutate({ name, email });
    setSubmitting(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setSubmitting(true);
    updateSettingsMutation.mutate({
      name,
      email,
      currentPassword,
      newPassword,
    });
    setSubmitting(false);
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="glass shadow-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div
            className="grid h-16 w-16 place-items-center rounded-full text-xl font-bold text-white shadow-glow"
            style={{ background: user.avatarColor }}
          >
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">{user.name}</h2>
              <Badge variant="secondary" className="text-[10px] uppercase font-bold">{user.role}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass shadow-card p-5 space-y-4">
          <h3 className="text-base font-bold">Profile Settings</h3>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-name">Full name</Label>
              <Input
                id="user-name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">Email Address</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={submitting} className="gradient-primary text-white shadow-glow">
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </Card>

        <Card className="glass shadow-card p-5 space-y-4">
          <h3 className="text-base font-bold">Change Password</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cur-pass">Current Password</Label>
              <Input
                id="cur-pass"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pass">New Password</Label>
              <Input
                id="new-pass"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conf-pass">Confirm New Password</Label>
              <Input
                id="conf-pass"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={submitting} className="gradient-primary text-white shadow-glow">
              {submitting ? "Updating..." : "Update password"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
