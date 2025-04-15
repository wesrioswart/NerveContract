import { pgTable, text, serial, integer, timestamp, boolean, jsonb, varchar, date, json, real } from "drizzle-orm/pg-core";
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
  forecastDate: timestamp("forecast_date"),
  actualDate: timestamp("actual_date"),
  status: text("status").notNull(), // Not Started, On Track, At Risk, Delayed, Completed
  isKeyDate: boolean("is_key_date").default(false),
  affectsCompletionDate: boolean("affects_completion_date").default(false),
  description: text("description"),
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

export const insertChatMessageSchema = createInsertSchema(chatMessages)
  .omit({
    id: true,
  })
  .extend({
    // Allow timestamp to be either a Date object or an ISO string
    timestamp: z.union([z.date(), z.string().transform((val) => new Date(val))])
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

// Programme Management
export const programmes = pgTable("programmes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  version: text("version").notNull(),
  submissionDate: timestamp("submission_date").notNull(),
  status: text("status", { enum: ["draft", "submitted", "accepted", "rejected"] }).notNull(),
  acceptanceDate: timestamp("acceptance_date"),
  plannedCompletionDate: timestamp("planned_completion_date").notNull(),
  baselineId: integer("baseline_id").references(() => programmes.id),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type", { enum: ["msp", "xer", "xml"] }).notNull(),
  submittedBy: integer("submitted_by").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProgrammeSchema = createInsertSchema(programmes).omit({
  id: true,
  createdAt: true,
});

export const programmeActivities = pgTable("programme_activities", {
  id: serial("id").primaryKey(),
  programmeId: integer("programme_id").notNull().references(() => programmes.id),
  externalId: text("external_id").notNull(), // ID from MS Project or Primavera
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  duration: integer("duration").notNull(),
  percentComplete: integer("percent_complete").notNull().default(0),
  isCritical: boolean("is_critical").notNull().default(false),
  totalFloat: integer("total_float"),
  parentId: integer("parent_id").references(() => programmeActivities.id),
  wbsCode: text("wbs_code"),
  milestone: boolean("milestone").notNull().default(false),
});

export const insertProgrammeActivitySchema = createInsertSchema(programmeActivities).omit({
  id: true,
});

export const activityRelationships = pgTable("activity_relationships", {
  id: serial("id").primaryKey(),
  predecessorId: integer("predecessor_id").notNull().references(() => programmeActivities.id),
  successorId: integer("successor_id").notNull().references(() => programmeActivities.id),
  type: text("type", { enum: ["FS", "FF", "SS", "SF"] }).notNull().default("FS"),
  lag: integer("lag").notNull().default(0),
});

export const insertActivityRelationshipSchema = createInsertSchema(activityRelationships).omit({
  id: true,
});

export const programmeAnalyses = pgTable("programme_analyses", {
  id: serial("id").primaryKey(),
  programmeId: integer("programme_id").notNull().references(() => programmes.id),
  analysisDate: timestamp("analysis_date").defaultNow(),
  qualityScore: integer("quality_score"),
  criticalPathLength: integer("critical_path_length"),
  scheduleRisk: text("schedule_risk", { enum: ["low", "medium", "high"] }),
  issuesFound: json("issues_found").$type<Array<{
    severity: "low" | "medium" | "high",
    category: string,
    description: string,
    activities: number[]
  }>>(),
  nec4Compliance: json("nec4_compliance").$type<{
    clause31: boolean,
    clause32: boolean,
    overallCompliant: boolean,
    issues: string[]
  }>(),
  recommendations: json("recommendations").$type<string[]>(),
});

export const insertProgrammeAnalysisSchema = createInsertSchema(programmeAnalyses).omit({
  id: true,
  analysisDate: true,
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type Programme = typeof programmes.$inferSelect;
export type InsertProgramme = z.infer<typeof insertProgrammeSchema>;

export type ProgrammeActivity = typeof programmeActivities.$inferSelect;
export type InsertProgrammeActivity = z.infer<typeof insertProgrammeActivitySchema>;

export type ActivityRelationship = typeof activityRelationships.$inferSelect;
export type InsertActivityRelationship = z.infer<typeof insertActivityRelationshipSchema>;

export type ProgrammeAnalysis = typeof programmeAnalyses.$inferSelect;
export type InsertProgrammeAnalysis = z.infer<typeof insertProgrammeAnalysisSchema>;
