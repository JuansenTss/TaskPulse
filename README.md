# Task Pulse

Task Pulse is a lightweight task tracking and reporting app built with React + Vite (frontend) and a small Express API (backend). It is simple to run locally while demonstrating practical patterns (auth, sessions, filters, per‑user isolation, JSON persistence).

## Quick start

Prerequisites
- Node.js 18+ and npm 9+

Install
```bash
npm install
```

Run the API (Terminal 1)
```bash
npm run server
```

Run the frontend (Terminal 2)
```bash
npm run dev
# For LAN testing
# npm run dev -- --host --port 5173
```

Open the app
- Browser: http://localhost:5173
- Default account: `admin / admin`

Notes
- The frontend proxies `/api/*` → `http://localhost:3001` (see `vite.config.ts`).
- Sessions use an HttpOnly cookie (`tp_session`).
- User and task data are saved as JSON files under `dist/`.

## Features (current)
- Login/logout with cookie session; optional “Remember me” (7‑day persistent session)
- Sign Up with OTP step (accepts any 6 digits; no email send in dev)
- Forgot password (email → OTP → new password)
- Password hashing (bcrypt); legacy plaintext auto‑migrates on first successful login
- Per‑user task isolation (only see your own tasks)
- Task table with rich filtering (No., Title, Status, Created/Completed Date, Notes, Action)
- Pagination, status color tags; accessibility niceties (caps‑lock warning, password visibility, strength meter)
- Dark/light aware styling

## Tech stack
- Frontend: React 19 + Vite 7, TypeScript
- Backend: Express 5, TypeScript, cookie‑parser, cors, bcryptjs
- Linting: ESLint 9

## Project structure
```
.
├─ server/          # Express API (TypeScript)
│  ├─ server.ts
│  └─ tsconfig.json
├─ src/             # React app (TypeScript)
│  ├─ components/
│  │  ├─ Login.tsx
│  │  ├─ TaskForm.tsx
│  │  ├─ TaskList.tsx
│  │  └─ TaskItem.tsx
│  ├─ utils/
│  ├─ types/
│  ├─ App.tsx
│  └─ index.css
├─ dist/            # Built server and JSON data live here at runtime
│  ├─ server.js
│  ├─ users.json    # created automatically
│  └─ tasks.json    # created automatically
├─ vite.config.ts
└─ README.md
```

## Data and persistence
- `dist/users.json`
  - `{ username, password }` (password is a bcrypt hash)
- `dist/tasks.json`
  - Task records include `owner` (username). The API filters by `owner` for all operations.

On first run, the server creates `users.json` (with default `admin/admin`) and `tasks.json` if missing.

## Authentication endpoints
- `POST /auth/login` `{ username, password, rememberMe? }`
- `POST /auth/logout`
- `GET  /auth/me`
- `POST /auth/signup` `{ username, password, email? }` (user created after OTP step in UI)
- `POST /auth/reset` `{ username? , email? , newPassword }` (UI uses the email path)

Both root and `/api/*` routes exist for dev/prod flexibility; the frontend uses `/api` via Vite proxy.

## Development
Common scripts (see `package.json`):
```json
{
  "dev": "vite",
  "server": "npm run build-server && node dist/server.js",
  "build-server": "tsc -p server/tsconfig.json",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint ."
}
```

Troubleshooting
- Port in use: `npm run dev -- --port 5174`
- Cookies not sticking: ensure same origin; clear site data and retry
- Server changes not applied: stop and re‑run `npm run server`
- Reset data: stop API, delete `dist/users.json` or `dist/tasks.json` (they’ll be recreated)

## Contributing notes
- Filters live in `src/components/TaskList.tsx` (dates use `<input type="date">`)
- Auth flows are in `src/components/Login.tsx` with helpers in `src/utils/auth.ts`
- API base is `/api` (`src/utils/api.ts`), proxied in `vite.config.ts`
- Server code: `server/server.ts` (JSON persistence under `dist/`)

## Roadmap ideas
- Multi‑tenant business accounts (companies, roles, org units) with per‑company isolation
- KPI tiles and charts (burndown, cumulative flow), scheduled PDF/CSV reports
- Import/export (CSV/Excel), Jira/Azure DevOps integration
- Role‑based permissions, audit log

## Security
- Local dev sets cookies with `secure=false`; enable `secure=true` behind HTTPS in production
- Passwords are hashed (bcrypt); never store plaintext

## License
Internal/demo use. Add a proper license before distribution.
