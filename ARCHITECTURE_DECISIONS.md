# Architectural & Design Decisions

## Overview

The **Taskflow Ensemble** starter kit is built with a modern front‑end stack:
- **Vite** (v8) – fast dev server and optimized build.
- **React 19** with **TypeScript** – type‑safe component development.
- **TanStack Router** – declarative routing with lazy‑loaded routes.
- **Tailwind CSS** – utility‑first styling, custom colour palette, dark mode, and glass‑morphism effects.
- **Recharts** – lightweight charting library for data visualisation.
- **React Hook Form** – performant form handling and validation.

## Key Design Choices

1. **File Structure**
   - `src/`
     - `components/` – reusable UI pieces.
     - `pages/` – route‑level components.
     - `hooks/` – custom React hooks.
     - `utils/` – helper functions.
   - `public/` – static assets.
   - `vite.config.ts` – Vite configuration with native `tsconfigPath` support.

2. **Styling**
   - Tailwind configuration defines a harmonious HSL‑based palette (`primary`, `secondary`, `accent`).
   - Dark mode enabled via `media` strategy.
   - Micro‑animations (hover, focus) implemented with Tailwind `transition` utilities.
   - Glass‑morphism cards use `backdrop-blur` and semi‑transparent backgrounds.

3. **Routing**
   - TanStack Router provides type‑safe route definitions.
   - Lazy loading via `import()` keeps initial bundle size low.
   - SSR hooks are present but not used (future‑proof for server‑side rendering).

4. **State Management**
   - Minimal global state; React Query (`@tanstack/react-query`) is set up for data fetching and caching.
   - Local component state handled via `useState` / `useReducer`.

5. **Build & Deploy**
   - `npm run build` outputs a static site ready for any static host (Vercel, Netlify, GitHub Pages).
   - No backend, so no database schema is required. If added later, a `prisma/` folder can host migrations.

## Why These Choices?

- **Performance:** Vite’s native ES module dev server eliminates bundling overhead, resulting in sub‑second cold starts.
- **Scalability:** TanStack Router scales to large apps with nested routes and data loaders.
- **Developer Experience:** Tailwind + TypeScript provides instant feedback and prevents CSS drift.
- **Future‑Proof:** The architecture leaves room for adding SSR, authentication, or a backend without major refactoring.

## Trade‑offs & Limitations

- The project is front‑end only; no DB or API layer is included.
- Accessibility is basic; further audits are required for WCAG compliance.
- The chosen `@tanstack` packages currently require Node ≥ 22, which may limit compatibility with older CI environments.

---

