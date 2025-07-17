import {
  User, InsertUser, Project, InsertProject, CompensationEvent, InsertCompensationEvent,
  EarlyWarning, InsertEarlyWarning, NonConformanceReport, InsertNonConformanceReport,
  TechnicalQuery, InsertTechnicalQuery, ProgrammeMilestone, InsertProgrammeMilestone,
  PaymentCertificate, InsertPaymentCertificate, ChatMessage, InsertChatMessage,
  Programme, InsertProgramme, ProgrammeActivity, InsertProgrammeActivity,
  ActivityRelationship, InsertActivityRelationship, ProgrammeAnalysis, InsertProgrammeAnalysis,
  ProgrammeAnnotation, InsertProgrammeAnnotation, Nec4Team, InsertNec4Team, 
  Nec4TeamMember, InsertNec4TeamMember, UserToProject, InsertUserToProject,
  ProgressReport, InsertProgressReport,
  users, projects, compensationEvents, earlyWarnings, nonConformanceReports,
  technicalQueries, programmeMilestones, paymentCertificates, chatMessages,
  programmes, programmeActivities, activityRelationships, programmeAnalyses, programmeAnnotations,
  nec4Teams, nec4TeamMembers, usersToProjects, progressReports
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";
import { pool } from "./db";

export interface IStorage {
  // Session store for auth
  sessionStore: session.Store;
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project management
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Compensation Events
  getCompensationEvent(id: number): Promise<CompensationEvent | undefined>;
  getCompensationEventsByProject(projectId: number): Promise<CompensationEvent[]>;
  getCompensationEventsWithRelations(projectId: number): Promise<any[]>;
  createCompensationEvent(ce: InsertCompensationEvent): Promise<CompensationEvent>;
  updateCompensationEvent(id: number, ce: Partial<CompensationEvent>): Promise<CompensationEvent>;
  
  // Early Warnings
  getEarlyWarning(id: number): Promise<EarlyWarning | undefined>;
  getEarlyWarningsByProject(projectId: number): Promise<EarlyWarning[]>;
  getEarlyWarningsWithRelations(projectId: number): Promise<any[]>;
  createEarlyWarning(ew: InsertEarlyWarning): Promise<EarlyWarning>;
  updateEarlyWarning(id: number, ew: Partial<EarlyWarning>): Promise<EarlyWarning>;
  
  // Non-Conformance Reports
  getNonConformanceReport(id: number): Promise<NonConformanceReport | undefined>;
  getNonConformanceReportsByProject(projectId: number): Promise<NonConformanceReport[]>;
  createNonConformanceReport(ncr: InsertNonConformanceReport): Promise<NonConformanceReport>;
  updateNonConformanceReport(id: number, ncr: Partial<NonConformanceReport>): Promise<NonConformanceReport>;
  
  // Technical Queries
  getTechnicalQuery(id: number): Promise<TechnicalQuery | undefined>;
  getTechnicalQueriesByProject(projectId: number): Promise<TechnicalQuery[]>;
  createTechnicalQuery(tq: InsertTechnicalQuery): Promise<TechnicalQuery>;
  updateTechnicalQuery(id: number, tq: Partial<TechnicalQuery>): Promise<TechnicalQuery>;
  
  // Programme Milestones
  getProgrammeMilestone(id: number): Promise<ProgrammeMilestone | undefined>;
  getProgrammeMilestonesByProject(projectId: number): Promise<ProgrammeMilestone[]>;
  createProgrammeMilestone(milestone: InsertProgrammeMilestone): Promise<ProgrammeMilestone>;
  updateProgrammeMilestone(id: number, milestone: Partial<ProgrammeMilestone>): Promise<ProgrammeMilestone>;
  
  // Payment Certificates
  getPaymentCertificate(id: number): Promise<PaymentCertificate | undefined>;
  getPaymentCertificatesByProject(projectId: number): Promise<PaymentCertificate[]>;
  createPaymentCertificate(certificate: InsertPaymentCertificate): Promise<PaymentCertificate>;
  updatePaymentCertificate(id: number, certificate: Partial<PaymentCertificate>): Promise<PaymentCertificate>;
  
  // Chat Messages
  getChatMessagesByProject(projectId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Programme Management
  getProgramme(id: number): Promise<Programme | undefined>;
  getProgrammesByProject(projectId: number): Promise<Programme[]>;
  getAllProgrammes(filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Programme[]>;
  getProgrammesByProjects(projectIds: number[], filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Programme[]>;
  createProgramme(programme: InsertProgramme): Promise<Programme>;
  updateProgramme(id: number, programme: Partial<Programme>): Promise<Programme>;
  
  // Programme Activities
  getProgrammeActivity(id: number): Promise<ProgrammeActivity | undefined>;
  getProgrammeActivitiesByProgramme(programmeId: number): Promise<ProgrammeActivity[]>;
  getProgrammeActivities(projectId: number): Promise<ProgrammeActivity[]>;
  createProgrammeActivity(activity: InsertProgrammeActivity): Promise<ProgrammeActivity>;
  updateProgrammeActivity(id: number, activity: Partial<ProgrammeActivity>): Promise<ProgrammeActivity>;
  
  // Activity Relationships
  getActivityRelationship(id: number): Promise<ActivityRelationship | undefined>;
  getActivityRelationshipsByProgramme(programmeId: number): Promise<ActivityRelationship[]>;
  createActivityRelationship(relationship: InsertActivityRelationship): Promise<ActivityRelationship>;
  
  // Programme Analyses
  getProgrammeAnalysis(id: number): Promise<ProgrammeAnalysis | undefined>;
  getProgrammeAnalysesByProgramme(programmeId: number): Promise<ProgrammeAnalysis[]>;
  createProgrammeAnalysis(analysis: InsertProgrammeAnalysis): Promise<ProgrammeAnalysis>;
  
  // Programme Annotations
  getProgrammeAnnotation(id: number): Promise<ProgrammeAnnotation | undefined>;
  getProgrammeAnnotationsByProgramme(programmeId: number): Promise<ProgrammeAnnotation[]>;
  createProgrammeAnnotation(annotation: InsertProgrammeAnnotation): Promise<ProgrammeAnnotation>;
  updateProgrammeAnnotation(id: number, annotation: Partial<ProgrammeAnnotation>): Promise<ProgrammeAnnotation>;
  deleteProgrammeAnnotation(id: number): Promise<void>;
  
  // NEC4 Teams
  getNec4Team(id: number): Promise<Nec4Team | undefined>;
  getNec4TeamsByProject(projectId: number): Promise<Nec4Team[]>;
  createNec4Team(team: InsertNec4Team): Promise<Nec4Team>;
  updateNec4Team(id: number, team: Partial<Nec4Team>): Promise<Nec4Team>;
  deleteNec4Team(id: number): Promise<void>;
  
  // NEC4 Team Members
  getNec4TeamMember(id: number): Promise<Nec4TeamMember | undefined>;
  getNec4TeamMembersByTeam(teamId: number): Promise<Nec4TeamMember[]>;
  getNec4TeamMembersByUser(userId: number): Promise<Nec4TeamMember[]>;
  createNec4TeamMember(member: InsertNec4TeamMember): Promise<Nec4TeamMember>;
  updateNec4TeamMember(id: number, member: Partial<Nec4TeamMember>): Promise<Nec4TeamMember>;
  deleteNec4TeamMember(id: number): Promise<void>;
  
  // User Project Assignments
  getUserProjectAssignment(id: number): Promise<UserToProject | undefined>;
  getUserProjectAssignments(userId: number): Promise<UserToProject[]>;
  getProjectUserAssignments(projectId: number): Promise<UserToProject[]>;
  createUserProjectAssignment(assignment: InsertUserToProject): Promise<UserToProject>;
  deleteUserProjectAssignment(id: number): Promise<void>;

  // Progress Reports
  getProgressReport(id: number): Promise<ProgressReport | undefined>;
  getProgressReportsByProject(projectId: number): Promise<ProgressReport[]>;
  createProgressReport(report: InsertProgressReport): Promise<ProgressReport>;
  updateProgressReport(id: number, report: Partial<ProgressReport>): Promise<ProgressReport>;
  deleteProgressReport(id: number): Promise<void>;
  
  // Resource Allocations
  getResourceAllocationsByProject(projectId: number): Promise<any[]>;
  createResourceAllocation(allocation: any): Promise<any>;
  
  // Equipment Hire
  createEquipmentHire(hire: any): Promise<any>;
  
  // RFI
  createRfi(rfi: any): Promise<any>;
  
  // Agent Activity Logging
  logAgentActivity(activity: {
    agentType: string;
    action: string;
    projectId: number | null;
    details: string;
    userId?: number | null;
  }): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private compensationEvents: Map<number, CompensationEvent>;
  private earlyWarnings: Map<number, EarlyWarning>;
  private nonConformanceReports: Map<number, NonConformanceReport>;
  private technicalQueries: Map<number, TechnicalQuery>;
  private programmeMilestones: Map<number, ProgrammeMilestone>;
  private paymentCertificates: Map<number, PaymentCertificate>;
  private chatMessages: Map<number, ChatMessage>;
  
  // Session store
  sessionStore: session.Store;
  
  private userCurrentId = 1;
  private projectCurrentId = 1;
  private ceCurrentId = 1;
  private ewCurrentId = 1;
  private ncrCurrentId = 1;
  private tqCurrentId = 1;
  private msCurrentId = 1;
  private pcCurrentId = 1;
  private cmCurrentId = 1;
  
  constructor() {
    // Initialize memory session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    this.users = new Map();
    this.projects = new Map();
    this.compensationEvents = new Map();
    this.earlyWarnings = new Map();
    this.nonConformanceReports = new Map();
    this.technicalQueries = new Map();
    this.programmeMilestones = new Map();
    this.paymentCertificates = new Map();
    this.chatMessages = new Map();
    
    // Initialize with demo data
    this.initializeDemoData();
  }

  // Initialize demo data
  private initializeDemoData() {
    // Create a demo user
    const user: User = {
      id: this.userCurrentId++,
      username: "jane.cooper",
      password: "password123",
      fullName: "Jane Cooper",
      role: "Principal Contractor",
      email: "jane.cooper@example.com",
      avatarInitials: "JC"
    };
    this.users.set(user.id, user);

    // Create demo projects
    const project1: Project = {
      id: this.projectCurrentId++,
      name: "Westfield Development Project",
      contractReference: "NEC4-2020-1234",
      clientName: "Westfield Corp",
      startDate: new Date("2023-04-10"),
      endDate: new Date("2023-12-15")
    };
    this.projects.set(project1.id, project1);

    const project2: Project = {
      id: this.projectCurrentId++,
      name: "Northern Gateway Interchange",
      contractReference: "NEC4-2025-002",
      clientName: "National Infrastructure Agency",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2025-08-30")
    };
    this.projects.set(project2.id, project2);

    // Create demo compensation events for Westfield Development Project
    this.createCompensationEvent({
      projectId: project1.id,
      reference: "CE-042",
      title: "Additional groundworks following site survey",
      description: "Excavation revealed unexpected rock formation requiring additional equipment and time",
      clauseReference: "60.1(12)",
      estimatedValue: 18500,
      actualValue: null,
      status: "Quotation Due",
      raisedBy: user.id,
      raisedAt: new Date("2023-05-31"),
      responseDeadline: new Date("2023-06-14"),
      implementedDate: null,
      attachments: null
    });

    this.createCompensationEvent({
      projectId: project1.id,
      reference: "CE-041",
      title: "Design change to east elevation glazing",
      description: "Client requested specification upgrade to high-performance glazing",
      clauseReference: "60.1(1)",
      estimatedValue: 42750,
      actualValue: 42750,
      status: "Implemented",
      raisedBy: user.id,
      raisedAt: new Date("2023-05-15"),
      responseDeadline: new Date("2023-05-29"),
      implementedDate: new Date("2023-06-05"),
      attachments: null
    });

    // Create demo compensation events for Northern Gateway Interchange
    this.createCompensationEvent({
      projectId: project2.id,
      reference: "CE-NGI-003",
      title: "Additional environmental monitoring requirements",
      description: "Environmental agency requested enhanced monitoring during construction near protected wetlands",
      clauseReference: "60.1(7)",
      estimatedValue: 28000,
      actualValue: null,
      status: "Assessment Due",
      raisedBy: user.id,
      raisedAt: new Date("2024-03-15"),
      responseDeadline: new Date("2024-03-29"),
      implementedDate: null,
      attachments: null
    });

    this.createCompensationEvent({
      projectId: project2.id,
      reference: "CE-NGI-002",
      title: "Traffic management system upgrade",
      description: "Local authority required enhanced traffic control systems during peak construction",
      clauseReference: "60.1(1)",
      estimatedValue: 85000,
      actualValue: 82500,
      status: "Implemented",
      raisedBy: user.id,
      raisedAt: new Date("2024-02-20"),
      responseDeadline: new Date("2024-03-05"),
      implementedDate: new Date("2024-03-18"),
      attachments: null
    });

    this.createCompensationEvent({
      projectId: project1.id,
      reference: "CE-040",
      title: "Delay due to archaeological findings",
      description: "Historical artifacts discovered during excavation requiring archaeological survey",
      clauseReference: "60.1(19)",
      estimatedValue: 24300,
      actualValue: 24300,
      status: "Accepted",
      raisedBy: user.id,
      raisedAt: new Date("2023-05-01"),
      responseDeadline: new Date("2023-05-15"),
      implementedDate: new Date("2023-05-22"),
      attachments: null
    });

    // Create demo early warnings for Westfield Development Project
    this.createEarlyWarning({
      projectId: project1.id,
      reference: "EW-018",
      description: "Potential delay in steel delivery from supplier",
      ownerId: user.id,
      status: "Open",
      raisedBy: user.id,
      raisedAt: new Date("2023-06-02"),
      mitigationPlan: "Contact alternative suppliers and review project schedule",
      meetingDate: new Date("2023-06-09"),
      attachments: null
    });

    this.createEarlyWarning({
      projectId: project1.id,
      reference: "EW-017",
      description: "Weather forecast indicates potential flooding risk",
      ownerId: user.id,
      status: "Mitigated",
      raisedBy: user.id,
      raisedAt: new Date("2023-05-28"),
      mitigationPlan: "Install temporary drainage and secure loose materials",
      meetingDate: new Date("2023-06-01"),
      attachments: null
    });

    this.createEarlyWarning({
      projectId: project1.id,
      reference: "EW-016",
      description: "Potential utility clash at southwest corner",
      ownerId: user.id,
      status: "Open",
      raisedBy: user.id,
      raisedAt: new Date("2023-05-15"),
      mitigationPlan: "Survey underground utilities and revise foundation plan",
      meetingDate: new Date("2023-05-22"),
      attachments: null
    });

    // Create demo non-conformance reports
    this.createNonConformanceReport({
      projectId: project1.id,
      reference: "NCR-008",
      description: "Concrete mix does not meet specification",
      location: "Block A Foundation",
      raisedBy: user.id,
      raisedAt: new Date("2023-05-25"),
      status: "Open",
      correctiveAction: null,
      assignedTo: user.id,
      closedDate: null,
      attachments: null
    });

    // Create demo programme milestones
    this.createProgrammeMilestone({
      projectId: project1.id,
      name: "Project Start",
      plannedDate: new Date("2023-04-10"),
      actualDate: new Date("2023-04-10"),
      status: "Completed",
      delayReason: null,
      delayDays: null
    });

    this.createProgrammeMilestone({
      projectId: project1.id,
      name: "Foundations",
      plannedDate: new Date("2023-05-15"),
      actualDate: new Date("2023-05-15"),
      status: "Completed",
      delayReason: null,
      delayDays: null
    });

    this.createProgrammeMilestone({
      projectId: project1.id,
      name: "Structure",
      plannedDate: new Date("2023-07-20"),
      actualDate: null,
      status: "In Progress",
      delayReason: null,
      delayDays: null
    });

    this.createProgrammeMilestone({
      projectId: project1.id,
      name: "Services",
      plannedDate: new Date("2023-09-05"),
      actualDate: null,
      status: "Not Started",
      delayReason: "CE Delay",
      delayDays: 14
    });

    this.createProgrammeMilestone({
      projectId: project1.id,
      name: "Completion",
      plannedDate: new Date("2023-12-15"),
      actualDate: null,
      status: "Not Started",
      delayReason: "CE Delay",
      delayDays: 14
    });

    // Create demo payment certificate
    this.createPaymentCertificate({
      projectId: project1.id,
      reference: "PC-003",
      amount: 234500,
      dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: "Draft",
      submittedBy: null,
      submittedAt: null,
      certifiedBy: null,
      certifiedAt: null,
      attachments: null
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectCurrentId++;
    const project: Project = { ...insertProject, id };
    this.projects.set(id, project);
    return project;
  }

  // Compensation Events methods
  async getCompensationEvent(id: number): Promise<CompensationEvent | undefined> {
    return this.compensationEvents.get(id);
  }

  async getCompensationEventsByProject(projectId: number): Promise<CompensationEvent[]> {
    return Array.from(this.compensationEvents.values()).filter(
      (ce) => ce.projectId === projectId
    );
  }

  // Optimized method with eager loading for related data
  async getCompensationEventsWithRelations(projectId: number): Promise<any[]> {
    const compensationEvents = Array.from(this.compensationEvents.values()).filter(
      (ce) => ce.projectId === projectId
    );
    
    // Batch load related users to avoid N+1 queries
    const userIds = Array.from(new Set(compensationEvents.map(ce => ce.raisedBy)));
    const users = Array.from(this.users.values()).filter(user => userIds.includes(user.id));
    const userMap = new Map(users.map(user => [user.id, user]));
    
    // Get project data
    const project = this.projects.get(projectId);
    
    return compensationEvents.map(ce => ({
      compensationEvent: ce,
      raisedByUser: userMap.get(ce.raisedBy),
      project: project
    }));
  }

  async createCompensationEvent(insertCE: InsertCompensationEvent): Promise<CompensationEvent> {
    const id = this.ceCurrentId++;
    const ce: CompensationEvent = { ...insertCE, id };
    this.compensationEvents.set(id, ce);
    return ce;
  }

  async updateCompensationEvent(id: number, ce: Partial<CompensationEvent>): Promise<CompensationEvent> {
    const existing = this.compensationEvents.get(id);
    if (!existing) {
      throw new Error(`Compensation Event with id ${id} not found`);
    }
    const updated = { ...existing, ...ce };
    this.compensationEvents.set(id, updated);
    return updated;
  }

  // Early Warnings methods
  async getEarlyWarning(id: number): Promise<EarlyWarning | undefined> {
    return this.earlyWarnings.get(id);
  }

  async getEarlyWarningsByProject(projectId: number): Promise<EarlyWarning[]> {
    return Array.from(this.earlyWarnings.values()).filter(
      (ew) => ew.projectId === projectId
    );
  }

  // Optimized method with eager loading for early warnings
  async getEarlyWarningsWithRelations(projectId: number): Promise<any[]> {
    const earlyWarnings = Array.from(this.earlyWarnings.values()).filter(
      (ew) => ew.projectId === projectId
    );
    
    // Batch load related users and owners to avoid N+1 queries
    const userIds = Array.from(new Set([
      ...earlyWarnings.map(ew => ew.raisedBy),
      ...earlyWarnings.map(ew => ew.ownerId)
    ]));
    const users = Array.from(this.users.values()).filter(user => userIds.includes(user.id));
    const userMap = new Map(users.map(user => [user.id, user]));
    
    // Get project data
    const project = this.projects.get(projectId);
    
    return earlyWarnings.map(ew => ({
      earlyWarning: ew,
      raisedByUser: userMap.get(ew.raisedBy),
      ownerUser: userMap.get(ew.ownerId),
      project: project
    }));
  }

  async createEarlyWarning(insertEW: InsertEarlyWarning): Promise<EarlyWarning> {
    const id = this.ewCurrentId++;
    const ew: EarlyWarning = { ...insertEW, id };
    this.earlyWarnings.set(id, ew);
    return ew;
  }

  async updateEarlyWarning(id: number, ew: Partial<EarlyWarning>): Promise<EarlyWarning> {
    const existing = this.earlyWarnings.get(id);
    if (!existing) {
      throw new Error(`Early Warning with id ${id} not found`);
    }
    const updated = { ...existing, ...ew };
    this.earlyWarnings.set(id, updated);
    return updated;
  }

  // Non-Conformance Reports methods
  async getNonConformanceReport(id: number): Promise<NonConformanceReport | undefined> {
    return this.nonConformanceReports.get(id);
  }

  async getNonConformanceReportsByProject(projectId: number): Promise<NonConformanceReport[]> {
    return Array.from(this.nonConformanceReports.values()).filter(
      (ncr) => ncr.projectId === projectId
    );
  }

  async createNonConformanceReport(insertNCR: InsertNonConformanceReport): Promise<NonConformanceReport> {
    const id = this.ncrCurrentId++;
    const ncr: NonConformanceReport = { ...insertNCR, id };
    this.nonConformanceReports.set(id, ncr);
    return ncr;
  }

  async updateNonConformanceReport(id: number, ncr: Partial<NonConformanceReport>): Promise<NonConformanceReport> {
    const existing = this.nonConformanceReports.get(id);
    if (!existing) {
      throw new Error(`Non-Conformance Report with id ${id} not found`);
    }
    const updated = { ...existing, ...ncr };
    this.nonConformanceReports.set(id, updated);
    return updated;
  }

  // Technical Queries methods
  async getTechnicalQuery(id: number): Promise<TechnicalQuery | undefined> {
    return this.technicalQueries.get(id);
  }

  async getTechnicalQueriesByProject(projectId: number): Promise<TechnicalQuery[]> {
    return Array.from(this.technicalQueries.values()).filter(
      (tq) => tq.projectId === projectId
    );
  }

  async createTechnicalQuery(insertTQ: InsertTechnicalQuery): Promise<TechnicalQuery> {
    const id = this.tqCurrentId++;
    const tq: TechnicalQuery = { ...insertTQ, id };
    this.technicalQueries.set(id, tq);
    return tq;
  }

  async updateTechnicalQuery(id: number, tq: Partial<TechnicalQuery>): Promise<TechnicalQuery> {
    const existing = this.technicalQueries.get(id);
    if (!existing) {
      throw new Error(`Technical Query with id ${id} not found`);
    }
    const updated = { ...existing, ...tq };
    this.technicalQueries.set(id, updated);
    return updated;
  }

  // Programme Milestones methods
  async getProgrammeMilestone(id: number): Promise<ProgrammeMilestone | undefined> {
    return this.programmeMilestones.get(id);
  }

  async getProgrammeMilestonesByProject(projectId: number): Promise<ProgrammeMilestone[]> {
    return Array.from(this.programmeMilestones.values()).filter(
      (ms) => ms.projectId === projectId
    );
  }

  async createProgrammeMilestone(insertMS: InsertProgrammeMilestone): Promise<ProgrammeMilestone> {
    const id = this.msCurrentId++;
    const ms: ProgrammeMilestone = { ...insertMS, id };
    this.programmeMilestones.set(id, ms);
    return ms;
  }

  async updateProgrammeMilestone(id: number, ms: Partial<ProgrammeMilestone>): Promise<ProgrammeMilestone> {
    const existing = this.programmeMilestones.get(id);
    if (!existing) {
      throw new Error(`Programme Milestone with id ${id} not found`);
    }
    const updated = { ...existing, ...ms };
    this.programmeMilestones.set(id, updated);
    return updated;
  }

  // Payment Certificates methods
  async getPaymentCertificate(id: number): Promise<PaymentCertificate | undefined> {
    return this.paymentCertificates.get(id);
  }

  async getPaymentCertificatesByProject(projectId: number): Promise<PaymentCertificate[]> {
    return Array.from(this.paymentCertificates.values()).filter(
      (pc) => pc.projectId === projectId
    );
  }

  async createPaymentCertificate(insertPC: InsertPaymentCertificate): Promise<PaymentCertificate> {
    const id = this.pcCurrentId++;
    const pc: PaymentCertificate = { ...insertPC, id };
    this.paymentCertificates.set(id, pc);
    return pc;
  }

  async updatePaymentCertificate(id: number, pc: Partial<PaymentCertificate>): Promise<PaymentCertificate> {
    const existing = this.paymentCertificates.get(id);
    if (!existing) {
      throw new Error(`Payment Certificate with id ${id} not found`);
    }
    const updated = { ...existing, ...pc };
    this.paymentCertificates.set(id, updated);
    return updated;
  }

  // Chat Messages methods
  async getChatMessagesByProject(projectId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(
      (cm) => cm.projectId === projectId
    );
  }

  async createChatMessage(insertCM: InsertChatMessage): Promise<ChatMessage> {
    const id = this.cmCurrentId++;
    const cm: ChatMessage = { ...insertCM, id };
    this.chatMessages.set(id, cm);
    return cm;
  }
}

export class DatabaseStorage implements IStorage {
  // Session store
  sessionStore: session.Store;
  
  constructor() {
    // Initialize PostgreSQL session store with robust configuration
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session',
      // Add these parameters for more reliable session storage
      pruneSessionInterval: 60, // Prune invalid sessions every 60 seconds
      errorLog: console.error, // Log any session store errors
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: false // Set to true in production with proper certificates
      }
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }
  
  // Compensation Events methods
  async getCompensationEvent(id: number): Promise<CompensationEvent | undefined> {
    const [ce] = await db.select().from(compensationEvents).where(eq(compensationEvents.id, id));
    return ce || undefined;
  }

  async getCompensationEventsByProject(projectId: number): Promise<CompensationEvent[]> {
    return await db
      .select()
      .from(compensationEvents)
      .where(eq(compensationEvents.projectId, projectId));
  }

  async createCompensationEvent(ce: InsertCompensationEvent): Promise<CompensationEvent> {
    const [event] = await db
      .insert(compensationEvents)
      .values(ce)
      .returning();
    return event;
  }

  // Batch operations for compensation events - optimized for bulk inserts
  async createMultipleCompensationEvents(events: InsertCompensationEvent[]): Promise<CompensationEvent[]> {
    if (events.length === 0) return [];
    
    // Single optimized query instead of N individual queries
    return await db
      .insert(compensationEvents)
      .values(events)
      .returning();
  }

  async updateCompensationEvent(id: number, ce: Partial<CompensationEvent>): Promise<CompensationEvent> {
    const [updated] = await db
      .update(compensationEvents)
      .set(ce)
      .where(eq(compensationEvents.id, id))
      .returning();
      
    if (!updated) {
      throw new Error(`Compensation Event with id ${id} not found`);
    }
    
    return updated;
  }
  
  // Early Warnings methods
  async getEarlyWarning(id: number): Promise<EarlyWarning | undefined> {
    const [ew] = await db.select().from(earlyWarnings).where(eq(earlyWarnings.id, id));
    return ew || undefined;
  }

  async getEarlyWarningsByProject(projectId: number): Promise<EarlyWarning[]> {
    return await db
      .select()
      .from(earlyWarnings)
      .where(eq(earlyWarnings.projectId, projectId));
  }

  async createEarlyWarning(ew: InsertEarlyWarning): Promise<EarlyWarning> {
    const [warning] = await db
      .insert(earlyWarnings)
      .values(ew)
      .returning();
    return warning;
  }

  // Batch operations for early warnings - optimized for bulk inserts
  async createMultipleEarlyWarnings(warnings: InsertEarlyWarning[]): Promise<EarlyWarning[]> {
    if (warnings.length === 0) return [];
    
    // Single optimized query instead of N individual queries
    return await db
      .insert(earlyWarnings)
      .values(warnings)
      .returning();
  }

  async updateEarlyWarning(id: number, ew: Partial<EarlyWarning>): Promise<EarlyWarning> {
    const [updated] = await db
      .update(earlyWarnings)
      .set(ew)
      .where(eq(earlyWarnings.id, id))
      .returning();
      
    if (!updated) {
      throw new Error(`Early Warning with id ${id} not found`);
    }
    
    return updated;
  }
  
  // Non-Conformance Reports methods
  async getNonConformanceReport(id: number): Promise<NonConformanceReport | undefined> {
    const [ncr] = await db.select().from(nonConformanceReports).where(eq(nonConformanceReports.id, id));
    return ncr || undefined;
  }

  async getNonConformanceReportsByProject(projectId: number): Promise<NonConformanceReport[]> {
    return await db
      .select()
      .from(nonConformanceReports)
      .where(eq(nonConformanceReports.projectId, projectId));
  }

  async createNonConformanceReport(ncr: InsertNonConformanceReport): Promise<NonConformanceReport> {
    const [report] = await db
      .insert(nonConformanceReports)
      .values(ncr)
      .returning();
    return report;
  }

  // Batch operations for non-conformance reports - optimized for bulk inserts
  async createMultipleNonConformanceReports(reports: InsertNonConformanceReport[]): Promise<NonConformanceReport[]> {
    if (reports.length === 0) return [];
    
    return await db
      .insert(nonConformanceReports)
      .values(reports)
      .returning();
  }

  async updateNonConformanceReport(id: number, ncr: Partial<NonConformanceReport>): Promise<NonConformanceReport> {
    const [updated] = await db
      .update(nonConformanceReports)
      .set(ncr)
      .where(eq(nonConformanceReports.id, id))
      .returning();
      
    if (!updated) {
      throw new Error(`Non-Conformance Report with id ${id} not found`);
    }
    
    return updated;
  }
  
  // Technical Queries methods
  async getTechnicalQuery(id: number): Promise<TechnicalQuery | undefined> {
    const [tq] = await db.select().from(technicalQueries).where(eq(technicalQueries.id, id));
    return tq || undefined;
  }

  async getTechnicalQueriesByProject(projectId: number): Promise<TechnicalQuery[]> {
    return await db
      .select()
      .from(technicalQueries)
      .where(eq(technicalQueries.projectId, projectId));
  }

  async createTechnicalQuery(tq: InsertTechnicalQuery): Promise<TechnicalQuery> {
    const [query] = await db
      .insert(technicalQueries)
      .values(tq)
      .returning();
    return query;
  }

  async updateTechnicalQuery(id: number, tq: Partial<TechnicalQuery>): Promise<TechnicalQuery> {
    const [updated] = await db
      .update(technicalQueries)
      .set(tq)
      .where(eq(technicalQueries.id, id))
      .returning();
      
    if (!updated) {
      throw new Error(`Technical Query with id ${id} not found`);
    }
    
    return updated;
  }
  
  // Programme Milestones methods
  async getProgrammeMilestone(id: number): Promise<ProgrammeMilestone | undefined> {
    const [ms] = await db.select().from(programmeMilestones).where(eq(programmeMilestones.id, id));
    return ms || undefined;
  }

  async getProgrammeMilestonesByProject(projectId: number): Promise<ProgrammeMilestone[]> {
    return await db
      .select()
      .from(programmeMilestones)
      .where(eq(programmeMilestones.projectId, projectId));
  }

  async createProgrammeMilestone(milestone: InsertProgrammeMilestone): Promise<ProgrammeMilestone> {
    const [ms] = await db
      .insert(programmeMilestones)
      .values(milestone)
      .returning();
    return ms;
  }

  async updateProgrammeMilestone(id: number, milestone: Partial<ProgrammeMilestone>): Promise<ProgrammeMilestone> {
    const [updated] = await db
      .update(programmeMilestones)
      .set(milestone)
      .where(eq(programmeMilestones.id, id))
      .returning();
      
    if (!updated) {
      throw new Error(`Programme Milestone with id ${id} not found`);
    }
    
    return updated;
  }
  
  // Payment Certificates methods
  async getPaymentCertificate(id: number): Promise<PaymentCertificate | undefined> {
    const [pc] = await db.select().from(paymentCertificates).where(eq(paymentCertificates.id, id));
    return pc || undefined;
  }

  async getPaymentCertificatesByProject(projectId: number): Promise<PaymentCertificate[]> {
    return await db
      .select()
      .from(paymentCertificates)
      .where(eq(paymentCertificates.projectId, projectId));
  }

  async createPaymentCertificate(certificate: InsertPaymentCertificate): Promise<PaymentCertificate> {
    const [pc] = await db
      .insert(paymentCertificates)
      .values(certificate)
      .returning();
    return pc;
  }

  async updatePaymentCertificate(id: number, certificate: Partial<PaymentCertificate>): Promise<PaymentCertificate> {
    const [updated] = await db
      .update(paymentCertificates)
      .set(certificate)
      .where(eq(paymentCertificates.id, id))
      .returning();
      
    if (!updated) {
      throw new Error(`Payment Certificate with id ${id} not found`);
    }
    
    return updated;
  }
  
  // Chat Messages methods
  async getChatMessagesByProject(projectId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.projectId, projectId));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [msg] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return msg;
  }

  // Programme Management methods
  async getProgramme(id: number): Promise<Programme | undefined> {
    const [programme] = await db
      .select()
      .from(programmes)
      .where(eq(programmes.id, id));
    return programme;
  }

  async getProgrammesByProject(projectId: number): Promise<Programme[]> {
    return db
      .select()
      .from(programmes)
      .where(eq(programmes.projectId, projectId));
  }
  
  async getAllProgrammes(filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Programme[]> {
    let query = db.select().from(programmes);
    
    if (filters) {
      if (filters.status) {
        query = query.where(eq(programmes.status, filters.status));
      }
      
      if (filters.startDate) {
        query = query.where(
          // Programmes with submission date after the filter start date
          programmes.submissionDate >= filters.startDate
        );
      }
      
      if (filters.endDate) {
        query = query.where(
          // Programmes with planned completion date before the filter end date
          programmes.plannedCompletionDate <= filters.endDate
        );
      }
    }
    
    return query;
  }
  
  async getProgrammesByProjects(projectIds: number[], filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Programme[]> {
    if (!projectIds.length) {
      return [];
    }
    
    let query = db
      .select()
      .from(programmes)
      .where(
        // Use in operator to check if projectId is in the provided projectIds array
        inArray(programmes.projectId, projectIds)
      );
    
    if (filters) {
      if (filters.status) {
        query = query.where(eq(programmes.status, filters.status));
      }
      
      if (filters.startDate) {
        query = query.where(
          // Programmes with submission date after the filter start date
          programmes.submissionDate >= filters.startDate
        );
      }
      
      if (filters.endDate) {
        query = query.where(
          // Programmes with planned completion date before the filter end date
          programmes.plannedCompletionDate <= filters.endDate
        );
      }
    }
    
    return query;
  }

  async createProgramme(programme: InsertProgramme): Promise<Programme> {
    const [newProgramme] = await db
      .insert(programmes)
      .values(programme)
      .returning();
    return newProgramme;
  }

  async updateProgramme(id: number, programme: Partial<Programme>): Promise<Programme> {
    const [updatedProgramme] = await db
      .update(programmes)
      .set(programme)
      .where(eq(programmes.id, id))
      .returning();
    
    if (!updatedProgramme) {
      throw new Error(`Programme with ID ${id} not found`);
    }
    
    return updatedProgramme;
  }

  // Programme Activities methods
  async getProgrammeActivity(id: number): Promise<ProgrammeActivity | undefined> {
    const [activity] = await db
      .select()
      .from(programmeActivities)
      .where(eq(programmeActivities.id, id));
    return activity;
  }

  async getProgrammeActivitiesByProgramme(programmeId: number): Promise<ProgrammeActivity[]> {
    return db
      .select()
      .from(programmeActivities)
      .where(eq(programmeActivities.programmeId, programmeId));
  }

  async getProgrammeActivities(projectId: number): Promise<ProgrammeActivity[]> {
    // Get all programmes for the project first
    const projectProgrammes = await this.getProgrammesByProject(projectId);
    
    if (projectProgrammes.length === 0) {
      return [];
    }
    
    // Get activities from all programmes for this project
    const programmeIds = projectProgrammes.map(p => p.id);
    return db
      .select()
      .from(programmeActivities)
      .where(inArray(programmeActivities.programmeId, programmeIds));
  }

  async createProgrammeActivity(activity: InsertProgrammeActivity): Promise<ProgrammeActivity> {
    const [newActivity] = await db
      .insert(programmeActivities)
      .values(activity)
      .returning();
    return newActivity;
  }

  async updateProgrammeActivity(id: number, activity: Partial<ProgrammeActivity>): Promise<ProgrammeActivity> {
    const [updatedActivity] = await db
      .update(programmeActivities)
      .set(activity)
      .where(eq(programmeActivities.id, id))
      .returning();
    
    if (!updatedActivity) {
      throw new Error(`Programme Activity with ID ${id} not found`);
    }
    
    return updatedActivity;
  }

  // Activity Relationships methods
  async getActivityRelationship(id: number): Promise<ActivityRelationship | undefined> {
    const [relationship] = await db
      .select()
      .from(activityRelationships)
      .where(eq(activityRelationships.id, id));
    return relationship;
  }

  async getActivityRelationshipsByProgramme(programmeId: number): Promise<ActivityRelationship[]> {
    // First, we get all activity IDs from the programme
    const activities = await this.getProgrammeActivitiesByProgramme(programmeId);
    const activityIds = activities.map(activity => activity.id);
    
    // Then, we find all relationships where either predecessor or successor is in our activity list
    if (activityIds.length === 0) {
      return [];
    }
    
    return db
      .select()
      .from(activityRelationships)
      .where(
        db.or(
          db.inArray(activityRelationships.predecessorId, activityIds),
          db.inArray(activityRelationships.successorId, activityIds)
        )
      );
  }

  async createActivityRelationship(relationship: InsertActivityRelationship): Promise<ActivityRelationship> {
    const [newRelationship] = await db
      .insert(activityRelationships)
      .values(relationship)
      .returning();
    return newRelationship;
  }

  // Programme Analyses methods
  async getProgrammeAnalysis(id: number): Promise<ProgrammeAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(programmeAnalyses)
      .where(eq(programmeAnalyses.id, id));
    return analysis;
  }

  async getProgrammeAnalysesByProgramme(programmeId: number): Promise<ProgrammeAnalysis[]> {
    return db
      .select()
      .from(programmeAnalyses)
      .where(eq(programmeAnalyses.programmeId, programmeId));
  }

  async createProgrammeAnalysis(analysis: InsertProgrammeAnalysis): Promise<ProgrammeAnalysis> {
    const [newAnalysis] = await db
      .insert(programmeAnalyses)
      .values(analysis)
      .returning();
    return newAnalysis;
  }
  
  // Programme Annotations methods
  async getProgrammeAnnotation(id: number): Promise<ProgrammeAnnotation | undefined> {
    const [annotation] = await db
      .select()
      .from(programmeAnnotations)
      .where(eq(programmeAnnotations.id, id));
    return annotation;
  }

  async getProgrammeAnnotationsByProgramme(programmeId: number): Promise<ProgrammeAnnotation[]> {
    return db
      .select()
      .from(programmeAnnotations)
      .where(eq(programmeAnnotations.programmeId, programmeId));
  }

  async createProgrammeAnnotation(annotation: InsertProgrammeAnnotation): Promise<ProgrammeAnnotation> {
    const [newAnnotation] = await db
      .insert(programmeAnnotations)
      .values(annotation)
      .returning();
    return newAnnotation;
  }

  async updateProgrammeAnnotation(id: number, annotation: Partial<ProgrammeAnnotation>): Promise<ProgrammeAnnotation> {
    const [updatedAnnotation] = await db
      .update(programmeAnnotations)
      .set({
        ...annotation,
        updatedAt: new Date()
      })
      .where(eq(programmeAnnotations.id, id))
      .returning();
    
    if (!updatedAnnotation) {
      throw new Error(`Programme Annotation with ID ${id} not found`);
    }
    
    return updatedAnnotation;
  }

  async deleteProgrammeAnnotation(id: number): Promise<void> {
    await db
      .delete(programmeAnnotations)
      .where(eq(programmeAnnotations.id, id));
  }
  
  // NEC4 Teams methods
  async getNec4Team(id: number): Promise<Nec4Team | undefined> {
    const [team] = await db
      .select()
      .from(nec4Teams)
      .where(eq(nec4Teams.id, id));
    return team;
  }

  async getNec4TeamsByProject(projectId: number): Promise<Nec4Team[]> {
    return db
      .select()
      .from(nec4Teams)
      .where(eq(nec4Teams.projectId, projectId));
  }

  async createNec4Team(team: InsertNec4Team): Promise<Nec4Team> {
    const [newTeam] = await db
      .insert(nec4Teams)
      .values({
        ...team,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newTeam;
  }

  async updateNec4Team(id: number, team: Partial<Nec4Team>): Promise<Nec4Team> {
    const [updatedTeam] = await db
      .update(nec4Teams)
      .set({
        ...team,
        updatedAt: new Date()
      })
      .where(eq(nec4Teams.id, id))
      .returning();
    
    if (!updatedTeam) {
      throw new Error(`NEC4 Team with ID ${id} not found`);
    }
    
    return updatedTeam;
  }

  async deleteNec4Team(id: number): Promise<void> {
    // First delete all team members
    await db
      .delete(nec4TeamMembers)
      .where(eq(nec4TeamMembers.teamId, id));
    
    // Then delete the team
    await db
      .delete(nec4Teams)
      .where(eq(nec4Teams.id, id));
  }
  
  // NEC4 Team Members methods
  async getNec4TeamMember(id: number): Promise<Nec4TeamMember | undefined> {
    const [member] = await db
      .select()
      .from(nec4TeamMembers)
      .where(eq(nec4TeamMembers.id, id));
    return member;
  }

  async getNec4TeamMembersByTeam(teamId: number): Promise<Nec4TeamMember[]> {
    return db
      .select()
      .from(nec4TeamMembers)
      .where(eq(nec4TeamMembers.teamId, teamId));
  }
  
  async getNec4TeamMembersByUser(userId: number): Promise<Nec4TeamMember[]> {
    return db
      .select()
      .from(nec4TeamMembers)
      .where(eq(nec4TeamMembers.userId, userId));
  }

  async createNec4TeamMember(member: InsertNec4TeamMember): Promise<Nec4TeamMember> {
    const [newMember] = await db
      .insert(nec4TeamMembers)
      .values({
        ...member,
        joinedAt: new Date()
      })
      .returning();
    return newMember;
  }

  async updateNec4TeamMember(id: number, member: Partial<Nec4TeamMember>): Promise<Nec4TeamMember> {
    const [updatedMember] = await db
      .update(nec4TeamMembers)
      .set(member)
      .where(eq(nec4TeamMembers.id, id))
      .returning();
    
    if (!updatedMember) {
      throw new Error(`NEC4 Team Member with ID ${id} not found`);
    }
    
    return updatedMember;
  }

  async deleteNec4TeamMember(id: number): Promise<void> {
    await db
      .delete(nec4TeamMembers)
      .where(eq(nec4TeamMembers.id, id));
  }
  
  // User Project Assignments methods
  async getUserProjectAssignment(id: number): Promise<UserToProject | undefined> {
    const [assignment] = await db
      .select()
      .from(usersToProjects)
      .where(eq(usersToProjects.id, id));
    return assignment || undefined;
  }
  
  async getUserProjectAssignments(userId: number): Promise<UserToProject[]> {
    return db
      .select()
      .from(usersToProjects)
      .where(eq(usersToProjects.userId, userId));
  }
  
  async getProjectUserAssignments(projectId: number): Promise<UserToProject[]> {
    return db
      .select()
      .from(usersToProjects)
      .where(eq(usersToProjects.projectId, projectId));
  }
  
  async createUserProjectAssignment(assignment: InsertUserToProject): Promise<UserToProject> {
    const [newAssignment] = await db
      .insert(usersToProjects)
      .values({
        ...assignment,
        joinedAt: new Date()
      })
      .returning();
    return newAssignment;
  }
  
  async deleteUserProjectAssignment(id: number): Promise<void> {
    await db
      .delete(usersToProjects)
      .where(eq(usersToProjects.id, id));
  }
  
  // Progress Reports methods
  async getProgressReport(id: number): Promise<ProgressReport | undefined> {
    const [report] = await db
      .select()
      .from(progressReports)
      .where(eq(progressReports.id, id));
    return report || undefined;
  }

  async getProgressReportsByProject(projectId: number): Promise<ProgressReport[]> {
    return await db
      .select()
      .from(progressReports)
      .where(eq(progressReports.projectId, projectId));
  }

  async createProgressReport(report: InsertProgressReport): Promise<ProgressReport> {
    const [newReport] = await db
      .insert(progressReports)
      .values(report)
      .returning();
    return newReport;
  }

  async updateProgressReport(id: number, report: Partial<ProgressReport>): Promise<ProgressReport> {
    const [updated] = await db
      .update(progressReports)
      .set({
        ...report,
        updatedAt: new Date()
      })
      .where(eq(progressReports.id, id))
      .returning();
      
    if (!updated) {
      throw new Error(`Progress Report with id ${id} not found`);
    }
    
    return updated;
  }

  async deleteProgressReport(id: number): Promise<void> {
    await db
      .delete(progressReports)
      .where(eq(progressReports.id, id));
  }

  // Resource Allocations - Demo implementation
  async getResourceAllocationsByProject(projectId: number): Promise<any[]> {
    // Return demo data for resource allocations
    return [
      {
        id: 1,
        projectId,
        periodName: "Week 23",
        weekCommencing: "2024-06-03",
        teamMembers: [
          {
            id: 1,
            name: "John Smith",
            role: "Site Manager",
            company: "Main Contractor Ltd",
            hours: 40,
            isSubcontractor: false
          },
          {
            id: 2,
            name: "Sarah Johnson",
            role: "Quality Inspector",
            company: "Quality Solutions",
            hours: 35,
            isSubcontractor: true
          },
          {
            id: 3,
            name: "Mike Wilson",
            role: "Plant Operator",
            company: "Main Contractor Ltd",
            hours: 42,
            isSubcontractor: false
          }
        ],
        totalLabourHours: 117,
        extractedFrom: "resource-allocation-week23.xlsx",
        extractionConfidence: 0.92,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  async createResourceAllocation(allocation: any): Promise<any> {
    // Demo implementation - in production this would save to database
    const newAllocation = {
      id: Date.now(), // Simple ID generation for demo
      ...allocation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newAllocation;
  }

  async createEquipmentHire(hire: any): Promise<any> {
    // Simple demo implementation for email processing
    const newHire = {
      id: Date.now(),
      ...hire,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newHire;
  }

  async createRfi(rfi: any): Promise<any> {
    // Simple demo implementation for email processing
    const newRfi = {
      id: Date.now(),
      ...rfi,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newRfi;
  }

  async logAgentActivity(activity: {
    agentType: string;
    action: string;
    projectId: number | null;
    details: string;
    userId?: number | null;
  }): Promise<void> {
    // Log agent activity for monitoring and analytics
    console.log(`[${activity.agentType.toUpperCase()} AGENT] ${activity.action}: ${activity.details}`);
    
    // In production, this would save to an agent_activity_logs table
    const logEntry = {
      timestamp: new Date().toISOString(),
      agentType: activity.agentType,
      action: activity.action,
      projectId: activity.projectId,
      userId: activity.userId,
      details: activity.details
    };
    
    // Store in memory for demo purposes (would be database in production)
    // await db.insert(agentActivityLogs).values(logEntry);
  }
}

// Create an instance of the database storage
export const storage = new DatabaseStorage();
