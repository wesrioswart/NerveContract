import { Request, Response } from 'express';
import { agentCoordinator } from '../agents/agent-coordinator';

// Get active alerts from all agents
export async function getActiveAlerts(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId);
    const alerts = agentCoordinator.getActiveAlerts(projectId);
    res.json(alerts);
  } catch (error) {
    console.error('Error getting active alerts:', error);
    res.status(500).json({ message: 'Failed to retrieve alerts' });
  }
}

// Acknowledge an alert
export async function acknowledgeAlert(req: Request, res: Response): Promise<void> {
  try {
    const { alertId } = req.params;
    const userId = 1; // Current user ID
    await agentCoordinator.acknowledgeAlert(alertId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ message: 'Failed to acknowledge alert' });
  }
}

// Resolve an alert
export async function resolveAlert(req: Request, res: Response): Promise<void> {
  try {
    const { alertId } = req.params;
    const userId = 1; // Current user ID
    await agentCoordinator.resolveAlert(alertId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ message: 'Failed to resolve alert' });
  }
}

// Simulate incoming email processing
export async function processEmail(req: Request, res: Response): Promise<void> {
  try {
    const emailData = req.body;
    await agentCoordinator.processIncomingEmail(emailData);
    res.json({ success: true, message: 'Email processed successfully' });
  } catch (error) {
    console.error('Error processing email:', error);
    res.status(500).json({ message: 'Failed to process email' });
  }
}

// Simulate programme update processing
export async function processProgrammeUpdate(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const programmeData = req.body;
    await agentCoordinator.processProgrammeUpdate(parseInt(projectId), programmeData);
    res.json({ success: true, message: 'Programme update processed successfully' });
  } catch (error) {
    console.error('Error processing programme update:', error);
    res.status(500).json({ message: 'Failed to process programme update' });
  }
}

// Get agent communication log
export async function getCommunicationLog(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const communications = agentCoordinator.getCommunicationLog(limit);
    res.json(communications);
  } catch (error) {
    console.error('Error getting communication log:', error);
    res.status(500).json({ message: 'Failed to retrieve communication log' });
  }
}

// Trigger agent processing for demonstration
export async function triggerAgentDemo(req: Request, res: Response): Promise<void> {
  try {
    const { scenarioType, projectId } = req.body;
    
    switch (scenarioType) {
      case 'archaeological-delay':
        // Simulate CE-040 archaeological findings programme impact
        await agentCoordinator.processProgrammeUpdate(projectId, {
          projectId,
          activities: [{
            id: 'foundation-phase-2',
            name: 'Foundation Works - Phase 2',
            startDate: new Date('2024-12-01'),
            endDate: new Date('2024-12-15'),
            duration: 14,
            progress: 60,
            isCritical: true,
            predecessors: [],
            successors: [],
            resources: ['Excavator', 'Foundation Team'],
            status: 'delayed'
          }],
          milestones: [],
          criticalPath: ['foundation-phase-2'],
          plannedCompletion: new Date('2024-12-20'),
          forecastCompletion: new Date('2025-01-10'),
          overallProgress: 65
        });
        break;
        
      case 'equipment-cost-validation':
        // Simulate equipment hire cost validation
        await agentCoordinator.processEquipmentHireUpdate(projectId, {
          id: 3,
          projectId,
          equipmentName: 'Concrete Pump - 42m',
          supplierName: 'Pumping Solutions Ltd',
          hireReference: 'PSL-CP-0089',
          startDate: new Date('2024-12-05'),
          endDate: new Date('2024-12-06'),
          dailyRate: 850.00,
          totalCost: 1700.00,
          status: 'active',
          sccCompliant: false,
          workingAreasOnly: false
        });
        break;
        
      case 'supplier-performance':
        // Simulate supplier performance issues
        await agentCoordinator.processSupplierPerformance(1, {
          supplierId: 1,
          supplierName: 'Regional Materials Ltd',
          performanceMetrics: {
            deliveryReliability: 65,
            qualityScore: 72,
            costPerformance: 68,
            responsiveness: 75
          },
          recentEvents: [{
            type: 'quality-issue',
            date: new Date(),
            severity: 'high',
            description: 'Concrete samples failed compression tests',
            impactValue: 5000
          }],
          riskLevel: 'high',
          contractValue: 125000,
          deliveryCount: 15,
          defectCount: 3
        });
        break;
        
      default:
        return res.status(400).json({ message: 'Unknown scenario type' });
    }
    
    res.json({ success: true, message: `${scenarioType} scenario processed successfully` });
  } catch (error) {
    console.error('Error triggering agent demo:', error);
    res.status(500).json({ message: 'Failed to trigger agent demo' });
  }
}