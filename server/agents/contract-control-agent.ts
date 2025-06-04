import { AgentCoordinator, AgentCommunication, AgentAlert } from './agent-coordinator';
import { db } from '../db';
import { compensationEvents, earlyWarnings, projects } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export interface ContractEvent {
  type: 'compensation-event' | 'early-warning' | 'instruction' | 'notification';
  projectId: number;
  title: string;
  description: string;
  clauseReference?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timeImpact?: boolean;
  costImpact?: boolean;
  deadlineDate?: Date;
  source: 'email' | 'manual' | 'document-analysis' | 'system';
}

export class ContractControlAgent {
  private coordinator: AgentCoordinator;
  private knowledgeBase: Map<string, any> = new Map();

  constructor(coordinator: AgentCoordinator) {
    this.coordinator = coordinator;
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase(): void {
    // NEC4 clause triggers and patterns
    this.knowledgeBase.set('early-warning-triggers', [
      'unforeseen ground conditions',
      'weather conditions',
      'delay in access',
      'design changes',
      'supply chain issues',
      'resource constraints',
      'archaeological findings'
    ]);

    this.knowledgeBase.set('compensation-event-triggers', [
      'change in scope',
      'instruction from project manager',
      'access not provided',
      'unforeseen physical conditions',
      'weather measurement',
      'others stopping work',
      'employer risk events'
    ]);

    this.knowledgeBase.set('deadline-patterns', {
      'early-warning-response': 7, // days
      'compensation-event-notification': 8, // weeks
      'compensation-event-quotation': 3, // weeks
      'programme-revision': 2 // weeks
    });
  }

  async receiveMessage(message: AgentCommunication): Promise<void> {
    switch (message.messageType) {
      case 'data-update':
        await this.processDataUpdate(message.payload);
        break;
      case 'request':
        await this.processRequest(message);
        break;
      case 'alert':
        await this.processAlert(message.payload);
        break;
    }
  }

  // Process contract events from Email Intake Agent
  async processContractEvent(event: ContractEvent): Promise<void> {
    console.log(`Contract Control Agent processing ${event.type} for project ${event.projectId}`);

    try {
      switch (event.type) {
        case 'early-warning':
          await this.processEarlyWarning(event);
          break;
        case 'compensation-event':
          await this.processCompensationEvent(event);
          break;
        case 'instruction':
          await this.processInstruction(event);
          break;
        case 'notification':
          await this.processNotification(event);
          break;
      }
    } catch (error) {
      console.error('Error processing contract event:', error);
      await this.createAlert({
        agentType: 'contract-control',
        severity: 'high',
        title: 'Contract Event Processing Error',
        message: `Failed to process ${event.type}: ${error}`,
        actionRequired: true,
        relatedEntity: { type: 'early-warning', id: 'unknown' },
        projectId: event.projectId
      });
    }
  }

  private async processEarlyWarning(event: ContractEvent): Promise<void> {
    // Check if similar early warning already exists
    const existingEWs = await db.select()
      .from(earlyWarnings)
      .where(and(
        eq(earlyWarnings.projectId, event.projectId),
        eq(earlyWarnings.status, 'Open')
      ));

    const similarEW = existingEWs.find(ew => 
      ew.title.toLowerCase().includes(event.title.toLowerCase().substring(0, 10))
    );

    if (similarEW) {
      await this.createAlert({
        agentType: 'contract-control',
        severity: 'medium',
        title: 'Potential Duplicate Early Warning',
        message: `New early warning "${event.title}" may be similar to existing EW-${similarEW.reference}`,
        actionRequired: true,
        relatedEntity: { type: 'early-warning', id: similarEW.id, reference: `EW-${similarEW.reference}` },
        projectId: event.projectId
      });
      return;
    }

    // Create new early warning
    const [newEW] = await db.insert(earlyWarnings).values({
      projectId: event.projectId,
      reference: await this.generateReference('EW', event.projectId),
      title: event.title,
      description: event.description,
      raisedBy: 1, // System user for agent-created entries
      dateRaised: new Date(),
      status: 'Open',
      risk: event.severity === 'critical' ? 'High' : event.severity === 'high' ? 'High' : 'Medium',
      clauseReference: event.clauseReference || '15.1'
    }).returning();

    // Notify Operational Agent if time impact
    if (event.timeImpact) {
      await this.coordinator.sendMessage({
        fromAgent: 'contract-control',
        toAgent: 'operational',
        messageType: 'data-update',
        payload: {
          type: 'early-warning-time-impact',
          earlyWarningId: newEW.id,
          projectId: event.projectId,
          description: event.description
        }
      });
    }

    // Notify Commercial Agent if cost impact
    if (event.costImpact) {
      await this.coordinator.sendMessage({
        fromAgent: 'contract-control',
        toAgent: 'commercial',
        messageType: 'data-update',
        payload: {
          type: 'early-warning-cost-impact',
          earlyWarningId: newEW.id,
          projectId: event.projectId,
          description: event.description
        }
      });
    }

    await this.createAlert({
      agentType: 'contract-control',
      severity: 'medium',
      title: 'New Early Warning Created',
      message: `Early Warning EW-${newEW.reference} created: ${event.title}`,
      actionRequired: true,
      relatedEntity: { type: 'early-warning', id: newEW.id, reference: `EW-${newEW.reference}` },
      projectId: event.projectId
    });
  }

  private async processCompensationEvent(event: ContractEvent): Promise<void> {
    // Create new compensation event
    const [newCE] = await db.insert(compensationEvents).values({
      projectId: event.projectId,
      reference: await this.generateReference('CE', event.projectId),
      title: event.title,
      description: event.description,
      raisedBy: 1, // System user for agent-created entries
      dateRaised: new Date(),
      status: 'Notification',
      category: 'Change in Scope', // Default category
      clauseReference: event.clauseReference || '60.1',
      instructionRequired: true
    }).returning();

    // Set quotation deadline (3 weeks from now)
    const quotationDeadline = new Date();
    quotationDeadline.setDate(quotationDeadline.getDate() + 21);

    // Notify Commercial Agent for cost assessment
    await this.coordinator.sendMessage({
      fromAgent: 'contract-control',
      toAgent: 'commercial',
      messageType: 'data-update',
      payload: {
        type: 'compensation-event-created',
        compensationEventId: newCE.id,
        projectId: event.projectId,
        quotationDeadline: quotationDeadline,
        timeImpact: event.timeImpact,
        costImpact: event.costImpact
      }
    });

    // Notify Operational Agent if programme impact
    if (event.timeImpact) {
      await this.coordinator.sendMessage({
        fromAgent: 'contract-control',
        toAgent: 'operational',
        messageType: 'data-update',
        payload: {
          type: 'compensation-event-programme-impact',
          compensationEventId: newCE.id,
          projectId: event.projectId,
          description: event.description
        }
      });
    }

    await this.createAlert({
      agentType: 'contract-control',
      severity: 'high',
      title: 'New Compensation Event Created',
      message: `Compensation Event CE-${newCE.reference} created: ${event.title}`,
      actionRequired: true,
      relatedEntity: { type: 'compensation-event', id: newCE.id, reference: `CE-${newCE.reference}` },
      projectId: event.projectId
    });
  }

  private async processInstruction(event: ContractEvent): Promise<void> {
    // Instructions can trigger compensation events
    const isCompensationEvent = this.analyzeForCompensationEvent(event.description);
    
    if (isCompensationEvent) {
      await this.processCompensationEvent({
        ...event,
        type: 'compensation-event',
        clauseReference: '14.3' // Project Manager instruction
      });
    }
  }

  private async processNotification(event: ContractEvent): Promise<void> {
    // General notifications for tracking and awareness
    await this.createAlert({
      agentType: 'contract-control',
      severity: event.severity,
      title: `Contract Notification: ${event.title}`,
      message: event.description,
      actionRequired: false,
      relatedEntity: { type: 'early-warning', id: 'notification' },
      projectId: event.projectId
    });
  }

  private analyzeForCompensationEvent(description: string): boolean {
    const ceTriggers = this.knowledgeBase.get('compensation-event-triggers') as string[];
    return ceTriggers.some(trigger => 
      description.toLowerCase().includes(trigger.toLowerCase())
    );
  }

  private async generateReference(type: 'EW' | 'CE', projectId: number): Promise<string> {
    const table = type === 'EW' ? earlyWarnings : compensationEvents;
    const existing = await db.select().from(table).where(eq(table.projectId, projectId));
    const nextNumber = String(existing.length + 1).padStart(3, '0');
    return nextNumber;
  }

  private async processDataUpdate(payload: any): Promise<void> {
    // Handle updates from other agents
    console.log('Contract Control Agent received data update:', payload);
  }

  private async processRequest(message: AgentCommunication): Promise<void> {
    // Handle requests from other agents
    console.log('Contract Control Agent received request:', message);
  }

  private async processAlert(alert: AgentAlert): Promise<void> {
    // Handle alerts from other agents
    console.log('Contract Control Agent received alert:', alert);
  }

  private async createAlert(alert: Omit<AgentAlert, 'id' | 'timestamp' | 'status'>): Promise<void> {
    await this.coordinator.createAlert(alert);
  }

  // Analyze contract document for risks and compliance
  async analyzeContractDocument(projectId: number, documentText: string): Promise<any> {
    const risks: any[] = [];
    const recommendations: any[] = [];

    // Analyze for missing NEC4 clauses
    const requiredClauses = ['15.1', '60.1', '61.3', '62.2', '13.4'];
    for (const clause of requiredClauses) {
      if (!documentText.includes(clause)) {
        risks.push({
          clause: `Missing Clause ${clause}`,
          issue: `Required NEC4 clause ${clause} not referenced in document`,
          severity: 'Moderate',
          recommendation: `Ensure compliance with NEC4 Clause ${clause} requirements`
        });
      }
    }

    // Analyze for early warning triggers
    const ewTriggers = this.knowledgeBase.get('early-warning-triggers') as string[];
    for (const trigger of ewTriggers) {
      if (documentText.toLowerCase().includes(trigger.toLowerCase())) {
        recommendations.push({
          type: 'early-warning',
          message: `Document mentions "${trigger}" which may require an Early Warning under Clause 15.1`,
          action: 'Consider raising Early Warning'
        });
      }
    }

    return {
      riskAreas: risks,
      compliantClauses: [],
      missingClauses: requiredClauses.filter(clause => !documentText.includes(clause)),
      overallRisk: risks.length > 2 ? 'High' : risks.length > 0 ? 'Medium' : 'Low',
      summary: `Document analysis complete. Found ${risks.length} risk areas and ${recommendations.length} recommendations.`
    };
  }

  // Monitor deadlines and create alerts
  async monitorDeadlines(): Promise<void> {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

    // Check compensation event quotation deadlines
    const pendingCEs = await db.select()
      .from(compensationEvents)
      .where(eq(compensationEvents.status, 'Quotation Due'));

    for (const ce of pendingCEs) {
      if (ce.quotationDeadline && ce.quotationDeadline <= threeDaysFromNow) {
        await this.createAlert({
          agentType: 'contract-control',
          severity: 'critical',
          title: 'Compensation Event Deadline Approaching',
          message: `CE-${ce.reference} quotation deadline is ${ce.quotationDeadline.toDateString()}`,
          actionRequired: true,
          relatedEntity: { type: 'compensation-event', id: ce.id, reference: `CE-${ce.reference}` },
          projectId: ce.projectId
        });
      }
    }
  }
}