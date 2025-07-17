/**
 * Approval Routes
 * API endpoints for managing programme change approvals
 */

import { Router } from 'express';
import { db } from '../db';
import { programmeApprovals } from '../../shared/schema';
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

export default router;