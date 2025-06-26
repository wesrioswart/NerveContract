import { db } from '../db.js';
import { 
  compensationEvents, 
  earlyWarnings, 
  rfis, 
  projects, 
  users,
  programmes,
  programmeActivities
} from '../../shared/schema.js';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

interface SimpleProjectMetrics {
  compensationEvents: {
    total: number;
    totalValue: number;
    byStatus: Record<string, number>;
  };
  earlyWarnings: {
    total: number;
    byStatus: Record<string, number>;
  };
  rfis: {
    total: number;
    byStatus: Record<string, number>;
  };
  programmes: Array<{
    id: number;
    name: string;
    progress: number;
    totalActivities: number;
    completedActivities: number;
  }>;
}

interface ReportAuthor {
  id: number;
  name: string;
  email: string;
  position?: string | null;
  department?: string | null;
}

export interface ReportSummary {
  period: string;
  type: 'weekly' | 'monthly';
  summary: {
    totalCompensationEvents: number;
    totalEarlyWarnings: number;
    totalRFIs: number;
    projectStatus: string;
    keyHighlights: string[];
  };
  analysis?: string;
  generatedAt: string;
  submittedBy?: {
    name: string;
    position: string;
    department: string;
    email: string;
    submissionDate: string;
  };
}

export class SimpleReportGenerator {
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private calculateRiskLevel(metrics: SimpleProjectMetrics): 'LOW' | 'MEDIUM' | 'HIGH' {
    const totalIssues = metrics.compensationEvents.total + metrics.earlyWarnings.total;
    
    if (totalIssues >= 10) return 'HIGH';
    if (totalIssues >= 5) return 'MEDIUM';
    return 'LOW';
  }

  private async getProjectMetrics(
    projectId: number,
    startDate: Date,
    endDate: Date
  ): Promise<SimpleProjectMetrics> {
    try {
      // Get compensation events using raw SQL to avoid schema issues
      const ceData = await db.execute(sql`
        SELECT id, status, estimated_value 
        FROM compensation_events 
        WHERE project_id = ${projectId}
      `);
      console.log('CE Data:', ceData.rows?.length || 0, 'rows');

      // This was the problematic Drizzle query - now removed

      // Get RFIs using raw SQL
      let rfiData: any[] = [];
      try {
        const rfiResult = await db.execute(sql`
          SELECT id, status 
          FROM rfi 
          WHERE project_id = ${projectId}
        `);
        rfiData = rfiResult.rows || [];
        console.log('RFI Data:', rfiData.length, 'rows');
      } catch (error) {
        console.log('RFI table not found, continuing without RFI data');
        rfiData = [];
      }

      // Get programmes using raw SQL
      const progResult = await db.execute(sql`
        SELECT id, name, total_activities, completed_activities
        FROM programmes 
        WHERE project_id = ${projectId}
      `);
      const progData = progResult.rows || [];
      console.log('Programme Data:', progData.length, 'rows');

      // Process raw SQL results correctly
      const ceRows = ceData.rows || [];
      const ewRows = ewData.rows || [];
      
      return {
      compensationEvents: {
        total: ceRows.length,
        totalValue: ceRows.reduce((sum: number, ce: any) => sum + (ce.estimated_value || 0), 0),
        byStatus: ceRows.reduce((acc: Record<string, number>, ce: any) => {
          acc[ce.status] = (acc[ce.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      earlyWarnings: {
        total: ewRows.length,
        byStatus: ewRows.reduce((acc: Record<string, number>, ew: any) => {
          acc[ew.status] = (acc[ew.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      rfis: {
        total: rfiData.length,
        byStatus: rfiData.reduce((acc: Record<string, number>, rfi: any) => {
          acc[rfi.status] = (acc[rfi.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      programmes: progData.map((p: any) => ({
        id: p.id,
        name: p.name || 'Unnamed Programme',
        progress: p.total_activities > 0 
          ? Math.round((p.completed_activities / p.total_activities) * 100)
          : 0,
        totalActivities: p.total_activities || 0,
        completedActivities: p.completed_activities || 0
      }))
      };
    } catch (error) {
      console.error('Error in getProjectMetrics:', error);
      // Return default empty metrics on error
      return {
        compensationEvents: { total: 0, totalValue: 0, byStatus: {} },
        earlyWarnings: { total: 0, byStatus: {} },
        rfis: { total: 0, byStatus: {} },
        programmes: []
      };
    }
  }

  private async getProject(projectId: number) {
    const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    return project[0];
  }

  private async getAuthorDetails(authorId: number): Promise<ReportAuthor | null> {
    try {
      const author = await db.select({
        id: users.id,
        name: users.fullName,
        email: users.email,
        position: users.position,
        department: users.department
      }).from(users).where(eq(users.id, authorId)).limit(1);
      
      return author[0] || null;
    } catch (error) {
      console.error('Error fetching author details:', error);
      return null;
    }
  }

  async generateReportSummary(
    projectId: number, 
    periodType: 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
    authorId?: number
  ): Promise<ReportSummary> {
    try {
      const [metrics, project] = await Promise.all([
        this.getProjectMetrics(projectId, startDate, endDate),
        this.getProject(projectId)
      ]);

      const authorDetails = authorId ? await this.getAuthorDetails(authorId) : null;

      return {
        period: `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`,
        type: periodType,
        summary: {
          totalCompensationEvents: metrics.compensationEvents.total,
          totalEarlyWarnings: metrics.earlyWarnings.total,
          totalRFIs: metrics.rfis.total,
          projectStatus: 'Active',
          keyHighlights: [
            `${metrics.compensationEvents.total} compensation events processed`,
            `${metrics.earlyWarnings.total} early warnings raised`,
            `${metrics.rfis.total} RFIs submitted`
          ]
        },
        generatedAt: new Date().toISOString(),
        submittedBy: authorDetails ? {
          name: authorDetails.name,
          position: authorDetails.position || 'Project Team Member',
          department: authorDetails.department || 'Project Management',
          email: authorDetails.email,
          submissionDate: new Date().toISOString()
        } : undefined
      };
    } catch (error) {
      console.error('Error generating report summary:', error);
      throw error;
    }
  }

  async generateReport(
    projectId: number,
    periodType: 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
    authorId?: number
  ): Promise<{ report: string; period: string; type: 'weekly' | 'monthly'; generatedAt: string; }> {
    const summary = await this.generateReportSummary(projectId, periodType, startDate, endDate, authorId);
    
    const report = `
# ${periodType.charAt(0).toUpperCase() + periodType.slice(1)} Project Report
**Period:** ${summary.period}
**Generated:** ${new Date().toLocaleDateString('en-GB')}

## Executive Summary
This ${periodType} report covers project activity from ${this.formatDate(startDate)} to ${this.formatDate(endDate)}.

### Key Metrics
- **Compensation Events:** ${summary.summary.totalCompensationEvents}
- **Early Warnings:** ${summary.summary.totalEarlyWarnings}
- **RFIs:** ${summary.summary.totalRFIs}
- **Project Status:** ${summary.summary.projectStatus}

### Key Highlights
${summary.summary.keyHighlights.map(highlight => `- ${highlight}`).join('\n')}

## Analysis
The project shows ${summary.summary.totalCompensationEvents + summary.summary.totalEarlyWarnings < 5 ? 'normal' : 'elevated'} activity levels for this period.

${summary.submittedBy ? `\n---\n**Report submitted by:** ${summary.submittedBy.name} (${summary.submittedBy.position})\n**Department:** ${summary.submittedBy.department}\n**Date:** ${new Date(summary.submittedBy.submissionDate).toLocaleDateString('en-GB')}` : ''}
    `.trim();

    return {
      report,
      period: summary.period,
      type: periodType,
      generatedAt: summary.generatedAt
    };
  }
}

export const simpleReportGenerator = new SimpleReportGenerator();