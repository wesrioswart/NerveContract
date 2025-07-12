import { Router } from 'express';
import { GrokTestSuite } from '../utils/grok-test-suite.js';
import { requireAuth } from '../middleware/auth-middleware.js';

const router = Router();

// Apply authentication to all test suite endpoints
router.use(requireAuth);

// Run all Grok tests
router.post('/run-all-tests', async (req, res) => {
  try {
    const testSuite = new GrokTestSuite();
    const results = await testSuite.runAllTests();
    
    res.json({
      success: true,
      data: results,
      message: 'Grok test suite completed successfully'
    });
  } catch (error) {
    console.error('Error running Grok test suite:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Run specific test category
router.post('/run-tests/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const testSuite = new GrokTestSuite();
    
    let results;
    switch (category) {
      case 'code':
        results = await testSuite.runCodeTests();
        break;
      case 'reasoning':
        results = await testSuite.runReasoningTests();
        break;
      case 'logic':
        results = await testSuite.runLogicTests();
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid test category. Use: code, reasoning, or logic'
        });
    }
    
    res.json({
      success: true,
      data: results,
      message: `${category} tests completed successfully`
    });
  } catch (error) {
    console.error(`Error running ${req.params.category} tests:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;