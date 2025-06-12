import { EventEmitter } from 'events';
import { storage } from './storage';

// Event types for type safety
export interface AgentEvents {
  'earlyWarning.received': (ewData: EarlyWarningEventData) => void;
  'compensationEvent.notice': (ceData: CompensationEventData) => void;
  'email.classified': (emailData: EmailClassificationData) => void;
  'document.analyzed': (docData: DocumentAnalysisData) => void;
  'programme.updated': (progData: ProgrammeUpdateData) => void;
  'equipment.requested': (equipData: EquipmentRequestData) => void;
  'supplier.evaluated': (supplierData: SupplierEvaluationData) => void;
  'payment.processed': (paymentData: PaymentProcessedData) => void;
  'risk.identified': (riskData: RiskIdentificationData) => void;
  'notification.send': (notificationData: NotificationData) => void;
}

export interface EarlyWarningEventData {
  projectId: number;
  description: string;
  raisedBy: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  mitigationSuggestions?: string[];
  sourceEmail?: string;
  extractedData?: any;
}

export interface CompensationEventData {
  projectId: number;
  title: string;
  description: string;
  clauseReference: string;
  estimatedValue?: number;
  raisedBy: number;
  sourceEmail?: string;
  extractedData?: any;
}

export interface EmailClassificationData {
  emailId: string;
  from: string;
  subject: string;
  classification: string;
  confidence: number;
  projectId?: number;
  extractedData: any;
}

export interface DocumentAnalysisData {
  documentId: string;
  documentType: string;
  analysis: any;
  risks: string[];
  actions: string[];
  projectId?: number;
}

export interface ProgrammeUpdateData {
  projectId: number;
  changes: any[];
  criticalPathImpact: boolean;
  delayIdentified: boolean;
  milestonesAffected: string[];
}

export interface EquipmentRequestData {
  projectId: number;
  equipmentType: string;
  requestedBy: number;
  urgency: 'low' | 'medium' | 'high';
  specifications: any;
}

export interface SupplierEvaluationData {
  supplierId: number;
  projectId: number;
  performanceScore: number;
  issues: string[];
  recommendations: string[];
}

export interface PaymentProcessedData {
  projectId: number;
  certificateId: number;
  amount: number;
  status: string;
}

export interface RiskIdentificationData {
  projectId: number;
  riskType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source: string;
  recommendedActions: string[];
}

export interface NotificationData {
  recipientType: 'user' | 'team' | 'project';
  recipientId: number;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired?: boolean;
}

// Create typed event bus
class AgentEventBus extends EventEmitter {
  private logger: any;

  constructor() {
    super();
    this.setMaxListeners(50); // Allow many listeners for different agents
    this.setupErrorHandling();
    this.logger = console; // Replace with proper logger in production
  }

  private setupErrorHandling() {
    this.on('error', (error) => {
      this.logger.error('Event bus error:', error);
    });
  }

  // Type-safe emit method
  emitEvent<K extends keyof AgentEvents>(event: K, data: Parameters<AgentEvents[K]>[0]): boolean {
    try {
      this.logger.info(`Event emitted: ${event}`, { data });
      return this.emit(event, data);
    } catch (error) {
      this.logger.error(`Failed to emit event ${event}:`, error);
      return false;
    }
  }

  // Type-safe listener method
  onEvent<K extends keyof AgentEvents>(event: K, listener: AgentEvents[K]): this {
    return this.on(event, listener);
  }
}

// Singleton event bus instance
export const eventBus = new AgentEventBus();

// Agent Event Handlers
export class AgentEventHandlers {
  static async handleEarlyWarningReceived(ewData: EarlyWarningEventData) {
    try {
      console.log('Processing Early Warning event:', ewData);
      
      // Generate reference number
      const reference = `EW-${Date.now().toString().slice(-6)}`;
      
      // Create early warning record
      const earlyWarning = await storage.createEarlyWarning({
        projectId: ewData.projectId,
        reference,
        description: ewData.description,
        ownerId: ewData.raisedBy,
        status: 'Open',
        raisedBy: ewData.raisedBy,
        raisedAt: new Date(),
        mitigationPlan: ewData.mitigationSuggestions?.join('; ') || null,
        attachments: ewData.extractedData ? JSON.stringify(ewData.extractedData) : null
      });

      // Log Contract Control Agent activity
      await storage.logAgentActivity({
        agentType: 'contract_control',
        action: 'early_warning_processed',
        projectId: ewData.projectId,
        details: `Early Warning ${reference} created from email classification`,
        userId: ewData.raisedBy
      });

      // Emit notification event for stakeholders
      eventBus.emitEvent('notification.send', {
        recipientType: 'project',
        recipientId: ewData.projectId,
        message: `New Early Warning ${reference}: ${ewData.description}`,
        type: ewData.severity === 'critical' ? 'error' : 'warning',
        priority: ewData.severity === 'critical' ? 'urgent' : 'high',
        actionRequired: true
      });

      console.log(`Early Warning ${reference} created successfully`);
      return earlyWarning;
    } catch (error) {
      console.error('Failed to handle Early Warning event:', error);
      throw error;
    }
  }

  static async handleCompensationEventNotice(ceData: CompensationEventData) {
    try {
      console.log('Processing Compensation Event notice:', ceData);
      
      // Generate reference number
      const reference = `CE-${Date.now().toString().slice(-6)}`;
      
      // Create compensation event record
      const compensationEvent = await storage.createCompensationEvent({
        projectId: ceData.projectId,
        reference,
        title: ceData.title,
        description: ceData.description,
        clauseReference: ceData.clauseReference,
        estimatedValue: ceData.estimatedValue || 0,
        actualValue: 0,
        status: 'Notification',
        raisedBy: ceData.raisedBy,
        raisedAt: new Date(),
        responseDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        attachments: ceData.extractedData ? JSON.stringify(ceData.extractedData) : null
      });

      // Log Commercial Agent activity
      await storage.logAgentActivity({
        agentType: 'commercial',
        action: 'compensation_event_created',
        projectId: ceData.projectId,
        details: `Compensation Event ${reference} created from email - estimated value: £${ceData.estimatedValue || 0}`,
        userId: ceData.raisedBy
      });

      // Emit notification for urgent review
      eventBus.emitEvent('notification.send', {
        recipientType: 'project',
        recipientId: ceData.projectId,
        message: `New Compensation Event ${reference}: ${ceData.title} - 14 day response deadline`,
        type: 'warning',
        priority: 'high',
        actionRequired: true
      });

      console.log(`Compensation Event ${reference} created successfully`);
      return compensationEvent;
    } catch (error) {
      console.error('Failed to handle Compensation Event notice:', error);
      throw error;
    }
  }

  static async handleEmailClassified(emailData: EmailClassificationData) {
    try {
      console.log('Processing email classification:', emailData);
      
      // Log Email Intake Agent activity
      await storage.logAgentActivity({
        agentType: 'email_intake',
        action: 'email_classified',
        projectId: emailData.projectId || null,
        details: `Email from ${emailData.from} classified as ${emailData.classification} (confidence: ${Math.round(emailData.confidence * 100)}%)`,
        userId: null
      });

      // Route to appropriate handlers based on classification
      switch (emailData.classification.toLowerCase()) {
        case 'early_warning':
          if (emailData.projectId && emailData.extractedData) {
            eventBus.emitEvent('earlyWarning.received', {
              projectId: emailData.projectId,
              description: emailData.extractedData.description || emailData.subject,
              raisedBy: 1, // Default user - should be mapped from email
              severity: emailData.extractedData.severity || 'medium',
              category: emailData.extractedData.category || 'General',
              mitigationSuggestions: emailData.extractedData.mitigationSuggestions,
              sourceEmail: emailData.from,
              extractedData: emailData.extractedData
            });
          }
          break;

        case 'compensation_event':
          if (emailData.projectId && emailData.extractedData) {
            eventBus.emitEvent('compensationEvent.notice', {
              projectId: emailData.projectId,
              title: emailData.extractedData.title || emailData.subject,
              description: emailData.extractedData.description || '',
              clauseReference: emailData.extractedData.clauseReference || '60.1(12)',
              estimatedValue: emailData.extractedData.estimatedValue,
              raisedBy: 1, // Default user - should be mapped from email
              sourceEmail: emailData.from,
              extractedData: emailData.extractedData
            });
          }
          break;

        case 'equipment_request':
          if (emailData.projectId && emailData.extractedData) {
            eventBus.emitEvent('equipment.requested', {
              projectId: emailData.projectId,
              equipmentType: emailData.extractedData.equipmentType || 'General Equipment',
              requestedBy: 1,
              urgency: emailData.extractedData.urgency || 'medium',
              specifications: emailData.extractedData.specifications || {}
            });
          }
          break;
      }

      console.log(`Email classification processed for ${emailData.classification}`);
    } catch (error) {
      console.error('Failed to handle email classification:', error);
      throw error;
    }
  }

  static async handleDocumentAnalyzed(docData: DocumentAnalysisData) {
    try {
      console.log('Processing document analysis:', docData);
      
      // Log activity
      await storage.logAgentActivity({
        agentType: 'operational',
        action: 'document_analyzed',
        projectId: docData.projectId || null,
        details: `${docData.documentType} document analyzed - ${docData.risks.length} risks identified`,
        userId: null
      });

      // If risks are identified, create risk events
      for (const risk of docData.risks) {
        eventBus.emitEvent('risk.identified', {
          projectId: docData.projectId || 0,
          riskType: 'Document Analysis',
          severity: 'medium',
          description: risk,
          source: `Document: ${docData.documentId}`,
          recommendedActions: docData.actions
        });
      }

      console.log(`Document analysis processed for ${docData.documentType}`);
    } catch (error) {
      console.error('Failed to handle document analysis:', error);
      throw error;
    }
  }

  static async handleNotificationSend(notificationData: NotificationData) {
    try {
      console.log('Processing notification:', notificationData);
      
      // In a real implementation, this would send actual notifications
      // via email, SMS, in-app notifications, etc.
      
      // For now, log the notification
      console.log(`NOTIFICATION [${notificationData.type.toUpperCase()}] ${notificationData.priority}: ${notificationData.message}`);
      
      // Store notification in database for in-app display
      // await storage.createNotification(notificationData);
      
    } catch (error) {
      console.error('Failed to handle notification:', error);
      throw error;
    }
  }
}

// Initialize event listeners
export function initializeEventBus() {
  console.log('Initializing Agent Event Bus...');
  
  // Register all event handlers
  eventBus.onEvent('earlyWarning.received', AgentEventHandlers.handleEarlyWarningReceived);
  eventBus.onEvent('compensationEvent.notice', AgentEventHandlers.handleCompensationEventNotice);
  eventBus.onEvent('email.classified', AgentEventHandlers.handleEmailClassified);
  eventBus.onEvent('document.analyzed', AgentEventHandlers.handleDocumentAnalyzed);
  eventBus.onEvent('notification.send', AgentEventHandlers.handleNotificationSend);
  
  console.log('Agent Event Bus initialized with 5 event handlers');
}