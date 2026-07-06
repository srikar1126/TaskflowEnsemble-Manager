import { db } from "./db";
import { users, projects, tasks, rcas, notifications } from "./mock-data";
import { hashPassword } from "./crypto";

export async function seedDatabase() {
  const defaultPasswordHash = hashPassword("password");

  // 1. Seed users
  for (let i = 0; i < users.length; i++) {
    const user = { ...users[i] };
    
    // Adjust the first user to be Alex Kim so the frontend pre-filled login works
    if (i === 0) {
      user.name = "Alex Kim";
      user.email = "alex.kim@teamflow.io";
      user.role = "Admin";
      user.avatarColor = "#6366F1";
    }

    await db.execute({
      sql: `INSERT INTO users (id, name, email, password_hash, role, avatar_color, workload)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        user.id,
        user.name,
        user.email,
        defaultPasswordHash,
        user.role,
        user.avatarColor,
        user.workload
      ]
    });
  }

  // 2. Seed projects
  for (const project of projects) {
    await db.execute({
      sql: `INSERT INTO projects (id, name, description, progress, due_date, status, health)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        project.id,
        project.name,
        project.description,
        project.progress,
        project.dueDate,
        project.status,
        project.health
      ]
    });

    // Seed project members
    for (const memberId of project.memberIds) {
      await db.execute({
        sql: `INSERT INTO project_members (project_id, user_id) VALUES (?, ?)`,
        args: [project.id, memberId]
      });
    }
  }

  // 3. Seed tasks
  for (const task of tasks) {
    await db.execute({
      sql: `INSERT INTO tasks (id, title, description, priority, status, assignee_id, project_id, due_date, comments, attachments, dependencies)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        task.id,
        task.title,
        task.description,
        task.priority,
        task.status,
        task.assigneeId,
        task.projectId,
        task.dueDate,
        task.comments,
        task.attachments,
        JSON.stringify(task.dependencies)
      ]
    });
  }

  // 4. Seed RCAs
  for (const rca of rcas) {
    // If owner is "Alex Chen", rename to "Alex Kim" to match seed user
    let owner = rca.owner;
    if (owner === "Alex Chen") {
      owner = "Alex Kim";
    }
    const reviewers = rca.reviewers.map(r => r === "Alex Chen" ? "Alex Kim" : r);

    await db.execute({
      sql: `INSERT INTO rcas (id, title, severity, status, created_at, owner, reviewers, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        rca.id,
        rca.title,
        rca.severity,
        rca.status,
        rca.createdAt,
        owner,
        JSON.stringify(reviewers),
        rca.description
      ]
    });
  }

  // 5. Seed Notifications
  for (let i = 0; i < notifications.length; i++) {
    const notif = notifications[i];
    // Distribute notifications: assign them all to 'u1' (which is Alex Kim now)
    // so the logged in user sees their notifications in the dashboard/header!
    await db.execute({
      sql: `INSERT INTO notifications (id, type, title, message, read, time, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        notif.id,
        notif.type,
        notif.title,
        notif.message,
        notif.read ? 1 : 0,
        notif.time,
        "u1"
      ]
    });
  }
}
