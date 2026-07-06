import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import crypto from "crypto";
import { db, ensureDbInitialized } from "./db";
import { hashPassword, verifyPassword } from "./crypto";
import { type Task, type Project, type User, type RCA, type Notification } from "./mock-data";

// Ensure database is ready before operations
async function getAuthenticatedUser(): Promise<User | null> {
  await ensureDbInitialized();
  const token = getCookie("session_token");
  if (!token) return null;

  const now = new Date().toISOString();
  const sessionResult = await db.execute({
    sql: `SELECT s.token, u.id, u.name, u.email, u.role, u.avatar_color as avatarColor, u.workload 
          FROM sessions s
          JOIN users u ON s.user_id = u.id
          WHERE s.token = ? AND s.expires_at > ?`,
    args: [token, now]
  });

  if (sessionResult.rows.length === 0) {
    return null;
  }

  const row = sessionResult.rows[0];
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role) as any,
    avatarColor: String(row.avatarColor),
    workload: Number(row.workload)
  };
}

// ----------------------------------------------------
// Authentication Functions
// ----------------------------------------------------

export const getCurrentUserFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<User | null> => {
    return await getAuthenticatedUser();
  });

export const loginUserFn = createServerFn({ method: "POST" })
  .validator((data: { email?: string; password?: string }) => data)
  .handler(async ({ data }): Promise<User> => {
    const { email, password } = data;
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    await ensureDbInitialized();

    // Find user
    const userResult = await db.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email.toLowerCase().trim()]
    });

    if (userResult.rows.length === 0) {
      throw new Error("Invalid email or password.");
    }

    const user = userResult.rows[0];
    const isValid = verifyPassword(password, String(user.password_hash));
    if (!isValid) {
      throw new Error("Invalid email or password.");
    }

    // Create session
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await db.execute({
      sql: "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
      args: [token, String(user.id), expiresAt]
    });

    // Set HTTP-only Cookie
    setCookie("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/"
    });

    return {
      id: String(user.id),
      name: String(user.name),
      email: String(user.email),
      role: String(user.role) as any,
      avatarColor: String(user.avatar_color),
      workload: Number(user.workload)
    };
  });

export const registerUserFn = createServerFn({ method: "POST" })
  .validator((data: { name?: string; email?: string; password?: string; role?: string }) => data)
  .handler(async ({ data }): Promise<User> => {
    const { name, email, password, role } = data;
    if (!name || !email || !password || !role) {
      throw new Error("All fields are required.");
    }

    await ensureDbInitialized();

    // Check if exists
    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [email.toLowerCase().trim()]
    });

    if (existing.rows.length > 0) {
      throw new Error("A user with this email already exists.");
    }

    const id = `u_${Date.now()}_${crypto.randomInt(1000)}`;
    const passwordHash = hashPassword(password);
    
    // Custom colors for avatar
    const colors = ["#6366F1", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#14B8A6"];
    const avatarColor = colors[crypto.randomInt(colors.length)];

    await db.execute({
      sql: "INSERT INTO users (id, name, email, password_hash, role, avatar_color, workload) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [id, name, email.toLowerCase().trim(), passwordHash, role, avatarColor, 0]
    });

    // Create session
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await db.execute({
      sql: "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
      args: [token, id, expiresAt]
    });

    setCookie("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/"
    });

    return { id, name, email, role: role as any, avatarColor, workload: 0 };
  });

export const logoutUserFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const token = getCookie("session_token");
    if (token) {
      await ensureDbInitialized();
      await db.execute({
        sql: "DELETE FROM sessions WHERE token = ?",
        args: [token]
      });
    }

    deleteCookie("session_token");
    return { success: true };
  });

// ----------------------------------------------------
// Dashboard & Stats Functions
// ----------------------------------------------------

export const getDashboardStatsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const projectsResult = await db.execute("SELECT * FROM projects");
    const tasksResult = await db.execute("SELECT * FROM tasks");
    const rcasResult = await db.execute("SELECT * FROM rcas");
    const usersResult = await db.execute("SELECT * FROM users");
    const notifResult = await db.execute({
      sql: "SELECT * FROM notifications WHERE user_id = ? AND read = 0",
      args: [user.id]
    });

    const totalProjects = projectsResult.rows.length;
    const activeTasks = tasksResult.rows.filter(t => t.status === "In Progress" || t.status === "Todo").length;
    const completedTasks = tasksResult.rows.filter(t => t.status === "Done").length;
    const openRcas = rcasResult.rows.filter(r => r.status !== "Closed").length;
    const teamMembers = usersResult.rows.length;
    const unreadNotifications = notifResult.rows.length;

    // Seeding trends data
    const velocityData = [
      { sprint: "S1", planned: 38, completed: 32 },
      { sprint: "S2", planned: 42, completed: 40 },
      { sprint: "S3", planned: 35, completed: 30 },
      { sprint: "S4", planned: 45, completed: 44 },
      { sprint: "S5", planned: 40, completed: 38 },
      { sprint: "S6", planned: 48, completed: 42 },
      { sprint: "S7", planned: 44, completed: 45 },
      { sprint: "S8", planned: 50, completed: 47 }
    ];

    // Group active tasks by user
    const workloadMap: Record<string, number> = {};
    usersResult.rows.forEach(u => {
      workloadMap[String(u.name)] = 0;
    });
    tasksResult.rows.forEach(t => {
      if (t.status !== "Done") {
        const assignee = usersResult.rows.find(u => u.id === t.assignee_id);
        if (assignee) {
          workloadMap[String(assignee.name)] = (workloadMap[String(assignee.name)] || 0) + 1;
        }
      }
    });

    const workloadData = Object.entries(workloadMap)
      .map(([name, tasks]) => ({ name: name.split(" ")[0], tasks }))
      .slice(0, 8);

    const rcaTrend = [
      { month: "Jan", opened: 4, closed: 3 },
      { month: "Feb", opened: 6, closed: 5 },
      { month: "Mar", opened: 3, closed: 4 },
      { month: "Apr", opened: 8, closed: 7 },
      { month: "May", opened: 5, closed: 5 },
      { month: "Jun", opened: 7, closed: 6 }
    ];

    return {
      stats: [
        { label: "Total Projects", value: totalProjects, delta: "+12%" },
        { label: "Active Tasks", value: activeTasks, delta: "+8%" },
        { label: "Completed Tasks", value: completedTasks, delta: "+24%" },
        { label: "Open RCA Reports", value: openRcas, delta: "-3%" },
        { label: "Team Members", value: teamMembers, delta: "+2" },
        { label: "Notifications", value: unreadNotifications, delta: "New" }
      ],
      velocityData,
      workloadData,
      rcaTrend
    };
  });

// ----------------------------------------------------
// Project Functions
// ----------------------------------------------------

export const getProjectsFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<Project[]> => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    // Fetch projects and their member IDs
    const projectsResult = await db.execute(`
      SELECT p.*, GROUP_CONCAT(pm.user_id) as member_ids
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      GROUP BY p.id
    `);

    return projectsResult.rows.map(row => ({
      id: String(row.id),
      name: String(row.name),
      description: String(row.description),
      progress: Number(row.progress),
      dueDate: String(row.due_date),
      status: String(row.status) as any,
      health: Number(row.health),
      memberIds: row.member_ids ? String(row.member_ids).split(",") : [],
      taskCount: 0
    }));
  });

export const createProjectFn = createServerFn({ method: "POST" })
  .validator((data: { name: string; description: string; dueDate: string; memberIds: string[] }) => data)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");
    if (user.role !== "Admin" && user.role !== "Manager") {
      throw new Error("Only Administrators and Managers can create projects.");
    }

    const id = `p_${Date.now()}`;
    await db.execute({
      sql: "INSERT INTO projects (id, name, description, progress, due_date, status, health) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [id, data.name, data.description, 0, data.dueDate, "Planning", 100]
    });

    for (const memberId of data.memberIds) {
      await db.execute({
        sql: "INSERT INTO project_members (project_id, user_id) VALUES (?, ?)",
        args: [id, memberId]
      });
    }

    return { id, success: true };
  });

export const deleteProjectFn = createServerFn({ method: "POST" })
  .validator((projectId: string) => projectId)
  .handler(async ({ data: projectId }) => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");
    if (user.role !== "Admin") {
      throw new Error("Only Administrators can delete projects.");
    }

    await db.execute({
      sql: "DELETE FROM projects WHERE id = ?",
      args: [projectId]
    });

    return { success: true };
  });

export const updateProjectFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; name: string; description: string; dueDate: string; memberIds: string[] }) => data)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");
    if (user.role !== "Admin" && user.role !== "Manager") {
      throw new Error("Only Administrators and Managers can edit projects.");
    }

    await db.execute({
      sql: "UPDATE projects SET name = ?, description = ?, due_date = ? WHERE id = ?",
      args: [data.name, data.description, data.dueDate, data.id]
    });

    await db.execute({
      sql: "DELETE FROM project_members WHERE project_id = ?",
      args: [data.id]
    });

    for (const memberId of data.memberIds) {
      await db.execute({
        sql: "INSERT INTO project_members (project_id, user_id) VALUES (?, ?)",
        args: [data.id, memberId]
      });
    }

    return { success: true };
  });


// ----------------------------------------------------
// Task Functions
// ----------------------------------------------------

export const getTasksFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<Task[]> => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const result = await db.execute("SELECT * FROM tasks");
    return result.rows.map(row => ({
      id: String(row.id),
      title: String(row.title),
      description: String(row.description),
      priority: String(row.priority) as any,
      status: String(row.status) as any,
      assigneeId: String(row.assignee_id),
      projectId: String(row.project_id),
      dueDate: String(row.due_date),
      comments: Number(row.comments),
      attachments: Number(row.attachments),
      dependencies: JSON.parse(String(row.dependencies || "[]"))
    }));
  });

export const createTaskFn = createServerFn({ method: "POST" })
  .validator((data: { title: string; description: string; priority: string; projectId: string; assigneeId: string; dueDate: string }) => data)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const id = `t_${Date.now()}`;
    await db.execute({
      sql: `INSERT INTO tasks (id, title, description, priority, status, assignee_id, project_id, due_date, comments, attachments, dependencies)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, '[]')`,
      args: [id, data.title, data.description, data.priority, "Todo", data.assigneeId, data.projectId, data.dueDate]
    });

    // Log Notification
    const notifId = `n_${Date.now()}`;
    await db.execute({
      sql: `INSERT INTO notifications (id, type, title, message, read, time, user_id)
            VALUES (?, ?, ?, ?, 0, ?, ?)`,
      args: [
        notifId,
        "Task Assignment",
        "New Task Assigned",
        `${user.name} assigned you: ${data.title}`,
        new Date().toISOString(),
        data.assigneeId
      ]
    });

    return { id, success: true };
  });

export const updateTaskStatusFn = createServerFn({ method: "POST" })
  .validator((data: { taskId: string; status: string }) => data)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    await db.execute({
      sql: "UPDATE tasks SET status = ? WHERE id = ?",
      args: [data.status, data.taskId]
    });

    return { success: true };
  });

export const deleteTaskFn = createServerFn({ method: "POST" })
  .validator((taskId: string) => taskId)
  .handler(async ({ data: taskId }) => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    await db.execute({
      sql: "DELETE FROM tasks WHERE id = ?",
      args: [taskId]
    });

    return { success: true };
  });

// ----------------------------------------------------
// Root Cause Analysis (RCA) Functions
// ----------------------------------------------------

export const getRCAsFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<RCA[]> => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const result = await db.execute("SELECT * FROM rcas");
    return result.rows.map(row => ({
      id: String(row.id),
      title: String(row.title),
      severity: String(row.severity) as any,
      status: String(row.status) as any,
      createdAt: String(row.created_at),
      owner: String(row.owner),
      reviewers: JSON.parse(String(row.reviewers || "[]")),
      description: String(row.description)
    }));
  });

export const createRCAFn = createServerFn({ method: "POST" })
  .validator((data: { title: string; severity: string; description: string; reviewers: string[] }) => data)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const id = `r_${Date.now()}`;
    await db.execute({
      sql: `INSERT INTO rcas (id, title, severity, status, created_at, owner, reviewers, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.title,
        data.severity,
        "Submitted",
        new Date().toISOString(),
        user.name,
        JSON.stringify(data.reviewers),
        data.description
      ]
    });

    return { id, success: true };
  });

export const updateRCAStatusFn = createServerFn({ method: "POST" })
  .validator((data: { rcaId: string; status: string }) => data)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    await db.execute({
      sql: "UPDATE rcas SET status = ? WHERE id = ?",
      args: [data.status, data.rcaId]
    });

    return { success: true };
  });

// ----------------------------------------------------
// User Functions
// ----------------------------------------------------

export const getUsersFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<User[]> => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const result = await db.execute("SELECT id, name, email, role, avatar_color as avatarColor, workload FROM users");
    return result.rows.map(row => ({
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      role: String(row.role) as any,
      avatarColor: String(row.avatarColor),
      workload: Number(row.workload)
    }));
  });

export const updateUserSettingsFn = createServerFn({ method: "POST" })
  .validator((data: { name: string; email: string; currentPassword?: string; newPassword?: string }) => data)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    await ensureDbInitialized();

    // Check uniqueness
    if (data.email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await db.execute({
        sql: "SELECT id FROM users WHERE email = ? AND id != ?",
        args: [data.email.toLowerCase().trim(), user.id]
      });
      if (existing.rows.length > 0) {
        throw new Error("A user with this email already exists.");
      }
    }

    // Update profile basic settings
    await db.execute({
      sql: "UPDATE users SET name = ?, email = ? WHERE id = ?",
      args: [data.name, data.email.toLowerCase().trim(), user.id]
    });

    // Update password if requested
    if (data.currentPassword && data.newPassword) {
      const passResult = await db.execute({
        sql: "SELECT password_hash FROM users WHERE id = ?",
        args: [user.id]
      });
      const storedHash = String(passResult.rows[0]?.password_hash);
      if (!verifyPassword(data.currentPassword, storedHash)) {
        throw new Error("Incorrect current password.");
      }
      const newHash = hashPassword(data.newPassword);
      await db.execute({
        sql: "UPDATE users SET password_hash = ? WHERE id = ?",
        args: [newHash, user.id]
      });
    }

    return { success: true };
  });

// ----------------------------------------------------
// Notifications Functions
// ----------------------------------------------------

export const getNotificationsFn = createServerFn({ method: "GET" })
  .handler(async (): Promise<Notification[]> => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const result = await db.execute({
      sql: "SELECT * FROM notifications WHERE user_id = ? ORDER BY time DESC",
      args: [user.id]
    });

    return result.rows.map(row => ({
      id: String(row.id),
      type: String(row.type) as any,
      title: String(row.title),
      message: String(row.message),
      read: Number(row.read) === 1,
      time: String(row.time)
    }));
  });

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .validator((notificationId: string) => notificationId)
  .handler(async ({ data: notificationId }) => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    await db.execute({
      sql: "UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?",
      args: [notificationId, user.id]
    });

    return { success: true };
  });

export const bulkDeleteTasksFn = createServerFn({ method: "POST" })
  .validator((data: { taskIds: string[] }) => data)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const placeholders = data.taskIds.map(() => "?").join(",");
    await db.execute({
      sql: `DELETE FROM tasks WHERE id IN (${placeholders})`,
      args: data.taskIds
    });

    return { success: true };
  });

export const bulkAssignTasksFn = createServerFn({ method: "POST" })
  .validator((data: { taskIds: string[]; assigneeId: string }) => data)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const placeholders = data.taskIds.map(() => "?").join(",");
    await db.execute({
      sql: `UPDATE tasks SET assignee_id = ? WHERE id IN (${placeholders})`,
      args: [data.assigneeId, ...data.taskIds]
    });

    return { success: true };
  });

export const bulkUpdateTasksStatusFn = createServerFn({ method: "POST" })
  .validator((data: { taskIds: string[]; status: string }) => data)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const placeholders = data.taskIds.map(() => "?").join(",");
    await db.execute({
      sql: `UPDATE tasks SET status = ? WHERE id IN (${placeholders})`,
      args: [data.status, ...data.taskIds]
    });

    return { success: true };
  });

