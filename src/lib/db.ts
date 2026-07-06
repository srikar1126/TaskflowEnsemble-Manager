import { createClient } from "@libsql/client";

export const db = createClient({
  url: "file:D:/node22/local.db",
});

let initPromise: Promise<void> | null = null;

export async function ensureDbInitialized() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        avatar_color TEXT NOT NULL,
        workload INTEGER NOT NULL
      )
    `);

    // Create sessions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create projects table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        progress INTEGER NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL,
        health INTEGER NOT NULL
      )
    `);

    // Create project_members table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS project_members (
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        PRIMARY KEY (project_id, user_id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create tasks table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        assignee_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        due_date TEXT NOT NULL,
        comments INTEGER NOT NULL DEFAULT 0,
        attachments INTEGER NOT NULL DEFAULT 0,
        dependencies TEXT NOT NULL DEFAULT '[]',
        FOREIGN KEY (assignee_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Create rcas table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS rcas (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        owner TEXT NOT NULL,
        reviewers TEXT NOT NULL, -- JSON string
        description TEXT NOT NULL
      )
    `);

    // Create notifications table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
        time TEXT NOT NULL,
        user_id TEXT, -- nullable
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Check if seeding is needed
    const usersCount = await db.execute("SELECT COUNT(*) as count FROM users");
    const count = Number(usersCount.rows[0]?.count ?? 0);
    if (count === 0) {
      console.log("Database empty. Seeding mock data...");
      const { seedDatabase } = await import("./db-seed");
      await seedDatabase();
      console.log("Database seeded successfully.");
    }
  })();

  return initPromise;
}
