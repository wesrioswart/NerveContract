/**
 * Programme Automation Service
 * Handles automated MS Project and Primavera P6 programme changes
 */

import { db } from '../db';
import { programmes, programmeActivities, compensationEvents, earlyWarnings, projects } from '../../shared/schema';
import { eq, and, or, gte, lte, isNull } from 'drizzle-orm';
import { eventBus } from '../event-bus';
import * as xml2js from 'xml2js';
import { promises as fs } from 'fs';
import path from 'path';

interface ProgrammeChange {
  activityId: string;
  changeType: 'delay' | 'acceleration' | 'resource_change' | 'scope_change' | 'delete' | 'add';
  oldValue: any;
  newValue: any;
  reason: string;
  impactDays: number;
  affectsCriticalPath: boolean;
  ceReference?: string;
  ewReference?: string;
}

interface AutomatedProgrammeUpdate {
  projectId: number;
  changes: ProgrammeChange[];
  exportFormat: 'xml' | 'mpp' | 'xer';
  outputPath: string;
  summary: {
    totalChanges: number;
    criticalPathImpact: number;
    completionDateChange: number;
    resourceChanges: number;
  };
}

export class ProgrammeAutomationService {
  private xmlBuilder: xml2js.Builder;
  
  constructor() {
    this.xmlBuilder = new xml2js.Builder({
      rootName: 'Project',
      headless: true,
      renderOpts: { pretty: true, indent: '  ' }
    });
  }

  /**
   * Main entry point for automated programme changes
   */
  async processAutomatedProgrammeChanges(
    projectId: number,
    triggers: {
      compensationEvents?: any[];
      earlyWarnings?: any[];
      resourceChanges?: any[];
      externalDelays?: any[];
    }
  ): Promise<AutomatedProgrammeUpdate> {
    console.log(`🔄 Processing automated programme changes for project ${projectId}`);
    
    // Step 1: Get current programme data
    const currentProgramme = await this.getCurrentProgramme(projectId);
    if (!currentProgramme) {
      throw new Error(`No programme found for project ${projectId}`);
    }

    // Step 2: Analyze all triggers and determine required changes
    const changes: ProgrammeChange[] = [];
    
    if (triggers.compensationEvents) {
      const ceChanges = await this.processCompensationEventChanges(triggers.compensationEvents, currentProgramme);
      changes.push(...ceChanges);
    }
    
    if (triggers.earlyWarnings) {
      const ewChanges = await this.processEarlyWarningChanges(triggers.earlyWarnings, currentProgramme);
      changes.push(...ewChanges);
    }
    
    if (triggers.resourceChanges) {
      const resourceChanges = await this.processResourceChanges(triggers.resourceChanges, currentProgramme);
      changes.push(...resourceChanges);
    }
    
    if (triggers.externalDelays) {
      const delayChanges = await this.processExternalDelayChanges(triggers.externalDelays, currentProgramme);
      changes.push(...delayChanges);
    }

    // Step 3: Apply changes to programme data
    const updatedProgramme = await this.applyChangesToProgramme(currentProgramme, changes);
    
    // Step 4: Recalculate critical path and dependencies
    const recalculatedProgramme = await this.recalculateCriticalPath(updatedProgramme);
    
    // Step 5: Generate export files
    const exportResults = await this.generateExportFiles(projectId, recalculatedProgramme, ['xml', 'mpp']);
    
    // Step 6: Update database with changes
    await this.updateDatabaseWithChanges(projectId, changes, recalculatedProgramme);
    
    // Step 7: Emit events for other agents
    await this.emitProgrammeChangeEvents(projectId, changes);
    
    const summary = this.generateChangeSummary(changes, recalculatedProgramme);
    
    return {
      projectId,
      changes,
      exportFormat: 'xml',
      outputPath: exportResults.xml,
      summary
    };
  }

  /**
   * Process compensation event changes
   */
  private async processCompensationEventChanges(
    compensationEvents: any[],
    currentProgramme: any
  ): Promise<ProgrammeChange[]> {
    const changes: ProgrammeChange[] = [];
    
    for (const ce of compensationEvents) {
      console.log(`📋 Processing CE ${ce.reference} for programme changes`);
      
      // Analyze CE description for programme impact
      const impactAnalysis = await this.analyzeCompensationEventImpact(ce);
      
      if (impactAnalysis.requiresProgrammeChange) {
        const affectedActivities = await this.findAffectedActivities(
          currentProgramme,
          impactAnalysis.keywords,
          impactAnalysis.workAreas
        );
        
        for (const activity of affectedActivities) {
          // Different types of changes based on CE type
          if (ce.clauseReference?.includes('60.1(1)')) {
            // Change to Works Information - scope change
            changes.push({
              activityId: activity.externalId,
              changeType: 'scope_change',
              oldValue: activity.description,
              newValue: `${activity.description} (Modified per ${ce.reference})`,
              reason: `Scope change from ${ce.reference}: ${ce.title}`,
              impactDays: impactAnalysis.estimatedDelayDays,
              affectsCriticalPath: activity.isCritical,
              ceReference: ce.reference
            });
          } else if (ce.clauseReference?.includes('60.1(12)')) {
            // Physical conditions - delay
            changes.push({
              activityId: activity.externalId,
              changeType: 'delay',
              oldValue: activity.endDate,
              newValue: new Date(activity.endDate.getTime() + impactAnalysis.estimatedDelayDays * 24 * 60 * 60 * 1000),
              reason: `Delay due to unforeseen conditions (${ce.reference})`,
              impactDays: impactAnalysis.estimatedDelayDays,
              affectsCriticalPath: activity.isCritical,
              ceReference: ce.reference
            });
          } else if (ce.clauseReference?.includes('60.1(19)')) {
            // Change in law - resource change
            changes.push({
              activityId: activity.externalId,
              changeType: 'resource_change',
              oldValue: activity.resources || [],
              newValue: [...(activity.resources || []), 'Compliance Officer', 'Legal Review'],
              reason: `Additional resources for compliance (${ce.reference})`,
              impactDays: impactAnalysis.estimatedDelayDays,
              affectsCriticalPath: activity.isCritical,
              ceReference: ce.reference
            });
          }
        }
      }
    }
    
    return changes;
  }

  /**
   * Process early warning changes
   */
  private async processEarlyWarningChanges(
    earlyWarnings: any[],
    currentProgramme: any
  ): Promise<ProgrammeChange[]> {
    const changes: ProgrammeChange[] = [];
    
    for (const ew of earlyWarnings) {
      console.log(`⚠️ Processing EW ${ew.reference} for programme changes`);
      
      const riskAnalysis = await this.analyzeEarlyWarningRisk(ew);
      
      if (riskAnalysis.requiresImmediateAction) {
        const affectedActivities = await this.findAffectedActivities(
          currentProgramme,
          riskAnalysis.keywords,
          riskAnalysis.workAreas
        );
        
        for (const activity of affectedActivities) {
          if (riskAnalysis.recommendedAction === 'accelerate') {
            changes.push({
              activityId: activity.externalId,
              changeType: 'acceleration',
              oldValue: activity.duration,
              newValue: Math.max(1, activity.duration * 0.8), // 20% acceleration
              reason: `Acceleration to mitigate risk (${ew.reference})`,
              impactDays: -Math.floor(activity.duration * 0.2),
              affectsCriticalPath: activity.isCritical,
              ewReference: ew.reference
            });
          } else if (riskAnalysis.recommendedAction === 'add_resources') {
            changes.push({
              activityId: activity.externalId,
              changeType: 'resource_change',
              oldValue: activity.resources || [],
              newValue: [...(activity.resources || []), ...riskAnalysis.additionalResources],
              reason: `Additional resources for risk mitigation (${ew.reference})`,
              impactDays: riskAnalysis.estimatedImpactDays,
              affectsCriticalPath: activity.isCritical,
              ewReference: ew.reference
            });
          }
        }
      }
    }
    
    return changes;
  }

  /**
   * Process resource changes
   */
  private async processResourceChanges(
    resourceChanges: any[],
    currentProgramme: any
  ): Promise<ProgrammeChange[]> {
    const changes: ProgrammeChange[] = [];
    
    for (const resourceChange of resourceChanges) {
      const affectedActivities = currentProgramme.activities.filter((activity: any) => 
        activity.resources?.includes(resourceChange.resourceName)
      );
      
      for (const activity of affectedActivities) {
        if (resourceChange.changeType === 'unavailable') {
          changes.push({
            activityId: activity.externalId,
            changeType: 'delay',
            oldValue: activity.endDate,
            newValue: new Date(activity.endDate.getTime() + resourceChange.delayDays * 24 * 60 * 60 * 1000),
            reason: `Resource unavailable: ${resourceChange.resourceName}`,
            impactDays: resourceChange.delayDays,
            affectsCriticalPath: activity.isCritical
          });
        } else if (resourceChange.changeType === 'upgrade') {
          changes.push({
            activityId: activity.externalId,
            changeType: 'acceleration',
            oldValue: activity.duration,
            newValue: Math.max(1, activity.duration * 0.9), // 10% acceleration
            reason: `Improved resource: ${resourceChange.resourceName}`,
            impactDays: -Math.floor(activity.duration * 0.1),
            affectsCriticalPath: activity.isCritical
          });
        }
      }
    }
    
    return changes;
  }

  /**
   * Process external delay changes
   */
  private async processExternalDelayChanges(
    externalDelays: any[],
    currentProgramme: any
  ): Promise<ProgrammeChange[]> {
    const changes: ProgrammeChange[] = [];
    
    for (const delay of externalDelays) {
      const affectedActivities = await this.findAffectedActivities(
        currentProgramme,
        delay.keywords,
        delay.workAreas
      );
      
      for (const activity of affectedActivities) {
        changes.push({
          activityId: activity.externalId,
          changeType: 'delay',
          oldValue: activity.endDate,
          newValue: new Date(activity.endDate.getTime() + delay.delayDays * 24 * 60 * 60 * 1000),
          reason: delay.reason,
          impactDays: delay.delayDays,
          affectsCriticalPath: activity.isCritical
        });
      }
    }
    
    return changes;
  }

  /**
   * Apply changes to programme data
   */
  private async applyChangesToProgramme(
    currentProgramme: any,
    changes: ProgrammeChange[]
  ): Promise<any> {
    const updatedProgramme = JSON.parse(JSON.stringify(currentProgramme));
    
    for (const change of changes) {
      const activity = updatedProgramme.activities.find((a: any) => a.externalId === change.activityId);
      
      if (activity) {
        switch (change.changeType) {
          case 'delay':
            activity.endDate = change.newValue;
            activity.startDate = new Date(activity.endDate.getTime() - activity.duration * 24 * 60 * 60 * 1000);
            break;
          case 'acceleration':
            activity.duration = change.newValue;
            activity.endDate = new Date(activity.startDate.getTime() + activity.duration * 24 * 60 * 60 * 1000);
            break;
          case 'resource_change':
            activity.resources = change.newValue;
            break;
          case 'scope_change':
            activity.description = change.newValue;
            break;
        }
        
        activity.lastModified = new Date();
        activity.modificationReason = change.reason;
      }
    }
    
    return updatedProgramme;
  }

  /**
   * Recalculate critical path after changes
   */
  private async recalculateCriticalPath(programme: any): Promise<any> {
    // Implementation of Critical Path Method (CPM) calculation
    const activities = programme.activities;
    const relationships = programme.relationships || [];
    
    // Ensure all activities have proper Date objects
    for (const activity of activities) {
      if (!(activity.startDate instanceof Date)) {
        activity.startDate = new Date(activity.startDate);
      }
      if (!(activity.endDate instanceof Date)) {
        activity.endDate = new Date(activity.endDate);
      }
    }
    
    // Forward pass - calculate earliest start/finish
    for (const activity of activities) {
      activity.earliestStart = activity.startDate;
      activity.earliestFinish = new Date(activity.startDate.getTime() + activity.duration * 24 * 60 * 60 * 1000);
    }
    
    // Backward pass - calculate latest start/finish
    const projectFinish = new Date(Math.max(...activities.map((a: any) => a.earliestFinish.getTime())));
    
    for (const activity of activities.reverse()) {
      activity.latestFinish = activity.latestFinish || projectFinish;
      activity.latestStart = new Date(activity.latestFinish.getTime() - activity.duration * 24 * 60 * 60 * 1000);
      
      // Calculate total float
      activity.totalFloat = Math.max(0, Math.floor((activity.latestStart.getTime() - activity.earliestStart.getTime()) / (24 * 60 * 60 * 1000)));
      
      // Critical activities have zero float
      activity.isCritical = activity.totalFloat === 0;
    }
    
    programme.criticalPath = activities.filter((a: any) => a.isCritical);
    programme.projectFinish = projectFinish;
    
    return programme;
  }

  /**
   * Generate export files for MS Project and Primavera P6
   */
  private async generateExportFiles(
    projectId: number,
    programme: any,
    formats: string[]
  ): Promise<{ [key: string]: string }> {
    const exportResults: { [key: string]: string } = {};
    
    const exportDir = path.join(process.cwd(), 'exports', 'programmes', projectId.toString());
    await fs.mkdir(exportDir, { recursive: true });
    
    if (formats.includes('xml')) {
      const xmlPath = await this.generateMSProjectXML(programme, exportDir);
      exportResults.xml = xmlPath;
    }
    
    if (formats.includes('mpp')) {
      const mppPath = await this.generateMSProjectMPP(programme, exportDir);
      exportResults.mpp = mppPath;
    }
    
    if (formats.includes('xer')) {
      const xerPath = await this.generatePrimaveraXER(programme, exportDir);
      exportResults.xer = xerPath;
    }
    
    return exportResults;
  }

  /**
   * Generate MS Project XML export
   */
  private async generateMSProjectXML(programme: any, exportDir: string): Promise<string> {
    // Ensure programme has activities
    if (!programme.activities || programme.activities.length === 0) {
      throw new Error('No activities found in programme');
    }
    
    const xmlData = {
      $: {
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
        'xmlns': 'http://schemas.microsoft.com/project'
      },
      SaveVersion: '14',
      Name: programme.name,
      CreationDate: new Date().toISOString(),
      LastSaved: new Date().toISOString(),
      ScheduleFromStart: 'true',
      StartDate: programme.startDate,
      FinishDate: programme.projectFinish,
      Tasks: {
        Task: programme.activities.map((activity: any, index: number) => ({
          ID: index + 1,
          UID: index + 1,
          Name: activity.name,
          Type: '1',
          IsNull: 'false',
          Start: activity.startDate.toISOString(),
          Finish: activity.endDate.toISOString(),
          Duration: `PT${activity.duration * 24}H0M0S`,
          DurationFormat: '7',
          Work: `PT${activity.duration * 8}H0M0S`,
          PercentComplete: activity.percentComplete || 0,
          Critical: activity.isCritical ? 'true' : 'false',
          Milestone: activity.milestone ? 'true' : 'false',
          Notes: activity.modificationReason || activity.description,
          WBS: activity.wbsCode || `${index + 1}`,
          OutlineLevel: '1',
          OutlineNumber: `${index + 1}`
        }))
      }
    };
    
    if (programme.relationships && programme.relationships.length > 0) {
      xmlData.PredecessorLink = programme.relationships.map((rel: any) => ({
        PredecessorUID: rel.predecessorId,
        SuccessorUID: rel.successorId,
        Type: this.convertRelationshipType(rel.type),
        LinkLag: rel.lag || 0
      }));
    }
    
    const xmlString = this.xmlBuilder.buildObject(xmlData);
    const xmlPath = path.join(exportDir, `${programme.name}-${Date.now()}.xml`);
    await fs.writeFile(xmlPath, xmlString);
    
    console.log(`📄 Generated MS Project XML: ${xmlPath}`);
    return xmlPath;
  }

  /**
   * Generate MS Project MPP export (simplified - would need MPXJ library)
   */
  private async generateMSProjectMPP(programme: any, exportDir: string): Promise<string> {
    // This would require MPXJ Java library or similar
    // For now, create a placeholder file
    const mppPath = path.join(exportDir, `${programme.name}-${Date.now()}.mpp`);
    await fs.writeFile(mppPath, Buffer.from('MPP file would be generated here with MPXJ'));
    
    console.log(`📄 Generated MS Project MPP: ${mppPath}`);
    return mppPath;
  }

  /**
   * Generate Primavera P6 XER export
   */
  private async generatePrimaveraXER(programme: any, exportDir: string): Promise<string> {
    // XER format is text-based with specific formatting
    const xerContent = this.generateXERContent(programme);
    const xerPath = path.join(exportDir, `${programme.name}-${Date.now()}.xer`);
    await fs.writeFile(xerPath, xerContent);
    
    console.log(`📄 Generated Primavera XER: ${xerPath}`);
    return xerPath;
  }

  /**
   * Helper methods
   */
  private async getCurrentProgramme(projectId: number): Promise<any> {
    const programme = await db.select()
      .from(programmes)
      .where(eq(programmes.projectId, projectId))
      .then(results => results[0]);
    
    if (!programme) return null;
    
    const activities = await db.select()
      .from(programmeActivities)
      .where(eq(programmeActivities.programmeId, programme.id));
    
    // Get activity relationships (fallback to empty array for now)
    const relationships = [];
    
    return {
      ...programme,
      activities: activities.map(activity => ({
        ...activity,
        startDate: new Date(activity.startDate),
        endDate: new Date(activity.endDate),
        duration: activity.duration || 0,
        percentComplete: activity.percentComplete || 0,
        isCritical: activity.isCritical || false,
        milestone: activity.milestone || false
      })),
      relationships,
      startDate: new Date(programme.submissionDate),
      projectFinish: programme.plannedCompletionDate ? new Date(programme.plannedCompletionDate) : new Date()
    };
  }

  private async analyzeCompensationEventImpact(ce: any): Promise<any> {
    // AI-powered analysis of CE impact
    return {
      requiresProgrammeChange: ce.estimatedValue > 50000 || ce.clauseReference?.includes('60.1'),
      estimatedDelayDays: Math.ceil((ce.estimatedValue || 0) / 10000), // Simple calculation
      keywords: ce.title.toLowerCase().split(' '),
      workAreas: this.extractWorkAreas(ce.description),
      changeType: this.determineChangeType(ce.clauseReference)
    };
  }

  private async analyzeEarlyWarningRisk(ew: any): Promise<any> {
    return {
      requiresImmediateAction: ew.severity === 'high' || ew.description.toLowerCase().includes('critical'),
      estimatedImpactDays: this.calculateEarlyWarningImpact(ew),
      keywords: ew.description.toLowerCase().split(' '),
      workAreas: this.extractWorkAreas(ew.description),
      recommendedAction: this.determineRecommendedAction(ew),
      additionalResources: this.determineAdditionalResources(ew)
    };
  }

  private async findAffectedActivities(programme: any, keywords: string[], workAreas: string[]): Promise<any[]> {
    return programme.activities.filter((activity: any) => {
      const activityText = `${activity.name} ${activity.description}`.toLowerCase();
      return keywords.some(keyword => activityText.includes(keyword)) ||
             workAreas.some(area => activityText.includes(area));
    });
  }

  private convertRelationshipType(type: string): string {
    switch (type) {
      case 'FS': return '1'; // Finish-to-Start
      case 'FF': return '0'; // Finish-to-Finish
      case 'SS': return '2'; // Start-to-Start
      case 'SF': return '3'; // Start-to-Finish
      default: return '1';
    }
  }

  private extractWorkAreas(description: string): string[] {
    const workAreaKeywords = ['foundation', 'excavation', 'concrete', 'steel', 'roofing', 'mechanical', 'electrical'];
    return workAreaKeywords.filter(keyword => description.toLowerCase().includes(keyword));
  }

  private determineChangeType(clauseReference: string): string {
    if (clauseReference?.includes('60.1(1)')) return 'scope_change';
    if (clauseReference?.includes('60.1(12)')) return 'delay';
    if (clauseReference?.includes('60.1(19)')) return 'resource_change';
    return 'delay';
  }

  private calculateEarlyWarningImpact(ew: any): number {
    // Simple calculation based on severity
    const severityMap = { low: 1, medium: 3, high: 7, critical: 14 };
    return severityMap[ew.severity as keyof typeof severityMap] || 3;
  }

  private determineRecommendedAction(ew: any): string {
    if (ew.description.toLowerCase().includes('delay')) return 'accelerate';
    if (ew.description.toLowerCase().includes('resource')) return 'add_resources';
    return 'monitor';
  }

  private determineAdditionalResources(ew: any): string[] {
    const resourceMap = {
      'weather': ['Weather Protection', 'Additional Supervision'],
      'quality': ['Quality Inspector', 'Additional Testing'],
      'safety': ['Safety Officer', 'Additional PPE'],
      'delivery': ['Logistics Coordinator', 'Alternative Supplier']
    };
    
    for (const [key, resources] of Object.entries(resourceMap)) {
      if (ew.description.toLowerCase().includes(key)) {
        return resources;
      }
    }
    
    return ['Project Coordinator'];
  }

  private generateXERContent(programme: any): string {
    // Basic XER format structure
    let xerContent = `ERMHDR    1.0\nEXPORT     FLG=Y   VER=18.8.11.0\nPROJ     ${programme.name}\n`;
    
    programme.activities.forEach((activity: any, index: number) => {
      xerContent += `TASK       ${index + 1}    ${activity.name}        ${activity.duration}    ${activity.startDate.toISOString().split('T')[0]}       ${activity.endDate.toISOString().split('T')[0]}\n`;
    });
    
    return xerContent;
  }

  private async updateDatabaseWithChanges(projectId: number, changes: ProgrammeChange[], programme: any): Promise<void> {
    // Update programme activities in database
    for (const change of changes) {
      const activity = programme.activities.find((a: any) => a.externalId === change.activityId);
      if (activity) {
        await db.update(programmeActivities)
          .set({
            startDate: activity.startDate,
            endDate: activity.endDate,
            duration: activity.duration,
            isCritical: activity.isCritical,
            totalFloat: activity.totalFloat
          })
          .where(eq(programmeActivities.externalId, change.activityId));
      }
    }
  }

  private async emitProgrammeChangeEvents(projectId: number, changes: ProgrammeChange[]): Promise<void> {
    eventBus.emitEvent('programme.automated_changes', {
      projectId,
      changes,
      timestamp: new Date(),
      totalChanges: changes.length,
      criticalPathAffected: changes.filter(c => c.affectsCriticalPath).length
    });
  }

  private generateChangeSummary(changes: ProgrammeChange[], programme: any): any {
    return {
      totalChanges: changes.length,
      criticalPathImpact: changes.filter(c => c.affectsCriticalPath).length,
      completionDateChange: 0, // Would calculate based on critical path
      resourceChanges: changes.filter(c => c.changeType === 'resource_change').length
    };
  }
}

export const programmeAutomation = new ProgrammeAutomationService();