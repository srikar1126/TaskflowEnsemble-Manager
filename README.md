# TeamFlow Enterprise Workspace

TeamFlow is a premium, collaborative team project and task management dashboard designed with a modern, glassmorphic UI. It features real-time state persistence, interactive boards, advanced reporting, and a robust tracking system.

---

## 🚀 Key Features

*   **Interactive Kanban Board**: Fully draggable status board that automatically updates task statuses on the fly.
*   **List View with Bulk Actions**: Mass-select tasks to batch **Assign** owners, **Change status**, or **Delete** items simultaneously.
*   **Global "+ New Task" Creation**: Add new tasks instantly from any page with a structured form containing validations (Project, Assignee, Priority, and Due Date).
*   **Root Cause Analysis (RCA)**: Create, document, and review team retrospectives with severity tracking and assigned reviewers.
*   **User Workloads**: Live tracking of user tasks, projects count, and workloads.
*   **Real-time Notifications**: Global notifications panel updating instantly on task assignments.

---

## 💻 Tech Stack

*   **Frontend**: React, TanStack Start (SSR/CSR framework), TanStack Router, and TanStack Query.
*   **Styling**: Modern Tailwind CSS, Lucide icons, and sleek custom glassmorphic components.
*   **Backend Actions**: TanStack Start Server Functions (`createServerFn`) validated with input schemas.
*   **Database**: SQLite (`@libsql/client`) providing persistent relational storage for users, projects, tasks, sessions, and notifications.
*   **Authentication**: Cookie-based HTTP-only session management.

---

## 🛠️ Getting Started

### Prerequisites
*   **Node.js**: Version `20.19+` or `22.12+` is required for Vite 6 and TanStack Start compilation.

### Installation
1. Install project dependencies:
   ```bash
   npm install
   ```

2. Seed & Initialize Database:
   - The database automatically checks, initializes tables, and seeds default mock accounts (like `alex.kim@teamflow.io` with password `password`) on first launch.
   - Connection configurations can be checked or customized in `src/lib/db.ts`.

### Running Locally
*   Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:8080](http://localhost:8080) to access the application.

### Building for Production
*   Build client and SSR server bundles:
   ```bash
   npm run build
   ```

*   Preview the production build locally:
   ```bash
   npm run preview
   ```

---

## 📂 Project Structure

```
├── src/
│   ├── components/       # Shared UI components (Sidebar, Topbar, Radix wrappers)
│   ├── lib/              # Database connection, crypto utilities, and Server Functions
│   ├── routes/           # TanStack file-based routing views (Dashboard, List, Kanban, RCA)
│   ├── start.ts          # Vinxi HTTP server handler
│   ├── server.ts         # Server entry point
│   └── styles.css        # Global CSS theme variables & styling
├── public/               # Static assets
└── local.db              # SQLite Database (generated on setup)
```
