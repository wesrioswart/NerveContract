import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Enhanced error response structure
interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  timestamp: string;
  path: string;
  details?: any;
}

// Enhanced error classes with better context
export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public isOperational: boolean;
  public context?: any;

  constructor(message: string, statusCode: number, code?: string, context?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.context = context;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    super(`${resource} not found${id ? ` (ID: ${id})` : ''}`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', operation?: string) {
    super(message, 500, 'DATABASE_ERROR', { operation });
    this.name = 'DatabaseError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', limit?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { limit });
    this.name = 'RateLimitError';
  }
}

// Comprehensive error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // Convert Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code
    }));
    error = new ValidationError('Invalid input data', formattedErrors);
  }

  // Handle operational errors
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.name,
      message: DOMPurify.sanitize(error.message),
      code: error.code,
      timestamp: new Date().toISOString(),
      path: req.path
    };

    // Include details for validation errors in development
    if (error instanceof ValidationError && process.env.NODE_ENV === 'development') {
      response.details = error.context;
    }

    // Log operational errors for monitoring
    console.warn(`Operational Error [${error.code}]:`, {
      message: error.message,
      path: req.path,
      method: req.method,
      userId: (req as any).user?.id,
      timestamp: response.timestamp
    });

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle database connection errors
  if (err.message?.includes('connect') || err.message?.includes('timeout') || 
      err.message?.includes('ECONNREFUSED') || err.message?.includes('pool')) {
    const response: ErrorResponse = {
      error: 'DatabaseConnectionError',
      message: 'Database service temporarily unavailable',
      code: 'DATABASE_CONNECTION_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path
    };
    
    console.error('Database connection error:', {
      originalError: err.message,
      path: req.path,
      method: req.method,
      timestamp: response.timestamp
    });
    
    res.status(503).json(response);
    return;
  }

  // Handle CORS errors
  if (err.message?.includes('CORS') || err.message?.includes('origin')) {
    const response: ErrorResponse = {
      error: 'CORSError',
      message: 'Cross-origin request blocked',
      code: 'CORS_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path
    };
    res.status(403).json(response);
    return;
  }

  // Log unexpected errors with full context
  console.error('Unexpected Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    headers: req.headers,
    body: req.body,
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString()
  });

  // Generic response for unexpected errors
  const response: ErrorResponse = {
    error: 'InternalServerError',
    message: 'An unexpected error occurred. Our team has been notified.',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path
  };

  res.status(500).json(response);
};

// Async error wrapper with enhanced error context
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    Promise.resolve(fn(req, res, next))
      .catch((error) => {
        // Add request context to error
        error.requestContext = {
          method: req.method,
          path: req.path,
          duration: Date.now() - startTime,
          userId: (req as any).user?.id
        };
        next(error);
      });
  };
};

// Database operation wrapper with enhanced error handling
export const withDatabaseErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string,
  retries: number = 1
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Log attempt
      console.warn(`Database operation attempt ${attempt + 1}/${retries + 1} failed:`, {
        context,
        error: error.message,
        attempt: attempt + 1
      });
      
      // Don't retry on certain errors
      if (error.message?.includes('duplicate key') || 
          error.message?.includes('unique constraint') ||
          error.message?.includes('foreign key') ||
          error.message?.includes('violates')) {
        break;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
  }
  
  // Handle specific database errors
  if (lastError.message?.includes('duplicate key') || lastError.message?.includes('unique constraint')) {
    throw new ValidationError('Record already exists');
  }
  
  if (lastError.message?.includes('foreign key') || lastError.message?.includes('violates')) {
    throw new ValidationError('Referenced record not found');
  }
  
  if (lastError.message?.includes('connect') || lastError.message?.includes('timeout')) {
    throw new DatabaseError('Database connection failed', context);
  }
  
  throw new DatabaseError(`Database operation failed: ${context}`, context);
};

// Enhanced input sanitization with comprehensive cleaning
export const sanitizeInput = <T extends Record<string, any>>(input: T): T => {
  const sanitized = { ...input };
  
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return DOMPurify.sanitize(value.trim());
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (value && typeof value === 'object') {
      const sanitizedObj: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitizedObj[key] = sanitizeValue(val);
      }
      return sanitizedObj;
    }
    return value;
  };
  
  for (const key in sanitized) {
    sanitized[key] = sanitizeValue(sanitized[key]);
  }
  
  return sanitized;
};

// Enhanced validation helper
export const validateRequired = (data: any, fields: string[]): void => {
  const missing = fields.filter(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], data);
    return value === undefined || value === null || value === '';
  });
  
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
};

// Project access validation helper
export const validateProjectAccess = async (
  userId: number, 
  projectId: number, 
  storage: any,
  requiredRole?: string
): Promise<void> => {
  const hasAccess = await storage.hasProjectAccess?.(userId, projectId);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this project');
  }
  
  if (requiredRole) {
    const userProject = await storage.getUserProjectAssignment?.(userId, projectId);
    if (!userProject || userProject.role !== requiredRole) {
      throw new ForbiddenError(`${requiredRole} role required for this operation`);
    }
  }
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`${req.method} ${req.path}`, {
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent')
  });
  
  // Log response when finished
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`${req.method} ${req.path} ${res.statusCode}`, {
      duration: `${Date.now() - startTime}ms`,
      userId: (req as any).user?.id,
      statusCode: res.statusCode
    });
    return originalSend.call(this, data);
  };
  
  next();
};