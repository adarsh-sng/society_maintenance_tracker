# System Design — Society Maintenance Tracker

## Architecture Overview

```
┌─────────────┐   HTTP (cookies)   ┌──────────────────┐
│  Next.js    │ ─────────────────▶ │  Express API     │
│  Client     │ ◀───────────────── │  (TypeScript)    │
└─────────────┘   JSON + uploads   └───┬──────┬───────┘
        ▲                              │      │
   static /uploads                     ▼      ▼
        └────────────────────┐   PostgreSQL   Nodemailer
                             │   (Drizzle)    (async SMTP)
                        disk storage
```

The client is a Next.js App Router application that talks to a stateless Express API using cookie-authenticated fetches (SWR for caching/revalidation). All persistence lives in PostgreSQL via Drizzle ORM. Email sending and file writes are deliberately kept off the critical path so request latency and failure domains stay small.

*(~90 words)*

## Complaint History Model

`complaints` holds current state (`status`, `priority`, `isOverdue`); `complaint_history` is an **append-only ledger** of every transition. Each row stores `complaint_id`, the `actor_id` (the exact user who made the change, resident or admin), `new_status`, the server-generated `timestamp` (DB default `now()`), and an optional admin `note`.

Writes happen in three cases: complaint creation seeds the first entry ("Complaint created"), an admin status change appends an entry (with note or a generated summary like "Status changed from Open to In Progress"), and overdue flagging appends its own entry so *why* a flag exists is always answerable. Rows are never updated or deleted; the FK cascades only when a complaint itself is deleted.

The lifecycle is enforced server-side: `Open → In Progress → Resolved` with arbitrary forward moves allowed, but once `Resolved` the complaint is terminal — PATCH requests are rejected with `400`, guaranteeing closed issues can't be silently reopened without a trace.

Reads use Drizzle relational queries: complaints come back with their resident and full history (actor name/role embedded), newest-first, so the UI timeline is a single query — no N+1.

*(~185 words)*

## Overdue Detection

Overdue is modeled as a persisted boolean plus a computed check, giving both automation and admin control:

1. **Automatic threshold** — `OVERDUE_DAYS` (env, default 7). On read paths (admin list/detail), each unresolved complaint's age is compared against the threshold via `checkAndMarkOverdue()`. The computed result ORs with the stored flag, so items become visible as overdue without waiting for a cron job, while the threshold stays tunable per environment.
2. **Manual flag** — `POST /admin/complaints/:id/flag-overdue` lets admins escalate immediately regardless of age. It refuses resolved complaints and records a history entry ("Manually flagged as overdue by admin") preserving accountability.

Presentation-wise, the admin listing sorts overdue-first, then by the chosen column, so urgent work surfaces at the top. The metrics endpoint reports a strict overdue count (overdue AND not resolved) so dashboards never inflate the number with resolved-but-stale rows.

Trade-off: read-time detection avoids scheduler infrastructure; if write-back of the flag were needed at scale, the same pure function could move behind a cron unchanged.

*(~180 words)*

## Photo Handling

Photos arrive as `multipart/form-data` handled by Multer with disk storage. Guards: MIME whitelist (JPEG/PNG/GIF/WebP), a single-file limit from `MAX_FILE_SIZE` (5 MB default), and collision-proof filenames (`photo-<timestamp>-<random>.<ext>`). Rejected files surface as clean `400`s — Multer errors and filter errors are mapped explicitly in the global error handler instead of leaking as 500s.

Stored files live under `UPLOAD_DIR` (default `uploads/`) and are served statically at `/uploads/*`; the complaint row keeps only the URL string, keeping DB rows light and making a later swap to S3/Cloudinary a matter of changing storage driver + URL format. The client validates type/size before upload, shows a preview with remove option, and renders the attachment with a click-to-full-size link on the detail page.

*(~130 words)*

## Notification Flow

Notifications are **fire-and-forget**: email sends run asynchronously with `.catch()` logging, so an SMTP outage delays no response and fails no business operation. Two triggers exist:

1. **Status change** → targeted email to the owning resident (fetched by `resident_id`), including old/new status badges and the admin's note.
2. **Important notice** → broadcast to all users with role `resident`, fired when a notice is created important *or* updated to important (avoiding re-spam on edits).

Transport uses Nodemailer. In development, with no SMTP env vars set, an Ethereal test account is auto-provisioned at boot; preview URLs are logged per send, giving inspectable "inbox" evidence with zero signup. Production swaps in real SMTP credentials purely via env vars — no code change. Templates are inline HTML with text fallbacks.

*(~135 words)*

**Total: ~720 words**
