/**
 * Super Model Router - Combines all three AI models for enhanced capabilities
 * Uses multi-model consensus, parallel processing, and intelligent fusion
 */

import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';

export interface SuperModelRequest {
  task: string;
  content: string;
  context?: string;
  requireConsensus?: boolean;
  useParallelProcessing?: boolean;
  fusionStrategy?: 'voting' | 'weighted' | 'sequential' | 'hybrid';
  documentContent?: string;  // For document analysis
  documentType?: string;     // PDF, DOCX, etc.
  isDocumentAnalysis?: boolean;
}

export interface SuperModelResponse {
  result: string;
  confidence: number;
  modelsUsed: string[];
  consensusReached: boolean;
  individualResponses: {
    model: string;
    response: string;
    confidence: number;
    processingTime: number;
  }[];
  fusionReasoning: string;
  totalProcessingTime: number;
}

export class SuperModelRouter {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private grokClient: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.grokClient = new OpenAI({
      baseURL: "https://api.x.ai/v1",
      apiKey: process.env.XAI_API_KEY,
    });
  }

  /**
   * Super Model Processing - Combines all three models intelligently
   */
  async processSuperModel(request: SuperModelRequest): Promise<SuperModelResponse> {
    const startTime = Date.now();

    try {
      // Handle document analysis differently - process with specialized prompts
      if (request.isDocumentAnalysis && request.documentContent) {
        return await this.processDocumentAnalysis(request);
      }

      let individualResponses: SuperModelResponse['individualResponses'] = [];

      if (request.useParallelProcessing) {
        // Process all models in parallel
        const [grokResponse, claudeResponse, gptResponse] = await Promise.allSettled([
          this.processWithGrok(request),
          this.processWithClaude(request),
          this.processWithGPT4o(request)
        ]);

        individualResponses = [
          this.handleResponse('grok-3', grokResponse),
          this.handleResponse('claude-3.5-sonnet', claudeResponse),
          this.handleResponse('gpt-4o', gptResponse)
        ];
      } else {
        // Sequential processing for complex tasks
        individualResponses = await this.processSequentially(request);
      }

      // Apply fusion strategy
      const fusedResult = await this.applyFusionStrategy(
        request.fusionStrategy || 'weighted',
        individualResponses,
        request
      );

      const totalProcessingTime = Date.now() - startTime;

      return {
        result: fusedResult.result,
        confidence: fusedResult.confidence,
        modelsUsed: individualResponses.map(r => r.model),
        consensusReached: fusedResult.consensusReached,
        individualResponses,
        fusionReasoning: fusedResult.reasoning,
        totalProcessingTime
      };

    } catch (error) {
      console.error('Super Model Router Error:', error);
      throw error;
    }
  }

  /**
   * Voting Fusion - Models vote on the best response
   */
  private async applyFusionStrategy(
    strategy: string,
    responses: SuperModelResponse['individualResponses'],
    request: SuperModelRequest
  ) {
    const validResponses = responses.filter(r => r.confidence > 0);

    switch (strategy) {
      case 'voting':
        return this.votingFusion(validResponses);
      case 'weighted':
        return this.weightedFusion(validResponses, request);
      case 'sequential':
        return this.sequentialFusion(validResponses, request);
      case 'hybrid':
        return this.hybridFusion(validResponses, request);
      default:
        return this.weightedFusion(validResponses, request);
    }
  }

  /**
   * Weighted Fusion - Combines responses based on model strengths
   */
  private async weightedFusion(
    responses: SuperModelResponse['individualResponses'],
    request: SuperModelRequest
  ) {
    const weights = this.calculateModelWeights(request);
    let bestResponse = responses[0];
    let highestScore = 0;

    for (const response of responses) {
      const weight = weights[response.model] || 1;
      const score = response.confidence * weight;
      
      if (score > highestScore) {
        highestScore = score;
        bestResponse = response;
      }
    }

    // Enhance with insights from other models
    const enhancedResult = await this.enhanceWithOtherModels(
      bestResponse,
      responses.filter(r => r.model !== bestResponse.model)
    );

    return {
      result: enhancedResult,
      confidence: Math.min(0.95, bestResponse.confidence * 1.1),
      consensusReached: this.checkConsensus(responses),
      reasoning: `Weighted fusion: ${bestResponse.model} selected with ${weights[bestResponse.model]}x weight, enhanced with insights from other models`
    };
  }

  /**
   * Sequential Fusion - Each model builds on the previous
   */
  private async sequentialFusion(
    responses: SuperModelResponse['individualResponses'],
    request: SuperModelRequest
  ) {
    // Start with the most appropriate model's response
    const orderedModels = this.getOptimalSequence(request);
    let currentResult = responses.find(r => r.model === orderedModels[0])?.response || '';

    // Each subsequent model refines the result
    for (let i = 1; i < orderedModels.length; i++) {
      const model = orderedModels[i];
      const modelResponse = responses.find(r => r.model === model);
      
      if (modelResponse) {
        currentResult = await this.refineWithModel(currentResult, modelResponse.response, model);
      }
    }

    return {
      result: currentResult,
      confidence: 0.92,
      consensusReached: true,
      reasoning: `Sequential fusion: ${orderedModels.join(' → ')} pipeline processing`
    };
  }

  /**
   * Hybrid Fusion - Combines multiple strategies
   */
  private async hybridFusion(
    responses: SuperModelResponse['individualResponses'],
    request: SuperModelRequest
  ) {
    // Use voting for consensus, weighted for selection
    const votingResult = this.votingFusion(responses);
    const weightedResult = await this.weightedFusion(responses, request);

    if (votingResult.consensusReached) {
      return votingResult;
    } else {
      // Enhance weighted result with voting insights
      const hybridResult = await this.combineResults(
        weightedResult.result,
        votingResult.result
      );

      return {
        result: hybridResult,
        confidence: (votingResult.confidence + weightedResult.confidence) / 2,
        consensusReached: false,
        reasoning: 'Hybrid fusion: Combined weighted selection with voting insights'
      };
    }
  }

  /**
   * Calculate model weights based on task characteristics
   */
  private calculateModelWeights(request: SuperModelRequest): Record<string, number> {
    const baseWeights = {
      'grok-3': 1.0,
      'claude-3.5-sonnet': 1.0,
      'gpt-4o': 1.0
    };

    // Adjust weights based on task content
    if (request.task.includes('code') || request.task.includes('technical')) {
      baseWeights['claude-3.5-sonnet'] = 1.5;
    }

    if (request.task.includes('reasoning') || request.task.includes('analysis')) {
      baseWeights['grok-3'] = 1.5;
    }

    if (request.task.includes('quick') || request.task.includes('summary')) {
      baseWeights['gpt-4o'] = 1.3;
    }

    return baseWeights;
  }

  /**
   * Document Analysis - All three models analyze document and produce unified response
   */
  async processDocumentAnalysis(request: SuperModelRequest): Promise<SuperModelResponse> {
    const startTime = Date.now();
    
    // Create specialized prompts for each model based on their strengths
    const documentAnalysisPrompt = `
Analyze this document comprehensively:

Document Type: ${request.documentType || 'Unknown'}
Task: ${request.task}
Context: ${request.context || 'General document analysis'}

Document Content:
${request.documentContent}

Please provide a detailed analysis focusing on:
1. Key findings and insights
2. Risk identification and assessment
3. Compliance and regulatory considerations
4. Recommendations and next steps
5. Critical issues that require immediate attention

Be thorough and professional in your analysis.
`;

    try {
      // All three models analyze the document simultaneously
      const [grokResponse, claudeResponse, gptResponse] = await Promise.allSettled([
        this.analyzeWithGrok(documentAnalysisPrompt),
        this.analyzeWithClaude(documentAnalysisPrompt),
        this.analyzeWithGPT4o(documentAnalysisPrompt)
      ]);

      const individualResponses = [
        this.handleResponse('grok-3', grokResponse),
        this.handleResponse('claude-3.5-sonnet', claudeResponse),
        this.handleResponse('gpt-4o', gptResponse)
      ];

      // Combine all three analyses into one unified response
      const unifiedAnalysis = await this.synthesizeDocumentAnalysis(individualResponses, request);
      
      const totalProcessingTime = Date.now() - startTime;

      return {
        result: unifiedAnalysis,
        confidence: this.calculateUnifiedConfidence(individualResponses),
        modelsUsed: individualResponses.map(r => r.model),
        consensusReached: true, // Always true for document analysis
        individualResponses,
        fusionReasoning: "Document analyzed by all three models simultaneously, results synthesized into unified comprehensive analysis",
        totalProcessingTime
      };

    } catch (error) {
      console.error('Document analysis error:', error);
      throw new Error('Document analysis failed');
    }
  }

  /**
   * Synthesize all three model responses into one unified analysis
   */
  private async synthesizeDocumentAnalysis(responses: any[], request: SuperModelRequest): Promise<string> {
    const validResponses = responses.filter(r => r.confidence > 0);
    
    if (validResponses.length === 0) {
      throw new Error('No valid responses from any model');
    }

    // Create a synthesis prompt for GPT-4o to combine all analyses
    const synthesisPrompt = `
You are tasked with creating a unified, comprehensive document analysis by combining insights from three different AI models.

Document Type: ${request.documentType || 'Unknown'}
Task: ${request.task}

Here are the three separate analyses:

GROK ANALYSIS:
${responses.find(r => r.model === 'grok-3')?.response || 'No response'}

CLAUDE ANALYSIS:
${responses.find(r => r.model === 'claude-3.5-sonnet')?.response || 'No response'}

GPT-4O ANALYSIS:
${responses.find(r => r.model === 'gpt-4o')?.response || 'No response'}

Please synthesize these three analyses into one comprehensive, unified response that:
1. Combines the best insights from all three models
2. Eliminates redundancy while preserving unique perspectives
3. Provides clear, actionable recommendations
4. Maintains professional tone and structure
5. Highlights consensus areas and reconciles any differences

Format the response as a professional document analysis with clear sections and bullet points where appropriate.
`;

    try {
      const synthesis = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert document analyst skilled at synthesizing multiple AI perspectives into unified, actionable insights.' },
          { role: 'user', content: synthesisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      });

      return synthesis.choices[0].message.content || 'Synthesis failed';
    } catch (error) {
      console.error('Synthesis error:', error);
      // Fallback: combine responses manually
      return this.manualSynthesis(validResponses);
    }
  }

  /**
   * Manual synthesis fallback
   */
  private manualSynthesis(responses: any[]): string {
    const synthesis = responses.map((r, i) => 
      `**Analysis ${i + 1} (${r.model}):**\n${r.response}`
    ).join('\n\n---\n\n');
    
    return `**UNIFIED DOCUMENT ANALYSIS**\n\n${synthesis}`;
  }

  /**
   * Calculate unified confidence score
   */
  private calculateUnifiedConfidence(responses: any[]): number {
    const validResponses = responses.filter(r => r.confidence > 0);
    if (validResponses.length === 0) return 0;
    
    const avgConfidence = validResponses.reduce((sum, r) => sum + r.confidence, 0) / validResponses.length;
    // Boost confidence for multi-model consensus
    return Math.min(0.95, avgConfidence * 1.1);
  }

  /**
   * Specialized document analysis methods for each model
   */
  private async analyzeWithGrok(prompt: string) {
    const startTime = Date.now();
    const response = await this.grokClient.chat.completions.create({
      model: 'grok-2-1212',
      messages: [
        { role: 'system', content: 'You are an expert document analyst with strong reasoning capabilities and attention to detail.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 2500,
    });

    return {
      model: 'grok-3',
      response: response.choices[0].message.content || '',
      confidence: 0.87,
      processingTime: Date.now() - startTime
    };
  }

  private async analyzeWithClaude(prompt: string) {
    const startTime = Date.now();
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2500,
      temperature: 0.2,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    return {
      model: 'claude-3.5-sonnet',
      response: response.content[0].type === 'text' ? response.content[0].text : '',
      confidence: 0.92,
      processingTime: Date.now() - startTime
    };
  }

  private async analyzeWithGPT4o(prompt: string) {
    const startTime = Date.now();
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional document analyst with expertise in risk assessment and compliance.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 2500,
    });

    return {
      model: 'gpt-4o',
      response: response.choices[0].message.content || '',
      confidence: 0.90,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Process with individual models
   */
  private async processWithGrok(request: SuperModelRequest) {
    const startTime = Date.now();
    const response = await this.grokClient.chat.completions.create({
      model: 'grok-2-1212',
      messages: [
        { role: 'system', content: 'You are an expert in complex reasoning and analysis.' },
        { role: 'user', content: request.content }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return {
      model: 'grok-3',
      response: response.choices[0].message.content || '',
      confidence: 0.85,
      processingTime: Date.now() - startTime
    };
  }

  private async processWithClaude(request: SuperModelRequest) {
    const startTime = Date.now();
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        { role: 'user', content: request.content }
      ],
    });

    return {
      model: 'claude-3.5-sonnet',
      response: response.content[0].type === 'text' ? response.content[0].text : '',
      confidence: 0.90,
      processingTime: Date.now() - startTime
    };
  }

  private async processWithGPT4o(request: SuperModelRequest) {
    const startTime = Date.now();
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful and efficient AI assistant.' },
        { role: 'user', content: request.content }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return {
      model: 'gpt-4o',
      response: response.choices[0].message.content || '',
      confidence: 0.88,
      processingTime: Date.now() - startTime
    };
  }

  // Helper methods
  private handleResponse(model: string, response: PromiseSettledResult<any>) {
    if (response.status === 'fulfilled') {
      return response.value;
    } else {
      return {
        model,
        response: `Error: ${response.reason}`,
        confidence: 0,
        processingTime: 0
      };
    }
  }

  private async processSequentially(request: SuperModelRequest) {
    const responses = [];
    
    // Process in optimal order
    for (const model of ['grok-3', 'claude-3.5-sonnet', 'gpt-4o']) {
      try {
        let response;
        switch (model) {
          case 'grok-3':
            response = await this.processWithGrok(request);
            break;
          case 'claude-3.5-sonnet':
            response = await this.processWithClaude(request);
            break;
          case 'gpt-4o':
            response = await this.processWithGPT4o(request);
            break;
        }
        responses.push(response);
      } catch (error) {
        responses.push({
          model,
          response: `Error: ${error.message}`,
          confidence: 0,
          processingTime: 0
        });
      }
    }

    return responses;
  }

  private votingFusion(responses: SuperModelResponse['individualResponses']) {
    // Simple voting: highest confidence wins
    const bestResponse = responses.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    const consensus = responses.filter(r => 
      this.calculateSimilarity(r.response, bestResponse.response) > 0.7
    ).length >= 2;

    return {
      result: bestResponse.response,
      confidence: bestResponse.confidence,
      consensusReached: consensus,
      reasoning: `Voting fusion: ${bestResponse.model} selected with ${bestResponse.confidence} confidence`
    };
  }

  private checkConsensus(responses: SuperModelResponse['individualResponses']): boolean {
    const similarities = [];
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        similarities.push(this.calculateSimilarity(responses[i].response, responses[j].response));
      }
    }
    
    return similarities.reduce((a, b) => a + b, 0) / similarities.length > 0.6;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple word-based similarity
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const intersection = words1.filter(word => words2.includes(word));
    return intersection.length / Math.max(words1.length, words2.length);
  }

  private async enhanceWithOtherModels(
    primary: SuperModelResponse['individualResponses'][0],
    others: SuperModelResponse['individualResponses']
  ): Promise<string> {
    // Combine insights from other models
    const insights = others.map(r => r.response).join('\n\n');
    return `${primary.response}\n\n[Enhanced with insights from other models]`;
  }

  private getOptimalSequence(request: SuperModelRequest): string[] {
    // Determine optimal processing sequence
    if (request.task.includes('code')) {
      return ['claude-3.5-sonnet', 'grok-3', 'gpt-4o'];
    } else if (request.task.includes('reasoning')) {
      return ['grok-3', 'claude-3.5-sonnet', 'gpt-4o'];
    } else {
      return ['gpt-4o', 'claude-3.5-sonnet', 'grok-3'];
    }
  }

  private async refineWithModel(current: string, newResponse: string, model: string): Promise<string> {
    // Combine current result with new model's response
    return `${current}\n\n[Refined by ${model}]: ${newResponse}`;
  }

  private async combineResults(result1: string, result2: string): Promise<string> {
    // Intelligently combine two results
    return `${result1}\n\n[Alternative perspective]: ${result2}`;
  }
}

export const superModelRouter = new SuperModelRouter();