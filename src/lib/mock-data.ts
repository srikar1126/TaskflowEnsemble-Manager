// Mock data for TeamFlow
export type Role = "Admin" | "Manager" | "Developer" | "Reviewer" | "Viewer";
export type Priority = "Low" | "Medium" | "High" | "Critical";
export type TaskStatus = "Backlog" | "Todo" | "In Progress" | "Review" | "Done" | "Blocked";
export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed";
export type RcaStatus = "Draft" | "Submitted" | "Under Review" | "Approved" | "Rejected" | "Closed";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
  workload: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  memberIds: string[];
  taskCount: number;
  dueDate: string;
  status: ProjectStatus;
  health: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  assigneeId: string;
  projectId: string;
  dueDate: string;
  comments: number;
  attachments: number;
  dependencies: string[];
}

export interface RCA {
  id: string;
  title: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: RcaStatus;
  createdAt: string;
  owner: string;
  reviewers: string[];
  description: string;
}

export interface Notification {
  id: string;
  type: "Task Assignment" | "Status Change" | "Comment Mention" | "RCA Submitted" | "Review Decision";
  title: string;
  message: string;
  read: boolean;
  time: string;
}

const firstNames = ["Alex","Jordan","Sam","Taylor","Morgan","Casey","Riley","Avery","Quinn","Blake","Cameron","Drew","Emerson","Finley","Harper","Iris","Jamie","Kai","Logan","Micah"];
const lastNames = ["Chen","Patel","Nguyen","Garcia","Kim","Silva","Okafor","Rossi","Muller","Sato","Novak","Aziz","Rahman","Costa","Ivanov","Yamamoto","Dubois","Andersen","Fischer","Lopez"];
const colors = ["#6366F1","#8B5CF6","#22C55E","#F59E0B","#EF4444","#06B6D4","#EC4899","#14B8A6","#F97316","#A855F7"];
const roles: Role[] = ["Admin","Manager","Developer","Reviewer","Viewer"];

export const users: User[] = firstNames.map((f, i) => ({
  id: `u${i + 1}`,
  name: `${f} ${lastNames[i]}`,
  email: `${f.toLowerCase()}.${lastNames[i].toLowerCase()}@teamflow.io`,
  role: roles[i % roles.length],
  avatarColor: colors[i % colors.length],
  workload: 30 + Math.floor(Math.random() * 70),
}));

const projectNames = ["Atlas Platform","Nebula CRM","Orion Analytics","Vertex Payments","Aurora Mobile","Meridian API","Zenith Portal","Helix ML","Cascade Search","Quantum Cloud"];
export const projects: Project[] = projectNames.map((n, i) => {
  const memberIds = users.slice(i, i + 4 + (i % 3)).map(u => u.id);
  return {
    id: `p${i + 1}`,
    name: n,
    description: `${n} — enterprise initiative delivering high-impact capabilities across the org.`,
    progress: Math.floor(20 + Math.random() * 75),
    memberIds,
    taskCount: 8 + Math.floor(Math.random() * 20),
    dueDate: new Date(Date.now() + (i + 5) * 86400000 * 3).toISOString(),
    status: (["Planning","Active","Active","Active","On Hold","Completed"] as ProjectStatus[])[i % 6],
    health: 40 + Math.floor(Math.random() * 60),
  };
});

const taskTitles = [
  "Implement OAuth flow","Design onboarding wireframes","Refactor billing service","Fix pagination bug","Add dark mode toggle",
  "Migrate to Postgres 16","Write integration tests","Optimize image pipeline","Set up CI/CD","Audit access controls",
  "Build notification service","Create admin dashboard","Improve search relevance","Add multi-tenant support","Fix flaky e2e tests",
  "Ship analytics events","Refresh brand tokens","Draft SLA document","Reduce bundle size","Add feature flags",
];
const statuses: TaskStatus[] = ["Backlog","Todo","In Progress","Review","Done","Blocked"];
const priorities: Priority[] = ["Low","Medium","High","Critical"];

export const tasks: Task[] = Array.from({ length: 100 }, (_, i) => {
  const title = taskTitles[i % taskTitles.length] + (i >= taskTitles.length ? ` v${Math.floor(i / taskTitles.length) + 1}` : "");
  return {
    id: `t${i + 1}`,
    title,
    description: "Detailed task scope, acceptance criteria and technical notes go here.",
    priority: priorities[i % priorities.length],
    status: statuses[i % statuses.length],
    assigneeId: users[i % users.length].id,
    projectId: projects[i % projects.length].id,
    dueDate: new Date(Date.now() + ((i % 30) - 5) * 86400000).toISOString(),
    comments: Math.floor(Math.random() * 12),
    attachments: Math.floor(Math.random() * 5),
    dependencies: i > 2 && i % 4 === 0 ? [`t${i - 1}`, `t${i - 2}`] : [],
  };
});

const rcaTitles = [
  "Payment gateway outage","Auth token leak","Search latency spike","Data pipeline stall","Email delivery failure",
  "Cache invalidation bug","API rate-limit incident","Dashboard render regression","Storage quota exhaustion","Deploy rollback needed",
  "Login redirect loop","Webhook duplication","Report export timeout","Session expiry mismatch","Feature flag misfire",
];
const rcaStatuses: RcaStatus[] = ["Draft","Submitted","Under Review","Approved","Rejected","Closed"];

export const rcas: RCA[] = rcaTitles.map((t, i) => ({
  id: `r${i + 1}`,
  title: t,
  severity: (["Low","Medium","High","Critical"] as const)[i % 4],
  status: rcaStatuses[i % rcaStatuses.length],
  createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
  owner: users[i % users.length].name,
  reviewers: users.slice(i, i + 3).map(u => u.name),
  description: "Detailed incident narrative including timeline, contributing factors, corrective and preventive actions.",
}));

const notifTypes: Notification["type"][] = ["Task Assignment","Status Change","Comment Mention","RCA Submitted","Review Decision"];
export const notifications: Notification[] = Array.from({ length: 50 }, (_, i) => ({
  id: `n${i + 1}`,
  type: notifTypes[i % notifTypes.length],
  title: notifTypes[i % notifTypes.length],
  message: `${users[i % users.length].name} — ${taskTitles[i % taskTitles.length]}`,
  read: i > 8,
  time: new Date(Date.now() - i * 3600000).toISOString(),
}));

// Chart datasets
export const velocityData = Array.from({ length: 8 }, (_, i) => ({
  sprint: `S${i + 1}`,
  planned: 30 + Math.floor(Math.random() * 20),
  completed: 25 + Math.floor(Math.random() * 25),
}));

export const workloadData = users.slice(0, 8).map(u => ({
  name: u.name.split(" ")[0],
  tasks: 4 + Math.floor(Math.random() * 14),
}));

export const rcaTrend = Array.from({ length: 6 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun"][i],
  opened: Math.floor(3 + Math.random() * 8),
  closed: Math.floor(2 + Math.random() * 7),
}));

export const completionData = projects.slice(0, 6).map(p => ({
  name: p.name.split(" ")[0],
  value: p.progress,
}));

export function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("");
}
