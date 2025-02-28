import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  position: text("position"),
  electionId: integer("election_id").notNull(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  candidateId: integer("candidate_id").notNull(),
  electionId: integer("election_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  details: text("details").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertElectionSchema = createInsertSchema(elections).pick({
  title: true,
  description: true,
  startDate: true,
  endDate: true,
}).extend({
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
});

export const insertCandidateSchema = createInsertSchema(candidates).pick({
  name: true,
  description: true,
  imageUrl: true,
  position: true,
  electionId: true,
}).extend({
  imageUrl: z.string().url("Please enter a valid image URL").optional(),
  position: z.string().min(1, "Position is required"),
});

export const insertVoteSchema = createInsertSchema(votes).pick({
  candidateId: true,
  electionId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Election = typeof elections.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;