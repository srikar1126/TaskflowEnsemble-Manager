import { createFileRoute } from "@tanstack/react-router";
import { type RcaStatus, type RCA } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, XCircle, Clock, FileText, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRCAsFn, createRCAFn, updateRCAStatusFn, getUsersFn } from "@/lib/server-functions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_app/rca")({ component: RcaPage });

const statusFlow: RcaStatus[] = ["Draft","Submitted","Under Review","Approved","Closed"];
const statusTone: Record<RcaStatus, string> = {
  "Draft": "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  "Submitted": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "Under Review": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "Approved": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "Rejected": "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "Closed": "bg-primary/15 text-primary",
};
const sevTone: Record<string, string> = {
  Low: "bg-slate-500", Medium: "bg-amber-500", High: "bg-orange-500", Critical: "bg-rose-500",
};

function RcaPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [description, setDescription] = useState("");
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: rcas = [], isLoading: isRcasLoading } = useQuery({
    queryKey: ["rcas"],
    queryFn: () => getRCAsFn(),
  });

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsersFn(),
  });

  const createRcaMutation = useMutation({
    mutationFn: (data: { title: string; severity: string; description: string; reviewers: string[] }) =>
      createRCAFn({ data }),
    onSuccess: () => {
      toast.success("RCA report filed successfully!");
      queryClient.invalidateQueries({ queryKey: ["rcas"] });
      setOpen(false);
      setTitle("");
      setSeverity("Medium");
      setDescription("");
      setSelectedReviewers([]);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit RCA.");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { rcaId: string; status: string }) => updateRCAStatusFn({ data }),
    onSuccess: () => {
      toast.success("RCA status updated!");
      queryClient.invalidateQueries({ queryKey: ["rcas"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update RCA status.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    createRcaMutation.mutate({
      title,
      severity,
      description,
      reviewers: selectedReviewers,
    });
    setSubmitting(false);
  };

  const toggleReviewer = (userName: string) => {
    setSelectedReviewers(prev =>
      prev.includes(userName) ? prev.filter(name => name !== userName) : [...prev, userName]
    );
  };

  const isLoading = isRcasLoading || isUsersLoading;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { label: "Open", value: rcas.filter(r => ["Draft","Submitted"].includes(r.status)).length, icon: AlertTriangle, tone: "from-indigo-500 to-violet-500" },
    { label: "Under Review", value: rcas.filter(r => r.status === "Under Review").length, icon: Clock, tone: "from-amber-500 to-orange-500" },
    { label: "Approved", value: rcas.filter(r => r.status === "Approved").length, icon: CheckCircle2, tone: "from-emerald-500 to-teal-500" },
    { label: "Rejected", value: rcas.filter(r => r.status === "Rejected").length, icon: XCircle, tone: "from-rose-500 to-pink-500" },
    { label: "Closed", value: rcas.filter(r => r.status === "Closed").length, icon: FileText, tone: "from-slate-500 to-slate-700" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <h2 className="text-lg font-bold">Root Cause Analysis</h2>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white shadow-glow shrink-0">
              <Plus className="h-4 w-4" /> New RCA
            </Button>
          </DialogTrigger>
          <DialogContent className="glass sm:max-w-[475px]">
            <DialogHeader>
              <DialogTitle className="font-bold text-xl">File New RCA Report</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="rca-title">Incident Title</Label>
                <Input
                  id="rca-title"
                  placeholder="e.g. Payment gateway outage"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <Label htmlFor="rca-sev">Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger id="rca-sev"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Low","Medium","High","Critical"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rca-desc">Incident Narrative & Impact</Label>
                <Textarea
                  id="rca-desc"
                  placeholder="Describe the root cause and mitigation actions"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reviewers</Label>
                <div className="max-h-32 overflow-y-auto rounded-md border border-border/50 p-2 bg-muted/20 space-y-2">
                  {users.map(u => (
                    <label key={u.id} className="flex items-center gap-3 cursor-pointer select-none">
                      <Checkbox
                        checked={selectedReviewers.includes(u.name)}
                        onCheckedChange={() => toggleReviewer(u.name)}
                      />
                      <span className="text-sm font-medium">{u.name} ({u.role})</span>
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="gradient-primary text-white shadow-glow">
                  {submitting ? "Submitting..." : "File RCA"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="glass shadow-card relative overflow-hidden p-4">
              <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${s.tone} opacity-20 blur-2xl`} />
              <div className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${s.tone} text-white`}><Icon className="h-4 w-4" /></div>
              <div className="mt-3 text-2xl font-black">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {rcas.map((r: RCA) => {
          const stepIndex = statusFlow.indexOf(r.status);
          return (
            <Card key={r.id} className="glass shadow-card p-5 space-y-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", sevTone[r.severity])} />
                    <h3 className="truncate text-base font-bold">{r.title}</h3>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                </div>
                <Badge className={cn("border-0 shrink-0", statusTone[r.status])}>{r.status}</Badge>
              </div>

              {/* Workflow timeline */}
              <div className="flex items-center gap-1">
                {statusFlow.map((s, i) => (
                  <div key={s} className="flex flex-1 items-center gap-1">
                    <div className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                      i <= stepIndex ? "gradient-primary text-white" : "bg-muted text-muted-foreground",
                    )}>{i + 1}</div>
                    {i < statusFlow.length - 1 && <div className={cn("h-0.5 flex-1", i < stepIndex ? "gradient-primary" : "bg-muted")} />}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Owner</div>
                  <div className="font-semibold">{r.owner}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Reviewers</div>
                  <div className="font-semibold">{r.reviewers.length}</div>
                </div>
                <div className="flex gap-2">
                  {r.status === "Submitted" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ rcaId: r.id, status: "Under Review" })}
                    >
                      Review
                    </Button>
                  )}
                  {["Submitted", "Under Review"].includes(r.status) && (
                    <Button
                      size="sm"
                      className="gradient-primary text-white"
                      onClick={() => updateStatusMutation.mutate({ rcaId: r.id, status: "Approved" })}
                    >
                      Approve
                    </Button>
                  )}
                  {r.status === "Approved" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateStatusMutation.mutate({ rcaId: r.id, status: "Closed" })}
                    >
                      Close Report
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {rcas.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground">No RCA reports found.</div>
        )}
      </div>
    </div>
  );
}
