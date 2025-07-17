/**
 * Approval Routes
 * API endpoints for managing programme change approvals
 */

import { Router } from 'express';
import { db } from '../db';
import { programmeApprovals, approvalHierarchy, approvalAuditTrail, users } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { approvalWorkflow } from '../services/approval-workflow';
import { z } from 'zod';

const router = Router();

// Get pending approvals for a project
router.get('/projects/:projectId/approvals/pending', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const approvals = await approvalWorkflow.getPendingApprovals(projectId);
    res.json(approvals);
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
});

// Get all approvals for a project
router.get('/projects/:projectId/approvals', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const approvals = await db.select()
      .from(programmeApprovals)
      .where(eq(programmeApprovals.projectId, projectId))
      .orderBy(desc(programmeApprovals.requestedAt));
    
    res.json(approvals);
  } catch (error) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({ error: 'Failed to fetch approvals' });
  }
});

// Process approval decision
router.post('/approvals/:approvalId/decision', async (req, res) => {
  try {
    const approvalId = req.params.approvalId;
    const decisionSchema = z.object({
      approved: z.boolean(),
      reason: z.string().optional(),
      approvedBy: z.string(),
      modifiedImpact: z.object({
        delayDays: z.number(),
        cost: z.number(),
        reason: z.string()
      }).optional()
    });
    
    const decision = decisionSchema.parse(req.body);
    await approvalWorkflow.processApprovalDecision(approvalId, decision);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error processing approval decision:', error);
    res.status(500).json({ error: 'Failed to process approval decision' });
  }
});

// Get approval statistics
router.get('/projects/:projectId/approvals/stats', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    const allApprovals = await db.select()
      .from(programmeApprovals)
      .where(eq(programmeApprovals.projectId, projectId));
    
    const stats = {
      totalApprovals: allApprovals.length,
      pendingApprovals: allApprovals.filter(a => a.status === 'pending').length,
      autoApprovals: allApprovals.filter(a => a.autoApproved).length,
      manualApprovals: allApprovals.filter(a => !a.autoApproved).length,
      approvedCount: allApprovals.filter(a => a.status === 'approved').length,
      rejectedCount: allApprovals.filter(a => a.status === 'rejected').length,
      averageProcessingTime: 23, // In production, calculate from actual data
      totalImpactDays: allApprovals.reduce((sum, a) => sum + a.impactDays, 0),
      totalImpactCost: allApprovals.reduce((sum, a) => sum + Number(a.impactCost), 0),
      complianceRate: (allApprovals.filter(a => a.nec4Clause).length / allApprovals.length) * 100 || 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching approval stats:', error);
    res.status(500).json({ error: 'Failed to fetch approval stats' });
  }
});

// Dashboard metrics endpoint
router.get('/dashboard/metrics', async (req, res) => {
  try {
    // In production, this would aggregate real data from across all projects
    const metrics = {
      totalEventsProcessed: 12,
      pendingApprovals: 3,
      autoAppliedUpdates: 8,
      complianceRate: 98,
      averageProcessingTime: 23,
      timeSavedToday: 6.5,
      systemHealth: 'healthy' as const,
      agentStatus: [
        { name: 'Schedule Monitor', status: 'active', lastCheck: new Date() },
        { name: 'NEC4 Compliance Checker', status: 'active', lastCheck: new Date() },
        { name: 'MS Project Integration', status: 'active', lastCheck: new Date() }
      ]
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// Setup approval hierarchy for a project
router.post('/projects/:projectId/approvals/hierarchy', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const hierarchySchema = z.object({
      userId: z.number(),
      authorizationLevel: z.enum(['project_manager', 'senior_manager', 'director', 'board']),
      maxApprovalValue: z.number(),
      canApproveTypes: z.array(z.string())
    });
    
    const hierarchy = hierarchySchema.parse(req.body);
    
    await db.insert(approvalHierarchy).values({
      projectId,
      userId: hierarchy.userId,
      authorizationLevel: hierarchy.authorizationLevel,
      maxApprovalValue: hierarchy.maxApprovalValue,
      canApproveTypes: JSON.stringify(hierarchy.canApproveTypes),
      isActive: true,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting up approval hierarchy:', error);
    res.status(500).json({ error: 'Failed to setup approval hierarchy' });
  }
});

// Get approval hierarchy for a project
router.get('/projects/:projectId/approvals/hierarchy', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const hierarchy = await db.select({
      id: approvalHierarchy.id,
      userId: approvalHierarchy.userId,
      userName: users.fullName,
      authorizationLevel: approvalHierarchy.authorizationLevel,
      maxApprovalValue: approvalHierarchy.maxApprovalValue,
      canApproveTypes: approvalHierarchy.canApproveTypes,
      isActive: approvalHierarchy.isActive,
      createdAt: approvalHierarchy.createdAt,
    })
    .from(approvalHierarchy)
    .leftJoin(users, eq(approvalHierarchy.userId, users.id))
    .where(eq(approvalHierarchy.projectId, projectId));
    
    res.json(hierarchy);
  } catch (error) {
    console.error('Error fetching approval hierarchy:', error);
    res.status(500).json({ error: 'Failed to fetch approval hierarchy' });
  }
});

// Get audit trail for an approval
router.get('/approvals/:approvalId/audit-trail', async (req, res) => {
  try {
    const approvalId = req.params.approvalId;
    const auditTrail = await db.select({
      id: approvalAuditTrail.id,
      action: approvalAuditTrail.action,
      performedBy: approvalAuditTrail.performedBy,
      performedByName: users.fullName,
      performedAt: approvalAuditTrail.performedAt,
      previousStatus: approvalAuditTrail.previousStatus,
      newStatus: approvalAuditTrail.newStatus,
      comments: approvalAuditTrail.comments,
      changes: approvalAuditTrail.changes,
      ipAddress: approvalAuditTrail.ipAddress,
      userAgent: approvalAuditTrail.userAgent,
    })
    .from(approvalAuditTrail)
    .leftJoin(users, eq(approvalAuditTrail.performedBy, users.id))
    .where(eq(approvalAuditTrail.approvalId, approvalId))
    .orderBy(desc(approvalAuditTrail.performedAt));
    
    res.json(auditTrail);
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
});

// Enhanced approval decision with authorization tracking
router.post('/approvals/:approvalId/authorized-decision', async (req, res) => {
  try {
    const approvalId = req.params.approvalId;
    const decisionSchema = z.object({
      approved: z.boolean(),
      reason: z.string().optional(),
      approvedBy: z.string(),
      authorizedBy: z.number(),
      authorizationLevel: z.enum(['project_manager', 'senior_manager', 'director', 'board']),
      authorizationNotes: z.string().optional(),
      reviewedBy: z.number().optional(),
      reviewNotes: z.string().optional(),
      modifiedImpact: z.object({
        delayDays: z.number(),
        cost: z.number(),
        reason: z.string()
      }).optional()
    });
    
    const decision = decisionSchema.parse(req.body);
    
    // Get current approval for audit trail
    const currentApproval = await db.select()
      .from(programmeApprovals)
      .where(eq(programmeApprovals.id, approvalId))
      .limit(1);
    
    if (currentApproval.length === 0) {
      return res.status(404).json({ error: 'Approval not found' });
    }
    
    const previousStatus = currentApproval[0].status;
    const newStatus = decision.approved ? 'approved' : 'rejected';
    
    // Update approval with authorization tracking
    await db.update(programmeApprovals)
      .set({
        status: newStatus,
        approvedBy: decision.approvedBy,
        approvedAt: new Date(),
        authorizedBy: decision.authorizedBy,
        authorizationLevel: decision.authorizationLevel,
        authorizationNotes: decision.authorizationNotes,
        reviewedBy: decision.reviewedBy,
        reviewedAt: decision.reviewedBy ? new Date() : null,
        reviewNotes: decision.reviewNotes,
        rejectedReason: decision.approved ? null : decision.reason,
      })
      .where(eq(programmeApprovals.id, approvalId));
    
    // Log audit trail
    await db.insert(approvalAuditTrail).values({
      approvalId,
      action: decision.approved ? 'approved' : 'rejected',
      performedBy: decision.authorizedBy,
      previousStatus,
      newStatus,
      comments: decision.reason || decision.authorizationNotes,
      changes: JSON.stringify(decision.modifiedImpact),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error processing authorized decision:', error);
    res.status(500).json({ error: 'Failed to process authorized decision' });
  }
});

export default router;