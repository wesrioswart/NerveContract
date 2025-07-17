/**
 * Programme Automation API Routes
 * Handles automated MS Project/Primavera P6 programme changes
 */

import { Router, Request, Response } from 'express';
import { programmeAutomation } from '../services/programme-automation';
import { storage } from '../storage';

const router = Router();

/**
 * Trigger automated programme changes
 */
router.post('/trigger-automation/:projectId', async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { triggers } = req.body;
    
    console.log(`🔄 Triggering automated programme changes for project ${projectId}`);
    
    const result = await programmeAutomation.processAutomatedProgrammeChanges(
      projectId,
      triggers
    );
    
    res.json({
      success: true,
      data: result,
      message: `Programme automation completed with ${result.summary.totalChanges} changes`
    });
    
  } catch (error) {
    console.error('Programme automation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get available export formats
 */
router.get('/export-formats', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      formats: [
        { id: 'xml', name: 'MS Project XML', extension: '.xml', description: 'Microsoft Project 2010+ XML format' },
        { id: 'mpp', name: 'MS Project MPP', extension: '.mpp', description: 'Microsoft Project binary format' },
        { id: 'xer', name: 'Primavera XER', extension: '.xer', description: 'Primavera P6 XER format' }
      ]
    }
  });
});

/**
 * Export updated programme
 */
router.post('/export/:projectId', async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { format } = req.body;
    
    // Get current programme with activities
    const programme = await programmeAutomation['getCurrentProgramme'](projectId);
    if (!programme) {
      return res.status(404).json({
        success: false,
        error: 'No programme found for this project'
      });
    }
    
    // Generate export
    const exportResult = await programmeAutomation['generateExportFiles'](
      projectId,
      programme,
      [format]
    );
    
    res.json({
      success: true,
      data: {
        exportPath: exportResult[format],
        format,
        projectId
      }
    });
    
  } catch (error) {
    console.error('Programme export error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    });
  }
});

/**
 * Get programme change history
 */
router.get('/change-history/:projectId', async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    // Get activities with modification history
    const activities = await storage.getProgrammeActivities(projectId);
    
    const changeHistory = activities
      .filter(activity => activity.lastModified)
      .map(activity => ({
        activityId: activity.externalId,
        activityName: activity.name,
        lastModified: activity.lastModified,
        modificationReason: activity.modificationReason,
        impactDays: activity.impactDays || 0
      }))
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    
    res.json({
      success: true,
      data: {
        changeHistory,
        totalChanges: changeHistory.length,
        projectId
      }
    });
    
  } catch (error) {
    console.error('Change history error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve change history'
    });
  }
});

/**
 * Validate programme for automation
 */
router.post('/validate/:projectId', async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    // Get programme data
    const programmes = await storage.getProgrammesByProject(projectId);
    if (!programmes.length) {
      return res.status(404).json({
        success: false,
        error: 'No programme found for this project'
      });
    }
    
    const programme = programmes[0];
    const activities = await storage.getProgrammeActivities(programme.id);
    
    // Validation checks
    const validationResult = {
      isValid: true,
      issues: [] as string[],
      warnings: [] as string[],
      recommendations: [] as string[]
    };
    
    // Check for basic programme requirements
    if (activities.length === 0) {
      validationResult.isValid = false;
      validationResult.issues.push('No activities found in programme');
    }
    
    const criticalActivities = activities.filter(a => a.isCritical);
    if (criticalActivities.length === 0) {
      validationResult.warnings.push('No critical path activities identified');
    }
    
    const activitiesWithoutDates = activities.filter(a => !a.startDate || !a.endDate);
    if (activitiesWithoutDates.length > 0) {
      validationResult.isValid = false;
      validationResult.issues.push(`${activitiesWithoutDates.length} activities missing start/end dates`);
    }
    
    // Check for automation readiness
    if (validationResult.isValid) {
      validationResult.recommendations.push('Programme ready for automated changes');
      validationResult.recommendations.push('Consider enabling real-time programme updates');
    }
    
    res.json({
      success: true,
      data: validationResult
    });
    
  } catch (error) {
    console.error('Programme validation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    });
  }
});

export default router;