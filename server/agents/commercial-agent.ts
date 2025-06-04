import { AgentCoordinator, AgentCommunication, AgentAlert } from './agent-coordinator';
import { db } from '../db';
import { compensationEvents, equipmentHires, paymentCertificates } from '@shared/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface EquipmentHireData {
  id: number;
  projectId: number;
  equipmentName: string;
  supplierName: string;
  hireReference: string;
  startDate: Date;
  endDate: Date;
  dailyRate: number;
  totalCost: number;
  status: 'active' | 'completed' | 'disputed';
  sccCompliant: boolean;
  workingAreasOnly: boolean;
}

export interface CostAnalysis {
  projectId: number;
  totalDefinedCost: number;
  validatedCosts: number;
  pendingValidation: number;
  disallowedCosts: number;
  costDrift: number;
  budgetVariance: number;
}

export class CommercialAgent {
  private coordinator: AgentCoordinator;
  private costCache: Map<number, CostAnalysis> = new Map();
  private sccValidationRules: Map<string, any> = new Map();

  constructor(coordinator: AgentCoordinator) {
    this.coordinator = coordinator;
    this.initializeSCCRules();
  }

  private initializeSCCRules(): void {
    // Schedule of Cost Components validation rules
    this.sccValidationRules.set('equipment-hire', {
      requiredDocuments: ['hire-agreement', 'invoice', 'proof-of-payment'],
      workingAreasRequired: true,
      validPaymentTerms: ['weekly', 'monthly'],
      maxIdleTime: 0.1 // 10% of hire period
    });

    this.sccValidationRules.set('people-costs', {
      requiredDocuments: ['timesheet', 'payroll', 'employment-contract'],
      validRoles: ['operative', 'supervisor', 'manager', 'specialist'],
      overtimeRules: true
    });
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

  // Process equipment hire data and validate against SCC
  async processEquipmentHire(projectId: number, equipmentData: EquipmentHireData): Promise<void> {
    console.log(`Commercial Agent processing equipment hire for project ${projectId}`);

    try {
      // Validate against Schedule of Cost Components
      const validation = await this.validateEquipmentCost(equipmentData);
      
      if (!validation.isCompliant) {
        await this.createAlert({
          agentType: 'commercial',
          severity: 'high',
          title: 'Equipment Cost SCC Compliance Issue',
          message: `Equipment hire ${equipmentData.hireReference}: ${validation.issues.join(', ')}`,
          actionRequired: true,
          relatedEntity: { 
            type: 'equipment', 
            id: equipmentData.id,
            reference: equipmentData.hireReference
          },
          projectId: projectId
        });
      }

      // Check for off-hire requirements
      await this.checkOffHireRequirements(equipmentData);

      // Update cost analysis
      await this.updateCostAnalysis(projectId);

    } catch (error) {
      console.error('Error processing equipment hire:', error);
      await this.createAlert({
        agentType: 'commercial',
        severity: 'high',
        title: 'Equipment Processing Error',
        message: `Failed to process equipment hire: ${error}`,
        actionRequired: true,
        relatedEntity: { type: 'equipment', id: equipmentData.id },
        projectId: projectId
      });
    }
  }

  private async validateEquipmentCost(equipmentData: EquipmentHireData): Promise<{
    isCompliant: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if equipment is used within Working Areas
    if (!equipmentData.workingAreasOnly) {
      issues.push('Equipment used outside defined Working Areas');
      recommendations.push('Verify equipment usage is for Providing the Works only');
    }

    // Check daily rate reasonableness
    if (equipmentData.dailyRate > 1000) {
      issues.push('Daily rate appears unusually high');
      recommendations.push('Verify hire rate against market rates');
    }

    // Check hire duration
    const hireDuration = Math.ceil(
      (equipmentData.endDate.getTime() - equipmentData.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (hireDuration > 90) {
      recommendations.push('Consider equipment purchase vs long-term hire');
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      recommendations
    };
  }

  private async checkOffHireRequirements(equipmentData: EquipmentHireData): Promise<void> {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

    // Check if equipment hire is ending soon
    if (equipmentData.endDate <= sevenDaysFromNow && equipmentData.status === 'active') {
      await this.createAlert({
        agentType: 'commercial',
        severity: 'medium',
        title: 'Equipment Off-Hire Due Soon',
        message: `Equipment ${equipmentData.equipmentName} (${equipmentData.hireReference}) off-hire due: ${equipmentData.endDate.toDateString()}`,
        actionRequired: true,
        relatedEntity: { 
          type: 'equipment', 
          id: equipmentData.id,
          reference: equipmentData.hireReference
        },
        projectId: equipmentData.projectId
      });
    }

    // Check for overdue off-hire
    if (equipmentData.endDate < now && equipmentData.status === 'active') {
      await this.createAlert({
        agentType: 'commercial',
        severity: 'critical',
        title: 'Equipment Off-Hire Overdue',
        message: `Equipment ${equipmentData.equipmentName} (${equipmentData.hireReference}) was due for off-hire on ${equipmentData.endDate.toDateString()}`,
        actionRequired: true,
        relatedEntity: { 
          type: 'equipment', 
          id: equipmentData.id,
          reference: equipmentData.hireReference
        },
        projectId: equipmentData.projectId
      });
    }
  }

  private async updateCostAnalysis(projectId: number): Promise<void> {
    // Calculate project cost metrics
    const totalDefinedCost = await this.calculateTotalDefinedCost(projectId);
    const validatedCosts = await this.calculateValidatedCosts(projectId);
    const pendingValidation = await this.calculatePendingValidation(projectId);

    const analysis: CostAnalysis = {
      projectId,
      totalDefinedCost,
      validatedCosts,
      pendingValidation,
      disallowedCosts: totalDefinedCost - validatedCosts - pendingValidation,
      costDrift: 0, // Calculate against budget
      budgetVariance: 0 // Calculate against original budget
    };

    this.costCache.set(projectId, analysis);

    // Check for cost variances
    if (analysis.disallowedCosts > 5000) {
      await this.createAlert({
        agentType: 'commercial',
        severity: 'high',
        title: 'Significant Disallowed Costs',
        message: `Project has £${analysis.disallowedCosts.toLocaleString()} in disallowed costs`,
        actionRequired: true,
        relatedEntity: { type: 'payment', id: projectId },
        projectId: projectId
      });
    }
  }

  private async calculateTotalDefinedCost(projectId: number): Promise<number> {
    // This would integrate with your cost tracking system
    // For now, return a calculated value based on equipment hires
    return 125750; // Mock value for demonstration
  }

  private async calculateValidatedCosts(projectId: number): Promise<number> {
    // Calculate validated costs from various sources
    return 98500; // Mock value for demonstration
  }

  private async calculatePendingValidation(projectId: number): Promise<number> {
    // Calculate costs pending validation
    return 22100; // Mock value for demonstration
  }

  private async processDataUpdate(payload: any): Promise<void> {
    switch (payload.type) {
      case 'compensation-event-created':
        await this.assessCompensationEventCost(payload);
        break;
      case 'early-warning-cost-impact':
        await this.assessEarlyWarningCost(payload);
        break;
      default:
        console.log('Commercial Agent received data update:', payload);
    }
  }

  private async assessCompensationEventCost(payload: any): Promise<void> {
    const { compensationEventId, projectId, quotationDeadline, timeImpact, costImpact } = payload;

    if (costImpact) {
      await this.createAlert({
        agentType: 'commercial',
        severity: 'high',
        title: 'Compensation Event Cost Assessment Required',
        message: `CE requires cost quotation by ${quotationDeadline.toDateString()}`,
        actionRequired: true,
        relatedEntity: { 
          type: 'compensation-event', 
          id: compensationEventId 
        },
        projectId: projectId
      });

      // Start cost assessment process
      await this.initiateCompensationEventCostAssessment(compensationEventId, projectId);
    }
  }

  private async initiateCompensationEventCostAssessment(ceId: number, projectId: number): Promise<void> {
    // This would trigger the cost assessment workflow
    console.log(`Initiating cost assessment for CE ${ceId} on project ${projectId}`);
    
    // Create follow-up reminder
    setTimeout(async () => {
      await this.createAlert({
        agentType: 'commercial',
        severity: 'medium',
        title: 'Cost Assessment Reminder',
        message: `Cost assessment for CE ${ceId} due within 2 weeks`,
        actionRequired: true,
        relatedEntity: { type: 'compensation-event', id: ceId },
        projectId: projectId
      });
    }, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  private async assessEarlyWarningCost(payload: any): Promise<void> {
    const { earlyWarningId, projectId, description } = payload;

    // Analyze description for cost implications
    const costKeywords = ['material', 'equipment', 'resource', 'delay', 'additional', 'extra'];
    const hasCostImplications = costKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );

    if (hasCostImplications) {
      await this.createAlert({
        agentType: 'commercial',
        severity: 'medium',
        title: 'Early Warning Cost Implications',
        message: `Early Warning may have cost implications requiring assessment`,
        actionRequired: false,
        relatedEntity: { type: 'early-warning', id: earlyWarningId },
        projectId: projectId
      });
    }
  }

  private async processRequest(message: AgentCommunication): Promise<void> {
    console.log('Commercial Agent received request:', message);
  }

  private async processAlert(alert: AgentAlert): Promise<void> {
    console.log('Commercial Agent received alert:', alert);
  }

  private async createAlert(alert: Omit<AgentAlert, 'id' | 'timestamp' | 'status'>): Promise<void> {
    await this.coordinator.createAlert(alert);
  }

  // Generate cost insights for dashboard
  getCostInsights(projectId: number): any {
    const analysis = this.costCache.get(projectId);
    if (!analysis) return null;

    return {
      totalDefinedCost: analysis.totalDefinedCost,
      validatedCosts: analysis.validatedCosts,
      pendingValidation: analysis.pendingValidation,
      disallowedCosts: analysis.disallowedCosts,
      validationRate: (analysis.validatedCosts / analysis.totalDefinedCost) * 100,
      costHealth: analysis.disallowedCosts < 5000 ? 'Good' : 'Requires Attention'
    };
  }

  // Monitor payment certificate deadlines
  async monitorPaymentDeadlines(): Promise<void> {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

    // This would check against your payment certificates table
    // For now, create a mock alert for demonstration
    const mockProjectId = 2; // Northern Gateway
    
    await this.createAlert({
      agentType: 'commercial',
      severity: 'high',
      title: 'Payment Certificate Due Soon',
      message: `Payment certificate #PC-12 due for submission in 3 days`,
      actionRequired: true,
      relatedEntity: { type: 'payment', id: 'PC-12' },
      projectId: mockProjectId
    });
  }

  // Validate equipment costs against SCC Item 2
  async validateSCCCompliance(projectId: number): Promise<any> {
    // Mock equipment cost validation for demonstration
    const validationResults = {
      compliantItems: 2,
      nonCompliantItems: 1,
      totalValue: 13700,
      issues: [
        {
          equipmentRef: 'PSL-CP-0089',
          issue: 'Equipment used outside Working Areas',
          severity: 'High',
          recommendation: 'Verify usage scope with Project Manager'
        }
      ]
    };

    if (validationResults.nonCompliantItems > 0) {
      await this.createAlert({
        agentType: 'commercial',
        severity: 'high',
        title: 'SCC Compliance Issues Detected',
        message: `${validationResults.nonCompliantItems} equipment items require validation review`,
        actionRequired: true,
        relatedEntity: { type: 'equipment', id: 'validation' },
        projectId: projectId
      });
    }

    return validationResults;
  }
}