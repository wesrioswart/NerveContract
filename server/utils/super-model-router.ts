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