/**
 * Grok Code Review API Routes
 */

import { Router } from 'express';
import { GrokCodeReviewer } from '../utils/grok-code-reviewer';

const router = Router();

/**
 * POST /api/grok/review - Run comprehensive code review
 */
router.post('/review', async (req, res) => {
  try {
    console.log('🧠 Starting Grok code review...');
    
    const reviewer = new GrokCodeReviewer();
    
    // Scan the entire codebase
    await reviewer.scanCodebase(process.cwd());
    
    // Analyze with Grok
    const review = await reviewer.analyzeCodebase();
    
    // Generate report
    const report = reviewer.generateReport(review);
    
    res.json({
      success: true,
      review,
      report,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Grok review failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/grok/status - Check if Grok is available
 */
router.get('/status', async (req, res) => {
  try {
    const hasKey = !!process.env.XAI_API_KEY;
    res.json({
      available: hasKey,
      message: hasKey ? 'Grok is ready for code review' : 'XAI_API_KEY not configured'
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      error: error.message
    });
  }
});

export default router;