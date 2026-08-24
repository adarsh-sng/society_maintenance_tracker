import { relations } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";

// --- Enums ---
export const roleEnum = pgEnum("role", ["resident", "admin"]);
export const statusEnum = pgEnum("status", ["Open", "In Progress", "Resolved"]);
export const priorityEnum = pgEnum("priority", ["Low", "Medium", "High"]);

// --- Tables ---
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 512 }).notNull(),
  role: roleEnum("role").default("resident").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 128 }).notNull(),
  description: text("description").notNull(),
  photoUrl: text("photo_url"), // Optional
  status: statusEnum("status").default("Open").notNull(),
  priority: priorityEnum("priority").default("Low").notNull(),
  isOverdue: boolean("is_overdue").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complaintHistory = pgTable("complaint_history", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id")
    .notNull()
    .references(() => complaints.id, { onDelete: "cascade" }),
  actorId: integer("actor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  newStatus: statusEnum("new_status").notNull(),
  note: text("note"), // Optional
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  isImportant: boolean("is_important").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Relations ---
export const userRelations = relations(users, ({ many }) => ({
  complaints: many(complaints),
  complaintHistory: many(complaintHistory),
}));

export const complaintRelations = relations(complaints, ({ one, many }) => ({
  resident: one(users, {
    fields: [complaints.residentId],
    references: [users.id],
  }),
  history: many(complaintHistory),
}));

export const complaintHistoryRelations = relations(complaintHistory, ({ one }) => ({
  complaint: one(complaints, {
    fields: [complaintHistory.complaintId],
    references: [complaints.id],
  }),
  actor: one(users, {
    fields: [complaintHistory.actorId],
    references: [users.id],
  }),
}));

// --- Zod Schemas ---
export const selectUserSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users);

export const selectComplaintSchema = createSelectSchema(complaints);
export const insertComplaintSchema = createInsertSchema(complaints);

export const selectComplaintHistorySchema = createSelectSchema(complaintHistory);
export const insertComplaintHistorySchema = createInsertSchema(complaintHistory);

export const selectNoticeSchema = createSelectSchema(notices);
export const insertNoticeSchema = createInsertSchema(notices);

// --- Types ---
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Complaint = typeof complaints.$inferSelect;
export type NewComplaint = typeof complaints.$inferInsert;

export type ComplaintHistory = typeof complaintHistory.$inferSelect;
export type NewComplaintHistory = typeof complaintHistory.$inferInsert;

export type Notice = typeof notices.$inferSelect;
export type NewNotice = typeof notices.$inferInsert;