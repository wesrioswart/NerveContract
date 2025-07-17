/**
 * Procurement Agent Workflow
 * Monitors supplier performance and manages procurement workflows
 */

import { eventBus } from '../event-bus';
import { db } from '../db';
import { 
  suppliers,
  purchaseOrders,
  inventoryItems,
  equipmentHires,
  projects
} from '../../shared/schema';
import { eq, and, gte, lte, desc, isNull, or } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

interface SupplierAssessment {
  supplierId: number;
  performanceScore: number;
  deliveryReliability: number;
  qualityRating: number;
  costEffectiveness: number;
  responsiveness: number;
  complianceStatus: 'compliant' | 'minor_issues' | 'major_issues';
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface ProcurementOpportunity {
  type: 'cost_saving' | 'quality_improvement' | 'risk_mitigation' | 'process_optimization';
  description: string;
  estimatedSaving: number;
  implementationEffort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recommendations: string[];
}

interface InventoryAnalysis {
  totalItems: number;
  lowStockItems: any[];
  overstockItems: any[];
  obsoleteItems: any[];
  turnaroundRate: number;
  recommendations: string[];
}

export class ProcurementAgent {
  private anthropic: any;
  
  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
  }

  /**
   * Main workflow entry point - runs procurement monitoring
   */
  async runProcurementMonitoring(): Promise<void> {
    try {
      console.log('📦 Procurement Agent: Starting procurement monitoring');
      
      // Step 1: Get all active projects
      const activeProjects = await this.getActiveProjects();
      
      for (const project of activeProjects) {
        // Step 2: Monitor supplier performance
        await this.monitorSupplierPerformance(project.id);
        
        // Step 3: Analyze purchase orders
        await this.analyzePurchaseOrders(project.id);
        
        // Step 4: Review inventory levels
        await this.reviewInventoryLevels(project.id);
        
        // Step 5: Identify procurement opportunities
        await this.identifyProcurementOpportunities(project.id);
        
        // Step 6: Monitor compliance
        await this.monitorSupplierCompliance(project.id);
        
        // Step 7: Generate procurement reports
        await this.generateProcurementReport(project.id);
      }
      
      // Step 8: Cross-project supplier analysis
      await this.performCrossProjectAnalysis();
      
      console.log('✅ Procurement Agent: Procurement monitoring complete');
      
    } catch (error) {
      console.error('❌ Procurement Agent error:', error);
    }
  }

  /**
   * Handle supplier evaluation request
   */
  async handleSupplierEvaluation(evaluationData: any): Promise<void> {
    try {
      console.log(`📦 Procurement Agent: Evaluating supplier ${evaluationData.supplierId}`);
      
      // Step 1: Gather supplier performance data
      const performanceData = await this.gatherSupplierPerformanceData(evaluationData.supplierId);
      
      // Step 2: AI-powered assessment
      const assessment = await this.performSupplierAssessment(performanceData, evaluationData);
      
      // Step 3: Update supplier ratings
      await this.updateSupplierRatings(evaluationData.supplierId, assessment);
      
      // Step 4: Generate recommendations
      const recommendations = await this.generateSupplierRecommendations(assessment);
      
      // Step 5: Create action plan if needed
      if (assessment.riskLevel === 'high' || assessment.riskLevel === 'critical') {
        await this.createSupplierActionPlan(evaluationData.supplierId, assessment);
      }
      
      // Step 6: Emit evaluation results
      eventBus.emitEvent('supplier.evaluated', {
        supplierId: evaluationData.supplierId,
        projectId: evaluationData.projectId,
        performanceScore: assessment.performanceScore,
        issues: assessment.recommendations,
        recommendations
      });
      
      console.log(`✅ Supplier evaluation complete`);
      
    } catch (error) {
      console.error('❌ Supplier evaluation error:', error);
    }
  }

  /**
   * Handle payment processing events
   */
  async handlePaymentProcessed(paymentData: any): Promise<void> {
    try {
      console.log(`📦 Procurement Agent: Processing payment event for project ${paymentData.projectId}`);
      
      // Step 1: Update supplier payment history
      await this.updateSupplierPaymentHistory(paymentData);
      
      // Step 2: Check for payment-related performance impacts
      const impactAnalysis = await this.analyzePaymentImpact(paymentData);
      
      // Step 3: Update supplier cash flow metrics
      await this.updateSupplierCashFlowMetrics(paymentData.certificateId, paymentData.amount);
      
      // Step 4: Generate alerts for significant changes
      if (impactAnalysis.significantImpact) {
        await this.generatePaymentImpactAlert(paymentData, impactAnalysis);
      }
      
      console.log(`✅ Payment processing complete`);
      
    } catch (error) {
      console.error('❌ Payment processing error:', error);
    }
  }

  /**
   * Get all active projects
   */
  private async getActiveProjects(): Promise<any[]> {
    return await db.select().from(projects);
  }

  /**
   * Monitor supplier performance across all projects
   */
  private async monitorSupplierPerformance(projectId: number): Promise<void> {
    try {
      // Get all suppliers involved in the project
      const projectSuppliers = await this.getProjectSuppliers(projectId);
      
      for (const supplier of projectSuppliers) {
        const assessment = await this.assessSupplierPerformance(supplier.id, projectId);
        
        // Generate alerts for poor performance
        if (assessment.performanceScore < 70) {
          await this.generateSupplierPerformanceAlert(supplier.id, projectId, assessment);
        }
        
        // Check for compliance issues
        if (assessment.complianceStatus !== 'compliant') {
          await this.generateComplianceAlert(supplier.id, projectId, assessment);
        }
        
        // Update supplier metrics
        await this.updateSupplierMetrics(supplier.id, assessment);
      }
      
    } catch (error) {
      console.error('Supplier performance monitoring failed:', error);
    }
  }

  /**
   * Analyze purchase orders for a project
   */
  private async analyzePurchaseOrders(projectId: number): Promise<void> {
    try {
      const orders = await db.select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.projectId, projectId));
      
      for (const order of orders) {
        // Check for overdue orders
        if (this.isOrderOverdue(order)) {
          await this.generateOverdueOrderAlert(order);
        }
        
        // Analyze cost variances
        const costVariance = await this.analyzeCostVariance(order);
        if (costVariance.significantVariance) {
          await this.generateCostVarianceAlert(order, costVariance);
        }
        
        // Check delivery performance
        await this.checkDeliveryPerformance(order);
        
        // Quality assessment
        await this.assessOrderQuality(order);
      }
      
    } catch (error) {
      console.error('Purchase order analysis failed:', error);
    }
  }

  /**
   * Review inventory levels
   */
  private async reviewInventoryLevels(projectId: number): Promise<InventoryAnalysis> {
    try {
      // Get inventory items used in this project through purchase orders
      const projectInventory = await db.select({
        inventoryItem: inventoryItems,
        purchaseOrder: purchaseOrders,
      })
        .from(inventoryItems)
        .leftJoin(purchaseOrders, eq(purchaseOrders.projectId, projectId))
        .where(eq(purchaseOrders.projectId, projectId));

      const inventoryList = projectInventory.map(item => ({
        ...item.inventoryItem,
        currentQuantity: item.purchaseOrder?.quantity || 0,
        minimumQuantity: item.inventoryItem.minStockLevel || 10,
        maximumQuantity: item.inventoryItem.maxStockLevel || 1000,
        unitPrice: (item.inventoryItem.unitCost || 0) / 100, // Convert from pennies
        lastUsedDate: item.purchaseOrder?.orderDate || null,
        usageRate: 1, // Default usage rate
      }));
      
      const lowStockItems = inventoryList.filter(item => 
        item.currentQuantity <= (item.minimumQuantity || 10)
      );
      
      const overstockItems = inventoryList.filter(item => 
        item.currentQuantity > (item.maximumQuantity || 1000)
      );
      
      const obsoleteItems = inventoryList.filter(item => {
        const lastUsed = item.lastUsedDate ? new Date(item.lastUsedDate) : null;
        if (!lastUsed) return false;
        
        const daysSinceLastUsed = Math.floor((Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceLastUsed > 90; // Items not used in 90 days
      });
      
      const totalValue = inventoryList.reduce((sum, item) => sum + (item.unitPrice * item.currentQuantity), 0);
      const turnoverValue = inventoryList.reduce((sum, item) => sum + (item.usageRate || 0) * item.unitPrice, 0);
      const turnaroundRate = totalValue > 0 ? (turnoverValue / totalValue) * 365 : 0; // Annual turnover rate
      
      const recommendations: string[] = [];
      
      if (lowStockItems.length > 0) {
        recommendations.push(`Reorder ${lowStockItems.length} items below minimum stock levels`);
      }
      
      if (overstockItems.length > 0) {
        recommendations.push(`Review overstock for ${overstockItems.length} items`);
      }
      
      if (obsoleteItems.length > 0) {
        recommendations.push(`Consider disposing of ${obsoleteItems.length} obsolete items`);
      }
      
      if (turnaroundRate < 4) {
        recommendations.push('Improve inventory turnover rate through better demand planning');
      }
      
      const analysis: InventoryAnalysis = {
        totalItems: inventoryList.length,
        lowStockItems,
        overstockItems,
        obsoleteItems,
        turnaroundRate,
        recommendations
      };
      
      // Generate alerts
      if (lowStockItems.length > 0) {
        await this.generateLowStockAlert(projectId, lowStockItems);
      }
      
      return analysis;
      
    } catch (error) {
      console.error('Inventory review failed:', error);
      return {
        totalItems: 0,
        lowStockItems: [],
        overstockItems: [],
        obsoleteItems: [],
        turnaroundRate: 0,
        recommendations: ['Inventory analysis failed - review system']
      };
    }
  }

  /**
   * Perform AI-powered supplier assessment
   */
  private async performSupplierAssessment(performanceData: any, evaluationData: any): Promise<SupplierAssessment> {
    if (!this.anthropic) {
      return this.fallbackSupplierAssessment(performanceData);
    }

    try {
      const prompt = `
Analyze this supplier performance data:

Supplier Data: ${JSON.stringify(performanceData, null, 2)}
Evaluation Context: ${JSON.stringify(evaluationData, null, 2)}

Assess:
1. Delivery reliability and timeliness
2. Quality consistency and defect rates
3. Cost effectiveness and value for money
4. Responsiveness and communication
5. Compliance with contracts and standards
6. Risk factors and mitigation strategies

Respond with JSON:
{
  "performanceScore": 0-100,
  "deliveryReliability": 0-100,
  "qualityRating": 0-100,
  "costEffectiveness": 0-100,
  "responsiveness": 0-100,
  "complianceStatus": "compliant|minor_issues|major_issues",
  "recommendations": ["rec1", "rec2"],
  "riskLevel": "low|medium|high|critical",
  "keyStrengths": ["strength1", "strength2"],
  "improvementAreas": ["area1", "area2"]
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      const aiResult = JSON.parse(response.content[0].text);
      
      return {
        supplierId: evaluationData.supplierId,
        performanceScore: aiResult.performanceScore || 75,
        deliveryReliability: aiResult.deliveryReliability || 80,
        qualityRating: aiResult.qualityRating || 75,
        costEffectiveness: aiResult.costEffectiveness || 70,
        responsiveness: aiResult.responsiveness || 75,
        complianceStatus: aiResult.complianceStatus || 'compliant',
        recommendations: aiResult.recommendations || [],
        riskLevel: aiResult.riskLevel || 'medium'
      };
      
    } catch (error) {
      console.error('AI supplier assessment failed, using fallback:', error);
      return this.fallbackSupplierAssessment(performanceData);
    }
  }

  /**
   * Fallback supplier assessment using rule-based logic
   */
  private fallbackSupplierAssessment(performanceData: any): SupplierAssessment {
    // Calculate basic metrics
    const onTimeDeliveryRate = performanceData.onTimeDeliveries / performanceData.totalDeliveries || 0.8;
    const qualityScore = 100 - (performanceData.defectRate || 5);
    const costScore = performanceData.costCompetitiveness || 75;
    const responseScore = performanceData.responseTime <= 24 ? 90 : 60; // Hours to respond
    
    const performanceScore = (onTimeDeliveryRate * 100 + qualityScore + costScore + responseScore) / 4;
    
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let complianceStatus: 'compliant' | 'minor_issues' | 'major_issues' = 'compliant';
    
    if (onTimeDeliveryRate < 0.8) {
      recommendations.push('Improve delivery performance and scheduling');
      riskLevel = 'medium';
    }
    
    if (qualityScore < 70) {
      recommendations.push('Implement quality improvement measures');
      riskLevel = 'high';
      complianceStatus = 'minor_issues';
    }
    
    if (performanceScore < 60) {
      recommendations.push('Consider alternative suppliers');
      riskLevel = 'critical';
      complianceStatus = 'major_issues';
    }
    
    return {
      supplierId: performanceData.supplierId,
      performanceScore,
      deliveryReliability: onTimeDeliveryRate * 100,
      qualityRating: qualityScore,
      costEffectiveness: costScore,
      responsiveness: responseScore,
      complianceStatus,
      recommendations,
      riskLevel
    };
  }

  /**
   * Identify procurement opportunities
   */
  private async identifyProcurementOpportunities(projectId: number): Promise<ProcurementOpportunity[]> {
    const opportunities: ProcurementOpportunity[] = [];
    
    try {
      // Analyze spending patterns
      const spendingAnalysis = await this.analyzeSpendingPatterns(projectId);
      
      // Cost consolidation opportunities
      if (spendingAnalysis.fragmentedSpending > 10000) {
        opportunities.push({
          type: 'cost_saving',
          description: 'Consolidate fragmented spending with preferred suppliers',
          estimatedSaving: spendingAnalysis.fragmentedSpending * 0.1,
          implementationEffort: 'medium',
          priority: 'high',
          recommendations: ['Establish framework agreements', 'Negotiate volume discounts']
        });
      }
      
      // Supplier rationalization
      const supplierCount = await this.getActiveSupplierCount(projectId);
      if (supplierCount > 20) {
        opportunities.push({
          type: 'process_optimization',
          description: 'Reduce supplier base to improve management efficiency',
          estimatedSaving: 5000, // Administrative savings
          implementationEffort: 'high',
          priority: 'medium',
          recommendations: ['Supplier rationalization program', 'Strategic partnership development']
        });
      }
      
      // Contract optimization
      const contractAnalysis = await this.analyzeContracts(projectId);
      if (contractAnalysis.renewalsRequired > 5) {
        opportunities.push({
          type: 'risk_mitigation',
          description: 'Proactive contract renewal and renegotiation',
          estimatedSaving: 15000,
          implementationEffort: 'medium',
          priority: 'high',
          recommendations: ['Schedule contract reviews', 'Market benchmarking']
        });
      }
      
      return opportunities;
      
    } catch (error) {
      console.error('Failed to identify procurement opportunities:', error);
      return [];
    }
  }

  /**
   * Monitor supplier compliance
   */
  private async monitorSupplierCompliance(projectId: number): Promise<void> {
    try {
      const projectSuppliers = await this.getProjectSuppliers(projectId);
      
      for (const supplier of projectSuppliers) {
        // Check certificate expiries
        await this.checkSupplierCertificates(supplier);
        
        // Insurance validation
        await this.validateSupplierInsurance(supplier);
        
        // Contract compliance
        await this.checkContractCompliance(supplier, projectId);
        
        // Environmental and safety compliance
        await this.checkESGCompliance(supplier);
      }
      
    } catch (error) {
      console.error('Supplier compliance monitoring failed:', error);
    }
  }

  /**
   * Perform cross-project supplier analysis
   */
  private async performCrossProjectAnalysis(): Promise<void> {
    try {
      console.log('📊 Performing cross-project supplier analysis');
      
      // Get all suppliers across projects
      const allSuppliers = await db.select().from(suppliers);
      
      for (const supplier of allSuppliers) {
        // Calculate overall performance across all projects
        const overallPerformance = await this.calculateOverallPerformance(supplier.id);
        
        // Identify top performers
        if (overallPerformance.score > 90) {
          await this.recommendStrategicPartnership(supplier.id, overallPerformance);
        }
        
        // Flag underperformers
        if (overallPerformance.score < 60) {
          await this.flagUnderperformingSupplier(supplier.id, overallPerformance);
        }
        
        // Market intelligence
        await this.updateMarketIntelligence(supplier.id, overallPerformance);
      }
      
    } catch (error) {
      console.error('Cross-project analysis failed:', error);
    }
  }

  /**
   * Generate various alerts and notifications
   */
  private async generateSupplierPerformanceAlert(supplierId: number, projectId: number, assessment: SupplierAssessment): Promise<void> {
    eventBus.emitEvent('notification.send', {
      recipientType: 'project',
      recipientId: projectId,
      message: `Supplier ${supplierId} performance below threshold: ${assessment.performanceScore.toFixed(1)}%`,
      type: 'warning',
      priority: assessment.riskLevel === 'critical' ? 'urgent' : 'high',
      actionRequired: true
    });
  }

  private async generateComplianceAlert(supplierId: number, projectId: number, assessment: SupplierAssessment): Promise<void> {
    eventBus.emitEvent('notification.send', {
      recipientType: 'project',
      recipientId: projectId,
      message: `Supplier ${supplierId} compliance issues: ${assessment.complianceStatus}`,
      type: 'error',
      priority: 'high',
      actionRequired: true
    });
  }

  private async generateLowStockAlert(projectId: number, lowStockItems: any[]): Promise<void> {
    eventBus.emitEvent('notification.send', {
      recipientType: 'project',
      recipientId: projectId,
      message: `${lowStockItems.length} items below minimum stock levels`,
      type: 'warning',
      priority: 'medium',
      actionRequired: true
    });
  }

  private async generateOverdueOrderAlert(order: any): Promise<void> {
    eventBus.emitEvent('notification.send', {
      recipientType: 'project',
      recipientId: order.projectId,
      message: `Purchase order ${order.orderNumber} is overdue`,
      type: 'warning',
      priority: 'high',
      actionRequired: true
    });
  }

  // Helper methods and additional functionality
  private async getProjectSuppliers(projectId: number): Promise<any[]> {
    try {
      // Get suppliers involved in project through purchase orders and equipment hires
      const orderSuppliers = await db.select()
        .from(purchaseOrders)
        .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
        .where(eq(purchaseOrders.projectId, projectId));
      
      const equipmentSuppliers = await db.select()
        .from(equipmentHires)
        .leftJoin(suppliers, eq(equipmentHires.supplierRef, suppliers.id))
        .where(eq(equipmentHires.projectId, projectId));
      
      // Combine and deduplicate
      const allSuppliers = [...orderSuppliers, ...equipmentSuppliers];
      const uniqueSuppliers = allSuppliers.filter((supplier, index, self) => 
        index === self.findIndex(s => s.suppliers?.id === supplier.suppliers?.id)
      );
      
      return uniqueSuppliers.map(s => s.suppliers).filter(Boolean);
    } catch (error) {
      console.error('Error fetching project suppliers:', error);
      return [];
    }
  }

  private async assessSupplierPerformance(supplierId: number, projectId: number): Promise<SupplierAssessment> {
    // Gather performance data
    const performanceData = await this.gatherSupplierPerformanceData(supplierId, projectId);
    
    // Use fallback assessment for now
    return this.fallbackSupplierAssessment({ ...performanceData, supplierId });
  }

  private async gatherSupplierPerformanceData(supplierId: number, projectId?: number): Promise<any> {
    try {
      let orderQuery = db.select().from(purchaseOrders).where(eq(purchaseOrders.supplierId, supplierId));
      let hireQuery = db.select().from(equipmentHires).where(eq(equipmentHires.supplierRef, supplierId));
      
      if (projectId) {
        orderQuery = db.select().from(purchaseOrders).where(and(
          eq(purchaseOrders.supplierId, supplierId),
          eq(purchaseOrders.projectId, projectId)
        ));
        hireQuery = db.select().from(equipmentHires).where(and(
          eq(equipmentHires.supplierRef, supplierId),
          eq(equipmentHires.projectId, projectId)
        ));
      }
      
      const orders = await orderQuery;
      const hires = await hireQuery;
      
      const totalDeliveries = orders.length + hires.length;
      const onTimeDeliveries = orders.filter(o => o.status === 'completed').length + 
                              hires.filter(h => h.status === 'completed').length;
      
      return {
        supplierId,
        totalDeliveries,
        onTimeDeliveries,
        defectRate: 3, // Default 3% defect rate
        costCompetitiveness: 75, // Default score
        responseTime: 18 // Default 18 hours
      };
      
    } catch (error) {
      console.error('Failed to gather supplier performance data:', error);
      return {
        supplierId,
        totalDeliveries: 0,
        onTimeDeliveries: 0,
        defectRate: 0,
        costCompetitiveness: 75,
        responseTime: 24
      };
    }
  }

  private isOrderOverdue(order: any): boolean {
    if (!order.expectedDeliveryDate) return false;
    return new Date() > new Date(order.expectedDeliveryDate) && order.status !== 'completed';
  }

  // Placeholder methods for additional functionality
  private async generateProcurementReport(projectId: number): Promise<void> {
    console.log(`📋 Generating procurement report for project ${projectId}`);
  }

  private async updateSupplierRatings(supplierId: number, assessment: SupplierAssessment): Promise<void> {
    // Update supplier performance ratings in database
  }

  private async generateSupplierRecommendations(assessment: SupplierAssessment): Promise<string[]> {
    return assessment.recommendations;
  }

  private async createSupplierActionPlan(supplierId: number, assessment: SupplierAssessment): Promise<void> {
    // Create action plan for addressing supplier issues
  }

  private async updateSupplierPaymentHistory(paymentData: any): Promise<void> {
    // Update payment history
  }

  private async analyzePaymentImpact(paymentData: any): Promise<any> {
    return { significantImpact: false };
  }

  private async updateSupplierCashFlowMetrics(certificateId: number, amount: number): Promise<void> {
    // Update cash flow metrics
  }

  private async generatePaymentImpactAlert(paymentData: any, impactAnalysis: any): Promise<void> {
    // Generate payment impact alert
  }

  private async updateSupplierMetrics(supplierId: number, assessment: SupplierAssessment): Promise<void> {
    // Update supplier metrics
  }

  private async analyzeCostVariance(order: any): Promise<any> {
    return { significantVariance: false };
  }

  private async generateCostVarianceAlert(order: any, costVariance: any): Promise<void> {
    // Generate cost variance alert
  }

  private async checkDeliveryPerformance(order: any): Promise<void> {
    // Check delivery performance
  }

  private async assessOrderQuality(order: any): Promise<void> {
    // Assess order quality
  }

  private async analyzeSpendingPatterns(projectId: number): Promise<any> {
    return { fragmentedSpending: 15000 };
  }

  private async getActiveSupplierCount(projectId: number): Promise<number> {
    const suppliers = await this.getProjectSuppliers(projectId);
    return suppliers.length;
  }

  private async analyzeContracts(projectId: number): Promise<any> {
    return { renewalsRequired: 8 };
  }

  private async checkSupplierCertificates(supplier: any): Promise<void> {
    // Check certificate expiries
  }

  private async validateSupplierInsurance(supplier: any): Promise<void> {
    // Validate insurance
  }

  private async checkContractCompliance(supplier: any, projectId: number): Promise<void> {
    // Check contract compliance
  }

  private async checkESGCompliance(supplier: any): Promise<void> {
    // Check ESG compliance
  }

  private async calculateOverallPerformance(supplierId: number): Promise<any> {
    return { score: 85, projects: 3, totalValue: 150000 };
  }

  private async recommendStrategicPartnership(supplierId: number, performance: any): Promise<void> {
    // Recommend strategic partnership
  }

  private async flagUnderperformingSupplier(supplierId: number, performance: any): Promise<void> {
    // Flag underperforming supplier
  }

  private async updateMarketIntelligence(supplierId: number, performance: any): Promise<void> {
    // Update market intelligence
  }
}

export const procurementAgent = new ProcurementAgent();

// Event listeners
eventBus.onEvent('supplier.evaluated', (data) => {
  procurementAgent.handleSupplierEvaluation(data);
});

eventBus.onEvent('payment.processed', (data) => {
  procurementAgent.handlePaymentProcessed(data);
});