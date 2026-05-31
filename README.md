# Team Task Tracker

This repository contains a role-based team task management application with a secure backend API and an interactive React web interface.

The system features token-based authentication (JWT rotation), organization-scoped data boundaries, Redis caching with active invalidation, standalone WebSocket notifications, and a dark-theme Kanban task board.

---

## Tech Stack

### Backend API
- **Application**: Node.js & Express (Express 5)
- **Database**: SQLite with Prisma ORM
- **Cache**: Redis via `ioredis` (automatic bypass fallback if offline)
- **Validation**: Joi
- **Real-Time**: WebSockets via `ws`
- **Testing**: Jest & Supertest

### Frontend Client
- **Core**: React (v18)
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (theme variables, glassmorphism, responsive board)

---

## Architecture & Decisions

### 1. Database & Indexes
We chose SQLite to keep local development zero-dependency and fast.
- **ID Strategy**: All tables use CUID primary keys (`cuid()`). This prevents sequential ID enumeration attacks.
- **Indexes**: Added index points on fields queried most often:
  - `Task.status`
  - `Task.assigneeId`
  - `Task.dueDate`
  - Composite `(assigneeId, status)` to optimize the active dashboard loads.

### 2. Session Security (JWT Rotation)
The authentication flow utilizes short-lived access tokens (15 minutes) and longer-lived refresh tokens (7 days).
- **Secure Cookies**: Refresh tokens are stored in HttpOnly, SameSite=Lax cookies. In production, cookies are prefixed with `__Host-` to enforce HTTPS and prevent subdomain access.
- **Unique IDs (jti)**: Every token contains a unique `jti` UUID. This prevents primary key conflicts in high-velocity scripting environments and enables precise tracking.
- **Replay Protection (RTR)**: When a refresh token is used, it is revoked, and a new pair is issued. If a revoked refresh token is submitted (indicating a token theft or replay attempt), the system instantly invalidates all active sessions for that user.

### 3. Organization Isolation
Multitenancy is strictly isolated. Users can only fetch or modify projects, tasks, and members belonging to their specific `orgId`.
- Access attempts on resources outside a user's organization fail with a generic `404 NOT_FOUND` rather than `403 FORBIDDEN` to prevent resource enumeration.

### 4. Cache & Invalidation
To reduce database load, task lists (`GET /api/tasks`) are cached in Redis for 5 minutes.
- **Cache Keys**: Keys are structured using the organization, role, user ID, and active search filters:
  `tasks:org:{orgId}:role:{role}:user:{id}:proj:{projectId}:status:{status}:priority:{priority}`
- **Automated Invalidation**: Any write operation (create, update, transition, delete) triggers an async background scan (`SCAN`) that finds and deletes all cached keys matching `tasks:org:{orgId}:*`.
- **Graceful Fallback**: If Redis is offline, the client logs a warning and routes queries directly to SQLite. The server continues to run normally.

### 5. WebSocket Pushes
A standalone WebSocket server runs on port 8080.
- **Authentication**: Connections require a valid JWT token passed in the connection query string (`ws://127.0.0.1:8080?token=...`).
- **Pushes**: When a task is created or updated, real-time events (`TASK_ASSIGNED`, `TASK_UPDATED`, `TASK_STATUS_CHANGED`) are immediately sent to the assignee's active connections.

---

## API Endpoints

Check `openapi.json` for full schemas and payload definitions.

### Auth (/api/auth)
- `POST /register`: Registers a user (defaults to `MEMBER`). Requires `email`, `password`, `name`, and either `orgId` (existing) or `orgName` (to create a new org).
- `POST /login`: Validates password and sets the HttpOnly cookie.
- `POST /refresh`: Rotates the refresh token cookie and issues a new access token.
- `POST /logout`: Revokes the refresh token and clears the cookie.

### Users (/api/users) — Admins Only
- `GET /`: Lists all users inside the admin's organization.
- `PATCH /:id/role`: Enforces organization scope boundaries and updates the user role (`ADMIN`, `MANAGER`, `MEMBER`).

### Projects (/api/projects)
- `GET /`: Lists all projects inside the organization.
- `GET /:id`: Details of a specific project.
- `POST /` (Admins/Managers only): Creates a new project in the organization.
- `DELETE /:id` (Admins/Managers only): Deletes a project and cascade-cleans its tasks.

### Tasks (/api/tasks)
- `GET /`: Lists tasks. `MEMBER` users only see tasks assigned to them; admins and managers see all tasks in the org. Caching active.
- `GET /:id`: Details of a specific task.
- `POST /` (Admins/Managers only): Creates a task.
- `PUT /:id`: Updates task details. Restricts access to assignee, manager, or admin.
- `PATCH /:id/status`: Transitions status. Restricts status updates to the assignee or managers. Statuses must transition sequentially:
  - `TODO` ↔ `IN_PROGRESS`
  - `IN_PROGRESS` → `IN_REVIEW`
  - `IN_REVIEW` → `DONE`
  - `BLOCKED` can be entered from any active state and returned back once resolved.
- `DELETE /:id` (Admins/Managers only): Deletes a task.

### Analytics (/api/analytics) — Admins & Managers Only
- `GET /overdue`: Fetches list and count of all incomplete tasks past their `dueDate`.
- `GET /completion-time`: Computes the average duration (in hours) between creation and completion (`DONE`) for all tasks in the organization.

---

## Local Setup

### 1. Installation
Clone the repository and install all dependencies:
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
PORT=3000
WS_PORT=8080
DATABASE_URL="file:./dev.db"
REDIS_URL="redis://127.0.0.1:6379"
NODE_ENV=development
```

### 3. Database Migration & Seed
Run Prisma migrations and seed the SQLite database:
```bash
npm run prisma:migrate
npm run prisma:seed
```
Seeded accounts:
- **Admin**: admin@email.com (password: admin)
- **Manager**: manager@email.com (password: admin)
- **Member**: member@email.com (password: admin)

### 4. Running the Application

You will need two terminal tabs to run the backend and frontend simultaneously in local development:

**Tab 1: Start Backend API**
```bash
npm run dev
```

**Tab 2: Start Frontend Client**
```bash
cd client
npm run dev
```
Vite will start the client dev server at `http://127.0.0.1:5173`. Traffic targeting `/api` will be proxied automatically to the API port.

### 5. Run Tests
Execute the integration test suite:
```bash
npm test
```

---

## Docker Deployment

To spin up the API and Redis in a production-ready environment:

```bash
docker compose up --build
```
The container entrypoint will automatically run schema migrations and seeds, mount shared SQLite volumes, and expose the HTTP server on port 3000 and the WebSocket server on port 8080.

---

## Next Steps

Potential enhancements for scaling:
1. **Backend-For-Frontend (BFF)**: Route web app requests through a BFF layer to handle session tokens internally and protect secrets.
2. **Distributed Locks**: Use Redlock on Redis to avoid conflicts when multiple administrators modify a task status concurrently.
3. **MFA**: Require multi-factor tokens (TOTP) when changing roles or deleting projects.
4. **Scale WebSockets**: Integrate Redis Pub/Sub so WebSockets can span multiple container nodes.
