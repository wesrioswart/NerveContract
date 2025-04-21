import { pgTable, text, serial, integer, timestamp, boolean, jsonb, varchar, date, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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

// Programme Annotations
export const programmeAnnotations = pgTable("programme_annotations", {
  id: serial("id").primaryKey(),
  programmeId: integer("programme_id").notNull().references(() => programmes.id),
  activityId: text("activity_id"), // Optional reference to a specific activity
  x: integer("x").notNull(), // X position on the annotation canvas
  y: integer("y").notNull(), // Y position on the annotation canvas
  text: text("text").notNull(), // Annotation text content
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  type: text("type", { enum: ["issue", "comment", "instruction", "nec4-clause"] }).notNull(),
  status: text("status", { enum: ["pending", "resolved"] }).default("pending"),
  nec4Clause: text("nec4_clause"), // Optional NEC4 clause reference
});

export const insertProgrammeAnnotationSchema = createInsertSchema(programmeAnnotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProgrammeAnnotation = typeof programmeAnnotations.$inferSelect;
export type InsertProgrammeAnnotation = z.infer<typeof insertProgrammeAnnotationSchema>;

export type Programme = typeof programmes.$inferSelect;
export type InsertProgramme = z.infer<typeof insertProgrammeSchema>;

export type ProgrammeActivity = typeof programmeActivities.$inferSelect;
export type InsertProgrammeActivity = z.infer<typeof insertProgrammeActivitySchema>;

export type ActivityRelationship = typeof activityRelationships.$inferSelect;
export type InsertActivityRelationship = z.infer<typeof insertActivityRelationshipSchema>;

export type ProgrammeAnalysis = typeof programmeAnalyses.$inferSelect;
export type InsertProgrammeAnalysis = z.infer<typeof insertProgrammeAnalysisSchema>;

// NEC4 Teams
export const nec4Teams = pgTable("nec4_teams", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { 
    enum: [
      "client", 
      "contractor", 
      "project_manager", 
      "supervisor", 
      "adjudicator", 
      "senior_representatives"
    ] 
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const nec4TeamMembers = pgTable("nec4_team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => nec4Teams.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // e.g., "Lead", "Member", "Manager"
  responsibilities: text("responsibilities"),
  isKeyPerson: boolean("is_key_person").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  isActive: boolean("is_active").default(true),
});

export const usersToProjects = pgTable("users_to_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  role: text("role").notNull(), // Role in the specific project
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Define relations
export const nec4TeamsRelations = relations(nec4Teams, ({ many, one }) => ({
  members: many(nec4TeamMembers),
  project: one(projects, {
    fields: [nec4Teams.projectId],
    references: [projects.id]
  })
}));

export const nec4TeamMembersRelations = relations(nec4TeamMembers, ({ one }) => ({
  team: one(nec4Teams, {
    fields: [nec4TeamMembers.teamId],
    references: [nec4Teams.id]
  }),
  user: one(users, {
    fields: [nec4TeamMembers.userId],
    references: [users.id]
  })
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMemberships: many(nec4TeamMembers),
  projectAssignments: many(usersToProjects)
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  teams: many(nec4Teams),
  userAssignments: many(usersToProjects)
}));

// Create insert schemas
export const insertNec4TeamSchema = createInsertSchema(nec4Teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNec4TeamMemberSchema = createInsertSchema(nec4TeamMembers).omit({
  id: true,
  joinedAt: true
});

export const insertUserToProjectSchema = createInsertSchema(usersToProjects).omit({
  id: true,
  joinedAt: true
});

// Define types
export type Nec4Team = typeof nec4Teams.$inferSelect;
export type InsertNec4Team = z.infer<typeof insertNec4TeamSchema>;

export type Nec4TeamMember = typeof nec4TeamMembers.$inferSelect;
export type InsertNec4TeamMember = z.infer<typeof insertNec4TeamMemberSchema>;

export type UserToProject = typeof usersToProjects.$inferSelect;

// Progress Reports
export const progressReports = pgTable("progress_reports", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  title: text("title").notNull(),
  reportDate: date("report_date").notNull(),
  reportPeriodStart: date("report_period_start").notNull(),
  reportPeriodEnd: date("report_period_end").notNull(),
  overallProgress: real("overall_progress").notNull(), // Percentage complete (0-100)
  overallSummary: text("overall_summary").notNull(),
  forecastCompletion: date("forecast_completion"),
  contractCompletion: date("contract_completion"),
  statusColor: text("status_color", { enum: ["green", "amber", "red"] }).notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  sectionProgress: jsonb("section_progress").$type<Array<{
    section: string,
    team: string,
    percentComplete: number,
    issues: string,
    nextWeekFocus: string
  }>>(),
  risksAndEarlyWarnings: jsonb("risks_and_early_warnings").$type<Array<{
    riskId: string,
    description: string,
    status: string,
    mitigation: string,
    registerLink: string
  }>>(),
  compensationEvents: jsonb("compensation_events").$type<Array<{
    ceRef: string,
    description: string,
    status: string,
    costImpact: number,
    timeImpact: number,
    affectedSection: string
  }>>(),
  issuesAndQueries: jsonb("issues_and_queries").$type<Array<{
    ref: string,
    type: string, // NCR or TQR
    description: string,
    section: string,
    status: string,
    raisedDate: string
  }>>(),
  aiSummary: text("ai_summary"),
  attachments: jsonb("attachments").$type<Array<{
    name: string,
    url: string,
    type: string
  }>>(),
});

export const insertProgressReportSchema = createInsertSchema(progressReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const progressReportRelations = relations(progressReports, ({ one }) => ({
  project: one(projects, {
    fields: [progressReports.projectId],
    references: [projects.id]
  }),
  creator: one(users, {
    fields: [progressReports.createdBy],
    references: [users.id]
  })
}));

export type ProgressReport = typeof progressReports.$inferSelect;
export type InsertProgressReport = z.infer<typeof insertProgressReportSchema>;
