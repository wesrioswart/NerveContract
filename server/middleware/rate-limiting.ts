import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Enhanced rate limiting configuration
const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'RateLimitExceeded',
      message,
      retryAfter: Math.ceil(windowMs / 1000),
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Custom key generator for better tracking
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id || 'anonymous';
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      return `${userId}-${ip}`;
    },
    // Enhanced skip function
    skip: (req: Request) => {
      // Skip rate limiting for health checks and static assets
      return req.path === '/health' || 
             req.path.startsWith('/static/') ||
             req.path.startsWith('/assets/');
    },
    // Custom handler for rate limit exceeded
    handler: (req: Request, res: Response) => {
      console.warn('Rate limit exceeded:', {
        ip: req.ip,
        userId: (req as any).user?.id,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      
      res.status(429).json({
        error: 'RateLimitExceeded',
        message,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }
  });
};

// Specific rate limiters for different endpoints
export const generalRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many requests from this user. Please try again in 15 minutes.'
);

export const compensationEventRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests per window
  'Too many compensation event requests. Please try again in 15 minutes.'
);

export const earlyWarningRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  15, // 15 requests per window
  'Too many early warning requests. Please try again in 15 minutes.'
);

export const fileUploadRateLimit = createRateLimiter(
  10 * 60 * 1000, // 10 minutes
  5, // 5 uploads per window
  'Too many file uploads. Please try again in 10 minutes.'
);

export const programmeAnalysisRateLimit = createRateLimiter(
  10 * 60 * 1000, // 10 minutes
  20, // 20 requests per window
  'Too many programme analysis requests. Please try again in 10 minutes.'
);

export const authRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 login attempts per window
  'Too many login attempts. Please try again in 15 minutes.'
);

export const aiRequestRateLimit = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  30, // 30 AI requests per window
  'Too many AI assistant requests. Please try again in 5 minutes.'
);