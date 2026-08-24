# Society Maintenance Tracker

A full-stack platform for apartment societies to manage maintenance complaints. Residents raise complaints with optional photos and track progress; admins triage with priorities, manage status workflows with an immutable audit trail, flag overdue issues, publish notices, and monitor dashboard metrics — with automatic email updates to residents.

🌐 **Live Demo:** _pending deployment_

---

## Features

- **Role-based authentication** — resident vs admin, stateless JWT delivered in HttpOnly cookies (`secure` + `sameSite` aware for production)
- **Complaint lifecycle** — `Open → In Progress → Resolved`; once resolved a complaint is closed and cannot be updated
- **Immutable audit trail** — every status transition appends a row to `complaint_history` (actor ID, exact timestamp, optional note)
- **Priority management** — Low / Medium / High set by admin
- **Overdue detection** — automatic threshold check (configurable, default 7 days) plus manual admin flagging; overdue items surface first in the admin view
- **Photo uploads** — validated image attachments stored locally and served statically
- **Notice board** — admin-published announcements with a boolean pin toggle for important notices
- **Notification pipeline** — async emails to the affected resident on status change, broadcast emails when an important notice is published (Ethereal auto-provisioned for dev)
- **Metrics aggregation** — single endpoint returning counts grouped by status, grouped by category, overdue count, and totals

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Express 5, TypeScript, Drizzle ORM, PostgreSQL |
| Frontend | Next.js 16 (App Router), Tailwind CSS v4, SWR, React Hook Form + Zod |
| Email | Nodemailer (Ethereal in dev / any SMTP in prod) |
| Uploads | Multer (local disk storage) |
| Validation | Zod schemas shared per-request via middleware |

## Project Structure

```
├── client/                     # Next.js frontend
│   ├── app/
│   │   ├── styles/             # Tailwind v4 theme (CSS variables, muted palette)
│   │   └── src/app/
│   │       ├── (auth)/         # login, register
│   │       ├── (resident)/     # dashboard, complaints (list/new/detail), notices
│   │       └── (admin)/        # dashboard, complaints mgmt, notices CRUD, metrics
│   └── src/
│       ├── components/         # ui/ primitives + layout/ (Header, Sidebar, layouts)
│       ├── contexts/           # AuthContext (cookie session)
│       ├── hooks/              # SWR data hooks (complaints, notices, admin)
│       ├── lib/                # axios API client, formatters
│       └── types/              # shared TypeScript contracts
├── server/                     # Express API
│   └── src/
│       ├── db/                 # connection, drizzle schema, seed
│       ├── middleware/         # auth (JWT cookie), validation (Zod)
│       ├── routes/             # auth, complaints, admin, notices
│       ├── services/           # email (Nodemailer + templates)
│       ├── utils/              # jwt, password, upload (multer), overdue
│       └── validators/         # Zod request schemas
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL), or an existing Postgres instance
- npm

### 1. Database & API (server)

```bash
cd server
cp src/.env.example .env          # then edit values as needed
npm install

docker compose up -d              # starts postgres:15 on :5432
npx drizzle-kit push              # create tables from schema
npm run db:seed                   # sample users, complaints, notices
npm run dev                       # API on http://localhost:3000
```

Health check: `curl http://localhost:3000/health`

### 2. Frontend (client)

```bash
cd client
cp .env.example .env.local        # set NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev                       # app on http://localhost:3001 (or :3000 if free)
```

### Seeded Credentials (password: `password123`)

| Role | Email |
|---|---|
| Admin | `admin@society.com` |
| Resident | `alice@society.com` |
| Resident | `bob@society.com` |

---

## Environment Variables

### Server (`server/.env`) — see `server/src/.env.example`

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `DATABASE_URL_TEST` | — | — | Separate DB for integration tests |
| `PORT` | — | `3000` | API port |
| `NODE_ENV` | — | `development` | `development` \| `production` \| `test` |
| `APP_STAGE` | — | `dev` | `dev` \| `production` \| `test` (controls .env loading) |
| `CORS_ORIGIN` | — | `[]` | Comma-separated allowed origins (credentials enabled) |
| `JWT_SECRET` | ✅ | — | ≥32 chars signing key |
| `JWT_EXPIRES_IN` | — | `7d` | Token TTL |
| `JWT_COOKIE_NAME` | — | `token` | Auth cookie name |
| `OVERDUE_DAYS` | — | `7` | Days before an unresolved complaint is eligible for overdue |
| `BCRYPT_ROUNDS` | — | `10` | Password hashing cost |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` / `EMAIL_FROM` | — | Ethereal | SMTP creds; omitted = auto-created Ethereal test account (preview URLs logged) |
| `UPLOAD_DIR` | — | `uploads` | Photo storage folder (served at `/uploads`) |
| `MAX_FILE_SIZE` | — | `5242880` | Max upload size in bytes |

### Client (`client/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Backend base URL |

---

## Database Schema

Four tables (PostgreSQL, managed by Drizzle Kit):

```
users                          complaints
─────                          ──────────
id            serial PK        id             serial PK
name          varchar(256)     resident_id    int FK → users.id (cascade)
email         varchar(256) UQ  category       varchar(128)
password_hash varchar(512)     description    text
role          enum             photo_url      text (nullable)
              (resident|admin) status         enum (Open|In Progress|Resolved) = Open
created_at    timestamp        priority       enum (Low|Medium|High) = Low
                               is_overdue     boolean = false
                               created_at     timestamp
                                              │
notices                                       ▼
───────                        complaint_history
id           serial PK         ─────────────────
content      text              id           serial PK
is_important boolean = false   complaint_id int FK → complaints.id (cascade)
created_at   timestamp         actor_id     int FK → users.id (cascade)
                               new_status   enum (Open|In Progress|Resolved)
                               note         text (nullable)
                               timestamp    timestamp (default now)
```

Key relationships: a user (resident) owns many complaints; each complaint has an append-only history; each history row records the acting user (resident or admin).

---

## API Documentation

Base URL: `/api` · Auth via HttpOnly cookie set on register/login. Roles: 🌐 public, 👤 resident, 🛡️ admin.

### Auth

| Method | Path | Role | Body / Notes |
|---|---|---|---|
| POST | `/auth/register` | 🌐 | `{ name, email, password }` → sets cookie, creates resident |
| POST | `/auth/login` | 🌐 | `{ email, password }` → sets cookie |
| POST | `/auth/logout` | 🌐 | clears cookie |
| GET | `/auth/me` | 👤 | current user profile |

### Complaints (Resident)

| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/complaints` | 👤 | multipart: `category`, `description`, optional `photo` (image ≤ 5MB) |
| GET | `/complaints` | 👤 | own complaints; query: `page, limit, status, category, startDate, endDate`; includes full history |
| GET | `/complaints/:id` | 👤 | own complaint detail + history timeline |

### Complaints & Metrics (Admin)

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/admin/complaints` | 🛡️ | all complaints; query: `page, limit, status, category, priority, startDate, endDate, isOverdue, sortBy, sortOrder`; overdue-first ordering |
| GET | `/admin/complaints/:id` | 🛡️ | any complaint detail + history |
| PATCH | `/admin/complaints/:id` | 🛡️ | `{ status?, priority?, isOverdue?, note? }`; status change → history entry + email; rejected once `Resolved` |
| POST | `/admin/complaints/:id/flag-overdue` | 🛡️ | manual overdue flag (+ history entry); blocked for resolved complaints |
| GET | `/admin/metrics` | 🛡️ | `{ byStatus[], byCategory[], overdueCount, totalComplaints }` |

### Notices

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/notices` | 🌐 | paginated; important pinned first, then newest |
| GET | `/notices/:id` | 🌐 | single notice |
| POST | `/notices` | 🛡️ | `{ content, isImportant }`; important → broadcast email to all residents |
| PATCH | `/notices/:id` | 🛡️ | partial update; newly-important → broadcast email |
| DELETE | `/notices/:id` | 🛡️ | remove notice |

### Misc

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | service health/timestamp |
| GET | `/uploads/*` | static complaint photos |

Error responses follow `{ error: string, details?: [{ field, message }] }` — `400` validation, `401` unauthenticated, `403` wrong role, `404` not found, `409` duplicate email.

---

## Requirement Mapping

| Assignment requirement | Where |
|---|---|
| Role-based auth w/ JWT in HttpOnly cookies | `server/src/utils/jwt.ts`, `middleware/auth.ts`, `routes/auth.ts`; `client/src/contexts/AuthContext.tsx` |
| Resident submit + track w/ history | `routes/complaints.ts`; `(resident)` pages |
| Admin filters, priority, manual overdue flag | `routes/admin.ts`; `(admin)/complaints` pages |
| Immutable audit trail | `complaint_history` table; inserts on create/status-change/flag |
| Overdue detection (configurable threshold) | `utils/overdue.ts` + `OVERDUE_DAYS`; read-time check + manual endpoint |
| Notice board w/ pinning | `routes/notices.ts`; pinned-first ordering |
| Async notification pipeline | `services/email.ts` (fire-and-forget, never blocks responses) |
| Metrics aggregation endpoint | `GET /api/admin/metrics` |

See [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) for the design rationale.
