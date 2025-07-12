import { Router } from 'express';
import { aiRouter } from '../utils/multi-model-ai-router.js';
import { requireAuth } from '../middleware/auth-middleware.js';

const router = Router();

// Apply authentication to all AI router endpoints
router.use(requireAuth);

/**
 * Generic AI routing endpoint
 */
router.post('/route', async (req, res) => {
  try {
    const { task, content, context, priority, complexity, type } = req.body;
    
    if (!task || !content) {
      return res.status(400).json({
        success: false,
        error: 'Task and content are required'
      });
    }

    const response = await aiRouter.routeRequest({
      task,
      content,
      context,
      priority,
      complexity,
      type
    });

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('AI Router Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process AI request'
    });
  }
});

/**
 * Compensation event analysis endpoint
 */
router.post('/compensation-event/analyze', async (req, res) => {
  try {
    const eventData = req.body;
    const response = await aiRouter.analyzeCompensationEvent(eventData);
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Compensation Event Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze compensation event'
    });
  }
});

/**
 * Contract clause review endpoint
 */
router.post('/contract/review-clause', async (req, res) => {
  try {
    const { clauseText, context } = req.body;
    
    if (!clauseText) {
      return res.status(400).json({
        success: false,
        error: 'Clause text is required'
      });
    }

    const response = await aiRouter.reviewContractClause(clauseText, context || '');
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Contract Clause Review Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to review contract clause'
    });
  }
});

/**
 * Technical documentation generation endpoint
 */
router.post('/documentation/generate', async (req, res) => {
  try {
    const { codeOrSpec } = req.body;
    
    if (!codeOrSpec) {
      return res.status(400).json({
        success: false,
        error: 'Code or specification is required'
      });
    }

    const response = await aiRouter.generateTechnicalDocumentation(codeOrSpec);
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Documentation Generation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate documentation'
    });
  }
});

/**
 * Chat response endpoint
 */
router.post('/chat/respond', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const response = await aiRouter.provideChatResponse(message, context || '');
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Chat Response Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate chat response'
    });
  }
});

/**
 * Document analysis endpoint
 */
router.post('/document/analyze', async (req, res) => {
  try {
    const { documentContent, analysisType } = req.body;
    
    if (!documentContent || !analysisType) {
      return res.status(400).json({
        success: false,
        error: 'Document content and analysis type are required'
      });
    }

    const response = await aiRouter.analyzeDocument(documentContent, analysisType);
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Document Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze document'
    });
  }
});

/**
 * Get AI model recommendations for a task
 */
router.post('/recommend-model', async (req, res) => {
  try {
    const { task, type, complexity, priority } = req.body;
    
    // Create a temporary router instance to get recommendations
    const tempRouter = new (await import('../utils/multi-model-ai-router.js')).MultiModelAIRouter();
    const recommendation = (tempRouter as any).selectOptimalModel({
      task,
      type,
      complexity,
      priority
    });
    
    res.json({
      success: true,
      data: {
        recommendedModel: recommendation,
        reasoning: getModelRecommendationReasoning(recommendation, { task, type, complexity, priority })
      }
    });
  } catch (error) {
    console.error('Model Recommendation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get model recommendation'
    });
  }
});

function getModelRecommendationReasoning(model: string, request: any): string {
  switch (model) {
    case 'grok-3':
      return 'Grok 3 recommended for complex reasoning, mathematical calculations, and deep contract analysis';
    case 'claude-3.5-sonnet':
      return 'Claude 3.5 Sonnet recommended for technical tasks, code review, and documentation';
    case 'gpt-4o':
      return 'GPT-4o recommended for fast responses, general queries, and user interactions';
    default:
      return 'GPT-4o selected as default for reliable performance';
  }
}

export default router;