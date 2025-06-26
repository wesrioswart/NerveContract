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
    const dateCondition = and(
      gte(sql`DATE(${compensationEvents.raisedAt})`, startDate.toISOString().split('T')[0]),
      lte(sql`DATE(${compensationEvents.raisedAt})`, endDate.toISOString().split('T')[0])
    );

    // Get compensation events
    const ceData = await db
      .select({
        id: compensationEvents.id,
        status: compensationEvents.status,
        estimatedValue: compensationEvents.estimatedValue
      })
      .from(compensationEvents)
      .where(and(eq(compensationEvents.projectId, projectId), dateCondition));

    // Get early warnings
    const ewData = await db
      .select({
        id: earlyWarnings.id,
        status: earlyWarnings.status
      })
      .from(earlyWarnings)
      .where(and(eq(earlyWarnings.projectId, projectId), dateCondition));

    // Get RFIs
    const rfiData = await db
      .select({
        id: rfis.id,
        status: rfis.status
      })
      .from(rfis)
      .where(and(eq(rfis.projectId, projectId), dateCondition));

    // Get programmes
    const progData = await db
      .select({
        id: programmes.id,
        name: programmes.name,
        totalActivities: programmes.totalActivities,
        completedActivities: programmes.completedActivities
      })
      .from(programmes)
      .where(eq(programmes.projectId, projectId));

    return {
      compensationEvents: {
        total: ceData.length,
        totalValue: ceData.reduce((sum: number, ce: any) => sum + (ce.estimatedValue || 0), 0),
        byStatus: ceData.reduce((acc: Record<string, number>, ce: any) => {
          acc[ce.status] = (acc[ce.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      earlyWarnings: {
        total: ewData.length,
        byStatus: ewData.reduce((acc: Record<string, number>, ew: any) => {
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
        name: p.name,
        progress: p.totalActivities > 0 
          ? Math.round((p.completedActivities / p.totalActivities) * 100)
          : 0,
        totalActivities: p.totalActivities,
        completedActivities: p.completedActivities
      }))
    };
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