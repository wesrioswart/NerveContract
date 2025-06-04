import { EmailIntakeAgent } from './email-intake-agent';
import { ContractControlAgent } from './contract-control-agent';
import { OperationalAgent } from './operational-agent';
import { CommercialAgent } from './commercial-agent';
import { ProcurementAgent } from './procurement-agent';

export interface AgentAlert {
  id: string;
  agentType: 'email-intake' | 'contract-control' | 'operational' | 'commercial' | 'procurement';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionRequired: boolean;
  relatedEntity: {
    type: 'compensation-event' | 'early-warning' | 'programme' | 'equipment' | 'supplier' | 'payment';
    id: string | number;
    reference?: string;
  };
  timestamp: Date;
  projectId: number;
  assignedTo?: number; // user ID
  status: 'active' | 'acknowledged' | 'resolved';
}

export interface AgentCommunication {
  fromAgent: string;
  toAgent: string;
  messageType: 'data-update' | 'alert' | 'request' | 'response';
  payload: any;
  timestamp: Date;
  correlationId?: string;
}

export class AgentCoordinator {
  private emailIntakeAgent: EmailIntakeAgent;
  private contractControlAgent: ContractControlAgent;
  private operationalAgent: OperationalAgent;
  private commercialAgent: CommercialAgent;
  private procurementAgent: ProcurementAgent;
  
  private activeAlerts: Map<string, AgentAlert> = new Map();
  private communicationLog: AgentCommunication[] = [];

  constructor() {
    this.emailIntakeAgent = new EmailIntakeAgent(this);
    this.contractControlAgent = new ContractControlAgent(this);
    this.operationalAgent = new OperationalAgent(this);
    this.commercialAgent = new CommercialAgent(this);
    this.procurementAgent = new ProcurementAgent(this);
  }

  // Inter-agent communication
  async sendMessage(communication: Omit<AgentCommunication, 'timestamp'>): Promise<void> {
    const message: AgentCommunication = {
      ...communication,
      timestamp: new Date()
    };
    
    this.communicationLog.push(message);
    
    // Route message to appropriate agent
    switch (message.toAgent) {
      case 'email-intake':
        await this.emailIntakeAgent.receiveMessage(message);
        break;
      case 'contract-control':
        await this.contractControlAgent.receiveMessage(message);
        break;
      case 'operational':
        await this.operationalAgent.receiveMessage(message);
        break;
      case 'commercial':
        await this.commercialAgent.receiveMessage(message);
        break;
      case 'procurement':
        await this.procurementAgent.receiveMessage(message);
        break;
    }
  }

  // Alert management
  async createAlert(alert: Omit<AgentAlert, 'id' | 'timestamp' | 'status'>): Promise<string> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullAlert: AgentAlert = {
      ...alert,
      id: alertId,
      timestamp: new Date(),
      status: 'active'
    };
    
    this.activeAlerts.set(alertId, fullAlert);
    
    // Notify relevant agents of the new alert
    await this.broadcastAlert(fullAlert);
    
    return alertId;
  }

  private async broadcastAlert(alert: AgentAlert): Promise<void> {
    const broadcastMessage: Omit<AgentCommunication, 'timestamp'> = {
      fromAgent: 'coordinator',
      toAgent: 'all',
      messageType: 'alert',
      payload: alert
    };
    
    // Send to all agents for awareness
    await Promise.all([
      this.contractControlAgent.receiveMessage({ ...broadcastMessage, timestamp: new Date() }),
      this.operationalAgent.receiveMessage({ ...broadcastMessage, timestamp: new Date() }),
      this.commercialAgent.receiveMessage({ ...broadcastMessage, timestamp: new Date() }),
      this.procurementAgent.receiveMessage({ ...broadcastMessage, timestamp: new Date() })
    ]);
  }

  // Get alerts for dashboard
  getActiveAlerts(projectId: number): AgentAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.projectId === projectId && alert.status === 'active')
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string, userId: number): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.assignedTo = userId;
    }
  }

  // Resolve alert
  async resolveAlert(alertId: string, userId: number): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.assignedTo = userId;
    }
  }

  // Process incoming email (entry point for Email Intake Agent)
  async processIncomingEmail(emailData: any): Promise<void> {
    await this.emailIntakeAgent.processEmail(emailData);
  }

  // Process programme update (entry point for Operational Agent)
  async processProgrammeUpdate(projectId: number, programmeData: any): Promise<void> {
    await this.operationalAgent.processProgrammeUpdate(projectId, programmeData);
  }

  // Process equipment hire data (entry point for Commercial Agent)
  async processEquipmentHireUpdate(projectId: number, equipmentData: any): Promise<void> {
    await this.commercialAgent.processEquipmentHire(projectId, equipmentData);
  }

  // Process supplier performance data (entry point for Procurement Agent)
  async processSupplierPerformance(supplierId: number, performanceData: any): Promise<void> {
    await this.procurementAgent.processSupplierPerformance(supplierId, performanceData);
  }

  // Get communication log for debugging
  getCommunicationLog(limit: number = 100): AgentCommunication[] {
    return this.communicationLog
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// Singleton instance
export const agentCoordinator = new AgentCoordinator();