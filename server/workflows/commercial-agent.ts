/**
 * Commercial Agent Workflow
 * Handles cost analysis, equipment hire validation, and SCC compliance
 */

import { eventBus } from '../event-bus';
import { db } from '../db';
import { 
  equipmentHires,
  suppliers,
  purchaseOrders,
  compensationEvents,
  projects,
  inventory
} from '../../shared/schema';
import { eq, and, gte, lte, desc, sum } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

interface CostAnalysis {
  itemId: number;
  type: 'equipment_hire' | 'purchase_order' | 'compensation_event';
  estimatedCost: number;
  actualCost?: number;
  variance: number;
  isWithinBudget: boolean;
  recommendations: string[];
  riskFactors: string[];
}

interface SupplierPerformance {
  supplierId: number;
  performanceScore: number;
  onTimeDelivery: number;
  qualityRating: number;
  costCompetitiveness: number;
  issues: string[];
  recommendations: string[];
}

export class CommercialAgent {
  private anthropic: any;
  
  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
  }

  /**
   * Main workflow entry point - runs commercial monitoring
   */
  async runCommercialMonitoring(): Promise<void> {
    try {
      console.log('💰 Commercial Agent: Starting commercial monitoring');
      
      // Step 1: Get all active projects
      const activeProjects = await this.getActiveProjects();
      
      for (const project of activeProjects) {
        // Step 2: Analyze equipment hire costs
        await this.analyzeEquipmentHireCosts(project.id);
        
        // Step 3: Review purchase orders
        await this.reviewPurchaseOrders(project.id);
        
        // Step 4: Validate compensation event costs
        await this.validateCompensationEventCosts(project.id);
        
        // Step 5: Monitor supplier performance
        await this.monitorSupplierPerformance(project.id);
        
        // Step 6: Check budget compliance
        await this.checkBudgetCompliance(project.id);
        
        // Step 7: Generate cost alerts
        await this.generateCostAlerts(project.id);
      }
      
      console.log('✅ Commercial Agent: Commercial monitoring complete');
      
    } catch (error) {
      console.error('❌ Commercial Agent error:', error);
    }
  }

  /**
   * Handle equipment request
   */
  async handleEquipmentRequest(requestData: any): Promise<void> {
    try {
      console.log(`💰 Commercial Agent: Processing equipment request for ${requestData.equipmentType}`);
      
      // Step 1: Validate equipment availability and costs
      const costAnalysis = await this.analyzeEquipmentCosts(requestData);
      
      // Step 2: Check supplier options
      const supplierOptions = await this.getSupplierOptions(requestData.equipmentType);
      
      // Step 3: Validate budget allocation
      const budgetValidation = await this.validateBudget(requestData.projectId, costAnalysis.estimatedCost);
      
      // Step 4: Generate recommendations
      const recommendations = await this.generateEquipmentRecommendations(costAnalysis, supplierOptions, budgetValidation);
      
      // Step 5: Create or update equipment hire record
      if (budgetValidation.approved) {
        await this.createEquipmentHire(requestData, costAnalysis, recommendations.selectedSupplier);
      }
      
      // Step 6: Send notifications
      await this.sendEquipmentRequestNotification(requestData, costAnalysis, budgetValidation, recommendations);
      
      console.log(`✅ Equipment request processing complete`);
      
    } catch (error) {
      console.error('❌ Equipment request processing error:', error);
    }
  }

  /**
   * Handle supplier evaluation
   */
  async handleSupplierEvaluation(supplierData: any): Promise<void> {
    try {
      console.log(`💰 Commercial Agent: Evaluating supplier ${supplierData.supplierId}`);
      
      // Step 1: Calculate performance metrics
      const performance = await this.calculateSupplierPerformance(supplierData.supplierId, supplierData.projectId);
      
      // Step 2: AI-powered performance analysis
      const aiAnalysis = await this.analyzeSupplierPerformance(performance, supplierData);
      
      // Step 3: Update supplier ratings
      await this.updateSupplierRatings(supplierData.supplierId, performance);
      
      // Step 4: Generate performance alerts if needed
      if (performance.performanceScore < 70) {
        await this.generateSupplierAlert(supplierData, performance);
      }
      
      // Step 5: Recommend actions
      await this.recommendSupplierActions(supplierData, performance, aiAnalysis);
      
      console.log(`✅ Supplier evaluation complete`);
      
    } catch (error) {
      console.error('❌ Supplier evaluation error:', error);
    }
  }

  /**
   * Get all active projects
   */
  private async getActiveProjects(): Promise<any[]> {
    return await db.select().from(projects).where(eq(projects.status, 'active'));
  }

  /**
   * Analyze equipment hire costs for a project
   */
  private async analyzeEquipmentHireCosts(projectId: number): Promise<void> {
    try {
      const equipmentHireList = await db.select()
        .from(equipmentHires)
        .where(eq(equipmentHires.projectId, projectId));

      for (const hire of equipmentHireList) {
        const analysis = await this.performCostAnalysis(hire, 'equipment_hire');
        
        if (analysis.variance > 0.2) { // 20% variance threshold
          await this.generateCostVarianceAlert(hire, analysis);
        }
        
        if (!analysis.isWithinBudget) {
          await this.generateBudgetAlert(hire, analysis);
        }
      }
      
    } catch (error) {
      console.error('Equipment hire cost analysis failed:', error);
    }
  }

  /**
   * Review purchase orders for a project
   */
  private async reviewPurchaseOrders(projectId: number): Promise<void> {
    try {
      const orders = await db.select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.projectId, projectId));

      for (const order of orders) {
        // Check for cost overruns
        if (order.actualCost && order.actualCost > order.estimatedCost * 1.1) {
          await this.generateCostOverrunAlert(order);
        }
        
        // Validate supplier performance
        if (order.supplierId) {
          await this.validateOrderSupplierPerformance(order);
        }
        
        // Check delivery status
        await this.checkDeliveryStatus(order);
      }
      
    } catch (error) {
      console.error('Purchase order review failed:', error);
    }
  }

  /**
   * Validate compensation event costs
   */
  private async validateCompensationEventCosts(projectId: number): Promise<void> {
    try {
      const events = await db.select()
        .from(compensationEvents)
        .where(eq(compensationEvents.projectId, projectId));

      for (const event of events) {
        if (event.estimatedValue) {
          const validation = await this.validateCompensationEventCost(event);
          
          if (!validation.isReasonable) {
            await this.generateCompensationEventCostAlert(event, validation);
          }
        }
      }
      
    } catch (error) {
      console.error('Compensation event cost validation failed:', error);
    }
  }

  /**
   * Perform cost analysis using AI
   */
  private async performCostAnalysis(item: any, type: string): Promise<CostAnalysis> {
    if (!this.anthropic) {
      return this.fallbackCostAnalysis(item, type);
    }

    try {
      const prompt = `
Analyze this commercial item for cost efficiency:

Type: ${type}
Item: ${JSON.stringify(item, null, 2)}

Consider:
1. Market rates and benchmarks
2. Cost variations and trends
3. Budget allocation efficiency
4. Risk factors affecting costs
5. Recommendations for optimization

Respond with JSON:
{
  "estimatedCost": number,
  "actualCost": number,
  "variance": number (as percentage),
  "isWithinBudget": boolean,
  "recommendations": ["rec1", "rec2"],
  "riskFactors": ["risk1", "risk2"],
  "marketComparison": "above|below|competitive"
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      const aiResult = JSON.parse(response.content[0].text);
      
      return {
        itemId: item.id,
        type: type as any,
        estimatedCost: aiResult.estimatedCost || item.estimatedCost || 0,
        actualCost: aiResult.actualCost || item.actualCost,
        variance: aiResult.variance || 0,
        isWithinBudget: aiResult.isWithinBudget !== false,
        recommendations: aiResult.recommendations || [],
        riskFactors: aiResult.riskFactors || []
      };
      
    } catch (error) {
      console.error('AI cost analysis failed, using fallback:', error);
      return this.fallbackCostAnalysis(item, type);
    }
  }

  /**
   * Fallback cost analysis using rule-based logic
   */
  private fallbackCostAnalysis(item: any, type: string): CostAnalysis {
    const estimatedCost = item.estimatedCost || item.dailyRate || 0;
    const actualCost = item.actualCost || item.totalCost || estimatedCost;
    const variance = estimatedCost > 0 ? Math.abs(actualCost - estimatedCost) / estimatedCost : 0;
    
    const recommendations: string[] = [];
    const riskFactors: string[] = [];
    
    if (variance > 0.2) {
      recommendations.push('Review cost estimation methods');
      riskFactors.push('High cost variance');
    }
    
    if (actualCost > estimatedCost * 1.5) {
      recommendations.push('Investigate cost overrun causes');
      riskFactors.push('Significant cost overrun');
    }

    return {
      itemId: item.id,
      type: type as any,
      estimatedCost,
      actualCost,
      variance,
      isWithinBudget: variance < 0.1, // 10% tolerance
      recommendations,
      riskFactors
    };
  }

  /**
   * Analyze equipment costs
   */
  private async analyzeEquipmentCosts(requestData: any): Promise<CostAnalysis> {
    // Get market rates for equipment type
    const marketRates = await this.getMarketRates(requestData.equipmentType);
    
    // Calculate estimated costs
    const dailyRate = marketRates.averageRate || 500; // Default rate
    const estimatedDuration = requestData.duration || 30; // Default 30 days
    const estimatedCost = dailyRate * estimatedDuration;
    
    return {
      itemId: 0,
      type: 'equipment_hire',
      estimatedCost,
      variance: 0,
      isWithinBudget: true,
      recommendations: [
        'Compare quotes from multiple suppliers',
        'Consider long-term hire discounts',
        'Validate equipment specifications'
      ],
      riskFactors: []
    };
  }

  /**
   * Get supplier options for equipment
   */
  private async getSupplierOptions(equipmentType: string): Promise<any[]> {
    try {
      const allSuppliers = await db.select().from(suppliers);
      
      // Filter suppliers based on equipment capabilities
      return allSuppliers.filter(supplier => 
        supplier.capabilities?.includes(equipmentType) || 
        supplier.capabilities?.includes('general_equipment')
      );
    } catch (error) {
      console.error('Failed to get supplier options:', error);
      return [];
    }
  }

  /**
   * Validate budget allocation
   */
  private async validateBudget(projectId: number, estimatedCost: number): Promise<any> {
    try {
      // Get project budget information
      const project = await db.select().from(projects).where(eq(projects.id, projectId)).then(p => p[0]);
      
      if (!project) {
        return { approved: false, reason: 'Project not found' };
      }
      
      // Calculate current spending
      const equipmentSpend = await this.calculateEquipmentSpend(projectId);
      const availableBudget = (project.budget || 1000000) * 0.3; // Assume 30% for equipment
      
      const approved = equipmentSpend + estimatedCost <= availableBudget;
      
      return {
        approved,
        availableBudget,
        currentSpend: equipmentSpend,
        requestedAmount: estimatedCost,
        remainingBudget: availableBudget - equipmentSpend,
        reason: approved ? 'Within budget' : 'Exceeds available budget'
      };
      
    } catch (error) {
      console.error('Budget validation failed:', error);
      return { approved: true, reason: 'Validation failed, defaulting to approved' };
    }
  }

  /**
   * Calculate current equipment spend
   */
  private async calculateEquipmentSpend(projectId: number): Promise<number> {
    try {
      const equipmentHireList = await db.select()
        .from(equipmentHires)
        .where(eq(equipmentHires.projectId, projectId));
      
      return equipmentHireList.reduce((total, hire) => {
        return total + (hire.totalCost || hire.dailyRate * (hire.duration || 1));
      }, 0);
    } catch (error) {
      console.error('Failed to calculate equipment spend:', error);
      return 0;
    }
  }

  /**
   * Generate equipment recommendations
   */
  private async generateEquipmentRecommendations(costAnalysis: CostAnalysis, suppliers: any[], budgetValidation: any): Promise<any> {
    const recommendations = [...costAnalysis.recommendations];
    
    // Select best supplier based on performance and cost
    const selectedSupplier = suppliers.length > 0 ? suppliers[0] : null;
    
    if (!budgetValidation.approved) {
      recommendations.push('Request budget increase or reduce scope');
    }
    
    if (suppliers.length > 1) {
      recommendations.push('Request competitive quotes from multiple suppliers');
    }
    
    return {
      selectedSupplier,
      recommendations,
      alternativeOptions: suppliers.slice(1, 3)
    };
  }

  /**
   * Create equipment hire record
   */
  private async createEquipmentHire(requestData: any, costAnalysis: CostAnalysis, supplier: any): Promise<void> {
    try {
      await db.insert(equipmentHires).values({
        projectId: requestData.projectId,
        equipmentId: requestData.equipmentId || 1,
        supplierId: supplier?.id || 1,
        requestedById: requestData.requestedBy || 1,
        status: 'approved',
        startDate: new Date(),
        endDate: new Date(Date.now() + (requestData.duration || 30) * 24 * 60 * 60 * 1000),
        dailyRate: costAnalysis.estimatedCost / (requestData.duration || 30),
        totalCost: costAnalysis.estimatedCost,
        notes: `Auto-approved by Commercial Agent. Estimated cost: £${costAnalysis.estimatedCost}`
      });
    } catch (error) {
      console.error('Failed to create equipment hire record:', error);
    }
  }

  /**
   * Monitor supplier performance
   */
  private async monitorSupplierPerformance(projectId: number): Promise<void> {
    try {
      const uniqueSuppliers = await db.select()
        .from(equipmentHires)
        .where(eq(equipmentHires.projectId, projectId));
      
      const supplierIds = [...new Set(uniqueSuppliers.map(h => h.supplierId))];
      
      for (const supplierId of supplierIds) {
        if (supplierId) {
          const performance = await this.calculateSupplierPerformance(supplierId, projectId);
          
          if (performance.performanceScore < 70) {
            await this.generateSupplierPerformanceAlert(supplierId, performance);
          }
        }
      }
    } catch (error) {
      console.error('Supplier performance monitoring failed:', error);
    }
  }

  /**
   * Calculate supplier performance metrics
   */
  private async calculateSupplierPerformance(supplierId: number, projectId: number): Promise<SupplierPerformance> {
    try {
      const supplierHires = await db.select()
        .from(equipmentHires)
        .where(
          and(
            eq(equipmentHires.supplierId, supplierId),
            eq(equipmentHires.projectId, projectId)
          )
        );
      
      if (supplierHires.length === 0) {
        return {
          supplierId,
          performanceScore: 100,
          onTimeDelivery: 100,
          qualityRating: 100,
          costCompetitiveness: 100,
          issues: [],
          recommendations: []
        };
      }
      
      // Calculate metrics
      const onTimeCount = supplierHires.filter(h => h.status === 'completed').length;
      const onTimeDelivery = (onTimeCount / supplierHires.length) * 100;
      
      const avgCost = supplierHires.reduce((sum, h) => sum + (h.dailyRate || 0), 0) / supplierHires.length;
      const costCompetitiveness = Math.max(0, 100 - (avgCost / 500 - 1) * 50); // Benchmark against £500/day
      
      const qualityRating = 85; // Default quality rating
      const performanceScore = (onTimeDelivery + qualityRating + costCompetitiveness) / 3;
      
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      if (onTimeDelivery < 80) {
        issues.push('Poor delivery performance');
        recommendations.push('Improve delivery scheduling');
      }
      
      if (costCompetitiveness < 70) {
        issues.push('High cost compared to market rates');
        recommendations.push('Negotiate better rates');
      }
      
      return {
        supplierId,
        performanceScore,
        onTimeDelivery,
        qualityRating,
        costCompetitiveness,
        issues,
        recommendations
      };
      
    } catch (error) {
      console.error('Supplier performance calculation failed:', error);
      return {
        supplierId,
        performanceScore: 100,
        onTimeDelivery: 100,
        qualityRating: 100,
        costCompetitiveness: 100,
        issues: [],
        recommendations: []
      };
    }
  }

  /**
   * Check budget compliance for a project
   */
  private async checkBudgetCompliance(projectId: number): Promise<void> {
    try {
      const totalSpend = await this.calculateTotalProjectSpend(projectId);
      const project = await db.select().from(projects).where(eq(projects.id, projectId)).then(p => p[0]);
      
      if (project && project.budget) {
        const spendPercentage = (totalSpend / project.budget) * 100;
        
        if (spendPercentage > 90) {
          await this.generateBudgetComplianceAlert(projectId, totalSpend, project.budget, spendPercentage);
        }
      }
    } catch (error) {
      console.error('Budget compliance check failed:', error);
    }
  }

  /**
   * Calculate total project spend
   */
  private async calculateTotalProjectSpend(projectId: number): Promise<number> {
    const equipmentSpend = await this.calculateEquipmentSpend(projectId);
    // Add other cost categories as needed
    return equipmentSpend;
  }

  /**
   * Generate various alerts
   */
  private async generateCostVarianceAlert(item: any, analysis: CostAnalysis): Promise<void> {
    eventBus.emitEvent('notification.send', {
      recipientType: 'project',
      recipientId: item.projectId,
      message: `Cost variance alert: ${item.id} has ${(analysis.variance * 100).toFixed(1)}% variance`,
      type: 'warning',
      priority: 'medium',
      actionRequired: true
    });
  }

  private async generateBudgetAlert(item: any, analysis: CostAnalysis): Promise<void> {
    eventBus.emitEvent('notification.send', {
      recipientType: 'project',
      recipientId: item.projectId,
      message: `Budget alert: ${item.id} exceeds allocated budget`,
      type: 'error',
      priority: 'high',
      actionRequired: true
    });
  }

  private async generateSupplierPerformanceAlert(supplierId: number, performance: SupplierPerformance): Promise<void> {
    eventBus.emitEvent('notification.send', {
      recipientType: 'user',
      recipientId: 1, // Commercial manager
      message: `Supplier ${supplierId} performance below threshold: ${performance.performanceScore.toFixed(1)}%`,
      type: 'warning',
      priority: 'medium',
      actionRequired: true
    });
  }

  private async generateBudgetComplianceAlert(projectId: number, totalSpend: number, budget: number, percentage: number): Promise<void> {
    eventBus.emitEvent('notification.send', {
      recipientType: 'project',
      recipientId: projectId,
      message: `Budget compliance alert: ${percentage.toFixed(1)}% of budget spent (£${totalSpend.toLocaleString()} of £${budget.toLocaleString()})`,
      type: 'warning',
      priority: 'high',
      actionRequired: true
    });
  }

  // Additional helper methods
  private async getMarketRates(equipmentType: string): Promise<any> {
    // Simplified market rates - in production, this would query external APIs
    const rates = {
      'excavator': { averageRate: 450, minRate: 350, maxRate: 600 },
      'crane': { averageRate: 800, minRate: 600, maxRate: 1200 },
      'truck': { averageRate: 300, minRate: 200, maxRate: 450 },
      'default': { averageRate: 500, minRate: 300, maxRate: 800 }
    };
    
    return rates[equipmentType] || rates['default'];
  }

  private async generateCostAlerts(projectId: number): Promise<void> {
    // Implementation for generating various cost-related alerts
    console.log(`💰 Generating cost alerts for project ${projectId}`);
  }

  // Placeholder methods for other functionalities
  private async validateCompensationEventCost(event: any): Promise<any> {
    return { isReasonable: true, factors: [] };
  }

  private async generateCompensationEventCostAlert(event: any, validation: any): Promise<void> {
    // Implementation
  }

  private async validateOrderSupplierPerformance(order: any): Promise<void> {
    // Implementation
  }

  private async checkDeliveryStatus(order: any): Promise<void> {
    // Implementation
  }

  private async generateCostOverrunAlert(order: any): Promise<void> {
    // Implementation
  }

  private async analyzeSupplierPerformance(performance: SupplierPerformance, supplierData: any): Promise<any> {
    return { insights: [], recommendations: [] };
  }

  private async updateSupplierRatings(supplierId: number, performance: SupplierPerformance): Promise<void> {
    // Implementation
  }

  private async generateSupplierAlert(supplierData: any, performance: SupplierPerformance): Promise<void> {
    // Implementation
  }

  private async recommendSupplierActions(supplierData: any, performance: SupplierPerformance, aiAnalysis: any): Promise<void> {
    // Implementation
  }

  private async sendEquipmentRequestNotification(requestData: any, costAnalysis: CostAnalysis, budgetValidation: any, recommendations: any): Promise<void> {
    eventBus.emitEvent('notification.send', {
      recipientType: 'user',
      recipientId: requestData.requestedBy,
      message: `Equipment request ${budgetValidation.approved ? 'approved' : 'rejected'}: ${requestData.equipmentType}`,
      type: budgetValidation.approved ? 'success' : 'warning',
      priority: 'medium',
      actionRequired: !budgetValidation.approved
    });
  }
}

export const commercialAgent = new CommercialAgent();

// Event listeners
eventBus.onEvent('equipment.requested', (data) => {
  commercialAgent.handleEquipmentRequest(data);
});

eventBus.onEvent('supplier.evaluated', (data) => {
  commercialAgent.handleSupplierEvaluation(data);
});