import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';

/**
 * Centralized API Security Management
 * Prevents API key exposure and ensures proper validation
 */

// Create singleton instances for efficient client management
let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

// API Key validation and initialization
export interface APIClientConfig {
  isConfigured: boolean;
  client?: OpenAI | Anthropic;
  error?: string;
}

/**
 * Secure OpenAI client initialization with singleton pattern
 */
export function getOpenAIClient(): APIClientConfig {
  try {
    if (!openaiClient) {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey || apiKey.trim() === '') {
        return {
          isConfigured: false,
          error: 'OPENAI_API_KEY not configured or empty'
        };
      }

      // Validate API key format (should start with 'sk-')
      if (!apiKey.startsWith('sk-')) {
        return {
          isConfigured: false,
          error: 'Invalid OpenAI API key format'
        };
      }

      openaiClient = new OpenAI({ 
        apiKey: apiKey,
        timeout: 30000, // 30 second timeout
      });
    }

    return {
      isConfigured: true,
      client: openaiClient
    };
  } catch (error) {
    return {
      isConfigured: false,
      error: `Failed to initialize OpenAI client: ${error}`
    };
  }
}



/**
 * Secure Anthropic client initialization with singleton pattern
 */
export function getAnthropicClient(): APIClientConfig {
  try {
    if (!anthropicClient) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey || apiKey.trim() === '') {
        return {
          isConfigured: false,
          error: 'ANTHROPIC_API_KEY not configured or empty'
        };
      }

      // Validate API key format (Anthropic keys start with 'sk-ant-')
      if (!apiKey.startsWith('sk-ant-')) {
        return {
          isConfigured: false,
          error: 'Invalid Anthropic API key format'
        };
      }

      anthropicClient = new Anthropic({
        apiKey: apiKey,
        timeout: 30000, // 30 second timeout
      });
    }

    return {
      isConfigured: true,
      client: anthropicClient
    };
  } catch (error) {
    return {
      isConfigured: false,
      error: `Failed to initialize Anthropic client: ${error}`
    };
  }
}

/**
 * Validate all API configurations on startup
 */
export function validateAPIConfiguration(): {
  openai: boolean;
  anthropic: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  const openaiConfig = getOpenAIClient();
  const anthropicConfig = getAnthropicClient();
  
  if (!openaiConfig.isConfigured) {
    errors.push(`OpenAI: ${openaiConfig.error}`);
  }
  
  if (!anthropicConfig.isConfigured) {
    errors.push(`Anthropic: ${anthropicConfig.error}`);
  }

  return {
    openai: openaiConfig.isConfigured,
    anthropic: anthropicConfig.isConfigured,
    errors: errors
  };
}

/**
 * Security middleware for API key validation
 */
export function requireOpenAI(req: any, res: any, next: any) {
  const config = getOpenAIClient();
  
  if (!config.isConfigured) {
    return res.status(503).json({
      error: 'OpenAI service unavailable',
      message: config.error,
      code: 'OPENAI_NOT_CONFIGURED'
    });
  }
  
  req.openai = config.client;
  next();
}

/**
 * Security middleware for Anthropic API validation
 */
export function requireAnthropic(req: any, res: any, next: any) {
  const config = getAnthropicClient();
  
  if (!config.isConfigured) {
    return res.status(503).json({
      error: 'Anthropic service unavailable',
      message: config.error,
      code: 'ANTHROPIC_NOT_CONFIGURED'
    });
  }
  
  req.anthropic = config.client;
  next();
}

/**
 * Helper functions for secure client access
 */
export function getSecureOpenAIClient(): OpenAI {
  const config = getOpenAIClient();
  if (!config.isConfigured || !config.client) {
    throw new Error(config.error || 'OpenAI client not properly configured');
  }
  return config.client as OpenAI;
}

export function getSecureAnthropicClient(): Anthropic {
  const config = getAnthropicClient();
  if (!config.isConfigured || !config.client) {
    throw new Error(config.error || 'Anthropic client not properly configured');
  }
  return config.client as Anthropic;
}

/**
 * Rate limiting helper for API calls
 */
export class APIRateLimiter {
  private static requests = new Map<string, number[]>();
  private static readonly WINDOW_MS = 60000; // 1 minute
  private static readonly MAX_REQUESTS = 60; // 60 requests per minute

  static checkLimit(clientId: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(clientId) || [];
    
    // Remove requests older than the window
    const validRequests = requests.filter(time => now - time < this.WINDOW_MS);
    
    if (validRequests.length >= this.MAX_REQUESTS) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(clientId, validRequests);
    
    return true;
  }

  static getRemainingRequests(clientId: string): number {
    const now = Date.now();
    const requests = this.requests.get(clientId) || [];
    const validRequests = requests.filter(time => now - time < this.WINDOW_MS);
    
    return Math.max(0, this.MAX_REQUESTS - validRequests.length);
  }
}