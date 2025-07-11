import { db } from '../db';
import { projects, compensationEvents, earlyWarnings, rfis, equipmentHires, purchaseOrders, programmeMilestones, suppliers } from '../../shared/schema';
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

export interface ProjectMetrics {
  compensationEvents: {
    total: number;
    value: number;
    byStatus: Record<string, number>;
    recentEvents: any[];
  };
  earlyWarnings: {
    total: number;
    bySeverity: Record<string, number>;
    openItems: any[];
  };
  rfis: {
    total: number;
    responseRate: number;
    avgResponseTime: number;
    pendingItems: any[];
  };
  equipment: {
    totalCost: number;
    activeHires: number;
    complianceIssues: number;
    topItems: any[];
  };
  procurement: {
    totalValue: number;
    orderCount: number;
    supplierPerformance: any[];
    pendingOrders: any[];
  };
  programme: {
    completedMilestones: number;
    delayedMilestones: number;
    averageDelay: number;
    criticalPath: any[];
  };
}

export class AIReportGenerator {
  async generateProjectReport(projectId: number, period: ReportPeriod): Promise<string> {
    try {
      // Collect comprehensive project metrics
      const metrics = await this.collectProjectMetrics(projectId, period);
      const projectData = await this.getProjectDetails(projectId);
      
      // Generate AI-powered analysis
      const reportContent = await this.generateAIAnalysis(projectData, metrics, period);
      
      return reportContent;
    } catch (error) {
      console.error('Error generating project report:', error);
      throw new Error('Failed to generate project report');
    }
  }

  private async collectProjectMetrics(projectId: number, period: ReportPeriod): Promise<ProjectMetrics> {
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
      byStatus: ceData.reduce((acc, ce) => {
        acc[ce.status] = (acc[ce.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentEvents: ceData.slice(0, 5)
    };

    // Early Warnings metrics
    const ewData = await db.select({
      id: earlyWarnings.id,
      title: earlyWarnings.description,
      severity: earlyWarnings.category,
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
      bySeverity: ewData.reduce((acc, ew) => {
        acc[ew.severity] = (acc[ew.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      openItems: ewData.filter(ew => ew.status === 'open').slice(0, 5)
    };

    // RFI metrics
    const rfiData = await db.select({
      id: rfis.id,
      reference: rfis.reference,
      title: rfis.title,
      status: rfis.status,
      submissionDate: rfis.submissionDate,
      responseDate: rfis.responseDate,
    }).from(rfis)
      .where(and(
        eq(rfis.projectId, projectId),
        gte(rfis.submissionDate, startDate.toISOString()),
        lte(rfis.submissionDate, endDate.toISOString())
      ))
      .orderBy(desc(rfis.submissionDate));

    const respondedRfis = rfiData.filter(rfi => rfi.responseDate);
    const avgResponseTime = respondedRfis.length > 0 
      ? respondedRfis.reduce((sum, rfi) => {
          const submissionTime = new Date(rfi.submissionDate).getTime();
          const responseTime = new Date(rfi.responseDate!).getTime();
          const days = Math.floor((responseTime - submissionTime) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / respondedRfis.length 
      : 0;

    const rfiMetrics = {
      total: rfiData.length,
      responseRate: rfiData.length > 0 ? (respondedRfis.length / rfiData.length) * 100 : 0,
      avgResponseTime,
      pendingItems: rfiData.filter(rfi => rfi.status === 'pending').slice(0, 5)
    };

    // Equipment metrics
    const equipmentData = await db.select({
      id: equipmentHires.id,
      equipmentName: equipmentHires.hireReference,
      totalCost: equipmentHires.hireRate,
      status: equipmentHires.status,
      startDate: equipmentHires.startDate,
    }).from(equipmentHires)
      .where(and(
        eq(equipmentHires.projectId, projectId),
        gte(equipmentHires.startDate, startDate.toISOString().split('T')[0]),
        lte(equipmentHires.startDate, endDate.toISOString().split('T')[0])
      ))
      .orderBy(desc(equipmentHires.hireRate));

    const equipmentMetrics = {
      totalCost: equipmentData.reduce((sum, eq) => sum + (eq.totalCost || 0), 0),
      activeHires: equipmentData.filter(eq => eq.status === 'on-hire').length,
      complianceIssues: equipmentData.filter(eq => eq.status === 'disputed').length,
      topItems: equipmentData.slice(0, 5)
    };

    // Procurement metrics
    const procurementData = await db.select({
      id: purchaseOrders.id,
      reference: purchaseOrders.reference,
      totalValue: purchaseOrders.totalValue,
      status: purchaseOrders.status,
      supplierId: purchaseOrders.supplierId,
      orderDate: purchaseOrders.createdAt,
    }).from(purchaseOrders)
      .where(and(
        eq(purchaseOrders.projectId, projectId),
        gte(purchaseOrders.createdAt, startDate),
        lte(purchaseOrders.createdAt, endDate)
      ))
      .orderBy(desc(purchaseOrders.totalValue));

    const procurementMetrics = {
      totalValue: procurementData.reduce((sum, po) => sum + (po.totalValue || 0), 0),
      orderCount: procurementData.length,
      supplierPerformance: [], // To be enhanced with supplier performance data
      pendingOrders: procurementData.filter(po => po.status === 'draft').slice(0, 5)
    };

    // Programme metrics
    const milestoneData = await db.select({
      id: programmeMilestones.id,
      name: programmeMilestones.name,
      plannedDate: programmeMilestones.plannedDate,
      actualDate: programmeMilestones.actualDate,
      status: programmeMilestones.status,
      delayDays: programmeMilestones.delayDays,
    }).from(programmeMilestones)
      .where(eq(programmeMilestones.projectId, projectId))
      .orderBy(programmeMilestones.plannedDate);

    const completedMilestones = milestoneData.filter(m => m.status === 'Completed');
    const delayedMilestones = milestoneData.filter(m => m.delayDays && m.delayDays > 0);
    const avgDelay = delayedMilestones.length > 0 
      ? delayedMilestones.reduce((sum, m) => sum + (m.delayDays || 0), 0) / delayedMilestones.length 
      : 0;

    const programmeMetrics = {
      completedMilestones: completedMilestones.length,
      delayedMilestones: delayedMilestones.length,
      averageDelay: avgDelay,
      criticalPath: milestoneData.filter(m => m.status === 'In Progress' || m.status === 'Not Started').slice(0, 5)
    };

    return {
      compensationEvents: ceMetrics,
      earlyWarnings: ewMetrics,
      rfis: rfiMetrics,
      equipment: equipmentMetrics,
      procurement: procurementMetrics,
      programme: programmeMetrics
    };
  }

  private async getProjectDetails(projectId: number) {
    const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    return project[0];
  }

  private async generateAIAnalysis(projectData: any, metrics: ProjectMetrics, period: ReportPeriod): Promise<string> {
    const periodText = period.type === 'weekly' ? 'Weekly' : 'Monthly';
    const dateRange = `${period.startDate.toLocaleDateString()} to ${period.endDate.toLocaleDateString()}`;

    const prompt = `Generate a comprehensive ${period.type} project report for "${projectData.name}" covering ${dateRange}.

Project Context:
- Contract Type: ${projectData.contractType}
- Budget: £${projectData.budget?.toLocaleString() || 'Not specified'}
- Status: ${projectData.status}

Period Metrics:
COMPENSATION EVENTS:
- Total: ${metrics.compensationEvents.total}
- Value: £${metrics.compensationEvents.value.toLocaleString()}
- By Status: ${JSON.stringify(metrics.compensationEvents.byStatus)}

EARLY WARNINGS:
- Total: ${metrics.earlyWarnings.total}
- By Severity: ${JSON.stringify(metrics.earlyWarnings.bySeverity)}
- Open Items: ${metrics.earlyWarnings.openItems.length}

RFIs:
- Total: ${metrics.rfis.total}
- Response Rate: ${metrics.rfis.responseRate.toFixed(1)}%
- Avg Response Time: ${metrics.rfis.avgResponseTime.toFixed(1)} days
- Pending: ${metrics.rfis.pendingItems.length}

EQUIPMENT:
- Total Cost: £${metrics.equipment.totalCost.toLocaleString()}
- Active Hires: ${metrics.equipment.activeHires}
- Compliance Issues: ${metrics.equipment.complianceIssues}

PROCUREMENT:
- Total Value: £${metrics.procurement.totalValue.toLocaleString()}
- Order Count: ${metrics.procurement.orderCount}
- Pending Orders: ${metrics.procurement.pendingOrders.length}

PROGRAMME:
- Completed Milestones: ${metrics.programme.completedMilestones}
- Delayed Milestones: ${metrics.programme.delayedMilestones}
- Average Delay: ${metrics.programme.averageDelay.toFixed(1)} days

Generate a professional, executive-level report with:
1. Executive Summary (key insights and overall health)
2. Performance Analysis (trends, achievements, concerns)
3. Risk Assessment (current risks and mitigation recommendations)
4. Financial Overview (cost performance and budget impact)
5. Programme Status (timeline adherence and critical path)
6. Recommendations (specific actions for next period)

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
        max_tokens: 3000,
        temperature: 0.7
      });

      return response.choices[0].message.content || 'Unable to generate report content';
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      return `Error generating AI analysis. Please check API configuration.`;
    }
  }

  async generateReportSummary(projectId: number, period: ReportPeriod): Promise<any> {
    const metrics = await this.collectProjectMetrics(projectId, period);
    
    return {
      period: `${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()}`,
      type: period.type,
      summary: {
        totalEvents: metrics.compensationEvents.total + metrics.earlyWarnings.total,
        totalValue: metrics.compensationEvents.value + metrics.equipment.totalCost + metrics.procurement.totalValue,
        riskLevel: this.calculateRiskLevel(metrics),
        completionStatus: this.calculateCompletionStatus(metrics)
      },
      metrics
    };
  }

  private calculateRiskLevel(metrics: ProjectMetrics): 'low' | 'medium' | 'high' {
    const riskFactors = [
      metrics.earlyWarnings.bySeverity.critical || 0,
      metrics.earlyWarnings.bySeverity.high || 0,
      metrics.equipment.complianceIssues,
      metrics.programme.delayedMilestones
    ];

    const totalRisk = riskFactors.reduce((sum, factor) => sum + factor, 0);
    
    if (totalRisk >= 5) return 'high';
    if (totalRisk >= 2) return 'medium';
    return 'low';
  }

  private calculateCompletionStatus(metrics: ProjectMetrics): number {
    const total = metrics.programme.completedMilestones + metrics.programme.delayedMilestones;
    return total > 0 ? (metrics.programme.completedMilestones / total) * 100 : 0;
  }
}

export const reportGenerator = new AIReportGenerator();