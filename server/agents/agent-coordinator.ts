// Specialist AI Agent Coordinator for NEC4 Contract Management

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
  assignedTo?: number;
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
  private activeAlerts: Map<string, AgentAlert> = new Map();
  private communicationLog: AgentCommunication[] = [];

  constructor() {
    console.log('Agent Coordinator initialized with 5 specialist agents');
  }

  // Inter-agent communication
  async sendMessage(communication: Omit<AgentCommunication, 'timestamp'>): Promise<void> {
    const message: AgentCommunication = {
      ...communication,
      timestamp: new Date()
    };
    
    this.communicationLog.push(message);
    
    // Log agent communication for demonstration
    console.log(`Agent Communication: ${message.fromAgent} -> ${message.toAgent}: ${message.messageType}`);
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
    
    // Log broadcast for demonstration
    console.log(`Broadcasting alert to all agents: ${alert.title}`);
    this.communicationLog.push({ ...broadcastMessage, timestamp: new Date() });
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
    console.log('Email Intake Agent: Processing incoming email');
    
    // Create alert for email processing demonstration
    await this.createAlert({
      agentType: 'email-intake',
      severity: 'medium',
      title: 'Email Processed',
      message: `Email from ${emailData.from || 'unknown sender'} classified and routed`,
      actionRequired: false,
      relatedEntity: { type: 'early-warning', id: 'email-001' },
      projectId: 1
    });
  }

  // Process programme update (entry point for Operational Agent)
  async processProgrammeUpdate(projectId: number, programmeData: any): Promise<void> {
    console.log('Operational Agent: Processing programme update');
    
    // Create critical path alert for archaeological delay scenario
    await this.createAlert({
      agentType: 'operational',
      severity: 'critical',
      title: 'Programme Alert: Critical path slippage detected',
      message: 'Activity "Foundation Works - Phase 2" showing significant delay due to archaeological findings impact. Review required.',
      actionRequired: true,
      relatedEntity: { 
        type: 'compensation-event', 
        id: 'CE-040',
        reference: 'CE-040'
      },
      projectId: projectId
    });

    // Send communication to Contract Control Agent
    await this.sendMessage({
      fromAgent: 'operational',
      toAgent: 'contract-control',
      messageType: 'data-update',
      payload: {
        type: 'programme-revision-required',
        projectId: projectId,
        affectedActivity: 'Foundation Works - Phase 2',
        delayReason: 'archaeological findings',
        compensationEventRef: 'CE-040'
      }
    });
  }

  // Process equipment hire data (entry point for Commercial Agent)
  async processEquipmentHireUpdate(projectId: number, equipmentData: any): Promise<void> {
    console.log('Commercial Agent: Processing equipment hire validation');
    
    // Create SCC compliance alert
    await this.createAlert({
      agentType: 'commercial',
      severity: 'high',
      title: 'Equipment Cost SCC Compliance Issue',
      message: `Equipment hire ${equipmentData.hireReference}: Equipment used outside Working Areas`,
      actionRequired: true,
      relatedEntity: { 
        type: 'equipment', 
        id: equipmentData.id,
        reference: equipmentData.hireReference
      },
      projectId: projectId
    });

    // Send communication to Procurement Agent
    await this.sendMessage({
      fromAgent: 'commercial',
      toAgent: 'procurement',
      messageType: 'alert',
      payload: {
        type: 'equipment-compliance-issue',
        equipmentData: equipmentData,
        projectId: projectId
      }
    });
  }

  // Process supplier performance data (entry point for Procurement Agent)
  async processSupplierPerformance(supplierId: number, performanceData: any): Promise<void> {
    console.log('Procurement Agent: Processing supplier performance data');
    
    // Create supplier performance alert
    await this.createAlert({
      agentType: 'procurement',
      severity: 'high',
      title: 'Supplier Performance Decline',
      message: `${performanceData.supplierName} delivery reliability at ${performanceData.performanceMetrics?.deliveryReliability || 65}% (below 70% threshold)`,
      actionRequired: true,
      relatedEntity: { type: 'supplier', id: supplierId },
      projectId: 1
    });
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