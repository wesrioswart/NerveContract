/**
 * Email Intake Agent Workflow
 * Processes incoming emails, classifies content, and extracts relevant data
 */

import { eventBus } from '../event-bus';
import { db } from '../db';
import { 
  compensationEvents, 
  earlyWarnings, 
  rfis, 
  equipmentHires,
  projects 
} from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

interface EmailData {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachments?: string[];
  receivedAt: Date;
}

interface ClassificationResult {
  type: 'compensation_event' | 'early_warning' | 'rfi' | 'equipment_request' | 'general' | 'spam';
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  projectId?: number;
  extractedData: any;
  suggestedActions: string[];
}

export class EmailIntakeAgent {
  private anthropic: any;
  
  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
  }

  /**
   * Main workflow entry point
   */
  async processEmail(emailData: EmailData): Promise<void> {
    try {
      console.log(`📧 Email Intake Agent: Processing email from ${emailData.from}`);
      
      // Step 1: Security and spam filtering
      const isSecure = await this.securityCheck(emailData);
      if (!isSecure) {
        console.log('🚫 Email blocked by security filter');
        return;
      }

      // Step 2: AI-powered classification
      const classification = await this.classifyEmail(emailData);
      
      // Step 3: Project identification
      const projectId = await this.identifyProject(emailData, classification);
      
      // Step 4: Data extraction based on classification
      const extractedData = await this.extractRelevantData(emailData, classification);
      
      // Step 5: Create appropriate records
      await this.createRecords(classification, extractedData, projectId);
      
      // Step 6: Emit events for other agents
      await this.emitAgentEvents(classification, extractedData, projectId);
      
      // Step 7: Generate notifications
      await this.generateNotifications(classification, extractedData, projectId);
      
      console.log(`✅ Email processing complete: ${classification.type} (${classification.confidence}% confidence)`);
      
    } catch (error) {
      console.error('❌ Email Intake Agent error:', error);
      await this.handleError(emailData, error);
    }
  }

  /**
   * Security and spam filtering
   */
  private async securityCheck(emailData: EmailData): Promise<boolean> {
    // Check for spam indicators
    const spamKeywords = ['viagra', 'lottery', 'prince', 'urgent money'];
    const bodyLower = emailData.body.toLowerCase();
    
    if (spamKeywords.some(keyword => bodyLower.includes(keyword))) {
      return false;
    }

    // Check sender reputation (simplified)
    const trustedDomains = ['.gov', '.org', 'company.com'];
    const senderDomain = emailData.from.split('@')[1];
    
    // Allow internal emails and known domains
    return trustedDomains.some(domain => senderDomain.includes(domain)) || 
           senderDomain.includes('westfield') || 
           senderDomain.includes('contractor');
  }

  /**
   * AI-powered email classification
   */
  private async classifyEmail(emailData: EmailData): Promise<ClassificationResult> {
    if (!this.anthropic) {
      return this.fallbackClassification(emailData);
    }

    try {
      const prompt = `
Analyze this construction project email and classify it:

From: ${emailData.from}
Subject: ${emailData.subject}
Body: ${emailData.body}

Classify as one of:
- compensation_event: Contract variations, cost changes, delays
- early_warning: Risks, issues, potential problems
- rfi: Requests for information, clarifications
- equipment_request: Equipment hire/return requests
- general: General correspondence
- spam: Unwanted/irrelevant content

Respond with JSON:
{
  "type": "classification",
  "confidence": 0-100,
  "urgency": "low|medium|high|critical",
  "extractedData": {
    "keyPoints": ["point1", "point2"],
    "amounts": ["£1000"],
    "dates": ["2025-01-15"],
    "references": ["CE001", "EW002"]
  },
  "suggestedActions": ["action1", "action2"]
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error('AI classification failed, using fallback:', error);
      return this.fallbackClassification(emailData);
    }
  }

  /**
   * Fallback classification using keyword matching
   */
  private fallbackClassification(emailData: EmailData): ClassificationResult {
    const content = `${emailData.subject} ${emailData.body}`.toLowerCase();
    
    if (content.includes('compensation') || content.includes('variation') || content.includes('change')) {
      return {
        type: 'compensation_event',
        confidence: 70,
        urgency: 'medium',
        extractedData: { source: 'keyword_match' },
        suggestedActions: ['Review for compensation event']
      };
    }
    
    if (content.includes('warning') || content.includes('risk') || content.includes('issue')) {
      return {
        type: 'early_warning',
        confidence: 70,
        urgency: 'high',
        extractedData: { source: 'keyword_match' },
        suggestedActions: ['Assess risk level']
      };
    }
    
    if (content.includes('information') || content.includes('clarification') || content.includes('query')) {
      return {
        type: 'rfi',
        confidence: 70,
        urgency: 'medium',
        extractedData: { source: 'keyword_match' },
        suggestedActions: ['Prepare response']
      };
    }
    
    if (content.includes('equipment') || content.includes('hire') || content.includes('machinery')) {
      return {
        type: 'equipment_request',
        confidence: 70,
        urgency: 'medium',
        extractedData: { source: 'keyword_match' },
        suggestedActions: ['Check equipment availability']
      };
    }
    
    return {
      type: 'general',
      confidence: 50,
      urgency: 'low',
      extractedData: { source: 'fallback' },
      suggestedActions: ['File for reference']
    };
  }

  /**
   * Identify which project this email relates to
   */
  private async identifyProject(emailData: EmailData, classification: ClassificationResult): Promise<number | null> {
    try {
      const allProjects = await db.select().from(projects);
      
      // Check for project references in subject/body
      const content = `${emailData.subject} ${emailData.body}`.toLowerCase();
      
      for (const project of allProjects) {
        const projectName = project.name.toLowerCase();
        if (content.includes(projectName) || 
            content.includes(project.id.toString()) ||
            content.includes('westfield')) {
          return project.id;
        }
      }
      
      // Default to first project if no match found
      return allProjects[0]?.id || null;
    } catch (error) {
      console.error('Project identification failed:', error);
      return null;
    }
  }

  /**
   * Extract relevant data based on classification
   */
  private async extractRelevantData(emailData: EmailData, classification: ClassificationResult): Promise<any> {
    const baseData = {
      sourceEmail: emailData.from,
      subject: emailData.subject,
      body: emailData.body,
      receivedAt: emailData.receivedAt,
      attachments: emailData.attachments || [],
      classification: classification.type,
      confidence: classification.confidence
    };

    switch (classification.type) {
      case 'compensation_event':
        return {
          ...baseData,
          estimatedValue: this.extractMoneyAmount(emailData.body),
          clauseReference: this.extractClauseReference(emailData.body),
          description: this.extractDescription(emailData.body, 'compensation event')
        };
        
      case 'early_warning':
        return {
          ...baseData,
          severity: classification.urgency,
          category: this.extractCategory(emailData.body),
          description: this.extractDescription(emailData.body, 'early warning'),
          mitigationSuggestions: classification.suggestedActions
        };
        
      case 'rfi':
        return {
          ...baseData,
          requestType: 'general',
          description: this.extractDescription(emailData.body, 'information request'),
          responseRequired: true
        };
        
      case 'equipment_request':
        return {
          ...baseData,
          equipmentType: this.extractEquipmentType(emailData.body),
          requestType: this.extractRequestType(emailData.body),
          urgency: classification.urgency
        };
        
      default:
        return baseData;
    }
  }

  /**
   * Create appropriate database records
   */
  private async createRecords(classification: ClassificationResult, extractedData: any, projectId: number | null): Promise<void> {
    if (!projectId) return;

    try {
      switch (classification.type) {
        case 'compensation_event':
          await db.insert(compensationEvents).values({
            projectId,
            title: extractedData.subject,
            description: extractedData.description || extractedData.body,
            clauseReference: extractedData.clauseReference || 'TBD',
            estimatedValue: extractedData.estimatedValue,
            status: 'draft',
            raisedById: 1, // System user for email intake
            sourceEmail: extractedData.sourceEmail
          });
          break;
          
        case 'early_warning':
          await db.insert(earlyWarnings).values({
            projectId,
            title: extractedData.subject,
            description: extractedData.description || extractedData.body,
            severity: extractedData.severity || 'medium',
            category: extractedData.category || 'general',
            status: 'open',
            raisedById: 1,
            sourceEmail: extractedData.sourceEmail
          });
          break;
          
        case 'rfi':
          await db.insert(rfis).values({
            projectId,
            reference: `RFI-${Date.now()}`,
            title: extractedData.subject,
            description: extractedData.description || extractedData.body,
            status: 'Open',
            transmittalMethod: 'Email',
            submissionDate: new Date().toISOString().split('T')[0],
            contractualReplyPeriod: 14,
            plannedResponseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdBy: 1
          });
          break;
      }
    } catch (error) {
      console.error('Failed to create database records:', error);
    }
  }

  /**
   * Emit events for other agents
   */
  private async emitAgentEvents(classification: ClassificationResult, extractedData: any, projectId: number | null): Promise<void> {
    if (!projectId) return;

    switch (classification.type) {
      case 'compensation_event':
        eventBus.emitEvent('compensationEvent.notice', {
          projectId,
          title: extractedData.subject,
          description: extractedData.description || extractedData.body,
          clauseReference: extractedData.clauseReference || 'TBD',
          estimatedValue: extractedData.estimatedValue,
          raisedBy: 1,
          sourceEmail: extractedData.sourceEmail,
          extractedData
        });
        break;
        
      case 'early_warning':
        eventBus.emitEvent('earlyWarning.received', {
          projectId,
          description: extractedData.description || extractedData.body,
          raisedBy: 1,
          severity: extractedData.severity || 'medium',
          category: extractedData.category || 'general',
          mitigationSuggestions: extractedData.mitigationSuggestions,
          sourceEmail: extractedData.sourceEmail,
          extractedData
        });
        break;
    }

    // Always emit email classification event
    eventBus.emitEvent('email.classified', {
      emailId: `${Date.now()}`,
      from: extractedData.sourceEmail,
      subject: extractedData.subject,
      classification: classification.type,
      confidence: classification.confidence,
      projectId,
      extractedData
    });
  }

  /**
   * Generate notifications for relevant users
   */
  private async generateNotifications(classification: ClassificationResult, extractedData: any, projectId: number | null): Promise<void> {
    if (!projectId) return;

    const urgencyMap = {
      'low': 'info',
      'medium': 'warning', 
      'high': 'error',
      'critical': 'error'
    };

    eventBus.emitEvent('notification.send', {
      recipientType: 'project',
      recipientId: projectId,
      message: `New ${classification.type.replace('_', ' ')} received: ${extractedData.subject}`,
      type: urgencyMap[classification.urgency] as any,
      priority: classification.urgency,
      actionRequired: classification.urgency === 'high' || classification.urgency === 'critical'
    });
  }

  /**
   * Error handling
   */
  private async handleError(emailData: EmailData, error: any): Promise<void> {
    console.error('Email processing error:', error);
    
    // Log error for debugging
    const errorLog = {
      timestamp: new Date(),
      from: emailData.from,
      subject: emailData.subject,
      error: error.message,
      stack: error.stack
    };
    
    // In production, you might want to store this in a dedicated error table
    console.log('Error details:', errorLog);
  }

  // Utility methods for data extraction
  private extractMoneyAmount(text: string): number | null {
    const matches = text.match(/£?([\d,]+(?:\.\d{2})?)/);
    return matches ? parseFloat(matches[1].replace(',', '')) : null;
  }

  private extractClauseReference(text: string): string | null {
    const matches = text.match(/(clause\s+\d+(?:\.\d+)*|section\s+\d+(?:\.\d+)*)/i);
    return matches ? matches[1] : null;
  }

  private extractDescription(text: string, type: string): string {
    // Extract the first meaningful sentence or paragraph
    const sentences = text.split(/[.!?]+/);
    return sentences.find(s => s.trim().length > 20)?.trim() || `${type} from email`;
  }

  private extractCategory(text: string): string {
    const categories = ['safety', 'quality', 'environmental', 'commercial', 'programme'];
    const textLower = text.toLowerCase();
    
    for (const category of categories) {
      if (textLower.includes(category)) {
        return category;
      }
    }
    return 'general';
  }

  private extractEquipmentType(text: string): string {
    const equipment = ['excavator', 'crane', 'truck', 'generator', 'compressor'];
    const textLower = text.toLowerCase();
    
    for (const type of equipment) {
      if (textLower.includes(type)) {
        return type;
      }
    }
    return 'general';
  }

  private extractRequestType(text: string): 'hire' | 'return' | 'maintenance' {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('return') || textLower.includes('off-hire')) {
      return 'return';
    } else if (textLower.includes('maintenance') || textLower.includes('repair')) {
      return 'maintenance';
    }
    return 'hire';
  }
}

export const emailIntakeAgent = new EmailIntakeAgent();