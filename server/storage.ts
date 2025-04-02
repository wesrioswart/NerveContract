import {
  User, InsertUser, Project, InsertProject, CompensationEvent, InsertCompensationEvent,
  EarlyWarning, InsertEarlyWarning, NonConformanceReport, InsertNonConformanceReport,
  TechnicalQuery, InsertTechnicalQuery, ProgrammeMilestone, InsertProgrammeMilestone,
  PaymentCertificate, InsertPaymentCertificate, ChatMessage, InsertChatMessage,
} from "@shared/schema";

export interface IStorage {
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
  createCompensationEvent(ce: InsertCompensationEvent): Promise<CompensationEvent>;
  updateCompensationEvent(id: number, ce: Partial<CompensationEvent>): Promise<CompensationEvent>;
  
  // Early Warnings
  getEarlyWarning(id: number): Promise<EarlyWarning | undefined>;
  getEarlyWarningsByProject(projectId: number): Promise<EarlyWarning[]>;
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

    // Create a demo project
    const project: Project = {
      id: this.projectCurrentId++,
      name: "Westfield Development Project",
      contractReference: "NEC4-2020-1234",
      clientName: "Westfield Corp",
      startDate: new Date("2023-04-10"),
      endDate: new Date("2023-12-15")
    };
    this.projects.set(project.id, project);

    // Create demo compensation events
    this.createCompensationEvent({
      projectId: project.id,
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
      projectId: project.id,
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

    this.createCompensationEvent({
      projectId: project.id,
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

    // Create demo early warnings
    this.createEarlyWarning({
      projectId: project.id,
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
      projectId: project.id,
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
      projectId: project.id,
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
      projectId: project.id,
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
      projectId: project.id,
      name: "Project Start",
      plannedDate: new Date("2023-04-10"),
      actualDate: new Date("2023-04-10"),
      status: "Completed",
      delayReason: null,
      delayDays: null
    });

    this.createProgrammeMilestone({
      projectId: project.id,
      name: "Foundations",
      plannedDate: new Date("2023-05-15"),
      actualDate: new Date("2023-05-15"),
      status: "Completed",
      delayReason: null,
      delayDays: null
    });

    this.createProgrammeMilestone({
      projectId: project.id,
      name: "Structure",
      plannedDate: new Date("2023-07-20"),
      actualDate: null,
      status: "In Progress",
      delayReason: null,
      delayDays: null
    });

    this.createProgrammeMilestone({
      projectId: project.id,
      name: "Services",
      plannedDate: new Date("2023-09-05"),
      actualDate: null,
      status: "Not Started",
      delayReason: "CE Delay",
      delayDays: 14
    });

    this.createProgrammeMilestone({
      projectId: project.id,
      name: "Completion",
      plannedDate: new Date("2023-12-15"),
      actualDate: null,
      status: "Not Started",
      delayReason: "CE Delay",
      delayDays: 14
    });

    // Create demo payment certificate
    this.createPaymentCertificate({
      projectId: project.id,
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

export const storage = new MemStorage();
