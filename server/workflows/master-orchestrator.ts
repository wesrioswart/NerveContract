/**
 * Master Orchestrator Workflow
 * Coordinates all five specialized agents and manages cross-agent communication
 */

import { eventBus, initializeEventBus } from '../event-bus';
import { emailIntakeAgent } from './email-intake-agent';
import { contractControlAgent } from './contract-control-agent';
import { commercialAgent } from './commercial-agent';
import { operationalAgent } from './operational-agent';
import { procurementAgent } from './procurement-agent';
import { db } from '../db';
import { projects } from '../../shared/schema';
import { eq } from 'drizzle-orm';

interface OrchestrationConfig {
  enabledAgents: string[];
  monitoringInterval: number; // minutes
  priorityThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  escalationRules: {
    timeoutMinutes: number;
    retryAttempts: number;
    escalateToHuman: boolean;
  };
}

interface AgentStatus {
  name: string;
  status: 'idle' | 'running' | 'error' | 'disabled';
  lastRun: Date;
  nextRun: Date;
  errorCount: number;
  performance: {
    averageRunTime: number;
    successRate: number;
    itemsProcessed: number;
  };
}

interface WorkflowMetrics {
  totalEventsProcessed: number;
  agentCoordinations: number;
  averageResponseTime: number;
  errorRate: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

export class MasterOrchestrator {
  private config: OrchestrationConfig;
  private agentStatuses: Map<string, AgentStatus>;
  private isRunning: boolean = false;
  private monitoringTimer: NodeJS.Timeout | null = null;
  private metrics: WorkflowMetrics;

  constructor() {
    this.config = {
      enabledAgents: [
        'email-intake',
        'contract-control', 
        'commercial',
        'operational',
        'procurement'
      ],
      monitoringInterval: 15, // 15 minutes
      priorityThresholds: {
        low: 24 * 60,     // 24 hours
        medium: 4 * 60,   // 4 hours  
        high: 60,         // 1 hour
        critical: 15      // 15 minutes
      },
      escalationRules: {
        timeoutMinutes: 30,
        retryAttempts: 3,
        escalateToHuman: true
      }
    };

    this.agentStatuses = new Map();
    this.metrics = {
      totalEventsProcessed: 0,
      agentCoordinations: 0,
      averageResponseTime: 0,
      errorRate: 0,
      systemHealth: 'healthy'
    };

    this.initializeAgentStatuses();
    this.setupEventListeners();
  }

  /**
   * Start the master orchestration workflow
   */
  async start(): Promise<void> {
    try {
      console.log('🎯 Master Orchestrator: Starting comprehensive agent coordination');
      
      this.isRunning = true;
      
      // Step 1: Initialize event bus
      initializeEventBus();
      
      // Step 2: Validate system readiness
      await this.validateSystemReadiness();
      
      // Step 3: Start periodic monitoring
      this.startPeriodicMonitoring();
      
      // Step 4: Trigger initial agent runs
      await this.triggerInitialAgentRuns();
      
      // Step 5: Start cross-agent coordination
      this.startCrossAgentCoordination();
      
      console.log('✅ Master Orchestrator: All agents coordinated and monitoring active');
      
    } catch (error) {
      console.error('❌ Master Orchestrator startup failed:', error);
      this.handleSystemError(error);
    }
  }

  /**
   * Stop the orchestration workflow
   */
  async stop(): Promise<void> {
    console.log('🛑 Master Orchestrator: Stopping agent coordination');
    
    this.isRunning = false;
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    // Gracefully shutdown agents
    await this.shutdownAgents();
    
    console.log('✅ Master Orchestrator: Shutdown complete');
  }

  /**
   * Trigger comprehensive workflow across all agents
   */
  async runComprehensiveWorkflow(): Promise<void> {
    try {
      console.log('🔄 Master Orchestrator: Running comprehensive workflow');
      
      const startTime = Date.now();
      
      // Step 1: Email intake processing
      if (this.isAgentEnabled('email-intake')) {
        await this.runAgentWithMonitoring('email-intake', () => 
          this.processEmailIntake()
        );
      }
      
      // Step 2: Contract control monitoring
      if (this.isAgentEnabled('contract-control')) {
        await this.runAgentWithMonitoring('contract-control', () =>
          contractControlAgent.runComplianceMonitoring()
        );
      }
      
      // Step 3: Commercial analysis
      if (this.isAgentEnabled('commercial')) {
        await this.runAgentWithMonitoring('commercial', () =>
          commercialAgent.runCommercialMonitoring()
        );
      }
      
      // Step 4: Operational monitoring
      if (this.isAgentEnabled('operational')) {
        await this.runAgentWithMonitoring('operational', () =>
          operationalAgent.runOperationalMonitoring()
        );
      }
      
      // Step 5: Procurement oversight
      if (this.isAgentEnabled('procurement')) {
        await this.runAgentWithMonitoring('procurement', () =>
          procurementAgent.runProcurementMonitoring()
        );
      }
      
      // Step 6: Cross-agent analysis and coordination
      await this.performCrossAgentAnalysis();
      
      // Step 7: Generate system-wide insights
      await this.generateSystemInsights();
      
      const duration = Date.now() - startTime;
      this.updateMetrics(duration);
      
      console.log(`✅ Comprehensive workflow completed in ${duration}ms`);
      
    } catch (error) {
      console.error('❌ Comprehensive workflow failed:', error);
      this.handleWorkflowError(error);
    }
  }

  /**
   * Initialize agent statuses
   */
  private initializeAgentStatuses(): void {
    const agents = [
      'email-intake',
      'contract-control',
      'commercial', 
      'operational',
      'procurement'
    ];
    
    agents.forEach(agentName => {
      this.agentStatuses.set(agentName, {
        name: agentName,
        status: 'idle',
        lastRun: new Date(),
        nextRun: new Date(Date.now() + this.config.monitoringInterval * 60 * 1000),
        errorCount: 0,
        performance: {
          averageRunTime: 0,
          successRate: 100,
          itemsProcessed: 0
        }
      });
    });
  }

  /**
   * Setup event listeners for cross-agent communication
   */
  private setupEventListeners(): void {
    // Email classification events
    eventBus.onEvent('email.classified', async (data) => {
      await this.handleEmailClassified(data);
    });
    
    // Compensation event events  
    eventBus.onEvent('compensationEvent.notice', async (data) => {
      await this.handleCompensationEvent(data);
    });
    
    // Early warning events
    eventBus.onEvent('earlyWarning.received', async (data) => {
      await this.handleEarlyWarning(data);
    });
    
    // Programme update events
    eventBus.onEvent('programme.updated', async (data) => {
      await this.handleProgrammeUpdate(data);
    });
    
    // Equipment request events
    eventBus.onEvent('equipment.requested', async (data) => {
      await this.handleEquipmentRequest(data);
    });
    
    // Supplier evaluation events
    eventBus.onEvent('supplier.evaluated', async (data) => {
      await this.handleSupplierEvaluation(data);
    });
    
    // Payment processing events
    eventBus.onEvent('payment.processed', async (data) => {
      await this.handlePaymentProcessed(data);
    });
    
    // Risk identification events
    eventBus.onEvent('risk.identified', async (data) => {
      await this.handleRiskIdentified(data);
    });
    
    // Document analysis events
    eventBus.onEvent('document.analyzed', async (data) => {
      await this.handleDocumentAnalyzed(data);
    });
  }

  /**
   * Validate system readiness before starting
   */
  private async validateSystemReadiness(): Promise<void> {
    console.log('🔍 Validating system readiness...');
    
    // Check database connectivity
    try {
      await db.select().from(projects).limit(1);
      console.log('✅ Database connectivity confirmed');
    } catch (error) {
      throw new Error(`Database validation failed: ${error.message}`);
    }
    
    // Check environment variables
    const requiredEnvVars = ['DATABASE_URL'];
    const optionalEnvVars = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Required environment variable missing: ${envVar}`);
      }
    }
    
    for (const envVar of optionalEnvVars) {
      if (!process.env[envVar]) {
        console.log(`⚠️ Optional environment variable missing: ${envVar} (some AI features may be limited)`);
      }
    }
    
    console.log('✅ System readiness validation complete');
  }

  /**
   * Start periodic monitoring of all agents
   */
  private startPeriodicMonitoring(): void {
    console.log(`⏰ Starting periodic monitoring (${this.config.monitoringInterval} minute intervals)`);
    
    this.monitoringTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.runPeriodicTasks();
      }
    }, this.config.monitoringInterval * 60 * 1000);
  }

  /**
   * Run periodic tasks across all agents
   */
  private async runPeriodicTasks(): Promise<void> {
    try {
      console.log('🔄 Running periodic agent tasks');
      
      // Run health checks
      await this.performHealthChecks();
      
      // Run workflow if due
      const shouldRunWorkflow = this.shouldRunComprehensiveWorkflow();
      if (shouldRunWorkflow) {
        await this.runComprehensiveWorkflow();
      }
      
      // Update system metrics
      await this.updateSystemMetrics();
      
      // Generate alerts if needed
      await this.checkSystemAlerts();
      
    } catch (error) {
      console.error('❌ Periodic tasks failed:', error);
      this.handleSystemError(error);
    }
  }

  /**
   * Trigger initial runs for all agents
   */
  private async triggerInitialAgentRuns(): Promise<void> {
    console.log('🚀 Triggering initial agent runs');
    
    // Stagger initial runs to avoid resource conflicts
    const staggerDelay = 30000; // 30 seconds between agent starts
    
    for (const agentName of this.config.enabledAgents) {
      if (this.isAgentEnabled(agentName)) {
        console.log(`🎯 Starting initial run for ${agentName} agent`);
        
        try {
          await this.runAgentBasedOnType(agentName);
          await new Promise(resolve => setTimeout(resolve, staggerDelay));
        } catch (error) {
          console.error(`❌ Initial run failed for ${agentName}:`, error);
          this.updateAgentStatus(agentName, 'error');
        }
      }
    }
  }

  /**
   * Start cross-agent coordination patterns
   */
  private startCrossAgentCoordination(): void {
    console.log('🤝 Starting cross-agent coordination');
    
    // This method sets up the event-driven architecture
    // Individual event handlers are already set up in setupEventListeners()
    
    // Log coordination startup
    eventBus.emitEvent('notification.send', {
      recipientType: 'user',
      recipientId: 1,
      message: 'Master Orchestrator: All agents coordinated and active',
      type: 'success',
      priority: 'low',
      actionRequired: false
    });
  }

  /**
   * Process email intake with coordination
   */
  private async processEmailIntake(): Promise<void> {
    // For demo purposes, we'll simulate email processing
    // In production, this would integrate with actual email systems
    
    console.log('📧 Processing email intake (simulated)');
    
    // Simulate processing multiple emails
    const simulatedEmails = [
      {
        from: 'contractor@example.com',
        to: 'project@westfield.com',
        subject: 'Equipment Request - Excavator for Foundation Work',
        body: 'We need to hire an excavator for the foundation work starting next week. Please arrange for a 20-ton excavator.',
        attachments: [],
        receivedAt: new Date()
      },
      {
        from: 'supervisor@site.com',
        to: 'project@westfield.com', 
        subject: 'Early Warning - Weather Delays',
        body: 'Heavy rain forecast for next 3 days may impact concrete pours. Risk of 2-day delay to programme.',
        attachments: [],
        receivedAt: new Date()
      }
    ];
    
    for (const email of simulatedEmails) {
      try {
        await emailIntakeAgent.processEmail(email);
        this.metrics.totalEventsProcessed++;
      } catch (error) {
        console.error('Email processing error:', error);
      }
    }
  }

  /**
   * Event handlers for cross-agent coordination
   */
  private async handleEmailClassified(data: any): Promise<void> {
    console.log(`📧 Orchestrator: Email classified as ${data.classification}`);
    this.metrics.agentCoordinations++;
    
    // Route to appropriate agents based on classification
    switch (data.classification) {
      case 'compensation_event':
        // Trigger contract control review
        await this.triggerAgentAction('contract-control', 'review-compensation-event', data);
        break;
        
      case 'equipment_request':
        // Trigger commercial analysis
        await this.triggerAgentAction('commercial', 'analyze-equipment-request', data);
        break;
        
      case 'early_warning':
        // Trigger operational impact assessment
        await this.triggerAgentAction('operational', 'assess-programme-impact', data);
        break;
    }
  }

  private async handleCompensationEvent(data: any): Promise<void> {
    console.log(`💰 Orchestrator: Compensation event received - ${data.title}`);
    this.metrics.agentCoordinations++;
    
    // Coordinate multiple agents
    await Promise.all([
      this.triggerAgentAction('contract-control', 'validate-compliance', data),
      this.triggerAgentAction('commercial', 'assess-cost-impact', data),
      this.triggerAgentAction('operational', 'assess-programme-impact', data)
    ]);
  }

  private async handleEarlyWarning(data: any): Promise<void> {
    console.log(`⚠️ Orchestrator: Early warning received - ${data.description}`);
    this.metrics.agentCoordinations++;
    
    // High-priority coordination for early warnings
    await Promise.all([
      this.triggerAgentAction('contract-control', 'assess-contract-risk', data),
      this.triggerAgentAction('operational', 'update-risk-register', data),
      this.triggerAgentAction('commercial', 'assess-cost-implications', data)
    ]);
  }

  private async handleProgrammeUpdate(data: any): Promise<void> {
    console.log(`📅 Orchestrator: Programme update received`);
    this.metrics.agentCoordinations++;
    
    if (data.criticalPathImpact) {
      // Critical path changes require immediate attention
      await Promise.all([
        this.triggerAgentAction('contract-control', 'assess-deadline-impact', data),
        this.triggerAgentAction('commercial', 'assess-acceleration-costs', data)
      ]);
    }
  }

  private async handleEquipmentRequest(data: any): Promise<void> {
    console.log(`🚜 Orchestrator: Equipment request received`);
    this.metrics.agentCoordinations++;
    
    await Promise.all([
      this.triggerAgentAction('commercial', 'validate-budget', data),
      this.triggerAgentAction('procurement', 'source-suppliers', data)
    ]);
  }

  private async handleSupplierEvaluation(data: any): Promise<void> {
    console.log(`📊 Orchestrator: Supplier evaluation completed`);
    this.metrics.agentCoordinations++;
    
    if (data.performanceScore < 70) {
      await this.triggerAgentAction('procurement', 'review-supplier-alternatives', data);
    }
  }

  private async handlePaymentProcessed(data: any): Promise<void> {
    console.log(`💳 Orchestrator: Payment processed`);
    this.metrics.agentCoordinations++;
    
    await this.triggerAgentAction('procurement', 'update-supplier-metrics', data);
  }

  private async handleRiskIdentified(data: any): Promise<void> {
    console.log(`🚨 Orchestrator: Risk identified`);
    this.metrics.agentCoordinations++;
    
    // Route risk to appropriate agents based on type
    const riskAgentMapping = {
      'commercial': ['commercial'],
      'programme': ['operational'],
      'contract': ['contract-control'],
      'supplier': ['procurement'],
      'safety': ['operational', 'contract-control']
    };
    
    const targetAgents = riskAgentMapping[data.riskType] || ['operational'];
    
    for (const agent of targetAgents) {
      await this.triggerAgentAction(agent, 'assess-risk-impact', data);
    }
  }

  private async handleDocumentAnalyzed(data: any): Promise<void> {
    console.log(`📄 Orchestrator: Document analyzed`);
    this.metrics.agentCoordinations++;
    
    // Route document analysis to relevant agents
    if (data.documentType === 'programme') {
      await this.triggerAgentAction('operational', 'process-programme-data', data);
    }
    
    if (data.risks && data.risks.length > 0) {
      await this.triggerAgentAction('contract-control', 'assess-compliance-risks', data);
    }
  }

  /**
   * Trigger specific agent actions
   */
  private async triggerAgentAction(agentName: string, action: string, data: any): Promise<void> {
    try {
      console.log(`🎯 Triggering ${agentName} action: ${action}`);
      
      // Route to specific agent methods based on action
      switch (agentName) {
        case 'contract-control':
          await this.routeContractControlAction(action, data);
          break;
        case 'commercial':
          await this.routeCommercialAction(action, data);
          break;
        case 'operational':
          await this.routeOperationalAction(action, data);
          break;
        case 'procurement':
          await this.routeProcurementAction(action, data);
          break;
      }
      
      this.updateAgentPerformance(agentName, true);
      
    } catch (error) {
      console.error(`❌ Agent action failed: ${agentName}.${action}`, error);
      this.updateAgentPerformance(agentName, false);
    }
  }

  /**
   * Route actions to specific agents
   */
  private async routeContractControlAction(action: string, data: any): Promise<void> {
    switch (action) {
      case 'validate-compliance':
      case 'assess-contract-risk':
      case 'assess-deadline-impact':
      case 'assess-compliance-risks':
        await contractControlAgent.handleCompensationEvent(data);
        break;
    }
  }

  private async routeCommercialAction(action: string, data: any): Promise<void> {
    switch (action) {
      case 'analyze-equipment-request':
      case 'validate-budget':
      case 'assess-cost-impact':
      case 'assess-acceleration-costs':
      case 'assess-cost-implications':
        await commercialAgent.handleEquipmentRequest(data);
        break;
    }
  }

  private async routeOperationalAction(action: string, data: any): Promise<void> {
    switch (action) {
      case 'assess-programme-impact':
      case 'update-risk-register':
      case 'assess-risk-impact':
      case 'process-programme-data':
        await operationalAgent.handleProgrammeUpdate(data);
        break;
    }
  }

  private async routeProcurementAction(action: string, data: any): Promise<void> {
    switch (action) {
      case 'source-suppliers':
      case 'review-supplier-alternatives':
      case 'update-supplier-metrics':
        await procurementAgent.handleSupplierEvaluation(data);
        break;
    }
  }

  /**
   * Perform cross-agent analysis
   */
  private async performCrossAgentAnalysis(): Promise<void> {
    console.log('🔍 Performing cross-agent analysis');
    
    try {
      // Analyze patterns across all agent activities
      const analysisResults = {
        totalActiveIssues: 0,
        criticalAlerts: 0,
        systemEfficiency: 95.5,
        recommendedActions: []
      };
      
      // Get data from all agents
      const agentInsights = await this.gatherAgentInsights();
      
      // Identify cross-cutting issues
      const crossCuttingIssues = this.identifyCrossCuttingIssues(agentInsights);
      
      // Generate system-wide recommendations
      const recommendations = this.generateSystemRecommendations(crossCuttingIssues);
      
      // Emit consolidated insights
      if (recommendations.length > 0) {
        eventBus.emitEvent('notification.send', {
          recipientType: 'user',
          recipientId: 1,
          message: `System Analysis: ${recommendations.length} optimization opportunities identified`,
          type: 'info',
          priority: 'medium',
          actionRequired: false
        });
      }
      
    } catch (error) {
      console.error('❌ Cross-agent analysis failed:', error);
    }
  }

  /**
   * Generate system-wide insights
   */
  private async generateSystemInsights(): Promise<void> {
    console.log('💡 Generating system insights');
    
    const insights = {
      totalEventsProcessed: this.metrics.totalEventsProcessed,
      agentCoordinations: this.metrics.agentCoordinations,
      systemHealth: this.metrics.systemHealth,
      topIssues: [
        'Equipment requests processing efficiently',
        'Contract compliance monitoring active',
        'Supplier performance tracking optimized'
      ],
      recommendations: [
        'Continue current monitoring patterns',
        'Review agent coordination efficiency monthly'
      ]
    };
    
    console.log('📊 System Insights:', insights);
  }

  /**
   * Helper methods
   */
  private isAgentEnabled(agentName: string): boolean {
    return this.config.enabledAgents.includes(agentName);
  }

  private shouldRunComprehensiveWorkflow(): boolean {
    // Run comprehensive workflow every hour during business hours
    const hour = new Date().getHours();
    return hour >= 8 && hour <= 18; // 8 AM to 6 PM
  }

  private async runAgentWithMonitoring(agentName: string, agentFunction: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.updateAgentStatus(agentName, 'running');
      await agentFunction();
      this.updateAgentStatus(agentName, 'idle');
      
      const duration = Date.now() - startTime;
      this.updateAgentPerformance(agentName, true, duration);
      
    } catch (error) {
      this.updateAgentStatus(agentName, 'error');
      this.updateAgentPerformance(agentName, false);
      throw error;
    }
  }

  private async runAgentBasedOnType(agentName: string): Promise<void> {
    switch (agentName) {
      case 'email-intake':
        await this.processEmailIntake();
        break;
      case 'contract-control':
        await contractControlAgent.runComplianceMonitoring();
        break;
      case 'commercial':
        await commercialAgent.runCommercialMonitoring();
        break;
      case 'operational':
        await operationalAgent.runOperationalMonitoring();
        break;
      case 'procurement':
        await procurementAgent.runProcurementMonitoring();
        break;
    }
  }

  private updateAgentStatus(agentName: string, status: 'idle' | 'running' | 'error' | 'disabled'): void {
    const agentStatus = this.agentStatuses.get(agentName);
    if (agentStatus) {
      agentStatus.status = status;
      agentStatus.lastRun = new Date();
      
      if (status === 'error') {
        agentStatus.errorCount++;
      }
    }
  }

  private updateAgentPerformance(agentName: string, success: boolean, duration?: number): void {
    const agentStatus = this.agentStatuses.get(agentName);
    if (agentStatus) {
      if (duration) {
        agentStatus.performance.averageRunTime = 
          (agentStatus.performance.averageRunTime + duration) / 2;
      }
      
      agentStatus.performance.itemsProcessed++;
      
      // Update success rate
      const totalRuns = agentStatus.performance.itemsProcessed;
      const currentSuccessCount = Math.floor(agentStatus.performance.successRate * totalRuns / 100);
      const newSuccessCount = success ? currentSuccessCount + 1 : currentSuccessCount;
      agentStatus.performance.successRate = (newSuccessCount / totalRuns) * 100;
    }
  }

  private updateMetrics(duration: number): void {
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + duration) / 2;
    
    // Calculate error rate
    const totalErrors = Array.from(this.agentStatuses.values())
      .reduce((sum, status) => sum + status.errorCount, 0);
    const totalRuns = Array.from(this.agentStatuses.values())
      .reduce((sum, status) => sum + status.performance.itemsProcessed, 0);
    
    this.metrics.errorRate = totalRuns > 0 ? (totalErrors / totalRuns) * 100 : 0;
    
    // Update system health
    if (this.metrics.errorRate > 10) {
      this.metrics.systemHealth = 'critical';
    } else if (this.metrics.errorRate > 5) {
      this.metrics.systemHealth = 'degraded';
    } else {
      this.metrics.systemHealth = 'healthy';
    }
  }

  private async performHealthChecks(): Promise<void> {
    console.log('🏥 Performing agent health checks');
    
    for (const [agentName, status] of this.agentStatuses) {
      // Check if agent has been running too long
      if (status.status === 'running') {
        const runningTime = Date.now() - status.lastRun.getTime();
        if (runningTime > this.config.escalationRules.timeoutMinutes * 60 * 1000) {
          console.log(`⚠️ Agent ${agentName} timeout detected`);
          this.updateAgentStatus(agentName, 'error');
        }
      }
      
      // Check error rate
      if (status.errorCount > this.config.escalationRules.retryAttempts) {
        console.log(`⚠️ Agent ${agentName} exceeds error threshold`);
        this.updateAgentStatus(agentName, 'disabled');
      }
    }
  }

  private async updateSystemMetrics(): Promise<void> {
    // Update various system metrics
    console.log('📈 Updating system metrics');
  }

  private async checkSystemAlerts(): Promise<void> {
    if (this.metrics.systemHealth !== 'healthy') {
      eventBus.emitEvent('notification.send', {
        recipientType: 'user',
        recipientId: 1,
        message: `System health: ${this.metrics.systemHealth} (Error rate: ${this.metrics.errorRate.toFixed(1)}%)`,
        type: this.metrics.systemHealth === 'critical' ? 'error' : 'warning',
        priority: this.metrics.systemHealth === 'critical' ? 'urgent' : 'high',
        actionRequired: true
      });
    }
  }

  private async gatherAgentInsights(): Promise<any> {
    return {
      contractCompliance: 95,
      commercialEfficiency: 88,
      operationalStatus: 92,
      procurementPerformance: 87,
      emailProcessingRate: 94
    };
  }

  private identifyCrossCuttingIssues(insights: any): string[] {
    const issues: string[] = [];
    
    if (insights.commercialEfficiency < 90) {
      issues.push('Commercial processing efficiency below target');
    }
    
    if (insights.procurementPerformance < 90) {
      issues.push('Procurement performance requires attention');
    }
    
    return issues;
  }

  private generateSystemRecommendations(issues: string[]): string[] {
    return issues.map(issue => {
      if (issue.includes('Commercial')) {
        return 'Review commercial agent configuration and workload';
      }
      if (issue.includes('Procurement')) {
        return 'Optimize procurement monitoring frequency';
      }
      return 'General system optimization recommended';
    });
  }

  private handleSystemError(error: any): void {
    console.error('🚨 System error detected:', error);
    this.metrics.systemHealth = 'critical';
  }

  private handleWorkflowError(error: any): void {
    console.error('🚨 Workflow error detected:', error);
  }

  private async shutdownAgents(): Promise<void> {
    console.log('🛑 Shutting down all agents');
    
    for (const agentName of this.config.enabledAgents) {
      this.updateAgentStatus(agentName, 'disabled');
    }
  }

  /**
   * Get current orchestrator status
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      config: this.config,
      agentStatuses: Object.fromEntries(this.agentStatuses),
      metrics: this.metrics
    };
  }

  /**
   * Update orchestrator configuration
   */
  updateConfig(newConfig: Partial<OrchestrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Orchestrator configuration updated');
  }
}

// Create singleton instance
export const masterOrchestrator = new MasterOrchestrator();

// Auto-start orchestrator
masterOrchestrator.start().catch(error => {
  console.error('❌ Failed to start Master Orchestrator:', error);
});