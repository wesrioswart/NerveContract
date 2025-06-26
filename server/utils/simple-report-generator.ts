import { db } from '../db';
import { projects, compensationEvents, earlyWarnings, rfis } from '../../shared/schema';
import { eq, and, gte, lte, desc, count, sql } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
  type: 'weekly' | 'monthly';
}

export interface SimpleProjectMetrics {
  compensationEvents: {
    total: number;
    value: number;
    recentEvents: any[];
  };
  earlyWarnings: {
    total: number;
    openItems: any[];
  };
  rfis: {
    total: number;
    pendingItems: any[];
  };
}

export class SimpleReportGenerator {
  async generateProjectReport(projectId: number, period: ReportPeriod): Promise<string> {
    try {
      // Collect basic project metrics
      const metrics = await this.collectBasicMetrics(projectId, period);
      const projectData = await this.getProjectDetails(projectId);
      
      // Generate AI-powered analysis
      const reportContent = await this.generateAIAnalysis(projectData, metrics, period);
      
      return reportContent;
    } catch (error) {
      console.error('Error generating project report:', error);
      throw new Error('Failed to generate project report');
    }
  }

  private async collectBasicMetrics(projectId: number, period: ReportPeriod): Promise<SimpleProjectMetrics> {
    const { startDate, endDate } = period;

    // Compensation Events metrics
    const ceData = await db.select({
      id: compensationEvents.id,
      title: compensationEvents.title,
      estimatedValue: compensationEvents.estimatedValue,
      status: compensationEvents.status,
      raisedAt: compensationEvents.raisedAt,
    }).from(compensationEvents)
      .where(and(
        eq(compensationEvents.projectId, projectId),
        gte(compensationEvents.raisedAt, startDate),
        lte(compensationEvents.raisedAt, endDate)
      ))
      .orderBy(desc(compensationEvents.raisedAt));

    const ceMetrics = {
      total: ceData.length,
      value: ceData.reduce((sum, ce) => sum + (ce.estimatedValue || 0), 0),
      recentEvents: ceData.slice(0, 5)
    };

    // Early Warnings metrics
    const ewData = await db.select({
      id: earlyWarnings.id,
      description: earlyWarnings.description,
      status: earlyWarnings.status,
      raisedAt: earlyWarnings.raisedAt,
    }).from(earlyWarnings)
      .where(and(
        eq(earlyWarnings.projectId, projectId),
        gte(earlyWarnings.raisedAt, startDate),
        lte(earlyWarnings.raisedAt, endDate)
      ))
      .orderBy(desc(earlyWarnings.raisedAt));

    const ewMetrics = {
      total: ewData.length,
      openItems: ewData.filter(ew => ew.status === 'open').slice(0, 5)
    };

    // RFI metrics
    const rfiData = await db.select({
      id: rfis.id,
      reference: rfis.reference,
      title: rfis.title,
      status: rfis.status,
      submissionDate: rfis.submissionDate,
    }).from(rfis)
      .where(and(
        eq(rfis.projectId, projectId),
        sql`${rfis.submissionDate} >= ${startDate.toISOString()}`,
        sql`${rfis.submissionDate} <= ${endDate.toISOString()}`
      ))
      .orderBy(desc(rfis.submissionDate));

    const rfiMetrics = {
      total: rfiData.length,
      pendingItems: rfiData.filter(rfi => rfi.status === 'pending').slice(0, 5)
    };

    return {
      compensationEvents: ceMetrics,
      earlyWarnings: ewMetrics,
      rfis: rfiMetrics
    };
  }

  private async getProjectDetails(projectId: number) {
    const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    return project[0];
  }

  private async generateAIAnalysis(projectData: any, metrics: SimpleProjectMetrics, period: ReportPeriod): Promise<string> {
    const periodText = period.type === 'weekly' ? 'Weekly' : 'Monthly';
    const dateRange = `${period.startDate.toLocaleDateString()} to ${period.endDate.toLocaleDateString()}`;

    const prompt = `Generate a comprehensive ${period.type} project report for "${projectData.name}" covering ${dateRange}.

Project Context:
- Contract Type: ${projectData.contractType || 'NEC4'}
- Contract Value: £${projectData.contractValue?.toLocaleString() || 'Not specified'}

Period Metrics:
COMPENSATION EVENTS:
- Total: ${metrics.compensationEvents.total}
- Value: £${metrics.compensationEvents.value.toLocaleString()}

EARLY WARNINGS:
- Total: ${metrics.earlyWarnings.total}
- Open Items: ${metrics.earlyWarnings.openItems.length}

RFIs:
- Total: ${metrics.rfis.total}
- Pending: ${metrics.rfis.pendingItems.length}

Generate a professional, executive-level report with:
1. Executive Summary (key insights and overall health)
2. Risk Assessment (current risks and mitigation recommendations)
3. Performance Analysis (trends, achievements, concerns)
4. Recommendations (specific actions for next period)

Use NEC4 terminology appropriately and focus on actionable insights for project management decisions.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert NEC4 contract management consultant generating professional project reports. Provide clear, actionable insights with appropriate technical detail for project managers and stakeholders."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      return response.choices[0].message.content || 'Unable to generate report content';
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      return `# ${periodText} Project Report

## Executive Summary
${projectData.name} project status for ${dateRange}.

## Key Metrics
- Compensation Events: ${metrics.compensationEvents.total} (£${metrics.compensationEvents.value.toLocaleString()})
- Early Warnings: ${metrics.earlyWarnings.total} (${metrics.earlyWarnings.openItems.length} open)
- RFIs: ${metrics.rfis.total} (${metrics.rfis.pendingItems.length} pending)

## Status
The project continues with standard contract administration activities. Regular monitoring and management of events, warnings, and information requests is ongoing.

## Recommendations
- Continue monitoring open early warnings
- Address pending RFIs promptly
- Review compensation event valuations

*Note: AI analysis unavailable - check API configuration*`;
    }
  }

  async generateReportSummary(projectId: number, period: ReportPeriod): Promise<any> {
    const metrics = await this.collectBasicMetrics(projectId, period);
    
    return {
      period: `${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()}`,
      type: period.type,
      summary: {
        totalEvents: metrics.compensationEvents.total + metrics.earlyWarnings.total,
        totalValue: metrics.compensationEvents.value,
        riskLevel: this.calculateRiskLevel(metrics),
        completionStatus: 75 // Simplified placeholder
      },
      metrics
    };
  }

  private calculateRiskLevel(metrics: SimpleProjectMetrics): 'low' | 'medium' | 'high' {
    const totalIssues = metrics.earlyWarnings.openItems.length + metrics.rfis.pendingItems.length;
    
    if (totalIssues >= 5) return 'high';
    if (totalIssues >= 2) return 'medium';
    return 'low';
  }
}

export const simpleReportGenerator = new SimpleReportGenerator();