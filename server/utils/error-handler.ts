import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Generic error response structure
interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: any;
}

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Not authenticated') {
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
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // Convert known error types
  if (err instanceof ZodError) {
    error = new ValidationError('Invalid input data', err.errors);
  }

  // Handle operational errors
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.name,
      message: error.message,
      code: error.code
    };

    // Include details for validation errors in development
    if (error instanceof ValidationError && process.env.NODE_ENV === 'development') {
      response.details = (error as any).details;
    }

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle database connection errors
  if (err.message?.includes('connect') || err.message?.includes('timeout')) {
    const response: ErrorResponse = {
      error: 'DatabaseError',
      message: 'Database connection failed',
      code: 'DATABASE_CONNECTION_ERROR'
    };
    res.status(503).json(response);
    return;
  }

  // Log unexpected errors
  console.error('Unexpected error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Generic error response for unexpected errors
  const response: ErrorResponse = {
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR'
  };

  res.status(500).json(response);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database operation wrapper with error handling
export const withDatabaseErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    console.error(`Database error in ${context}:`, error);
    
    if (error.message?.includes('connect') || error.message?.includes('timeout')) {
      throw new DatabaseError('Database connection failed');
    }
    
    if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
      throw new ValidationError('Duplicate entry detected');
    }
    
    if (error.message?.includes('foreign key') || error.message?.includes('violates')) {
      throw new ValidationError('Related record not found');
    }
    
    throw new DatabaseError(`Database operation failed: ${context}`);
  }
};

// Input sanitization helper
export const sanitizeInput = <T extends Record<string, any>>(input: T): T => {
  const sanitized = { ...input };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      // Remove potentially dangerous characters
      sanitized[key] = sanitized[key]
        .replace(/[<>]/g, '') // Remove angle brackets
        .trim(); // Remove leading/trailing whitespace
    }
  }
  
  return sanitized;
};

// Validation helper
export const validateRequired = (data: any, fields: string[]): void => {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
};

// Rate limiting error
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}