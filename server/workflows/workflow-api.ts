/**
 * Workflow API Routes
 * Provides REST API endpoints for workflow management and monitoring
 */

import { Router } from 'express';
import { masterOrchestrator } from './master-orchestrator';
import { emailIntakeAgent } from './email-intake-agent';
import { contractControlAgent } from './contract-control-agent';
import { commercialAgent } from './commercial-agent';
import { operationalAgent } from './operational-agent';
import { procurementAgent } from './procurement-agent';

export const workflowRouter = Router();

/**
 * GET /api/workflows/status
 * Get overall workflow system status
 */
workflowRouter.get('/status', async (req, res) => {
  try {
    const status = masterOrchestrator.getStatus();
    
    res.json({
      success: true,
      data: {
        systemStatus: status.isRunning ? 'running' : 'stopped',
        systemHealth: status.metrics.systemHealth,
        agentStatuses: status.agentStatuses,
        metrics: status.metrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow status',
      details: error.message
    });
  }
});

/**
 * POST /api/workflows/start
 * Start the master orchestrator
 */
workflowRouter.post('/start', async (req, res) => {
  try {
    await masterOrchestrator.start();
    
    res.json({
      success: true,
      message: 'Master Orchestrator started successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start Master Orchestrator',
      details: error.message
    });
  }
});

/**
 * POST /api/workflows/stop
 * Stop the master orchestrator
 */
workflowRouter.post('/stop', async (req, res) => {
  try {
    await masterOrchestrator.stop();
    
    res.json({
      success: true,
      message: 'Master Orchestrator stopped successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to stop Master Orchestrator',
      details: error.message
    });
  }
});

/**
 * POST /api/workflows/run-comprehensive
 * Trigger a comprehensive workflow run
 */
workflowRouter.post('/run-comprehensive', async (req, res) => {
  try {
    // Run comprehensive workflow in background
    masterOrchestrator.runComprehensiveWorkflow().catch(error => {
      console.error('Background comprehensive workflow failed:', error);
    });
    
    res.json({
      success: true,
      message: 'Comprehensive workflow triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to trigger comprehensive workflow',
      details: error.message
    });
  }
});

/**
 * PUT /api/workflows/config
 * Update orchestrator configuration
 */
workflowRouter.put('/config', async (req, res) => {
  try {
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Configuration object required'
      });
    }
    
    masterOrchestrator.updateConfig(config);
    
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration',
      details: error.message
    });
  }
});

/**
 * POST /api/workflows/agents/:agentName/trigger
 * Trigger specific agent workflow
 */
workflowRouter.post('/agents/:agentName/trigger', async (req, res) => {
  try {
    const { agentName } = req.params;
    const { data } = req.body;
    
    let result;
    
    switch (agentName) {
      case 'email-intake':
        if (!data.emailData) {
          return res.status(400).json({
            success: false,
            error: 'emailData required for email intake agent'
          });
        }
        result = await emailIntakeAgent.processEmail(data.emailData);
        break;
        
      case 'contract-control':
        result = await contractControlAgent.runComplianceMonitoring();
        break;
        
      case 'commercial':
        result = await commercialAgent.runCommercialMonitoring();
        break;
        
      case 'operational':
        result = await operationalAgent.runOperationalMonitoring();
        break;
        
      case 'procurement':
        result = await procurementAgent.runProcurementMonitoring();
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown agent: ${agentName}`
        });
    }
    
    res.json({
      success: true,
      message: `${agentName} agent triggered successfully`,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to trigger ${req.params.agentName} agent`,
      details: error.message
    });
  }
});

/**
 * GET /api/workflows/agents/:agentName/status
 * Get specific agent status
 */
workflowRouter.get('/agents/:agentName/status', async (req, res) => {
  try {
    const { agentName } = req.params;
    const systemStatus = masterOrchestrator.getStatus();
    const agentStatus = systemStatus.agentStatuses[agentName];
    
    if (!agentStatus) {
      return res.status(404).json({
        success: false,
        error: `Agent not found: ${agentName}`
      });
    }
    
    res.json({
      success: true,
      data: {
        agent: agentName,
        status: agentStatus,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to get agent status`,
      details: error.message
    });
  }
});

/**
 * POST /api/workflows/test-email
 * Test email processing workflow
 */
workflowRouter.post('/test-email', async (req, res) => {
  try {
    const testEmail = {
      from: req.body.from || 'test@example.com',
      to: 'project@westfield.com',
      subject: req.body.subject || 'Test Email for Workflow',
      body: req.body.body || 'This is a test email to validate the workflow system.',
      attachments: [],
      receivedAt: new Date()
    };
    
    await emailIntakeAgent.processEmail(testEmail);
    
    res.json({
      success: true,
      message: 'Test email processed successfully',
      testEmail,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process test email',
      details: error.message
    });
  }
});

/**
 * GET /api/workflows/metrics
 * Get detailed workflow metrics
 */
workflowRouter.get('/metrics', async (req, res) => {
  try {
    const status = masterOrchestrator.getStatus();
    
    // Calculate additional metrics
    const totalAgents = Object.keys(status.agentStatuses).length;
    const activeAgents = Object.values(status.agentStatuses)
      .filter((agent: any) => agent.status === 'running' || agent.status === 'idle').length;
    const errorAgents = Object.values(status.agentStatuses)
      .filter((agent: any) => agent.status === 'error').length;
    
    const aggregatedMetrics = {
      system: {
        health: status.metrics.systemHealth,
        totalEventsProcessed: status.metrics.totalEventsProcessed,
        agentCoordinations: status.metrics.agentCoordinations,
        averageResponseTime: status.metrics.averageResponseTime,
        errorRate: status.metrics.errorRate
      },
      agents: {
        total: totalAgents,
        active: activeAgents,
        errors: errorAgents,
        utilization: totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0
      },
      performance: Object.fromEntries(
        Object.entries(status.agentStatuses).map(([name, agent]: [string, any]) => [
          name,
          {
            successRate: agent.performance.successRate,
            averageRunTime: agent.performance.averageRunTime,
            itemsProcessed: agent.performance.itemsProcessed,
            lastRun: agent.lastRun
          }
        ])
      )
    };
    
    res.json({
      success: true,
      data: aggregatedMetrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow metrics',
      details: error.message
    });
  }
});

/**
 * POST /api/workflows/simulate-event
 * Simulate various events for testing
 */
workflowRouter.post('/simulate-event', async (req, res) => {
  try {
    const { eventType, projectId, data } = req.body;
    
    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'eventType required'
      });
    }
    
    const simulatedData = {
      projectId: projectId || 1,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    // Import eventBus to emit simulated events
    const { eventBus } = await import('../event-bus');
    
    switch (eventType) {
      case 'compensation_event':
        eventBus.emitEvent('compensationEvent.notice', {
          ...simulatedData,
          title: 'Simulated Compensation Event',
          description: 'This is a simulated compensation event for testing',
          clauseReference: '60.1',
          estimatedValue: 15000,
          raisedBy: 1
        });
        break;
        
      case 'early_warning':
        eventBus.emitEvent('earlyWarning.received', {
          ...simulatedData,
          description: 'Simulated early warning for testing',
          raisedBy: 1,
          severity: 'medium',
          category: 'programme'
        });
        break;
        
      case 'equipment_request':
        eventBus.emitEvent('equipment.requested', {
          ...simulatedData,
          equipmentType: 'excavator',
          requestedBy: 1,
          urgency: 'medium',
          specifications: { size: '20-ton', duration: '2 weeks' }
        });
        break;
        
      case 'programme_update':
        eventBus.emitEvent('programme.updated', {
          ...simulatedData,
          changes: ['Activity delay identified'],
          criticalPathImpact: true,
          delayIdentified: true,
          milestonesAffected: ['Foundation Completion']
        });
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown event type: ${eventType}`
        });
    }
    
    res.json({
      success: true,
      message: `Simulated ${eventType} event triggered`,
      eventData: simulatedData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to simulate event',
      details: error.message
    });
  }
});

/**
 * GET /api/workflows/health
 * Simple health check endpoint
 */
workflowRouter.get('/health', (req, res) => {
  const status = masterOrchestrator.getStatus();
  
  res.json({
    success: true,
    status: status.isRunning ? 'healthy' : 'stopped',
    systemHealth: status.metrics.systemHealth,
    timestamp: new Date().toISOString()
  });
});

export default workflowRouter;