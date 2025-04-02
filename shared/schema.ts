import { pgTable, text, serial, integer, timestamp, boolean, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users and authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(),
  email: text("email").notNull(),
  avatarInitials: text("avatar_initials").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  email: true,
  avatarInitials: true,
});

// Projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contractReference: text("contract_reference").notNull(),
  clientName: text("client_name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  contractReference: true,
  clientName: true,
  startDate: true,
  endDate: true,
});

// Compensation Events (CEs)
export const compensationEvents = pgTable("compensation_events", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  reference: text("reference").notNull(), // e.g. CE-001
  title: text("title").notNull(),
  description: text("description").notNull(),
  clauseReference: text("clause_reference").notNull(),
  estimatedValue: integer("estimated_value"),
  actualValue: integer("actual_value"),
  status: text("status").notNull(), // Notification, Quotation Due, Implemented, Accepted, etc.
  raisedBy: integer("raised_by").notNull(), // User ID
  raisedAt: timestamp("raised_at").notNull(),
  responseDeadline: timestamp("response_deadline"),
  implementedDate: timestamp("implemented_date"),
  attachments: jsonb("attachments"),
});

export const insertCompensationEventSchema = createInsertSchema(compensationEvents).omit({
  id: true,
});

// Early Warnings (EWs)
export const earlyWarnings = pgTable("early_warnings", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  reference: text("reference").notNull(), // e.g. EW-001
  description: text("description").notNull(),
  ownerId: integer("owner_id").notNull(), // User ID
  status: text("status").notNull(), // Open, Mitigated, Closed
  raisedBy: integer("raised_by").notNull(), // User ID
  raisedAt: timestamp("raised_at").notNull(),
  mitigationPlan: text("mitigation_plan"),
  meetingDate: timestamp("meeting_date"),
  attachments: jsonb("attachments"),
});

export const insertEarlyWarningSchema = createInsertSchema(earlyWarnings).omit({
  id: true,
});

// Non-Conformance Reports (NCRs)
export const nonConformanceReports = pgTable("non_conformance_reports", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  reference: text("reference").notNull(), // e.g. NCR-001
  description: text("description").notNull(),
  location: text("location").notNull(),
  raisedBy: integer("raised_by").notNull(), // User ID
  raisedAt: timestamp("raised_at").notNull(),
  status: text("status").notNull(), // Open, In Progress, Closed
  correctiveAction: text("corrective_action"),
  assignedTo: integer("assigned_to"), // User ID
  closedDate: timestamp("closed_date"),
  attachments: jsonb("attachments"),
});

export const insertNonConformanceReportSchema = createInsertSchema(nonConformanceReports).omit({
  id: true,
});

// Technical Queries (TQs)
export const technicalQueries = pgTable("technical_queries", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  reference: text("reference").notNull(), // e.g. TQ-001
  question: text("question").notNull(),
  raisedBy: integer("raised_by").notNull(),
  raisedAt: timestamp("raised_at").notNull(),
  status: text("status").notNull(), // Open, Answered, Closed
  response: text("response"),
  respondedBy: integer("responded_by"),
  respondedAt: timestamp("responded_at"),
  attachments: jsonb("attachments"),
});

export const insertTechnicalQuerySchema = createInsertSchema(technicalQueries).omit({
  id: true,
});

// Programme Milestones
export const programmeMilestones = pgTable("programme_milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  plannedDate: timestamp("planned_date").notNull(),
  actualDate: timestamp("actual_date"),
  status: text("status").notNull(), // Not Started, In Progress, Completed, Delayed
  delayReason: text("delay_reason"),
  delayDays: integer("delay_days"),
});

export const insertProgrammeMilestoneSchema = createInsertSchema(programmeMilestones).omit({
  id: true,
});

// Payment Certificates
export const paymentCertificates = pgTable("payment_certificates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  reference: text("reference").notNull(), // e.g. PC-001
  amount: integer("amount").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull(), // Draft, Submitted, Certified, Paid
  submittedBy: integer("submitted_by"),
  submittedAt: timestamp("submitted_at"),
  certifiedBy: integer("certified_by"),
  certifiedAt: timestamp("certified_at"),
  attachments: jsonb("attachments"),
});

export const insertPaymentCertificateSchema = createInsertSchema(paymentCertificates).omit({
  id: true,
});

// Chat Messages for AI Assistant
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull(), // user or assistant
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
});

// Defining types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type CompensationEvent = typeof compensationEvents.$inferSelect;
export type InsertCompensationEvent = z.infer<typeof insertCompensationEventSchema>;

export type EarlyWarning = typeof earlyWarnings.$inferSelect;
export type InsertEarlyWarning = z.infer<typeof insertEarlyWarningSchema>;

export type NonConformanceReport = typeof nonConformanceReports.$inferSelect;
export type InsertNonConformanceReport = z.infer<typeof insertNonConformanceReportSchema>;

export type TechnicalQuery = typeof technicalQueries.$inferSelect;
export type InsertTechnicalQuery = z.infer<typeof insertTechnicalQuerySchema>;

export type ProgrammeMilestone = typeof programmeMilestones.$inferSelect;
export type InsertProgrammeMilestone = z.infer<typeof insertProgrammeMilestoneSchema>;

export type PaymentCertificate = typeof paymentCertificates.$inferSelect;
export type InsertPaymentCertificate = z.infer<typeof insertPaymentCertificateSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
