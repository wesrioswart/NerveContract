/**
 * Operational Agent Workflow
 * Manages programme data, critical path analysis, and milestone tracking
 */

import { eventBus } from '../event-bus';
import { db } from '../db';
import { 
  programmes,
  programmeActivities,
  programmeMilestones,
  projects,
  earlyWarnings,
  compensationEvents
} from '../../shared/schema';
import { eq, and, gte, lte, desc, isNull, or, sql } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

interface ProgrammeAnalysis {
  projectId: number;
  totalActivities: number;
  completedActivities: number;
  criticalPathActivities: number;
  delayedActivities: number;
  upcomingMilestones: any[];
  riskFactors: string[];
  recommendations: string[];
  overallStatus: 'on_track' | 'at_risk' | 'delayed';
}

interface CriticalPathAnalysis {
  activities: any[];
  totalDuration: number;
  criticalActivities: any[];
  floatActivities: any[];
  bottlenecks: string[];
  impactAssessment: string[];
}

interface MilestoneStatus {
  milestoneId: number;
  name: string;
  plannedDate: Date;
  forecastDate: Date;
  status: 'achieved' | 'on_track' | 'at_risk' | 'overdue';
  dependencies: string[];
  riskFactors: string[];
}

export class OperationalAgent {
  private anthropic: any;
  
  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
  }

  /**
   * Main workflow entry point - runs operational monitoring
   */
  async runOperationalMonitoring(): Promise<void> {
    try {
      console.log('🏗️ Operational Agent: Starting operational monitoring');
      
      // Step 1: Get all active projects
      const activeProjects = await this.getActiveProjects();
      
      for (const project of activeProjects) {
        // Step 2: Analyze programme status
        await this.analyzeProgrammeStatus(project.id);
        
        // Step 3: Perform critical path analysis
        await this.performCriticalPathAnalysis(project.id);
        
        // Step 4: Monitor milestones
        await this.monitorMilestones(project.id);
        
        // Step 5: Check for programme risks
        await this.checkProgrammeRisks(project.id);
        
        // Step 6: Generate progress reports
        await this.generateProgressReport(project.id);
        
        // Step 7: Update programme forecasts
        await this.updateProgrammeForecasts(project.id);
        
        // Step 8: Make intelligent programme adjustments
        await this.makeIntelligentAdjustments(project.id);
      }
      
      console.log('✅ Operational Agent: Operational monitoring complete');
      
    } catch (error) {
      console.error('❌ Operational Agent error:', error);
    }
  }

  /**
   * Handle programme update
   */
  async handleProgrammeUpdate(updateData: any): Promise<void> {
    try {
      console.log(`🏗️ Operational Agent: Processing programme update for project ${updateData.projectId}`);
      
      // Step 1: Validate programme data
      const validation = await this.validateProgrammeData(updateData);
      
      // Step 2: Analyze impact of changes
      const impactAnalysis = await this.analyzeUpdateImpact(updateData);
      
      // Step 3: Update critical path if affected
      if (impactAnalysis.criticalPathImpact) {
        await this.recalculateCriticalPath(updateData.projectId);
      }
      
      // Step 4: Check milestone impacts
      await this.assessMilestoneImpacts(updateData, impactAnalysis);
      
      // Step 5: Generate notifications for significant changes
      if (impactAnalysis.significantImpact) {
        await this.generateUpdateNotifications(updateData, impactAnalysis);
      }
      
      // Step 6: Emit events for other agents
      eventBus.emitEvent('programme.updated', {
        projectId: updateData.projectId,
        changes: updateData.changes || [],
        criticalPathImpact: impactAnalysis.criticalPathImpact,
        delayIdentified: impactAnalysis.delayIdentified,
        milestonesAffected: impactAnalysis.milestonesAffected
      });
      
      console.log(`✅ Programme update processing complete`);
      
    } catch (error) {
      console.error('❌ Programme update processing error:', error);
    }
  }

  /**
   * Handle document analysis results
   */
  async handleDocumentAnalysis(docData: any): Promise<void> {
    try {
      console.log(`🏗️ Operational Agent: Processing document analysis for ${docData.documentType}`);
      
      // Step 1: Extract programme-related information
      const programmeInfo = await this.extractProgrammeInformation(docData);
      
      // Step 2: Identify potential impacts
      const impacts = await this.identifyProgrammeImpacts(programmeInfo, docData);
      
      // Step 3: Create action items if needed
      if (impacts.length > 0) {
        await this.createProgrammeActionItems(docData.projectId, impacts);
      }
      
      // Step 4: Update risk register
      await this.updateProgrammeRisks(docData.projectId, docData.risks);
      
      console.log(`✅ Document analysis processing complete`);
      
    } catch (error) {
      console.error('❌ Document analysis processing error:', error);
    }
  }



  /**
   * Make intelligent programme adjustments using new automation service
   */
  private async makeIntelligentAdjustments(projectId: number): Promise<void> {
    try {
      console.log(`🤖 Making intelligent programme adjustments for project ${projectId}`);
      
      // Import the new programme automation service
      const { programmeAutomation } = await import('../services/programme-automation');
      
      // Get recent compensation events and early warnings
      const [recentCEs, recentEWs] = await Promise.all([
        db.select()
          .from(compensationEvents)
          .where(and(
            eq(compensationEvents.projectId, projectId),
            gte(compensationEvents.raisedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
          )),
        db.select()
          .from(earlyWarnings)
          .where(and(
            eq(earlyWarnings.projectId, projectId),
            gte(earlyWarnings.raisedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
          ))
      ]);
      
      // Process automated programme changes
      const updateResult = await programmeAutomation.processAutomatedProgrammeChanges(
        projectId,
        {
          compensationEvents: recentCEs,
          earlyWarnings: recentEWs,
          externalDelays: [{
            reason: 'Weather impact analysis',
            delayDays: 3,
            keywords: ['external', 'concrete', 'foundation'],
            workAreas: ['foundation', 'concrete']
          }]
        }
      );
      
      console.log(`✅ Programme automation complete - ${updateResult.summary.totalChanges} changes made`);
      console.log(`📊 Critical path impact: ${updateResult.summary.criticalPathImpact} activities affected`);
      
      // Create notification for project team
      await this.createAlert({
        agentType: 'operational',
        severity: updateResult.summary.criticalPathImpact > 0 ? 'high' : 'medium',
        title: 'Automated Programme Update Complete',
        message: `Programme automatically updated with ${updateResult.summary.totalChanges} changes. ${updateResult.summary.criticalPathImpact} critical path activities affected.`,
        actionRequired: updateResult.summary.criticalPathImpact > 0,
        relatedEntity: { type: 'programme', id: projectId },
        projectId: projectId
      });
      
    } catch (error) {
      console.error('❌ Programme automation error:', error);
      
      // Fallback to basic adjustments if automation fails
      await this.makeBasicAdjustments(projectId);
    }
  }

  /**
   * Fallback basic programme adjustments
   */
  private async makeBasicAdjustments(projectId: number): Promise<void> {
    console.log(`🔄 Applying basic programme adjustments for project ${projectId}`);
    
    // Get current programme analysis
    const analysis = await this.analyzeProgrammeStatus(projectId);
    
    if (analysis.overallStatus === 'delayed' || analysis.overallStatus === 'at_risk') {
      // Get programme and activities
      const programme = await db.select()
        .from(programmes)
        .where(eq(programmes.projectId, projectId))
        .then(p => p[0]);
        
      if (!programme) return;
      
      const activities = await db.select()
        .from(programmeActivities)
        .where(eq(programmeActivities.programmeId, programme.id));
      
      // Identify specific adjustments needed
      const adjustments = await this.identifyRequiredAdjustments(activities, analysis);
      
      // Apply adjustments
      for (const adjustment of adjustments) {
        await this.applyProgrammeAdjustment(adjustment);
        
        // Log the adjustment
        console.log(`📅 Applied adjustment: ${adjustment.type} for activity ${adjustment.activityId}`);
        
        // Create early warning if significant change
        if (adjustment.impactDays > 7) {
          await this.createDelayEarlyWarning(projectId, adjustment);
        }
      }
      
      // Recalculate critical path after adjustments
      await this.recalculateCriticalPath(programme.id);
      
      console.log(`✅ Basic programme adjustments complete - ${adjustments.length} changes made`);
    }
  }

  /**
   * Identify required programme adjustments
   */
  private async identifyRequiredAdjustments(activities: any[], analysis: ProgrammeAnalysis): Promise<any[]> {
    const adjustments = [];
    
    for (const activity of activities) {
      // Check if activity is delayed
      if (activity.finishDate && new Date(activity.finishDate) < new Date() && activity.percentComplete < 100) {
        const daysDelayed = Math.ceil((new Date().getTime() - new Date(activity.finishDate).getTime()) / (1000 * 60 * 60 * 24));
        
        adjustments.push({
          type: 'reschedule',
          activityId: activity.id,
          currentFinishDate: activity.finishDate,
          newFinishDate: new Date(Date.now() + (activity.duration || 5) * 24 * 60 * 60 * 1000),
          impactDays: daysDelayed,
          reason: `Activity delayed by ${daysDelayed} days - auto-rescheduling`
        });
      }
      
      // Check if critical activity needs acceleration
      if (activity.isCritical && activity.percentComplete < 50) {
        const remainingDuration = Math.ceil((activity.duration || 0) * (1 - (activity.percentComplete || 0) / 100));
        
        if (remainingDuration > 10) { // Accelerate if more than 10 days remaining
          const acceleratedDuration = Math.ceil(remainingDuration * 0.8); // 20% acceleration
          
          adjustments.push({
            type: 'accelerate',
            activityId: activity.id,
            originalDuration: remainingDuration,
            newDuration: acceleratedDuration,
            impactDays: remainingDuration - acceleratedDuration,
            reason: 'Critical path optimization - accelerating key activity'
          });
        }
      }
    }
    
    return adjustments;
  }

  /**
   * Apply programme adjustment to database
   */
  private async applyProgrammeAdjustment(adjustment: any): Promise<void> {
    try {
      if (adjustment.type === 'reschedule') {
        await db.update(programmeActivities)
          .set({
            finishDate: adjustment.newFinishDate,
            updatedAt: new Date()
          })
          .where(eq(programmeActivities.id, adjustment.activityId));
      }
      
      if (adjustment.type === 'accelerate') {
        await db.update(programmeActivities)
          .set({
            duration: adjustment.newDuration,
            finishDate: new Date(Date.now() + adjustment.newDuration * 24 * 60 * 60 * 1000),
            updatedAt: new Date()
          })
          .where(eq(programmeActivities.id, adjustment.activityId));
      }
      
    } catch (error) {
      console.error('Failed to apply programme adjustment:', error);
    }
  }

  /**
   * Create early warning for significant programme changes
   */
  private async createDelayEarlyWarning(projectId: number, adjustment: any): Promise<void> {
    try {
      await db.insert(earlyWarnings).values({
        projectId: projectId,
        reference: `EW-${String(Date.now()).slice(-6)}`,
        description: `Programme Adjustment: ${adjustment.type}. ${adjustment.reason}. Impact: ${adjustment.impactDays} days.`,
        ownerId: 1,
        raisedBy: 1, // System user
        status: 'Open',
        raisedAt: new Date(),
        mitigationPlan: `Automatic programme adjustment applied. Monitor progress closely.`
      });
      
    } catch (error) {
      console.error('Failed to create delay early warning:', error);
    }
  }

  /**
   * Recalculate critical path after adjustments
   */
  private async recalculateCriticalPath(projectId: number): Promise<void> {
    try {
      const activities = await db.select()
        .from(programmeActivities)
        .where(eq(programmeActivities.programmeId, projectId));
      
      // Simple critical path recalculation (in real system would use proper CPM algorithm)
      const sortedActivities = activities.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      let currentCriticalPath = true;
      for (const activity of sortedActivities) {
        const isOnCriticalPath = currentCriticalPath && (activity.duration || 0) > 3;
        
        await db.update(programmeActivities)
          .set({ isCritical: isOnCriticalPath })
          .where(eq(programmeActivities.id, activity.id));
      }
      
    } catch (error) {
      console.error('Failed to recalculate critical path:', error);
    }
  }

  /**
   * Get all active projects
   */
  private async getActiveProjects(): Promise<any[]> {
    return await db.select().from(projects);
  }

  /**
   * Analyze programme status
   */
  private async analyzeProgrammeStatus(projectId: number): Promise<ProgrammeAnalysis> {
    try {
      // Get programme data
      const programme = await db.select()
        .from(programmes)
        .where(eq(programmes.projectId, projectId))
        .then(p => p[0]);
      
      if (!programme) {
        return this.createDefaultAnalysis(projectId);
      }
      
      // Get activities
      const activities = await db.select()
        .from(programmeActivities)
        .where(eq(programmeActivities.programmeId, programme.id));
      
      // Get milestones
      const milestones = await db.select()
        .from(programmeMilestones)
        .where(eq(programmeMilestones.projectId, projectId));
      
      // Calculate metrics
      const totalActivities = activities.length;
      const completedActivities = activities.filter(a => a.percentComplete === 100).length;
      const criticalPathActivities = activities.filter(a => a.isCritical).length;
      const delayedActivities = activities.filter(a => 
        a.finishDate && new Date(a.finishDate) < new Date() && a.percentComplete < 100
      ).length;
      
      // Get upcoming milestones (next 30 days)
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const upcomingMilestones = milestones.filter(m => 
        m.plannedDate && new Date(m.plannedDate) <= thirtyDaysFromNow && m.status !== 'achieved'
      );
      
      // Determine overall status
      let overallStatus: 'on_track' | 'at_risk' | 'delayed' = 'on_track';
      const riskFactors: string[] = [];
      const recommendations: string[] = [];
      
      if (delayedActivities > 0) {
        overallStatus = 'delayed';
        riskFactors.push(`${delayedActivities} activities are delayed`);
        recommendations.push('Review delayed activities and implement recovery plan');
      }
      
      const progressPercentage = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;
      if (progressPercentage < 50 && programme.startDate) {
        const daysSinceStart = Math.floor((Date.now() - new Date(programme.startDate).getTime()) / (1000 * 60 * 60 * 24));
        const plannedDuration = programme.duration || 365;
        const expectedProgress = (daysSinceStart / plannedDuration) * 100;
        
        if (progressPercentage < expectedProgress * 0.8) {
          overallStatus = 'at_risk';
          riskFactors.push('Progress is behind schedule');
          recommendations.push('Accelerate activity completion');
        }
      }
      
      if (upcomingMilestones.length > 3) {
        riskFactors.push(`${upcomingMilestones.length} milestones due within 30 days`);
        recommendations.push('Focus on upcoming milestone delivery');
      }
      
      const analysis: ProgrammeAnalysis = {
        projectId,
        totalActivities,
        completedActivities,
        criticalPathActivities,
        delayedActivities,
        upcomingMilestones,
        riskFactors,
        recommendations,
        overallStatus
      };
      
      // Generate alerts if needed
      if (overallStatus !== 'on_track') {
        await this.generateProgrammeStatusAlert(projectId, analysis);
      }
      
      return analysis;
      
    } catch (error) {
      console.error('Programme status analysis failed:', error);
      return this.createDefaultAnalysis(projectId);
    }
  }

  /**
   * Perform critical path analysis
   */
  private async performCriticalPathAnalysis(projectId: number): Promise<CriticalPathAnalysis | null> {
    try {
      // Get programme
      const programme = await db.select()
        .from(programmes)
        .where(eq(programmes.projectId, projectId))
        .then(p => p[0]);
      
      if (!programme) return null;
      
      // Get activities with dependencies
      const activities = await db.select()
        .from(programmeActivities)
        .where(eq(programmeActivities.programmeId, programme.id));
      
      // AI-powered critical path analysis
      const analysis = await this.analyzeCriticalPath(activities);
      
      // Identify bottlenecks
      const bottlenecks = this.identifyBottlenecks(activities);
      
      // Calculate impact of delays
      const impactAssessment = await this.assessDelayImpacts(activities);
      
      const criticalPathAnalysis: CriticalPathAnalysis = {
        activities,
        totalDuration: this.calculateTotalDuration(activities),
        criticalActivities: activities.filter(a => a.isCritical),
        floatActivities: activities.filter(a => !a.isCritical && a.totalFloat > 0),
        bottlenecks,
        impactAssessment
      };
      
      // Generate alerts for critical issues
      if (bottlenecks.length > 0) {
        await this.generateCriticalPathAlert(projectId, criticalPathAnalysis);
      }
      
      return criticalPathAnalysis;
      
    } catch (error) {
      console.error('Critical path analysis failed:', error);
      return null;
    }
  }

  /**
   * Monitor milestones
   */
  private async monitorMilestones(projectId: number): Promise<void> {
    try {
      // Get programme milestones
      const programme = await db.select()
        .from(programmes)
        .where(eq(programmes.projectId, projectId))
        .then(p => p[0]);
      
      if (!programme) return;
      
      const milestones = await db.select()
        .from(programmeMilestones)
        .where(eq(programmeMilestones.projectId, projectId));
      
      for (const milestone of milestones) {
        const status = await this.assessMilestoneStatus(milestone);
        
        // Generate alerts for at-risk or overdue milestones
        if (status.status === 'at_risk' || status.status === 'overdue') {
          await this.generateMilestoneAlert(projectId, milestone, status);
        }
        
        // Update milestone forecast if needed
        if (status.forecastDate.getTime() !== milestone.plannedDate.getTime()) {
          await this.updateMilestoneForcast(milestone.id, status.forecastDate);
        }
      }
      
    } catch (error) {
      console.error('Milestone monitoring failed:', error);
    }
  }

  /**
   * Check for programme risks
   */
  private async checkProgrammeRisks(projectId: number): Promise<void> {
    try {
      // Get current early warnings related to programme
      const programmeWarnings = await db.select()
        .from(earlyWarnings)
        .where(
          and(
            eq(earlyWarnings.projectId, projectId),
            sql`${earlyWarnings.description} LIKE '%programme%' OR ${earlyWarnings.description} LIKE '%schedule%' OR ${earlyWarnings.description} LIKE '%delay%'`
          )
        );
      
      // Analyze warnings for programme impact
      for (const warning of programmeWarnings) {
        const impact = await this.assessProgrammeRiskImpact(warning);
        
        if (impact.severity === 'high' || impact.severity === 'critical') {
          await this.generateProgrammeRiskAlert(projectId, warning, impact);
        }
      }
      
      // Check for new risks based on programme data
      const newRisks = await this.identifyNewProgrammeRisks(projectId);
      
      for (const risk of newRisks) {
        await this.createProgrammeRiskWarning(projectId, risk);
      }
      
    } catch (error) {
      console.error('Programme risk checking failed:', error);
    }
  }

  /**
   * AI-powered critical path analysis
   */
  private async analyzeCriticalPath(activities: any[]): Promise<any> {
    if (!this.anthropic) {
      return this.fallbackCriticalPathAnalysis(activities);
    }

    try {
      const prompt = `
Analyze this programme data for critical path optimization:

Activities: ${JSON.stringify(activities.slice(0, 10), null, 2)} // Limited for token constraints

Consider:
1. Activity dependencies and relationships
2. Resource constraints and availability
3. Critical path identification
4. Float calculations
5. Risk factors and mitigation strategies

Respond with JSON:
{
  "criticalPath": ["activity1", "activity2"],
  "bottlenecks": ["constraint1", "constraint2"],
  "optimizationOpportunities": ["opp1", "opp2"],
  "riskFactors": ["risk1", "risk2"],
  "recommendations": ["rec1", "rec2"]
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      return JSON.parse(response.content[0].text);
      
    } catch (error) {
      console.error('AI critical path analysis failed:', error);
      return this.fallbackCriticalPathAnalysis(activities);
    }
  }

  /**
   * Fallback critical path analysis
   */
  private fallbackCriticalPathAnalysis(activities: any[]): any {
    return {
      criticalPath: activities.filter(a => a.isCritical).map(a => a.name),
      bottlenecks: ['Resource constraints', 'Weather dependencies'],
      optimizationOpportunities: ['Parallel execution', 'Resource reallocation'],
      riskFactors: ['Schedule delays', 'Resource availability'],
      recommendations: ['Review resource allocation', 'Consider acceleration options']
    };
  }

  /**
   * Create default analysis when no programme data exists
   */
  private createDefaultAnalysis(projectId: number): ProgrammeAnalysis {
    return {
      projectId,
      totalActivities: 0,
      completedActivities: 0,
      criticalPathActivities: 0,
      delayedActivities: 0,
      upcomingMilestones: [],
      riskFactors: ['No programme data available'],
      recommendations: ['Import programme data from MS Project or create baseline programme'],
      overallStatus: 'at_risk'
    };
  }

  /**
   * Assess milestone status
   */
  private async assessMilestoneStatus(milestone: any): Promise<MilestoneStatus> {
    const now = new Date();
    const plannedDate = new Date(milestone.plannedDate);
    
    let status: 'achieved' | 'on_track' | 'at_risk' | 'overdue';
    let forecastDate = plannedDate;
    
    if (milestone.status === 'achieved') {
      status = 'achieved';
    } else if (now > plannedDate) {
      status = 'overdue';
      forecastDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
    } else {
      const daysToMilestone = Math.floor((plannedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysToMilestone <= 7) {
        status = 'at_risk';
      } else {
        status = 'on_track';
      }
    }
    
    return {
      milestoneId: milestone.id,
      name: milestone.name,
      plannedDate,
      forecastDate,
      status,
      dependencies: milestone.dependencies || [],
      riskFactors: this.identifyMilestoneRisks(milestone)
    };
  }

  /**
   * Generate various alerts and notifications
   */
  private async generateProgrammeStatusAlert(projectId: number, analysis: ProgrammeAnalysis): Promise<void> {
    eventBus.emitEvent('notification.send', {
      recipientType: 'project',
      recipientId: projectId,
      message: `Programme status: ${analysis.overallStatus} - ${analysis.riskFactors.join(', ')}`,
      type: analysis.overallStatus === 'delayed' ? 'error' : 'warning',
      priority: analysis.overallStatus === 'delayed' ? 'high' : 'medium',
      actionRequired: true
    });
  }

  private async generateCriticalPathAlert(projectId: number, analysis: CriticalPathAnalysis): Promise<void> {
    eventBus.emitEvent('notification.send', {
      recipientType: 'project',
      recipientId: projectId,
      message: `Critical path bottlenecks identified: ${analysis.bottlenecks.join(', ')}`,
      type: 'warning',
      priority: 'high',
      actionRequired: true
    });
  }

  private async generateMilestoneAlert(projectId: number, milestone: any, status: MilestoneStatus): Promise<void> {
    eventBus.emitEvent('notification.send', {
      recipientType: 'project',
      recipientId: projectId,
      message: `Milestone ${status.status}: ${milestone.name} (planned: ${status.plannedDate.toDateString()})`,
      type: status.status === 'overdue' ? 'error' : 'warning',
      priority: status.status === 'overdue' ? 'high' : 'medium',
      actionRequired: true
    });
  }

  private async generateProgrammeRiskAlert(projectId: number, warning: any, impact: any): Promise<void> {
    eventBus.emitEvent('notification.send', {
      recipientType: 'project',
      recipientId: projectId,
      message: `Programme risk identified: ${warning.title} (${impact.severity} impact)`,
      type: 'warning',
      priority: impact.severity === 'critical' ? 'urgent' : 'high',
      actionRequired: true
    });
  }

  // Helper methods
  private identifyBottlenecks(activities: any[]): string[] {
    const bottlenecks: string[] = [];
    
    // Check for resource conflicts
    const resourceUsage = new Map();
    activities.forEach(activity => {
      if (activity.resources) {
        activity.resources.forEach((resource: string) => {
          resourceUsage.set(resource, (resourceUsage.get(resource) || 0) + 1);
        });
      }
    });
    
    resourceUsage.forEach((count, resource) => {
      if (count > 3) { // Arbitrary threshold
        bottlenecks.push(`Resource constraint: ${resource}`);
      }
    });
    
    return bottlenecks;
  }

  private calculateTotalDuration(activities: any[]): number {
    if (activities.length === 0) return 0;
    
    const startDates = activities.map(a => new Date(a.startDate)).filter(d => !isNaN(d.getTime()));
    const endDates = activities.map(a => new Date(a.finishDate)).filter(d => !isNaN(d.getTime()));
    
    if (startDates.length === 0 || endDates.length === 0) return 0;
    
    const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())));
    const latestEnd = new Date(Math.max(...endDates.map(d => d.getTime())));
    
    return Math.ceil((latestEnd.getTime() - earliestStart.getTime()) / (1000 * 60 * 60 * 24));
  }

  private identifyMilestoneRisks(milestone: any): string[] {
    const risks: string[] = [];
    
    if (milestone.dependencies && milestone.dependencies.length > 3) {
      risks.push('Multiple dependencies');
    }
    
    const daysToMilestone = Math.floor((new Date(milestone.plannedDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysToMilestone <= 14) {
      risks.push('Approaching deadline');
    }
    
    return risks;
  }

  private async assessDelayImpacts(activities: any[]): Promise<string[]> {
    return [
      'Potential milestone delays',
      'Resource reallocation required',
      'Cost implications',
      'Client delivery impact'
    ];
  }

  private async assessProgrammeRiskImpact(warning: any): Promise<any> {
    return {
      severity: 'medium',
      programmeImpact: 'Potential 2-week delay',
      mitigationRequired: true
    };
  }

  private async identifyNewProgrammeRisks(projectId: number): Promise<any[]> {
    return []; // Placeholder - would analyze programme data for emerging risks
  }

  private async createProgrammeRiskWarning(projectId: number, risk: any): Promise<void> {
    // Create early warning for new programme risk
  }

  // Placeholder methods for additional functionality
  private async generateProgressReport(projectId: number): Promise<void> {
    console.log(`📊 Generating progress report for project ${projectId}`);
  }

  private async updateProgrammeForecasts(projectId: number): Promise<void> {
    console.log(`📈 Updating programme forecasts for project ${projectId}`);
  }

  private async validateProgrammeData(updateData: any): Promise<any> {
    return { isValid: true, issues: [] };
  }

  private async analyzeUpdateImpact(updateData: any): Promise<any> {
    return {
      criticalPathImpact: false,
      delayIdentified: false,
      significantImpact: false,
      milestonesAffected: []
    };
  }

  private async recalculateCriticalPathDB(projectId: number): Promise<void> {
    console.log(`🔄 Recalculating critical path for project ${projectId}`);
  }

  private async assessMilestoneImpacts(updateData: any, impactAnalysis: any): Promise<void> {
    // Assessment logic
  }

  private async generateUpdateNotifications(updateData: any, impactAnalysis: any): Promise<void> {
    // Notification logic
  }

  private async extractProgrammeInformation(docData: any): Promise<any> {
    return { activities: [], milestones: [], risks: [] };
  }

  private async identifyProgrammeImpacts(programmeInfo: any, docData: any): Promise<any[]> {
    return [];
  }

  private async createProgrammeActionItems(projectId: number, impacts: any[]): Promise<void> {
    // Create action items
  }

  private async updateProgrammeRisks(projectId: number, risks: string[]): Promise<void> {
    // Update risk register
  }

  private async updateMilestoneForcast(milestoneId: number, forecastDate: Date): Promise<void> {
    // Update milestone forecast
  }
}

export const operationalAgent = new OperationalAgent();

// Event listeners
eventBus.onEvent('programme.updated', (data) => {
  operationalAgent.handleProgrammeUpdate(data);
});

eventBus.onEvent('document.analyzed', (data) => {
  operationalAgent.handleDocumentAnalysis(data);
});