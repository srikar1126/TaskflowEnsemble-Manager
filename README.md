# Project Overview

**Taskflow Ensemble – Starter Template**

This repository is a lightweight Vite + React + TypeScript starter kit that showcases a clean component layout, TanStack Router for navigation, Tailwind CSS styling, and a few sample charts.

---

## Getting Started

1. **Prerequisites**
   - Node.js **v26.4.0** (or any newer version). Install it from the official site or with `winget install OpenJS.NodeJS`.
   - npm comes bundled with Node.

2. **Clone the repo**
   ```bash
   git clone https://github.com/yourname/taskflow-ensemble-main.git
   cd taskflow-ensemble-main
   ```

3. **Install the packages**
   ```bash
   npm ci
   ```

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173/`.

5. **Build for production** (optional)
   ```bash
   npm run build
   ```

---

## Environment Variables

The UI part does not need any environment variables. If you decide to add a backend later, just drop a `.env` file in the root and add entries like `VITE_API_URL`.

---

## What I Assumed

- The app is purely a front‑end single‑page application.
- All styling follows the dark‑mode‑ready Tailwind setup we discussed, with subtle glass‑morphism effects.
- The data shown in the charts is static placeholder data.
- The folder structure mirrors a typical React project (`src/components`, `src/pages`, etc.).

---

## Features in This Build

- Responsive layout with a mobile‑first drawer navigation.
- TanStack Router for type‑safe routing and lazy loading.
- Form handling using React Hook Form.
- Sample charts created with Recharts.
- Tailwind CSS with a custom palette, dark mode, and smooth hover animations.
- Path aliases work out of the box thanks to Vite’s native `tsconfigPaths` support.

---

## Things to Keep in Mind

- No real backend – everything you see is static mock data.
- Accessibility has only been addressed at a basic level; a full audit would be needed for production.
- The `@tanstack` packages need Node ≥ 22, so older CI environments will complain.
- No database schema is included because this is a front‑end only starter.

---

## Database / Migrations

Not applicable for this front‑end only project. If you add a server later, you can drop migration files in a `prisma/` or `migrations/` folder.

---

## Architecture & Design Decisions

A short overview of the main choices lives in **ARCHITECTURE_DECISIONS.md** – it explains why we went with Vite, TanStack Router, Tailwind, and how the code is organised.
