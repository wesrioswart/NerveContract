/**
 * Approval Workflow Service
 * Handles smart decision making and approval routing based on impact
 */

import { db } from '../db';
import { 
  programmeApprovals, 
  compensationEvents, 
  earlyWarnings, 
  users, 
  projects,
  approvalHierarchy,
  approvalAuditTrail,
  type ApprovalHierarchy,
  type ApprovalAuditTrail
} from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { eventBus } from '../event-bus';
import { sendEmail } from './email-service';

export interface ApprovalRequest {
  id: string;
  projectId: number;
  changeType: 'compensation_event' | 'early_warning' | 'programme_change' | 'budget_change' | 'resource_change' | 'contract_modification' | 'procurement_change';
  title: string;
  description: string;
  impact: {
    delayDays: number;
    affectsCriticalPath: boolean;
    cost: number;
    confidence: number;
  };
  nec4Compliance: {
    isValid: boolean;
    clause: string;
    reason: string;
  };
  autoApproved: boolean;
  approvalRequired: boolean;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  // Enhanced authorization tracking
  authorizedBy?: number;
  authorizationLevel?: 'project_manager' | 'senior_manager' | 'director' | 'board';
  authorizationNotes?: string;
  reviewedBy?: number;
  reviewedAt?: Date;
  reviewNotes?: string;
  urgencyLevel?: 'low' | 'normal' | 'high' | 'critical';
  estimatedValue?: number;
  budgetImpact?: {
    originalBudget: number;
    newBudget: number;
    variance: number;
    reason: string;
  };
  riskAssessment?: {
    level: 'low' | 'medium' | 'high' | 'critical';
    mitigations: string[];
    probabilityOfCost: number;
    probabilityOfDelay: number;
  };
}

export interface ApprovalDecision {
  approved: boolean;
  modifiedImpact?: {
    delayDays: number;
    cost: number;
    reason: string;
  };
  reason?: string;
  approvedBy: string;
}

export class ApprovalWorkflowService {
  
  /**
   * Setup approval hierarchy for a project
   */
  async setupApprovalHierarchy(
    projectId: number,
    userId: number,
    authorizationLevel: 'project_manager' | 'senior_manager' | 'director' | 'board',
    maxApprovalValue: number,
    canApproveTypes: string[]
  ): Promise<void> {
    await db.insert(approvalHierarchy).values({
      projectId,
      userId,
      authorizationLevel,
      maxApprovalValue,
      canApproveTypes: JSON.stringify(canApproveTypes),
      isActive: true,
    });
  }

  /**
   * Get authorized approvers for a specific change type and value
   */
  async getAuthorizedApprovers(
    projectId: number,
    changeType: string,
    estimatedValue: number
  ): Promise<ApprovalHierarchy[]> {
    const approvers = await db
      .select()
      .from(approvalHierarchy)
      .where(and(
        eq(approvalHierarchy.projectId, projectId),
        eq(approvalHierarchy.isActive, true)
      ));

    return approvers.filter(approver => {
      const canApproveTypes = JSON.parse(approver.canApproveTypes as string || '[]');
      return canApproveTypes.includes(changeType) && 
             (approver.maxApprovalValue || 0) >= estimatedValue;
    });
  }

  /**
   * Log audit trail for approval actions
   */
  async logAuditTrail(
    approvalId: string,
    action: 'created' | 'reviewed' | 'approved' | 'rejected' | 'modified',
    performedBy: number,
    previousStatus?: string,
    newStatus?: string,
    comments?: string,
    changes?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await db.insert(approvalAuditTrail).values({
      approvalId,
      action,
      performedBy,
      previousStatus,
      newStatus,
      comments,
      changes: JSON.stringify(changes),
      ipAddress,
      userAgent,
    });
  }

  /**
   * Analyze impact and determine approval requirements
   */
  async analyzeImpactAndRoute(
    projectId: number,
    changeType: 'compensation_event' | 'early_warning' | 'programme_change' | 'budget_change' | 'resource_change' | 'contract_modification' | 'procurement_change',
    eventData: any
  ): Promise<ApprovalRequest> {
    console.log(`🔍 Analyzing impact for ${changeType} in project ${projectId}`);
    
    // Step 1: Calculate impact
    const impact = await this.calculateImpact(eventData);
    
    // Step 2: Determine approval requirements based on impact
    const approvalDecision = this.determineApprovalRequirements(impact);
    
    // Step 3: Create approval request
    const approvalRequest: ApprovalRequest = {
      id: `${changeType}_${Date.now()}`,
      projectId,
      changeType,
      title: eventData.title || eventData.description?.substring(0, 50) || 'Schedule Change',
      description: eventData.description || 'Programme change request',
      impact,
      nec4Compliance: await this.validateNEC4Compliance(eventData),
      autoApproved: approvalDecision.autoApprove,
      approvalRequired: approvalDecision.requiresApproval,
      requestedBy: 'AI Agent',
      requestedAt: new Date(),
      status: approvalDecision.autoApprove ? 'auto_approved' : 'pending'
    };
    
    // Step 4: Process based on decision
    if (approvalDecision.autoApprove) {
      await this.processAutoApproval(approvalRequest);
    } else {
      await this.requestHumanApproval(approvalRequest);
    }
    
    return approvalRequest;
  }
  
  /**
   * Calculate impact of the change
   */
  private async calculateImpact(eventData: any): Promise<ApprovalRequest['impact']> {
    // Basic impact calculation - in production, this would be more sophisticated
    let delayDays = 0;
    let cost = 0;
    let affectsCriticalPath = false;
    let confidence = 0.8;
    
    // Analyze event type and description for impact
    if (eventData.type === 'compensation_event') {
      // Extract delay information from CE
      const delayMatch = eventData.description?.match(/(\d+)\s*days?/i);
      if (delayMatch) {
        delayDays = parseInt(delayMatch[1]);
      }
      
      // Estimate cost based on clause type
      if (eventData.clauseReference?.includes('60.1(12)')) {
        cost = delayDays * 2000; // £2k per day for physical conditions
      } else if (eventData.clauseReference?.includes('60.1(1)')) {
        cost = delayDays * 5000; // £5k per day for design changes
      }
      
      // Check if affects critical path
      affectsCriticalPath = eventData.description?.toLowerCase().includes('critical') || 
                           eventData.description?.toLowerCase().includes('foundation') ||
                           eventData.description?.toLowerCase().includes('structure');
    }
    
    return {
      delayDays,
      affectsCriticalPath,
      cost,
      confidence
    };
  }
  
  /**
   * Determine approval requirements based on impact
   */
  private determineApprovalRequirements(impact: ApprovalRequest['impact']): {
    autoApprove: boolean;
    requiresApproval: boolean;
    approvalLevel: 'auto' | 'project_manager' | 'senior_management' | 'board';
  } {
    // Smart decision making based on impact
    if (impact.delayDays === 0 && impact.cost < 1000) {
      return {
        autoApprove: true,
        requiresApproval: false,
        approvalLevel: 'auto'
      };
    }
    
    if (impact.delayDays <= 1 && !impact.affectsCriticalPath && impact.cost < 5000) {
      return {
        autoApprove: true,
        requiresApproval: false,
        approvalLevel: 'auto'
      };
    }
    
    if (impact.delayDays <= 3 && impact.cost < 25000) {
      return {
        autoApprove: false,
        requiresApproval: true,
        approvalLevel: 'project_manager'
      };
    }
    
    if (impact.delayDays > 3 || impact.affectsCriticalPath || impact.cost >= 25000) {
      return {
        autoApprove: false,
        requiresApproval: true,
        approvalLevel: 'senior_management'
      };
    }
    
    return {
      autoApprove: false,
      requiresApproval: true,
      approvalLevel: 'project_manager'
    };
  }
  
  /**
   * Validate NEC4 compliance
   */
  private async validateNEC4Compliance(eventData: any): Promise<ApprovalRequest['nec4Compliance']> {
    // Basic NEC4 validation - in production, this would be more comprehensive
    if (eventData.clauseReference) {
      return {
        isValid: true,
        clause: eventData.clauseReference,
        reason: 'Valid NEC4 clause reference found'
      };
    }
    
    return {
      isValid: false,
      clause: '',
      reason: 'No valid NEC4 clause reference found'
    };
  }
  
  /**
   * Process auto-approval
   */
  private async processAutoApproval(approvalRequest: ApprovalRequest): Promise<void> {
    console.log(`✅ Auto-approving ${approvalRequest.title} (${approvalRequest.impact.delayDays} days, £${approvalRequest.impact.cost})`);
    
    // Store approval record
    await db.insert(programmeApprovals).values({
      id: approvalRequest.id,
      projectId: approvalRequest.projectId,
      changeType: approvalRequest.changeType,
      title: approvalRequest.title,
      description: approvalRequest.description,
      impactDays: approvalRequest.impact.delayDays,
      impactCost: approvalRequest.impact.cost,
      affectsCriticalPath: approvalRequest.impact.affectsCriticalPath,
      confidence: approvalRequest.impact.confidence,
      nec4Clause: approvalRequest.nec4Compliance.clause,
      autoApproved: true,
      status: 'auto_approved',
      requestedAt: approvalRequest.requestedAt,
      approvedAt: new Date(),
      approvedBy: 'AI Agent'
    });
    
    // Emit event for programme execution
    eventBus.emitEvent('approval.completed', {
      approvalId: approvalRequest.id,
      approved: true,
      autoApproved: true,
      projectId: approvalRequest.projectId
    });
    
    // Send notification
    await this.sendApprovalNotification(approvalRequest, 'auto_approved');
  }
  
  /**
   * Request human approval
   */
  private async requestHumanApproval(approvalRequest: ApprovalRequest): Promise<void> {
    console.log(`📋 Requesting approval for ${approvalRequest.title} (${approvalRequest.impact.delayDays} days, £${approvalRequest.impact.cost})`);
    
    // Store approval request
    await db.insert(programmeApprovals).values({
      id: approvalRequest.id,
      projectId: approvalRequest.projectId,
      changeType: approvalRequest.changeType,
      title: approvalRequest.title,
      description: approvalRequest.description,
      impactDays: approvalRequest.impact.delayDays,
      impactCost: approvalRequest.impact.cost,
      affectsCriticalPath: approvalRequest.impact.affectsCriticalPath,
      confidence: approvalRequest.impact.confidence,
      nec4Clause: approvalRequest.nec4Compliance.clause,
      autoApproved: false,
      status: 'pending',
      requestedAt: approvalRequest.requestedAt
    });
    
    // Send email to project manager
    await this.sendApprovalEmail(approvalRequest);
    
    // Create dashboard notification
    await this.createDashboardNotification(approvalRequest);
  }
  
  /**
   * Process human approval decision
   */
  async processApprovalDecision(
    approvalId: string,
    decision: ApprovalDecision
  ): Promise<void> {
    console.log(`${decision.approved ? '✅' : '❌'} Processing approval decision for ${approvalId}`);
    
    // Update approval record
    await db.update(programmeApprovals)
      .set({
        status: decision.approved ? 'approved' : 'rejected',
        approvedBy: decision.approvedBy,
        approvedAt: new Date(),
        rejectedReason: decision.reason || undefined
      })
      .where(eq(programmeApprovals.id, approvalId));
    
    // Get approval details
    const [approval] = await db.select()
      .from(programmeApprovals)
      .where(eq(programmeApprovals.id, approvalId));
    
    if (approval) {
      // Emit event for programme execution
      eventBus.emitEvent('approval.completed', {
        approvalId,
        approved: decision.approved,
        autoApproved: false,
        projectId: approval.projectId,
        modifiedImpact: decision.modifiedImpact
      });
      
      // Send notification
      await this.sendApprovalNotification(approval as any, decision.approved ? 'approved' : 'rejected');
    }
  }
  
  /**
   * Get pending approvals for a project
   */
  async getPendingApprovals(projectId: number): Promise<ApprovalRequest[]> {
    const approvals = await db.select()
      .from(programmeApprovals)
      .where(and(
        eq(programmeApprovals.projectId, projectId),
        eq(programmeApprovals.status, 'pending')
      ));
    
    return approvals.map(approval => ({
      id: approval.id,
      projectId: approval.projectId,
      changeType: approval.changeType as ApprovalRequest['changeType'],
      title: approval.title,
      description: approval.description,
      impact: {
        delayDays: approval.impactDays,
        affectsCriticalPath: approval.affectsCriticalPath,
        cost: approval.impactCost,
        confidence: approval.confidence
      },
      nec4Compliance: {
        isValid: !!approval.nec4Clause,
        clause: approval.nec4Clause || '',
        reason: approval.nec4Clause ? 'Valid clause reference' : 'No clause reference'
      },
      autoApproved: approval.autoApproved,
      approvalRequired: true,
      requestedBy: 'AI Agent',
      requestedAt: approval.requestedAt,
      status: approval.status as ApprovalRequest['status']
    }));
  }
  
  /**
   * Send approval email
   */
  private async sendApprovalEmail(approvalRequest: ApprovalRequest): Promise<void> {
    const emailSubject = `Approval Required - ${approvalRequest.title}`;
    const emailBody = `
      <h2>Schedule Change Approval Required</h2>
      <p>The AI agent has analyzed a ${approvalRequest.changeType.replace('_', ' ')} and requires your approval:</p>
      
      <h3>Change Details:</h3>
      <ul>
        <li><strong>Title:</strong> ${approvalRequest.title}</li>
        <li><strong>Description:</strong> ${approvalRequest.description}</li>
        <li><strong>Duration Impact:</strong> ${approvalRequest.impact.delayDays} days</li>
        <li><strong>Cost Impact:</strong> £${approvalRequest.impact.cost.toLocaleString()}</li>
        <li><strong>Critical Path:</strong> ${approvalRequest.impact.affectsCriticalPath ? 'Yes' : 'No'}</li>
        <li><strong>AI Confidence:</strong> ${(approvalRequest.impact.confidence * 100).toFixed(0)}%</li>
      </ul>
      
      <h3>NEC4 Compliance:</h3>
      <ul>
        <li><strong>Valid:</strong> ${approvalRequest.nec4Compliance.isValid ? 'Yes' : 'No'}</li>
        <li><strong>Clause:</strong> ${approvalRequest.nec4Compliance.clause}</li>
        <li><strong>Reason:</strong> ${approvalRequest.nec4Compliance.reason}</li>
      </ul>
      
      <p>
        <a href="${process.env.BASE_URL}/approvals/${approvalRequest.id}" 
           style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none;">
          APPROVE
        </a>
        <a href="${process.env.BASE_URL}/approvals/${approvalRequest.id}?action=reject" 
           style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; margin-left: 10px;">
          REJECT
        </a>
      </p>
    `;
    
    // In production, send to project manager
    console.log(`📧 Would send approval email: ${emailSubject}`);
    // await sendEmail(projectManager.email, emailSubject, emailBody);
  }
  
  /**
   * Create dashboard notification
   */
  private async createDashboardNotification(approvalRequest: ApprovalRequest): Promise<void> {
    eventBus.emitEvent('notification.send', {
      data: {
        recipientType: 'project',
        recipientId: approvalRequest.projectId,
        message: `Approval required: ${approvalRequest.title} (${approvalRequest.impact.delayDays} days, £${approvalRequest.impact.cost})`,
        type: 'info',
        priority: approvalRequest.impact.affectsCriticalPath ? 'high' : 'medium',
        actionRequired: true,
        approvalId: approvalRequest.id
      }
    });
  }
  
  /**
   * Send approval notification
   */
  private async sendApprovalNotification(
    approvalRequest: ApprovalRequest, 
    status: 'auto_approved' | 'approved' | 'rejected'
  ): Promise<void> {
    const statusMessages = {
      auto_approved: 'Auto-approved and implemented',
      approved: 'Approved and being implemented',
      rejected: 'Rejected - no changes made'
    };
    
    eventBus.emitEvent('notification.send', {
      data: {
        recipientType: 'project',
        recipientId: approvalRequest.projectId,
        message: `${approvalRequest.title}: ${statusMessages[status]}`,
        type: status === 'rejected' ? 'warning' : 'success',
        priority: 'medium',
        actionRequired: false
      }
    });
  }
}

export const approvalWorkflow = new ApprovalWorkflowService();