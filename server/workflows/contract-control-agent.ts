/**
 * Contract Control Agent Workflow
 * Monitors contract compliance, manages deadlines, and tracks NEC4 clause requirements
 */

import { eventBus } from '../event-bus';
import { db } from '../db';
import { 
  compensationEvents, 
  earlyWarnings, 
  projects,
  users,
  projectPeriods
} from '../../shared/schema';
import { eq, and, gte, lte, isNull, or } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

interface ContractEvent {
  id: number;
  type: 'compensation_event' | 'early_warning';
  projectId: number;
  title: string;
  description: string;
  createdAt: Date;
  deadline?: Date;
  status: string;
  clauseReference?: string;
}

interface ComplianceCheck {
  eventId: number;
  eventType: string;
  isCompliant: boolean;
  violations: string[];
  recommendations: string[];
  deadlines: {
    notification: Date;
    assessment: Date;
    implementation: Date;
  };
}

export class ContractControlAgent {
  private anthropic: any;
  
  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
  }

  /**
   * Main workflow entry point - runs periodic compliance monitoring
   */
  async runComplianceMonitoring(): Promise<void> {
    try {
      console.log('📋 Contract Control Agent: Starting compliance monitoring');
      
      // Step 1: Get all active projects
      const activeProjects = await this.getActiveProjects();
      
      for (const project of activeProjects) {
        // Step 2: Check compensation events compliance
        await this.checkCompensationEventsCompliance(project.id);
        
        // Step 3: Check early warnings compliance  
        await this.checkEarlyWarningsCompliance(project.id);
        
        // Step 4: Monitor deadlines
        await this.monitorDeadlines(project.id);
        
        // Step 5: Generate compliance reports
        await this.generateComplianceReport(project.id);
      }
      
      console.log('✅ Contract Control Agent: Compliance monitoring complete');
      
    } catch (error) {
      console.error('❌ Contract Control Agent error:', error);
    }
  }

  /**
   * Handle new compensation event
   */
  async handleCompensationEvent(eventData: any): Promise<void> {
    try {
      console.log(`📋 Contract Control Agent: Processing compensation event ${eventData.title}`);
      
      // Step 1: Validate NEC4 compliance
      const compliance = await this.validateNEC4Compliance(eventData, 'compensation_event');
      
      // Step 2: Set mandatory deadlines
      const deadlines = this.calculateNEC4Deadlines(eventData, 'compensation_event');
      
      // Step 3: Check clause reference validity
      const clauseValidation = await this.validateClauseReference(eventData.clauseReference);
      
      // Step 4: Generate compliance alerts if needed
      if (!compliance.isCompliant) {
        await this.generateComplianceAlert(eventData, compliance);
      }
      
      // Step 5: Update event with compliance data
      await this.updateEventCompliance(eventData.projectId, eventData, compliance, deadlines);
      
      console.log(`✅ Compensation event compliance check complete`);
      
    } catch (error) {
      console.error('❌ Compensation event compliance error:', error);
    }
  }

  /**
   * Handle new early warning
   */
  async handleEarlyWarning(eventData: any): Promise<void> {
    try {
      console.log(`📋 Contract Control Agent: Processing early warning ${eventData.description}`);
      
      // Step 1: Validate NEC4 compliance
      const compliance = await this.validateNEC4Compliance(eventData, 'early_warning');
      
      // Step 2: Set mandatory deadlines
      const deadlines = this.calculateNEC4Deadlines(eventData, 'early_warning');
      
      // Step 3: Assess risk impact on contract
      const riskAssessment = await this.assessContractRisk(eventData);
      
      // Step 4: Generate compliance alerts if needed
      if (!compliance.isCompliant || riskAssessment.severity === 'critical') {
        await this.generateComplianceAlert(eventData, compliance);
      }
      
      // Step 5: Update early warning with compliance data
      await this.updateEventCompliance(eventData.projectId, eventData, compliance, deadlines);
      
      console.log(`✅ Early warning compliance check complete`);
      
    } catch (error) {
      console.error('❌ Early warning compliance error:', error);
    }
  }

  /**
   * Get all active projects
   */
  private async getActiveProjects(): Promise<any[]> {
    return await db.select().from(projects).where(eq(projects.status, 'active'));
  }

  /**
   * Check compensation events compliance for a project
   */
  private async checkCompensationEventsCompliance(projectId: number): Promise<void> {
    const events = await db.select()
      .from(compensationEvents)
      .where(eq(compensationEvents.projectId, projectId));

    for (const event of events) {
      const compliance = await this.validateNEC4Compliance(event, 'compensation_event');
      
      if (!compliance.isCompliant) {
        await this.generateComplianceAlert(event, compliance);
      }
      
      // Check deadlines
      await this.checkEventDeadlines(event, 'compensation_event');
    }
  }

  /**
   * Check early warnings compliance for a project
   */
  private async checkEarlyWarningsCompliance(projectId: number): Promise<void> {
    const warnings = await db.select()
      .from(earlyWarnings)
      .where(eq(earlyWarnings.projectId, projectId));

    for (const warning of warnings) {
      const compliance = await this.validateNEC4Compliance(warning, 'early_warning');
      
      if (!compliance.isCompliant) {
        await this.generateComplianceAlert(warning, compliance);
      }
      
      // Check deadlines
      await this.checkEventDeadlines(warning, 'early_warning');
    }
  }

  /**
   * Validate NEC4 compliance using AI
   */
  private async validateNEC4Compliance(eventData: any, eventType: string): Promise<ComplianceCheck> {
    if (!this.anthropic) {
      return this.fallbackComplianceCheck(eventData, eventType);
    }

    try {
      const prompt = `
Analyze this NEC4 contract event for compliance:

Event Type: ${eventType}
Title: ${eventData.title}
Description: ${eventData.description}
Clause Reference: ${eventData.clauseReference || 'Not specified'}
Status: ${eventData.status}
Created: ${eventData.createdAt || eventData.raisedAt}

Check against NEC4 requirements:
1. Proper notification procedures
2. Required documentation
3. Time limits and deadlines
4. Clause reference accuracy
5. Risk register updates

Respond with JSON:
{
  "isCompliant": boolean,
  "violations": ["violation1", "violation2"],
  "recommendations": ["action1", "action2"],
  "clauseReferences": ["60.1", "61.3"],
  "riskLevel": "low|medium|high|critical"
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      const aiResult = JSON.parse(response.content[0].text);
      
      return {
        eventId: eventData.id,
        eventType,
        isCompliant: aiResult.isCompliant,
        violations: aiResult.violations || [],
        recommendations: aiResult.recommendations || [],
        deadlines: this.calculateNEC4Deadlines(eventData, eventType)
      };
      
    } catch (error) {
      console.error('AI compliance check failed, using fallback:', error);
      return this.fallbackComplianceCheck(eventData, eventType);
    }
  }

  /**
   * Fallback compliance check using rule-based logic
   */
  private fallbackComplianceCheck(eventData: any, eventType: string): ComplianceCheck {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check for missing clause reference
    if (!eventData.clauseReference) {
      violations.push('Missing NEC4 clause reference');
      recommendations.push('Add relevant NEC4 clause reference');
    }

    // Check for incomplete description
    if (!eventData.description || eventData.description.length < 50) {
      violations.push('Insufficient description detail');
      recommendations.push('Provide comprehensive description with technical details');
    }

    // Check status progression for compensation events
    if (eventType === 'compensation_event' && eventData.status === 'draft') {
      const daysSinceCreated = Math.floor((Date.now() - new Date(eventData.createdAt || eventData.raisedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceCreated > 7) {
        violations.push('Compensation event overdue for assessment');
        recommendations.push('Complete assessment and quotation within NEC4 time limits');
      }
    }

    return {
      eventId: eventData.id,
      eventType,
      isCompliant: violations.length === 0,
      violations,
      recommendations,
      deadlines: this.calculateNEC4Deadlines(eventData, eventType)
    };
  }

  /**
   * Calculate NEC4 deadlines based on event type
   */
  private calculateNEC4Deadlines(eventData: any, eventType: string): any {
    const createdDate = new Date(eventData.createdAt || eventData.raisedAt || Date.now());
    
    if (eventType === 'compensation_event') {
      return {
        notification: new Date(createdDate.getTime() + (1 * 24 * 60 * 60 * 1000)), // 1 day
        assessment: new Date(createdDate.getTime() + (21 * 24 * 60 * 60 * 1000)), // 3 weeks
        implementation: new Date(createdDate.getTime() + (35 * 24 * 60 * 60 * 1000)) // 5 weeks
      };
    } else if (eventType === 'early_warning') {
      return {
        notification: new Date(createdDate.getTime() + (1 * 24 * 60 * 60 * 1000)), // 1 day
        assessment: new Date(createdDate.getTime() + (7 * 24 * 60 * 60 * 1000)), // 1 week
        implementation: new Date(createdDate.getTime() + (14 * 24 * 60 * 60 * 1000)) // 2 weeks
      };
    }
    
    return {
      notification: createdDate,
      assessment: createdDate,
      implementation: createdDate
    };
  }

  /**
   * Validate clause reference against NEC4 database
   */
  private async validateClauseReference(clauseReference: string | null): Promise<boolean> {
    if (!clauseReference) return false;
    
    // NEC4 main clause patterns
    const validPatterns = [
      /^\d{2}\.\d+$/, // e.g., 60.1, 61.3
      /^X\d+\.\d+$/, // e.g., X1.1, X2.5
      /^Z\d+\.\d+$/, // e.g., Z1.1
      /^W\d+\.\d+$/  // e.g., W1.1
    ];
    
    return validPatterns.some(pattern => pattern.test(clauseReference));
  }

  /**
   * Assess contract risk impact
   */
  private async assessContractRisk(eventData: any): Promise<any> {
    // Simplified risk assessment
    const riskKeywords = {
      critical: ['safety', 'fatality', 'collapse', 'emergency'],
      high: ['delay', 'cost overrun', 'quality failure', 'non-compliance'],
      medium: ['variation', 'change', 'clarification'],
      low: ['information', 'routine', 'standard']
    };
    
    const description = (eventData.description || '').toLowerCase();
    
    for (const [level, keywords] of Object.entries(riskKeywords)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        return { severity: level, keywords: keywords.filter(k => description.includes(k)) };
      }
    }
    
    return { severity: 'low', keywords: [] };
  }

  /**
   * Monitor deadlines for overdue items
   */
  private async monitorDeadlines(projectId: number): Promise<void> {
    const now = new Date();
    
    // Check compensation events
    const overdueCompEvents = await db.select()
      .from(compensationEvents)
      .where(
        and(
          eq(compensationEvents.projectId, projectId),
          or(
            eq(compensationEvents.status, 'draft'),
            eq(compensationEvents.status, 'assessment')
          )
        )
      );

    for (const event of overdueCompEvents) {
      const daysSinceCreated = Math.floor((now.getTime() - new Date(event.raisedAt).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceCreated > 21) { // NEC4 standard assessment period
        await this.generateDeadlineAlert(event, 'compensation_event', daysSinceCreated);
      }
    }

    // Check early warnings
    const overdueWarnings = await db.select()
      .from(earlyWarnings)
      .where(
        and(
          eq(earlyWarnings.projectId, projectId),
          eq(earlyWarnings.status, 'open')
        )
      );

    for (const warning of overdueWarnings) {
      const daysSinceCreated = Math.floor((now.getTime() - new Date(warning.raisedAt).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceCreated > 7) { // Early warning response period
        await this.generateDeadlineAlert(warning, 'early_warning', daysSinceCreated);
      }
    }
  }

  /**
   * Generate compliance alert
   */
  private async generateComplianceAlert(eventData: any, compliance: ComplianceCheck): Promise<void> {
    const alertMessage = `
Compliance Alert: ${eventData.title || 'Unnamed Event'}

Violations:
${compliance.violations.map(v => `• ${v}`).join('\n')}

Recommendations:
${compliance.recommendations.map(r => `• ${r}`).join('\n')}
`;

    eventBus.emitEvent('notification.send', {
      recipientType: 'project',
      recipientId: eventData.projectId,
      message: `Compliance alert for ${eventData.title}`,
      type: 'error',
      priority: 'high',
      actionRequired: true
    });
  }

  /**
   * Generate deadline alert
   */
  private async generateDeadlineAlert(eventData: any, eventType: string, daysOverdue: number): Promise<void> {
    eventBus.emitEvent('notification.send', {
      recipientType: 'project',
      recipientId: eventData.projectId,
      message: `${eventType.replace('_', ' ')} overdue: ${eventData.title} (${daysOverdue} days)`,
      type: 'warning',
      priority: 'high',
      actionRequired: true
    });
  }

  /**
   * Check event deadlines
   */
  private async checkEventDeadlines(eventData: any, eventType: string): Promise<void> {
    const deadlines = this.calculateNEC4Deadlines(eventData, eventType);
    const now = new Date();
    
    // Check if any deadlines are missed
    Object.entries(deadlines).forEach(([phase, deadline]) => {
      if (now > deadline) {
        this.generateDeadlineAlert(eventData, eventType, Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)));
      }
    });
  }

  /**
   * Update event with compliance data
   */
  private async updateEventCompliance(projectId: number, eventData: any, compliance: ComplianceCheck, deadlines: any): Promise<void> {
    // In a real implementation, you might add compliance fields to your database schema
    // For now, we'll emit events with the compliance data
    
    eventBus.emitEvent('notification.send', {
      recipientType: 'project',
      recipientId: projectId,
      message: `Compliance check complete for ${eventData.title}: ${compliance.isCompliant ? 'Compliant' : 'Non-compliant'}`,
      type: compliance.isCompliant ? 'success' : 'warning',
      priority: compliance.isCompliant ? 'low' : 'medium',
      actionRequired: !compliance.isCompliant
    });
  }

  /**
   * Generate compliance report for a project
   */
  private async generateComplianceReport(projectId: number): Promise<void> {
    try {
      // Get all events for the project
      const compEvents = await db.select().from(compensationEvents).where(eq(compensationEvents.projectId, projectId));
      const warnings = await db.select().from(earlyWarnings).where(eq(earlyWarnings.projectId, projectId));
      
      const totalEvents = compEvents.length + warnings.length;
      const overdueEvents = [...compEvents, ...warnings].filter(event => {
        const daysSinceCreated = Math.floor((Date.now() - new Date(event.raisedAt || event.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceCreated > 14; // Consider overdue after 2 weeks
      });
      
      const complianceRate = totalEvents > 0 ? ((totalEvents - overdueEvents.length) / totalEvents * 100).toFixed(1) : '100';
      
      console.log(`📊 Project ${projectId} Compliance Report:`);
      console.log(`   Total Events: ${totalEvents}`);
      console.log(`   Overdue Events: ${overdueEvents.length}`);
      console.log(`   Compliance Rate: ${complianceRate}%`);
      
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
    }
  }
}

export const contractControlAgent = new ContractControlAgent();

// Event listeners
eventBus.onEvent('compensationEvent.notice', (data) => {
  contractControlAgent.handleCompensationEvent(data);
});

eventBus.onEvent('earlyWarning.received', (data) => {
  contractControlAgent.handleEarlyWarning(data);
});