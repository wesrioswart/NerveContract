import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';

export interface AIRequest {
  task: string;
  content: string;
  context?: string;
  priority?: 'speed' | 'quality' | 'reasoning';
  complexity?: 'simple' | 'medium' | 'complex';
  type?: 'code' | 'analysis' | 'chat' | 'document' | 'calculation';
}

export interface AIResponse {
  result: string;
  model: string;
  confidence: number;
  reasoning?: string;
  processingTime: number;
}

export class MultiModelAIRouter {
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
   * Intelligently routes AI requests to the optimal model
   */
  async routeRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const model = this.selectOptimalModel(request);
    
    try {
      let result: string;
      let reasoning: string | undefined;

      switch (model) {
        case 'grok-3':
          result = await this.processWithGrok(request);
          reasoning = 'Used Grok 3 for complex reasoning and analysis';
          break;
        case 'claude-3.5-sonnet':
          result = await this.processWithClaude(request);
          reasoning = 'Used Claude 3.5 Sonnet for technical tasks and coding';
          break;
        case 'gpt-4o':
        default:
          result = await this.processWithGPT4o(request);
          reasoning = 'Used GPT-4o for fast, reliable responses';
          break;
      }

      const processingTime = Date.now() - startTime;

      return {
        result,
        model,
        confidence: this.calculateConfidence(request, model),
        reasoning,
        processingTime
      };
    } catch (error) {
      console.error(`AI Router Error with ${model}:`, error);
      // Fallback to GPT-4o if primary model fails
      if (model !== 'gpt-4o') {
        return this.routeRequest({ ...request, priority: 'speed' });
      }
      throw error;
    }
  }

  /**
   * Select the optimal AI model based on request characteristics
   */
  private selectOptimalModel(request: AIRequest): string {
    const { task, type, complexity, priority } = request;

    // Grok 3 - Complex reasoning and analysis
    if (
      complexity === 'complex' ||
      type === 'calculation' ||
      task.includes('compensation event') ||
      task.includes('contract analysis') ||
      task.includes('legal precedent') ||
      task.includes('programme analysis') ||
      priority === 'reasoning'
    ) {
      return 'grok-3';
    }

    // Claude 3.5 Sonnet - Technical tasks and coding
    if (
      type === 'code' ||
      task.includes('debug') ||
      task.includes('review') ||
      task.includes('technical') ||
      task.includes('architecture') ||
      task.includes('implementation') ||
      priority === 'quality'
    ) {
      return 'claude-3.5-sonnet';
    }

    // GPT-4o - Speed and general tasks
    return 'gpt-4o';
  }

  /**
   * Process request with Grok 3 for complex reasoning
   */
  private async processWithGrok(request: AIRequest): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(request, 'grok');
    
    const response = await this.grokClient.chat.completions.create({
      model: 'grok-2-1212', // Using available model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.content }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Process request with Claude 3.5 Sonnet for technical tasks
   */
  private async processWithClaude(request: AIRequest): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(request, 'claude');
    
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        { role: 'user', content: `${systemPrompt}\n\n${request.content}` }
      ]
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  /**
   * Process request with GPT-4o for speed and reliability
   */
  private async processWithGPT4o(request: AIRequest): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(request, 'gpt4o');
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.content }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Build system prompt tailored to each model's strengths
   */
  private buildSystemPrompt(request: AIRequest, model: string): string {
    const basePrompt = `You are an expert NEC4 contract management AI assistant. 
    Context: ${request.context || 'General contract management'}
    Task: ${request.task}`;

    switch (model) {
      case 'grok':
        return `${basePrompt}
        
        Use your advanced reasoning capabilities to provide deep analysis. 
        Consider multiple angles, potential risks, and long-term implications.
        Show your reasoning process for complex decisions.
        Focus on mathematical accuracy and logical consistency.`;

      case 'claude':
        return `${basePrompt}
        
        Provide technically precise and well-structured responses.
        Focus on implementation details and best practices.
        Include code examples where relevant.
        Ensure responses are maintainable and scalable.`;

      case 'gpt4o':
        return `${basePrompt}
        
        Provide clear, concise, and actionable responses.
        Focus on practical solutions and user-friendly explanations.
        Prioritize speed and clarity over complex analysis.`;

      default:
        return basePrompt;
    }
  }

  /**
   * Calculate confidence score based on model selection
   */
  private calculateConfidence(request: AIRequest, selectedModel: string): number {
    const optimalModel = this.selectOptimalModel(request);
    
    if (selectedModel === optimalModel) {
      return 0.95; // High confidence when using optimal model
    }
    
    return 0.75; // Lower confidence for fallback scenarios
  }

  /**
   * Specialized methods for common NEC4 tasks
   */
  
  async analyzeCompensationEvent(eventData: any): Promise<AIResponse> {
    return this.routeRequest({
      task: 'compensation event analysis',
      content: JSON.stringify(eventData),
      type: 'calculation',
      complexity: 'complex',
      priority: 'reasoning',
      context: 'NEC4 compensation event assessment'
    });
  }

  async reviewContractClause(clauseText: string, context: string): Promise<AIResponse> {
    return this.routeRequest({
      task: 'contract clause review',
      content: clauseText,
      type: 'analysis',
      complexity: 'complex',
      priority: 'reasoning',
      context
    });
  }

  async generateTechnicalDocumentation(codeOrSpec: string): Promise<AIResponse> {
    return this.routeRequest({
      task: 'technical documentation generation',
      content: codeOrSpec,
      type: 'code',
      complexity: 'medium',
      priority: 'quality',
      context: 'Technical documentation'
    });
  }

  async provideChatResponse(userMessage: string, context: string): Promise<AIResponse> {
    return this.routeRequest({
      task: 'chat response',
      content: userMessage,
      type: 'chat',
      complexity: 'simple',
      priority: 'speed',
      context
    });
  }

  async analyzeDocument(documentContent: string, analysisType: string): Promise<AIResponse> {
    return this.routeRequest({
      task: `document analysis: ${analysisType}`,
      content: documentContent,
      type: 'document',
      complexity: 'complex',
      priority: 'reasoning',
      context: 'Contract document analysis'
    });
  }
}

export const aiRouter = new MultiModelAIRouter();