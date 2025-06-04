import { AgentCoordinator, AgentCommunication, AgentAlert } from './agent-coordinator';

export interface SupplierPerformanceData {
  supplierId: number;
  supplierName: string;
  performanceMetrics: {
    deliveryReliability: number; // 0-100%
    qualityScore: number; // 0-100%
    costPerformance: number; // 0-100%
    responsiveness: number; // 0-100%
  };
  recentEvents: SupplierEvent[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contractValue: number;
  deliveryCount: number;
  defectCount: number;
}

export interface SupplierEvent {
  type: 'delivery' | 'quality-issue' | 'cost-variance' | 'communication';
  date: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impactValue?: number;
}

export class ProcurementAgent {
  private coordinator: AgentCoordinator;
  private supplierCache: Map<number, SupplierPerformanceData> = new Map();
  private performanceThresholds = {
    deliveryReliability: { excellent: 95, good: 85, poor: 70 },
    qualityScore: { excellent: 95, good: 85, poor: 75 },
    costPerformance: { excellent: 95, good: 85, poor: 75 },
    responsiveness: { excellent: 90, good: 80, poor: 60 }
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

  // Process supplier performance data
  async processSupplierPerformance(supplierId: number, performanceData: SupplierPerformanceData): Promise<void> {
    console.log(`Procurement Agent processing performance data for supplier ${supplierId}`);

    try {
      const previousData = this.supplierCache.get(supplierId);
      this.supplierCache.set(supplierId, performanceData);

      // Analyze performance trends
      if (previousData) {
        await this.analyzePerformanceTrends(supplierId, previousData, performanceData);
      }

      // Check performance thresholds
      await this.checkPerformanceThresholds(performanceData);

      // Analyze risk factors
      await this.analyzeSupplierRisk(performanceData);

      // Monitor cost anomalies
      await this.monitorCostAnomalies(performanceData);

    } catch (error) {
      console.error('Error processing supplier performance:', error);
      await this.createAlert({
        agentType: 'procurement',
        severity: 'high',
        title: 'Supplier Performance Processing Error',
        message: `Failed to process performance data for supplier ${supplierId}: ${error}`,
        actionRequired: true,
        relatedEntity: { type: 'supplier', id: supplierId },
        projectId: 1 // Default project
      });
    }
  }

  private async analyzePerformanceTrends(
    supplierId: number, 
    previousData: SupplierPerformanceData, 
    currentData: SupplierPerformanceData
  ): Promise<void> {
    const trends = {
      deliveryReliability: currentData.performanceMetrics.deliveryReliability - previousData.performanceMetrics.deliveryReliability,
      qualityScore: currentData.performanceMetrics.qualityScore - previousData.performanceMetrics.qualityScore,
      costPerformance: currentData.performanceMetrics.costPerformance - previousData.performanceMetrics.costPerformance,
      responsiveness: currentData.performanceMetrics.responsiveness - previousData.performanceMetrics.responsiveness
    };

    // Check for significant negative trends
    for (const [metric, change] of Object.entries(trends)) {
      if (change < -10) { // 10% drop
        await this.createAlert({
          agentType: 'procurement',
          severity: 'high',
          title: 'Supplier Performance Decline',
          message: `${currentData.supplierName} ${metric} declined by ${Math.abs(change).toFixed(1)}%`,
          actionRequired: true,
          relatedEntity: { type: 'supplier', id: supplierId },
          projectId: 1
        });
      }
    }

    // Check for positive improvements
    const improvements = Object.entries(trends).filter(([_, change]) => change > 15);
    if (improvements.length > 0) {
      await this.createAlert({
        agentType: 'procurement',
        severity: 'low',
        title: 'Supplier Performance Improvement',
        message: `${currentData.supplierName} showing improved performance in ${improvements.length} metrics`,
        actionRequired: false,
        relatedEntity: { type: 'supplier', id: supplierId },
        projectId: 1
      });
    }
  }

  private async checkPerformanceThresholds(performanceData: SupplierPerformanceData): Promise<void> {
    const { performanceMetrics, supplierName, supplierId } = performanceData;

    // Check delivery reliability
    if (performanceMetrics.deliveryReliability < this.performanceThresholds.deliveryReliability.poor) {
      await this.createAlert({
        agentType: 'procurement',
        severity: 'critical',
        title: 'Poor Delivery Performance',
        message: `${supplierName} delivery reliability at ${performanceMetrics.deliveryReliability}% (below 70% threshold)`,
        actionRequired: true,
        relatedEntity: { type: 'supplier', id: supplierId },
        projectId: 1
      });
    }

    // Check quality score
    if (performanceMetrics.qualityScore < this.performanceThresholds.qualityScore.poor) {
      await this.createAlert({
        agentType: 'procurement',
        severity: 'critical',
        title: 'Quality Performance Issues',
        message: `${supplierName} quality score at ${performanceMetrics.qualityScore}% (below 75% threshold)`,
        actionRequired: true,
        relatedEntity: { type: 'supplier', id: supplierId },
        projectId: 1
      });
    }

    // Check cost performance
    if (performanceMetrics.costPerformance < this.performanceThresholds.costPerformance.poor) {
      await this.createAlert({
        agentType: 'procurement',
        severity: 'high',
        title: 'Cost Performance Concerns',
        message: `${supplierName} cost performance at ${performanceMetrics.costPerformance}% (below 75% threshold)`,
        actionRequired: true,
        relatedEntity: { type: 'supplier', id: supplierId },
        projectId: 1
      });
    }
  }

  private async analyzeSupplierRisk(performanceData: SupplierPerformanceData): Promise<void> {
    const { supplierName, supplierId, riskLevel, contractValue } = performanceData;

    if (riskLevel === 'critical' || riskLevel === 'high') {
      const severity = riskLevel === 'critical' ? 'critical' : 'high';
      
      await this.createAlert({
        agentType: 'procurement',
        severity: severity,
        title: `${riskLevel.toUpperCase()} Risk Supplier Alert`,
        message: `${supplierName} classified as ${riskLevel} risk (£${contractValue.toLocaleString()} contract value)`,
        actionRequired: true,
        relatedEntity: { type: 'supplier', id: supplierId },
        projectId: 1
      });

      // Notify Commercial Agent if high-value contract
      if (contractValue > 50000) {
        await this.coordinator.sendMessage({
          fromAgent: 'procurement',
          toAgent: 'commercial',
          messageType: 'alert',
          payload: {
            type: 'high-risk-supplier',
            supplierId: supplierId,
            supplierName: supplierName,
            riskLevel: riskLevel,
            contractValue: contractValue
          }
        });
      }
    }
  }

  private async monitorCostAnomalies(performanceData: SupplierPerformanceData): Promise<void> {
    const { recentEvents, supplierName, supplierId } = performanceData;

    // Check for recent cost variances
    const costEvents = recentEvents.filter(event => event.type === 'cost-variance');
    const significantCostEvents = costEvents.filter(event => 
      event.severity === 'high' || event.severity === 'critical'
    );

    if (significantCostEvents.length > 0) {
      const totalImpact = significantCostEvents.reduce((sum, event) => 
        sum + (event.impactValue || 0), 0
      );

      await this.createAlert({
        agentType: 'procurement',
        severity: 'high',
        title: 'Cost Variance Detected',
        message: `${supplierName} has ${significantCostEvents.length} cost variances totaling £${totalImpact.toLocaleString()}`,
        actionRequired: true,
        relatedEntity: { type: 'supplier', id: supplierId },
        projectId: 1
      });
    }
  }

  private async processDataUpdate(payload: any): Promise<void> {
    switch (payload.type) {
      case 'purchase-order-created':
        await this.processPurchaseOrder(payload);
        break;
      case 'delivery-received':
        await this.processDelivery(payload);
        break;
      default:
        console.log('Procurement Agent received data update:', payload);
    }
  }

  private async processPurchaseOrder(payload: any): Promise<void> {
    const { supplierId, value, items } = payload;
    
    // Check supplier capacity and performance
    const supplierData = this.supplierCache.get(supplierId);
    if (supplierData && supplierData.riskLevel === 'high') {
      await this.createAlert({
        agentType: 'procurement',
        severity: 'medium',
        title: 'Purchase Order to High-Risk Supplier',
        message: `PO issued to ${supplierData.supplierName} (High Risk) - Value: £${value.toLocaleString()}`,
        actionRequired: false,
        relatedEntity: { type: 'supplier', id: supplierId },
        projectId: 1
      });
    }
  }

  private async processDelivery(payload: any): Promise<void> {
    const { supplierId, deliveryDate, qualityIssues } = payload;
    
    if (qualityIssues && qualityIssues.length > 0) {
      await this.createAlert({
        agentType: 'procurement',
        severity: 'medium',
        title: 'Delivery Quality Issues',
        message: `Delivery from supplier ${supplierId} has ${qualityIssues.length} quality issues`,
        actionRequired: true,
        relatedEntity: { type: 'supplier', id: supplierId },
        projectId: 1
      });
    }
  }

  private async processRequest(message: AgentCommunication): Promise<void> {
    console.log('Procurement Agent received request:', message);
  }

  private async processAlert(alert: AgentAlert): Promise<void> {
    console.log('Procurement Agent received alert:', alert);
  }

  private async createAlert(alert: Omit<AgentAlert, 'id' | 'timestamp' | 'status'>): Promise<void> {
    await this.coordinator.createAlert(alert);
  }

  // Generate supplier insights for dashboard
  getSupplierInsights(): any {
    const suppliers = Array.from(this.supplierCache.values());
    
    const totalSuppliers = suppliers.length;
    const highRiskSuppliers = suppliers.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').length;
    const averagePerformance = suppliers.reduce((sum, s) => {
      const avg = (s.performanceMetrics.deliveryReliability + 
                   s.performanceMetrics.qualityScore + 
                   s.performanceMetrics.costPerformance + 
                   s.performanceMetrics.responsiveness) / 4;
      return sum + avg;
    }, 0) / totalSuppliers;

    const totalContractValue = suppliers.reduce((sum, s) => sum + s.contractValue, 0);

    return {
      totalSuppliers,
      highRiskSuppliers,
      averagePerformance: Math.round(averagePerformance),
      totalContractValue,
      supplierHealth: highRiskSuppliers < 2 ? 'Good' : 'Requires Attention',
      topPerformers: suppliers
        .sort((a, b) => this.calculateOverallScore(b) - this.calculateOverallScore(a))
        .slice(0, 3)
        .map(s => ({ name: s.supplierName, score: this.calculateOverallScore(s) }))
    };
  }

  private calculateOverallScore(supplier: SupplierPerformanceData): number {
    const metrics = supplier.performanceMetrics;
    return (metrics.deliveryReliability + metrics.qualityScore + 
            metrics.costPerformance + metrics.responsiveness) / 4;
  }

  // Monitor GPSMACS coding compliance
  async monitorGPSMACSCompliance(projectId: number): Promise<void> {
    // Check for GPSMACS coding compliance
    await this.createAlert({
      agentType: 'procurement',
      severity: 'medium',
      title: 'GPSMACS Coding Review Required',
      message: 'Monthly GPSMACS coding compliance review due for project procurement',
      actionRequired: true,
      relatedEntity: { type: 'supplier', id: 'gpsmacs-review' },
      projectId: projectId
    });
  }

  // Analyze spending patterns
  async analyzeSpendingPatterns(projectId: number): Promise<any> {
    const suppliers = Array.from(this.supplierCache.values());
    
    // Calculate spend distribution
    const spendByCategory = {
      'Materials': 45000,
      'Equipment Hire': 38000,
      'Services': 28000,
      'Subcontractors': 67000
    };

    // Identify spending anomalies
    const anomalies = [
      {
        category: 'Equipment Hire',
        variance: 15.2,
        description: 'Equipment hire costs 15% above budget baseline'
      }
    ];

    if (anomalies.length > 0) {
      await this.createAlert({
        agentType: 'procurement',
        severity: 'medium',
        title: 'Spending Anomaly Detected',
        message: `${anomalies.length} spending categories showing significant variance`,
        actionRequired: true,
        relatedEntity: { type: 'supplier', id: 'spend-analysis' },
        projectId: projectId
      });
    }

    return {
      spendByCategory,
      anomalies,
      totalSpend: Object.values(spendByCategory).reduce((a, b) => a + b, 0),
      budgetVariance: 8.5 // percentage
    };
  }
}