import { AgentCoordinator, AgentCommunication, AgentAlert } from './agent-coordinator';
import { db } from '../db';
import { projects, programmeMilestones } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export interface ProgrammeData {
  projectId: number;
  activities: ProgrammeActivity[];
  milestones: ProgrammeMilestone[];
  criticalPath: string[];
  plannedCompletion: Date;
  forecastCompletion: Date;
  overallProgress: number;
}

export interface ProgrammeActivity {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  progress: number;
  isCritical: boolean;
  predecessors: string[];
  successors: string[];
  resources: string[];
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed' | 'suspended';
}

export interface ProgrammeMilestone {
  id: string;
  name: string;
  plannedDate: Date;
  forecastDate: Date;
  status: 'achieved' | 'on-track' | 'at-risk' | 'overdue';
  criticalityLevel: 'high' | 'medium' | 'low';
}

export class OperationalAgent {
  private coordinator: AgentCoordinator;
  private programmeCache: Map<number, ProgrammeData> = new Map();
  private slippageThresholds = {
    critical: 14, // days
    high: 7,
    medium: 3,
    low: 1
  };

  constructor(coordinator: AgentCoordinator) {
    this.coordinator = coordinator;
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

  // Process programme updates from MS Project/Primavera
  async processProgrammeUpdate(projectId: number, programmeData: ProgrammeData): Promise<void> {
    console.log(`Operational Agent processing programme update for project ${projectId}`);

    try {
      const previousData = this.programmeCache.get(projectId);
      this.programmeCache.set(projectId, programmeData);

      // Analyze for slippage
      if (previousData) {
        await this.analyzeSlippage(projectId, previousData, programmeData);
      }

      // Check critical path impacts
      await this.analyzeCriticalPath(projectId, programmeData);

      // Monitor milestones
      await this.monitorMilestones(projectId, programmeData.milestones);

      // Update programme progress
      await this.updateProgrammeProgress(projectId, programmeData);

    } catch (error) {
      console.error('Error processing programme update:', error);
      await this.createAlert({
        agentType: 'operational',
        severity: 'high',
        title: 'Programme Update Processing Error',
        message: `Failed to process programme update: ${error}`,
        actionRequired: true,
        relatedEntity: { type: 'programme', id: projectId },
        projectId: projectId
      });
    }
  }

  private async analyzeSlippage(
    projectId: number, 
    previousData: ProgrammeData, 
    currentData: ProgrammeData
  ): Promise<void> {
    const completionSlippage = this.calculateDateDifference(
      previousData.forecastCompletion,
      currentData.forecastCompletion
    );

    if (completionSlippage > 0) {
      const severity = this.calculateSlippageSeverity(completionSlippage);
      
      await this.createAlert({
        agentType: 'operational',
        severity: severity,
        title: 'Programme Slippage Detected',
        message: `Project completion forecast has slipped by ${completionSlippage} days. New completion date: ${currentData.forecastCompletion.toDateString()}`,
        actionRequired: true,
        relatedEntity: { type: 'programme', id: projectId },
        projectId: projectId
      });

      // Notify Contract Control Agent if significant slippage
      if (completionSlippage >= this.slippageThresholds.high) {
        await this.coordinator.sendMessage({
          fromAgent: 'operational',
          toAgent: 'contract-control',
          messageType: 'data-update',
          payload: {
            type: 'programme-slippage',
            projectId: projectId,
            slippageDays: completionSlippage,
            newCompletionDate: currentData.forecastCompletion,
            affectedActivities: currentData.activities.filter(a => a.status === 'delayed')
          }
        });
      }
    }

    // Analyze individual activity slippage
    for (const currentActivity of currentData.activities) {
      const previousActivity = previousData.activities.find(a => a.id === currentActivity.id);
      if (previousActivity) {
        const activitySlippage = this.calculateDateDifference(
          previousActivity.endDate,
          currentActivity.endDate
        );

        if (activitySlippage > 0 && currentActivity.isCritical) {
          await this.createAlert({
            agentType: 'operational',
            severity: 'high',
            title: 'Critical Path Activity Delayed',
            message: `Critical activity "${currentActivity.name}" delayed by ${activitySlippage} days`,
            actionRequired: true,
            relatedEntity: { type: 'programme', id: currentActivity.id },
            projectId: projectId
          });
        }
      }
    }
  }

  private async analyzeCriticalPath(projectId: number, programmeData: ProgrammeData): Promise<void> {
    const criticalActivities = programmeData.activities.filter(a => a.isCritical);
    const delayedCriticalActivities = criticalActivities.filter(a => a.status === 'delayed');

    if (delayedCriticalActivities.length > 0) {
      const totalFloatLoss = delayedCriticalActivities.reduce((total, activity) => {
        const delay = this.calculateDateDifference(new Date(), activity.endDate);
        return total + Math.max(0, delay);
      }, 0);

      if (totalFloatLoss > 0) {
        await this.createAlert({
          agentType: 'operational',
          severity: 'critical',
          title: 'Critical Path Impact Detected',
          message: `${delayedCriticalActivities.length} critical activities delayed, total float loss: ${totalFloatLoss} days`,
          actionRequired: true,
          relatedEntity: { type: 'programme', id: projectId },
          projectId: projectId
        });

        // Special handling for CE-040 archaeological findings scenario
        const archaeologicalActivity = delayedCriticalActivities.find(a => 
          a.name.toLowerCase().includes('foundation') || 
          a.name.toLowerCase().includes('excavation')
        );

        if (archaeologicalActivity) {
          await this.handleArchaeologicalDelay(projectId, archaeologicalActivity);
        }
      }
    }
  }

  private async handleArchaeologicalDelay(
    projectId: number, 
    activity: ProgrammeActivity
  ): Promise<void> {
    // Specific handling for CE-040 archaeological findings scenario
    await this.createAlert({
      agentType: 'operational',
      severity: 'critical',
      title: 'Programme Alert: Critical path slippage detected',
      message: `Activity "${activity.name}" showing significant delay due to archaeological findings impact. Review required.`,
      actionRequired: true,
      relatedEntity: { 
        type: 'compensation-event', 
        id: 'CE-040',
        reference: 'CE-040'
      },
      projectId: projectId
    });

    // Notify Contract Control Agent about programme revision requirement
    await this.coordinator.sendMessage({
      fromAgent: 'operational',
      toAgent: 'contract-control',
      messageType: 'data-update',
      payload: {
        type: 'programme-revision-required',
        projectId: projectId,
        affectedActivity: activity.name,
        delayReason: 'archaeological findings',
        compensationEventRef: 'CE-040',
        requiredActions: [
          'Submit revised programme under Clause 32.1',
          'Assess time impact for CE quotation under Clause 62.2'
        ]
      }
    });
  }

  private async monitorMilestones(projectId: number, milestones: ProgrammeMilestone[]): Promise<void> {
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));

    for (const milestone of milestones) {
      if (milestone.status === 'at-risk' && milestone.forecastDate <= twoWeeksFromNow) {
        await this.createAlert({
          agentType: 'operational',
          severity: milestone.criticalityLevel === 'high' ? 'critical' : 'high',
          title: 'Milestone at Risk',
          message: `Milestone "${milestone.name}" at risk. Forecast date: ${milestone.forecastDate.toDateString()}`,
          actionRequired: true,
          relatedEntity: { type: 'programme', id: milestone.id },
          projectId: projectId
        });
      }

      if (milestone.status === 'overdue') {
        await this.createAlert({
          agentType: 'operational',
          severity: 'critical',
          title: 'Milestone Overdue',
          message: `Milestone "${milestone.name}" is overdue. Planned date was: ${milestone.plannedDate.toDateString()}`,
          actionRequired: true,
          relatedEntity: { type: 'programme', id: milestone.id },
          projectId: projectId
        });
      }
    }
  }

  private async updateProgrammeProgress(projectId: number, programmeData: ProgrammeData): Promise<void> {
    // Update database with programme progress
    try {
      // This would integrate with your programme management tables
      // For now, we'll just log the progress
      console.log(`Project ${projectId} overall progress: ${programmeData.overallProgress}%`);
    } catch (error) {
      console.error('Error updating programme progress:', error);
    }
  }

  private calculateDateDifference(date1: Date, date2: Date): number {
    const diffTime = date2.getTime() - date1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateSlippageSeverity(days: number): 'critical' | 'high' | 'medium' | 'low' {
    if (days >= this.slippageThresholds.critical) return 'critical';
    if (days >= this.slippageThresholds.high) return 'high';
    if (days >= this.slippageThresholds.medium) return 'medium';
    return 'low';
  }

  private async processDataUpdate(payload: any): Promise<void> {
    switch (payload.type) {
      case 'early-warning-time-impact':
        await this.assessEarlyWarningImpact(payload);
        break;
      case 'compensation-event-programme-impact':
        await this.assessCompensationEventImpact(payload);
        break;
      default:
        console.log('Operational Agent received data update:', payload);
    }
  }

  private async assessEarlyWarningImpact(payload: any): Promise<void> {
    const { projectId, earlyWarningId, description } = payload;
    
    // Analyze potential programme impact
    const programmeData = this.programmeCache.get(projectId);
    if (programmeData) {
      // Look for activities that might be affected
      const potentiallyAffected = programmeData.activities.filter(activity =>
        description.toLowerCase().includes(activity.name.toLowerCase().substring(0, 5)) ||
        activity.isCritical
      );

      if (potentiallyAffected.length > 0) {
        await this.createAlert({
          agentType: 'operational',
          severity: 'medium',
          title: 'Early Warning Programme Impact Assessment',
          message: `Early Warning may impact ${potentiallyAffected.length} programme activities`,
          actionRequired: true,
          relatedEntity: { type: 'early-warning', id: earlyWarningId },
          projectId: projectId
        });
      }
    }
  }

  private async assessCompensationEventImpact(payload: any): Promise<void> {
    const { projectId, compensationEventId, description } = payload;
    
    // For CE-040 archaeological findings, create specific programme alert
    if (description.toLowerCase().includes('archaeological')) {
      const mockActivity: ProgrammeActivity = {
        id: 'foundation-phase-2',
        name: 'Foundation Works - Phase 2',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-15'),
        duration: 14,
        progress: 60,
        isCritical: true,
        predecessors: [],
        successors: [],
        resources: ['Excavator', 'Foundation Team'],
        status: 'delayed'
      };

      await this.handleArchaeologicalDelay(projectId, mockActivity);
    }
  }

  private async processRequest(message: AgentCommunication): Promise<void> {
    console.log('Operational Agent received request:', message);
  }

  private async processAlert(alert: AgentAlert): Promise<void> {
    console.log('Operational Agent received alert:', alert);
  }

  private async createAlert(alert: Omit<AgentAlert, 'id' | 'timestamp' | 'status'>): Promise<void> {
    await this.coordinator.createAlert(alert);
  }

  // Generate programme analysis for dashboard
  getProgrammeInsights(projectId: number): any {
    const programmeData = this.programmeCache.get(projectId);
    if (!programmeData) return null;

    const criticalActivities = programmeData.activities.filter(a => a.isCritical);
    const delayedActivities = programmeData.activities.filter(a => a.status === 'delayed');
    const completedActivities = programmeData.activities.filter(a => a.status === 'completed');

    return {
      overallProgress: programmeData.overallProgress,
      criticalPathHealth: delayedActivities.filter(a => a.isCritical).length === 0 ? 'Good' : 'At Risk',
      milestonesOnTrack: programmeData.milestones.filter(m => m.status === 'on-track').length,
      totalMilestones: programmeData.milestones.length,
      activitiesCompleted: completedActivities.length,
      totalActivities: programmeData.activities.length,
      forecastCompletion: programmeData.forecastCompletion,
      plannedCompletion: programmeData.plannedCompletion
    };
  }
}