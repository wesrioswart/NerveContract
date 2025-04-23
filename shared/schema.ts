import { pgTable, text, serial, integer, timestamp, boolean, jsonb, varchar, date, json, real, decimal } from "drizzle-orm/pg-core";
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

// Procurement and Inventory Management

// Nominal Codes from GPSMACS system
export const nominalCodes = pgTable("nominal_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g. 5399
  description: text("description").notNull(), // e.g. "OTHER SITE CONSUMABLES"
  category: text("category").notNull(), // e.g. "MATERIAL COSTS", "PLANT COSTS"
  isProjectSpecific: boolean("is_project_specific").notNull(), // 5000-6999 (true) or 7000-8999 (false)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  accountNumber: text("account_number"),
  isPreferred: boolean("is_preferred").default(false),
  isGpsmacs: boolean("is_gpsmacs").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase Orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(), // Generated PO number
  projectId: integer("project_id").references(() => projects.id),
  nominalCodeId: integer("nominal_code_id").notNull().references(() => nominalCodes.id),
  description: text("description").notNull(),
  deliveryMethod: text("delivery_method").notNull(), // "delivery" or "collection"
  hireDuration: text("hire_duration"), // N/A for purchases
  estimatedCost: integer("estimated_cost").notNull(), // Stored in pennies/cents
  totalCost: integer("total_cost").notNull(), // Stored in pennies/cents
  vatIncluded: boolean("vat_included").notNull(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  deliveryDate: text("delivery_date").notNull(), // Using text to handle various formats like "After Easter"
  deliveryAddress: text("delivery_address").notNull(),
  status: text("status", { 
    enum: ["draft", "pending_approval", "approved", "ordered", "delivered", "completed", "cancelled"] 
  }).notNull().default("draft"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase Order Items
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").notNull().references(() => purchaseOrders.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(), // Stored in pennies/cents
  unit: text("unit").default("item"), // e.g., "each", "kg", "m", etc.
  vatRate: integer("vat_rate").notNull().default(20), // percentage
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory Items (Stock)
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Internal stock code
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // e.g., "Materials", "Plant", "PPE", "Tools"
  subcategory: text("subcategory"), // More specific categorization
  nominalCodeId: integer("nominal_code_id").references(() => nominalCodes.id),
  unit: text("unit").notNull().default("each"), // Unit of measurement
  minStockLevel: integer("min_stock_level").default(0),
  maxStockLevel: integer("max_stock_level"),
  reorderPoint: integer("reorder_point").default(0),
  unitCost: integer("unit_cost"), // Average cost in pennies/cents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory Locations (Yards, Stores)
export const inventoryLocations = pgTable("inventory_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Barking Yard", "Main Store"
  address: text("address"),
  type: text("type", { enum: ["yard", "store", "warehouse", "site"] }).notNull(),
  contactPerson: text("contact_person"),
  contactPhone: text("contact_phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stock Levels - tracks quantities at specific locations
export const stockLevels = pgTable("stock_levels", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => inventoryItems.id),
  locationId: integer("location_id").notNull().references(() => inventoryLocations.id),
  quantity: integer("quantity").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Stock Transactions - tracks movements of inventory
export const stockTransactions = pgTable("stock_transactions", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => inventoryItems.id),
  type: text("type", { 
    enum: ["purchase", "issue", "return", "transfer", "adjustment", "stocktake"]
  }).notNull(),
  quantity: integer("quantity").notNull(),
  fromLocationId: integer("from_location_id").references(() => inventoryLocations.id),
  toLocationId: integer("to_location_id").references(() => inventoryLocations.id),
  projectId: integer("project_id").references(() => projects.id), // If allocated to a project
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id),
  comments: text("comments"),
  transactionDate: timestamp("transaction_date").defaultNow(),
  performedBy: integer("performed_by").notNull().references(() => users.id),
});

// Define relations
export const nominalCodesRelations = relations(nominalCodes, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
  inventoryItems: many(inventoryItems),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  project: one(projects, {
    fields: [purchaseOrders.projectId],
    references: [projects.id],
  }),
  nominalCode: one(nominalCodes, {
    fields: [purchaseOrders.nominalCodeId],
    references: [nominalCodes.id],
  }),
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  creator: one(users, {
    fields: [purchaseOrders.createdBy],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [purchaseOrders.approvedBy],
    references: [users.id],
  }),
  items: many(purchaseOrderItems),
  stockTransactions: many(stockTransactions),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  nominalCode: one(nominalCodes, {
    fields: [inventoryItems.nominalCodeId],
    references: [nominalCodes.id],
  }),
  stockLevels: many(stockLevels),
  stockTransactions: many(stockTransactions),
}));

export const inventoryLocationsRelations = relations(inventoryLocations, ({ many }) => ({
  stockLevels: many(stockLevels),
  stockTransactionsFrom: many(stockTransactions, { relationName: "fromLocation" }),
  stockTransactionsTo: many(stockTransactions, { relationName: "toLocation" }),
}));

export const stockLevelsRelations = relations(stockLevels, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [stockLevels.itemId],
    references: [inventoryItems.id],
  }),
  location: one(inventoryLocations, {
    fields: [stockLevels.locationId],
    references: [inventoryLocations.id],
  }),
}));

export const stockTransactionsRelations = relations(stockTransactions, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [stockTransactions.itemId],
    references: [inventoryItems.id],
  }),
  fromLocation: one(inventoryLocations, {
    fields: [stockTransactions.fromLocationId],
    references: [inventoryLocations.id],
  }),
  toLocation: one(inventoryLocations, {
    fields: [stockTransactions.toLocationId],
    references: [inventoryLocations.id],
  }),
  project: one(projects, {
    fields: [stockTransactions.projectId],
    references: [projects.id],
  }),
  purchaseOrder: one(purchaseOrders, {
    fields: [stockTransactions.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  performedByUser: one(users, {
    fields: [stockTransactions.performedBy],
    references: [users.id],
  }),
}));

// Create insert schemas
export const insertNominalCodeSchema = createInsertSchema(nominalCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
  id: true,
  createdAt: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventoryLocationSchema = createInsertSchema(inventoryLocations).omit({
  id: true,
  createdAt: true,
});

export const insertStockLevelSchema = createInsertSchema(stockLevels).omit({
  id: true,
  lastUpdated: true,
});

export const insertStockTransactionSchema = createInsertSchema(stockTransactions).omit({
  id: true,
  transactionDate: true,
});

// Define types
export type NominalCode = typeof nominalCodes.$inferSelect;
export type InsertNominalCode = z.infer<typeof insertNominalCodeSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;

export type InventoryLocation = typeof inventoryLocations.$inferSelect;
export type InsertInventoryLocation = z.infer<typeof insertInventoryLocationSchema>;

export type StockLevel = typeof stockLevels.$inferSelect;
export type InsertStockLevel = z.infer<typeof insertStockLevelSchema>;

export type StockTransaction = typeof stockTransactions.$inferSelect;
export type InsertStockTransaction = z.infer<typeof insertStockTransactionSchema>;

// Equipment Hire System

// Equipment categories for classification
export const equipmentCategories = pgTable("equipment_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  code: text("code").notNull().unique(), // Short code for quick reference
  createdAt: timestamp("created_at").defaultNow(),
});

// Equipment master table
export const equipmentItems = pgTable("equipment_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => equipmentCategories.id),
  assetTag: text("asset_tag").unique(), // Company asset tag if owned
  name: text("name").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  serialNumber: text("serial_number").unique(),
  description: text("description"),
  ownedStatus: text("owned_status", { enum: ["owned", "hired", "leased"] }).notNull(),
  purchaseDate: date("purchase_date"),
  purchasePrice: real("purchase_price"),
  supplierRef: integer("supplier_ref").references(() => suppliers.id),
  status: text("status", { 
    enum: ["available", "on-hire", "under-repair", "off-hired", "disposed"] 
  }).notNull().default("available"),
  lastMaintenanceDate: date("last_maintenance_date"),
  nextMaintenanceDate: date("next_maintenance_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

// Equipment Hire Records
export const equipmentHires = pgTable("equipment_hires", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").notNull().references(() => equipmentItems.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  poId: integer("po_id").references(() => purchaseOrders.id),
  supplierRef: integer("supplier_ref").references(() => suppliers.id),
  hireReference: text("hire_reference").notNull(), // Supplier's reference number
  startDate: date("start_date").notNull(),
  expectedEndDate: date("expected_end_date").notNull(),
  actualEndDate: date("actual_end_date"),
  hireRate: real("hire_rate").notNull(),
  rateFrequency: text("rate_frequency", { 
    enum: ["daily", "weekly", "monthly"] 
  }).notNull().default("weekly"),
  status: text("status", { 
    enum: ["scheduled", "on-hire", "extended", "off-hire-requested", "returned", "disputed"] 
  }).notNull().default("scheduled"),
  requestedById: integer("requested_by_id").notNull().references(() => users.id),
  programmeActivityId: integer("programme_activity_id").references(() => programmeActivities.id),
  deliveryAddress: text("delivery_address"),
  deliveryContact: text("delivery_contact"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Off-Hire Requests
export const offHireRequests = pgTable("off_hire_requests", {
  id: serial("id").primaryKey(),
  hireId: integer("hire_id").notNull().references(() => equipmentHires.id),
  reference: text("reference").notNull(), // Off-hire reference number (for tracking)
  requestDate: timestamp("request_date").notNull().defaultNow(),
  requestedEndDate: date("requested_end_date").notNull(),
  actualEndDate: date("actual_end_date"),
  status: text("status", { 
    enum: ["pending", "sent", "confirmed", "disputed", "completed", "cancelled"] 
  }).notNull().default("pending"),
  requestedById: integer("requested_by_id").notNull().references(() => users.id),
  confirmationNumber: text("confirmation_number"),
  confirmationDate: timestamp("confirmation_date"),
  pickupAddress: text("pickup_address"),
  pickupContact: text("pickup_contact"),
  notes: text("notes"),
  // For mobile scanning
  qrCode: text("qr_code").unique(),
  barcode: text("barcode"),
  scanDate: timestamp("scan_date"),
  scanLocation: text("scan_location"),
  scanLatitude: text("scan_latitude"),
  scanLongitude: text("scan_longitude"),
  scanById: integer("scan_by_id").references(() => users.id),
  images: jsonb("images"), // URLs to any photos taken during scan/return process
  confirmedById: integer("confirmed_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Confirmation tokens for supplier email confirmations
export const offHireConfirmations = pgTable("off_hire_confirmations", {
  id: serial("id").primaryKey(),
  offHireRequestId: integer("off_hire_request_id").notNull().references(() => offHireRequests.id),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  used: boolean("used").notNull().default(false),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Hire Notifications
export const hireNotifications = pgTable("hire_notifications", {
  id: serial("id").primaryKey(),
  hireId: integer("hire_id").notNull().references(() => equipmentHires.id),
  offHireRequestId: integer("off_hire_request_id").references(() => offHireRequests.id),
  type: text("type", { 
    enum: ["hire-confirmation", "due-soon", "overdue", "off-hire-request", "return-confirmation"] 
  }).notNull(),
  message: text("message").notNull(),
  sentDate: timestamp("sent_date").notNull().defaultNow(),
  sentTo: text("sent_to").notNull(), // Email or other contact info
  sentById: integer("sent_by_id").references(() => users.id),
  status: text("status", { 
    enum: ["pending", "sent", "delivered", "read", "action-taken", "failed"] 
  }).notNull().default("pending"),
  escalationLevel: integer("escalation_level").default(0), // 0=normal, 1=manager, 2=director
  reminderCount: integer("reminder_count").default(0),
  lastReminderDate: timestamp("last_reminder_date"),
  responseDate: timestamp("response_date"),
  responseMessage: text("response_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const equipmentCategoryRelations = relations(equipmentCategories, ({ many }) => ({
  equipmentItems: many(equipmentItems),
}));

export const equipmentItemsRelations = relations(equipmentItems, ({ one, many }) => ({
  category: one(equipmentCategories, {
    fields: [equipmentItems.categoryId],
    references: [equipmentCategories.id],
  }),
  supplier: one(suppliers, {
    fields: [equipmentItems.supplierRef],
    references: [suppliers.id],
  }),
  hires: many(equipmentHires),
  createdByUser: one(users, {
    fields: [equipmentItems.createdBy],
    references: [users.id],
  }),
}));

export const equipmentHiresRelations = relations(equipmentHires, ({ one, many }) => ({
  equipment: one(equipmentItems, {
    fields: [equipmentHires.equipmentId],
    references: [equipmentItems.id],
  }),
  project: one(projects, {
    fields: [equipmentHires.projectId],
    references: [projects.id],
  }),
  purchaseOrder: one(purchaseOrders, {
    fields: [equipmentHires.poId],
    references: [purchaseOrders.id],
  }),
  supplier: one(suppliers, {
    fields: [equipmentHires.supplierRef],
    references: [suppliers.id],
  }),
  requestedBy: one(users, {
    fields: [equipmentHires.requestedById],
    references: [users.id],
  }),
  programmeActivity: one(programmeActivities, {
    fields: [equipmentHires.programmeActivityId],
    references: [programmeActivities.id],
  }),
  offHireRequests: many(offHireRequests),
  notifications: many(hireNotifications),
}));

export const offHireRequestsRelations = relations(offHireRequests, ({ one, many }) => ({
  hire: one(equipmentHires, {
    fields: [offHireRequests.hireId],
    references: [equipmentHires.id],
  }),
  requestedBy: one(users, {
    fields: [offHireRequests.requestedById],
    references: [users.id],
  }),
  scanBy: one(users, {
    fields: [offHireRequests.scanById],
    references: [users.id],
  }),
  confirmedBy: one(users, {
    fields: [offHireRequests.confirmedById],
    references: [users.id],
  }),
  notifications: many(hireNotifications),
}));

export const hireNotificationsRelations = relations(hireNotifications, ({ one }) => ({
  hire: one(equipmentHires, {
    fields: [hireNotifications.hireId],
    references: [equipmentHires.id],
  }),
  offHireRequest: one(offHireRequests, {
    fields: [hireNotifications.offHireRequestId],
    references: [offHireRequests.id],
  }),
  sentBy: one(users, {
    fields: [hireNotifications.sentById],
    references: [users.id],
  }),
}));

// Create insert schemas
export const insertEquipmentCategorySchema = createInsertSchema(equipmentCategories).omit({
  id: true,
  createdAt: true,
});

export const insertEquipmentItemSchema = createInsertSchema(equipmentItems).omit({
  id: true,
  createdAt: true,
});

export const insertEquipmentHireSchema = createInsertSchema(equipmentHires).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOffHireRequestSchema = createInsertSchema(offHireRequests).omit({
  id: true,
  requestDate: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOffHireConfirmationSchema = createInsertSchema(offHireConfirmations).omit({
  id: true,
  createdAt: true,
  used: true,
});

export const insertHireNotificationSchema = createInsertSchema(hireNotifications).omit({
  id: true,
  sentDate: true,
  createdAt: true,
});

// Define types
export type EquipmentCategory = typeof equipmentCategories.$inferSelect;
export type InsertEquipmentCategory = z.infer<typeof insertEquipmentCategorySchema>;

export type EquipmentItem = typeof equipmentItems.$inferSelect;
export type InsertEquipmentItem = z.infer<typeof insertEquipmentItemSchema>;

export type EquipmentHire = typeof equipmentHires.$inferSelect;
export type InsertEquipmentHire = z.infer<typeof insertEquipmentHireSchema>;

export type OffHireRequest = typeof offHireRequests.$inferSelect;
export type InsertOffHireRequest = z.infer<typeof insertOffHireRequestSchema>;

export type OffHireConfirmation = typeof offHireConfirmations.$inferSelect;
export type InsertOffHireConfirmation = z.infer<typeof insertOffHireConfirmationSchema>;

export type HireNotification = typeof hireNotifications.$inferSelect;
export type InsertHireNotification = z.infer<typeof insertHireNotificationSchema>;
