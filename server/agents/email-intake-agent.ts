import { AgentCoordinator, AgentCommunication, AgentAlert } from './agent-coordinator';
import { ContractEvent } from './contract-control-agent';

export interface EmailData {
  id: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  attachments: EmailAttachment[];
  timestamp: Date;
  projectId?: number;
}

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
  size: number;
}

export interface ClassificationResult {
  type: 'compensation-event' | 'early-warning' | 'instruction' | 'notification' | 'query' | 'other';
  confidence: number;
  extractedData: any;
  suggestedActions: string[];
}

export class EmailIntakeAgent {
  private coordinator: AgentCoordinator;
  private classificationRules: Map<string, any> = new Map();
  private senderPatterns: Map<string, string> = new Map();

  constructor(coordinator: AgentCoordinator) {
    this.coordinator = coordinator;
    this.initializeClassificationRules();
    this.initializeSenderPatterns();
  }

  private initializeClassificationRules(): void {
    // Early Warning patterns
    this.classificationRules.set('early-warning', {
      subjectKeywords: ['warning', 'alert', 'risk', 'issue', 'problem', 'concern'],
      bodyKeywords: ['unforeseen', 'delay', 'impact', 'risk', 'problem', 'issue', 'weather', 'ground conditions'],
      urgencyIndicators: ['urgent', 'immediate', 'asap', 'critical'],
      clauseReferences: ['15.1', '15.2', '15.3']
    });

    // Compensation Event patterns
    this.classificationRules.set('compensation-event', {
      subjectKeywords: ['change', 'instruction', 'variation', 'additional', 'compensation'],
      bodyKeywords: ['change in scope', 'additional work', 'instruction', 'variation', 'compensation event'],
      urgencyIndicators: ['formal', 'instruction', 'implement'],
      clauseReferences: ['60.1', '61.1', '61.3', '62.1', '14.3']
    });

    // Project Manager Instruction patterns
    this.classificationRules.set('instruction', {
      subjectKeywords: ['instruction', 'direction', 'order', 'implement', 'proceed'],
      bodyKeywords: ['you are instructed', 'please implement', 'formal instruction', 'direction'],
      urgencyIndicators: ['immediate', 'proceed', 'implement'],
      clauseReferences: ['14.1', '14.2', '14.3']
    });
  }

  private initializeSenderPatterns(): void {
    // Map email patterns to roles
    this.senderPatterns.set('projectmanager@', 'project-manager');
    this.senderPatterns.set('pm@', 'project-manager');
    this.senderPatterns.set('client@', 'employer');
    this.senderPatterns.set('supervisor@', 'supervisor');
    this.senderPatterns.set('engineer@', 'engineer');
    this.senderPatterns.set('contractor@', 'contractor');
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

  // Main email processing entry point
  async processEmail(emailData: EmailData): Promise<void> {
    console.log(`Email Intake Agent processing email from ${emailData.from}`);

    try {
      // Classify email content
      const classification = await this.classifyEmail(emailData);
      
      // Extract project context
      const projectId = await this.extractProjectContext(emailData);
      
      // Process attachments
      const attachmentAnalysis = await this.processAttachments(emailData.attachments);

      // Route to appropriate agent based on classification
      await this.routeEmail(emailData, classification, projectId, attachmentAnalysis);

      // Create processing alert
      await this.createAlert({
        agentType: 'email-intake',
        severity: 'low',
        title: 'Email Processed',
        message: `Email from ${emailData.from} classified as ${classification.type}`,
        actionRequired: false,
        relatedEntity: { type: 'early-warning', id: emailData.id },
        projectId: projectId || 1
      });

    } catch (error) {
      console.error('Error processing email:', error);
      await this.createAlert({
        agentType: 'email-intake',
        severity: 'high',
        title: 'Email Processing Error',
        message: `Failed to process email from ${emailData.from}: ${error}`,
        actionRequired: true,
        relatedEntity: { type: 'early-warning', id: emailData.id },
        projectId: 1
      });
    }
  }

  private async classifyEmail(emailData: EmailData): Promise<ClassificationResult> {
    const subject = emailData.subject.toLowerCase();
    const body = emailData.body.toLowerCase();
    
    // Check for Early Warning patterns
    const ewRules = this.classificationRules.get('early-warning');
    const ewScore = this.calculateScore(subject, body, ewRules);

    // Check for Compensation Event patterns
    const ceRules = this.classificationRules.get('compensation-event');
    const ceScore = this.calculateScore(subject, body, ceRules);

    // Check for Instruction patterns
    const instRules = this.classificationRules.get('instruction');
    const instScore = this.calculateScore(subject, body, instRules);

    // Determine classification
    const scores = [
      { type: 'early-warning', score: ewScore },
      { type: 'compensation-event', score: ceScore },
      { type: 'instruction', score: instScore }
    ];

    const bestMatch = scores.reduce((prev, current) => 
      current.score > prev.score ? current : prev
    );

    const extractedData = this.extractKeyInformation(emailData, bestMatch.type);

    return {
      type: bestMatch.score > 0.3 ? bestMatch.type as any : 'other',
      confidence: bestMatch.score,
      extractedData,
      suggestedActions: this.generateSuggestedActions(bestMatch.type, bestMatch.score)
    };
  }

  private calculateScore(subject: string, body: string, rules: any): number {
    let score = 0;
    const content = `${subject} ${body}`;

    // Check subject keywords
    const subjectMatches = rules.subjectKeywords.filter((keyword: string) => 
      subject.includes(keyword)
    ).length;
    score += subjectMatches * 0.3;

    // Check body keywords
    const bodyMatches = rules.bodyKeywords.filter((keyword: string) => 
      body.includes(keyword)
    ).length;
    score += bodyMatches * 0.2;

    // Check urgency indicators
    const urgencyMatches = rules.urgencyIndicators.filter((indicator: string) => 
      content.includes(indicator)
    ).length;
    score += urgencyMatches * 0.2;

    // Check clause references
    const clauseMatches = rules.clauseReferences.filter((clause: string) => 
      content.includes(clause)
    ).length;
    score += clauseMatches * 0.3;

    return Math.min(score, 1.0);
  }

  private extractKeyInformation(emailData: EmailData, type: string): any {
    const extractedData: any = {
      sender: emailData.from,
      timestamp: emailData.timestamp,
      subject: emailData.subject
    };

    // Extract dates
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
    const dates = emailData.body.match(dateRegex) || [];
    if (dates.length > 0) {
      extractedData.mentionedDates = dates;
    }

    // Extract monetary values
    const moneyRegex = /£[\d,]+\.?\d*/g;
    const amounts = emailData.body.match(moneyRegex) || [];
    if (amounts.length > 0) {
      extractedData.mentionedAmounts = amounts;
    }

    // Extract clause references
    const clauseRegex = /\b\d+\.\d+\b/g;
    const clauses = emailData.body.match(clauseRegex) || [];
    if (clauses.length > 0) {
      extractedData.clauseReferences = clauses;
    }

    // Type-specific extraction
    switch (type) {
      case 'early-warning':
        extractedData.riskLevel = this.assessRiskLevel(emailData.body);
        extractedData.impactAreas = this.extractImpactAreas(emailData.body);
        break;
      case 'compensation-event':
        extractedData.changeType = this.extractChangeType(emailData.body);
        extractedData.estimatedImpact = this.extractImpactEstimate(emailData.body);
        break;
      case 'instruction':
        extractedData.instructionType = this.extractInstructionType(emailData.body);
        extractedData.deadline = this.extractDeadline(emailData.body);
        break;
    }

    return extractedData;
  }

  private assessRiskLevel(body: string): 'high' | 'medium' | 'low' {
    const highRiskKeywords = ['critical', 'urgent', 'severe', 'major', 'significant'];
    const mediumRiskKeywords = ['moderate', 'some', 'potential', 'possible'];
    
    if (highRiskKeywords.some(keyword => body.toLowerCase().includes(keyword))) {
      return 'high';
    }
    if (mediumRiskKeywords.some(keyword => body.toLowerCase().includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  private extractImpactAreas(body: string): string[] {
    const impactKeywords = ['cost', 'time', 'quality', 'safety', 'programme', 'schedule'];
    return impactKeywords.filter(keyword => body.toLowerCase().includes(keyword));
  }

  private extractChangeType(body: string): string {
    const changeTypes = ['scope change', 'design change', 'additional work', 'omission', 'variation'];
    return changeTypes.find(type => body.toLowerCase().includes(type)) || 'unspecified';
  }

  private extractImpactEstimate(body: string): any {
    const timeRegex = /(\d+)\s*(days?|weeks?|months?)/i;
    const costRegex = /£([\d,]+)/;
    
    const timeMatch = body.match(timeRegex);
    const costMatch = body.match(costRegex);
    
    return {
      timeImpact: timeMatch ? `${timeMatch[1]} ${timeMatch[2]}` : null,
      costImpact: costMatch ? costMatch[0] : null
    };
  }

  private extractInstructionType(body: string): string {
    const instructionTypes = ['proceed', 'stop', 'change', 'implement', 'suspend'];
    return instructionTypes.find(type => body.toLowerCase().includes(type)) || 'general';
  }

  private extractDeadline(body: string): Date | null {
    const deadlineRegex = /by\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i;
    const match = body.match(deadlineRegex);
    return match ? new Date(match[1]) : null;
  }

  private generateSuggestedActions(type: string, confidence: number): string[] {
    const actions: string[] = [];

    if (confidence > 0.7) {
      switch (type) {
        case 'early-warning':
          actions.push('Create Early Warning notification');
          actions.push('Schedule risk assessment meeting');
          actions.push('Notify affected parties');
          break;
        case 'compensation-event':
          actions.push('Create Compensation Event record');
          actions.push('Request formal quotation');
          actions.push('Assess time and cost impact');
          break;
        case 'instruction':
          actions.push('Acknowledge receipt of instruction');
          actions.push('Assess impact on programme');
          actions.push('Update project records');
          break;
      }
    } else {
      actions.push('Review email manually');
      actions.push('Verify classification accuracy');
    }

    return actions;
  }

  private async extractProjectContext(emailData: EmailData): Promise<number | null> {
    // Extract project information from email content
    const projectKeywords = ['westfield', 'northern gateway', 'project'];
    const subject = emailData.subject.toLowerCase();
    const body = emailData.body.toLowerCase();

    if (subject.includes('westfield') || body.includes('westfield')) {
      return 1; // Westfield Development Project
    }
    if (subject.includes('northern gateway') || body.includes('northern gateway')) {
      return 2; // Northern Gateway Interchange
    }

    // Default to first project if no specific match
    return 1;
  }

  private async processAttachments(attachments: EmailAttachment[]): Promise<any> {
    const analysis: any = {
      documentTypes: [],
      extractedText: [],
      potentialIssues: []
    };

    for (const attachment of attachments) {
      // Analyze attachment type
      if (attachment.contentType.includes('pdf')) {
        analysis.documentTypes.push('PDF Document');
        // Would integrate with PDF text extraction
      } else if (attachment.contentType.includes('image')) {
        analysis.documentTypes.push('Image');
        // Would integrate with image analysis
      } else if (attachment.filename.includes('.mpp') || attachment.filename.includes('.xml')) {
        analysis.documentTypes.push('Programme File');
        // Would integrate with programme analysis
      }
    }

    return analysis;
  }

  private async routeEmail(
    emailData: EmailData, 
    classification: ClassificationResult, 
    projectId: number | null,
    attachmentAnalysis: any
  ): Promise<void> {
    if (classification.confidence < 0.3) {
      // Low confidence - create manual review alert
      await this.createAlert({
        agentType: 'email-intake',
        severity: 'medium',
        title: 'Email Requires Manual Review',
        message: `Email from ${emailData.from} could not be automatically classified`,
        actionRequired: true,
        relatedEntity: { type: 'early-warning', id: emailData.id },
        projectId: projectId || 1
      });
      return;
    }

    // Create contract event for Contract Control Agent
    const contractEvent: ContractEvent = {
      type: classification.type as any,
      projectId: projectId || 1,
      title: emailData.subject,
      description: emailData.body.substring(0, 500), // Truncate for storage
      clauseReference: classification.extractedData.clauseReferences?.[0],
      severity: this.mapRiskToSeverity(classification.extractedData.riskLevel || 'medium'),
      timeImpact: classification.extractedData.impactAreas?.includes('time') || false,
      costImpact: classification.extractedData.impactAreas?.includes('cost') || false,
      source: 'email'
    };

    // Send to Contract Control Agent
    await this.coordinator.sendMessage({
      fromAgent: 'email-intake',
      toAgent: 'contract-control',
      messageType: 'data-update',
      payload: {
        type: 'contract-event',
        event: contractEvent,
        originalEmail: emailData,
        classification: classification
      }
    });
  }

  private mapRiskToSeverity(riskLevel: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (riskLevel) {
      case 'high': return 'critical';
      case 'medium': return 'high';
      case 'low': return 'medium';
      default: return 'medium';
    }
  }

  private async processDataUpdate(payload: any): Promise<void> {
    console.log('Email Intake Agent received data update:', payload);
  }

  private async processRequest(message: AgentCommunication): Promise<void> {
    console.log('Email Intake Agent received request:', message);
  }

  private async processAlert(alert: AgentAlert): Promise<void> {
    console.log('Email Intake Agent received alert:', alert);
  }

  private async createAlert(alert: Omit<AgentAlert, 'id' | 'timestamp' | 'status'>): Promise<void> {
    await this.coordinator.createAlert(alert);
  }

  // Process incoming email from external email service
  async processIncomingEmail(rawEmailData: any): Promise<void> {
    const emailData: EmailData = {
      id: rawEmailData.messageId || `email_${Date.now()}`,
      from: rawEmailData.from,
      to: rawEmailData.to,
      subject: rawEmailData.subject,
      body: rawEmailData.text || rawEmailData.html,
      attachments: rawEmailData.attachments || [],
      timestamp: new Date(rawEmailData.date)
    };

    await this.processEmail(emailData);
  }
}