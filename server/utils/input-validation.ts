import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import rateLimit from 'express-rate-limit';

/**
 * Comprehensive Input Validation Security
 * Provides multi-layer validation beyond basic schema checking
 */

// Security validation rules
export interface ValidationConfig {
  maxStringLength?: number;
  maxArrayLength?: number;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  sanitizeHtml?: boolean;
  checkSqlInjection?: boolean;
  checkXssAttempts?: boolean;
}

const DEFAULT_CONFIG: ValidationConfig = {
  maxStringLength: 10000,
  maxArrayLength: 1000,
  allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'mpp', 'xml'],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  sanitizeHtml: true,
  checkSqlInjection: true,
  checkXssAttempts: true
};

/**
 * SQL Injection pattern detection
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
  /(--|\/\*|\*\/|;|\|\||&&)/,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
  /('|(\\x27)|(\\x2D\\x2D))/
];

/**
 * XSS pattern detection
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi
];

/**
 * Project access validation
 */
export async function validateProjectAccess(req: any, projectId: number): Promise<boolean> {
  if (!req.user) {
    return false;
  }

  // For now, allow access to all projects for authenticated users
  // In production, implement proper project-user relationship checking
  return true;
}

/**
 * Business logic validation
 */
export function validateBusinessRules(data: any, type: string): string[] {
  const errors: string[] = [];

  switch (type) {
    case 'compensation-event':
      if (data.estimatedValue && data.estimatedValue < 0) {
        errors.push('Estimated value cannot be negative');
      }
      if (data.responseDeadline && new Date(data.responseDeadline) < new Date()) {
        errors.push('Response deadline cannot be in the past');
      }
      break;

    case 'early-warning':
      if (data.meetingDate && new Date(data.meetingDate) < new Date()) {
        errors.push('Meeting date cannot be in the past');
      }
      break;

    case 'milestone':
      if (data.plannedDate && data.actualDate && new Date(data.actualDate) < new Date(data.plannedDate)) {
        errors.push('Actual date cannot be before planned date');
      }
      break;

    case 'payment-certificate':
      if (data.amount && data.amount <= 0) {
        errors.push('Payment amount must be positive');
      }
      if (data.dueDate && new Date(data.dueDate) < new Date()) {
        errors.push('Due date cannot be in the past');
      }
      break;
  }

  return errors;
}

/**
 * Content security validation
 */
export function validateContentSecurity(value: any, config: ValidationConfig = DEFAULT_CONFIG): string[] {
  const errors: string[] = [];

  if (typeof value === 'string') {
    // Length validation
    if (config.maxStringLength && value.length > config.maxStringLength) {
      errors.push(`String exceeds maximum length of ${config.maxStringLength} characters`);
    }

    // SQL injection detection
    if (config.checkSqlInjection) {
      for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(value)) {
          errors.push('Potential SQL injection attempt detected');
          break;
        }
      }
    }

    // XSS detection
    if (config.checkXssAttempts) {
      for (const pattern of XSS_PATTERNS) {
        if (pattern.test(value)) {
          errors.push('Potential XSS attempt detected');
          break;
        }
      }
    }
  }

  if (Array.isArray(value)) {
    // Array length validation
    if (config.maxArrayLength && value.length > config.maxArrayLength) {
      errors.push(`Array exceeds maximum length of ${config.maxArrayLength} items`);
    }

    // Validate each array item
    for (const item of value) {
      const itemErrors = validateContentSecurity(item, config);
      errors.push(...itemErrors);
    }
  }

  if (typeof value === 'object' && value !== null) {
    // Recursively validate object properties
    for (const [key, val] of Object.entries(value)) {
      const keyErrors = validateContentSecurity(key, config);
      const valErrors = validateContentSecurity(val, config);
      errors.push(...keyErrors, ...valErrors);
    }
  }

  return errors;
}

/**
 * File upload validation
 */
export function validateFileUpload(file: any, config: ValidationConfig = DEFAULT_CONFIG): string[] {
  const errors: string[] = [];

  if (!file) {
    return errors;
  }

  // File size validation
  if (config.maxFileSize && file.size > config.maxFileSize) {
    errors.push(`File size exceeds maximum of ${config.maxFileSize / 1024 / 1024}MB`);
  }

  // File type validation
  if (config.allowedFileTypes) {
    const fileExtension = file.originalname?.split('.').pop()?.toLowerCase();
    if (fileExtension && !config.allowedFileTypes.includes(fileExtension)) {
      errors.push(`File type '${fileExtension}' is not allowed`);
    }
  }

  // Filename validation
  if (file.originalname) {
    const filenameErrors = validateContentSecurity(file.originalname, {
      ...config,
      maxStringLength: 255
    });
    errors.push(...filenameErrors);
  }

  return errors;
}

/**
 * Comprehensive validation middleware
 */
export function createValidationMiddleware<T>(
  schema: ZodSchema<T>,
  validationType: string,
  config: ValidationConfig = DEFAULT_CONFIG
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Schema validation (Zod)
      const validatedData = schema.parse(req.body);

      // 2. Content security validation
      const securityErrors = validateContentSecurity(validatedData, config);
      if (securityErrors.length > 0) {
        return res.status(400).json({
          error: 'Security validation failed',
          details: securityErrors
        });
      }

      // 3. Business rules validation
      const businessErrors = validateBusinessRules(validatedData, validationType);
      if (businessErrors.length > 0) {
        return res.status(400).json({
          error: 'Business validation failed',
          details: businessErrors
        });
      }

      // 4. Project access validation (if projectId is present)
      if ('projectId' in validatedData) {
        const hasAccess = await validateProjectAccess(req, (validatedData as any).projectId);
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Access denied',
            details: ['Insufficient permissions for this project']
          });
        }
      }

      // 5. File validation (if files are present)
      if (req.files) {
        const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        for (const file of files) {
          const fileErrors = validateFileUpload(file, config);
          if (fileErrors.length > 0) {
            return res.status(400).json({
              error: 'File validation failed',
              details: fileErrors
            });
          }
        }
      }

      // All validations passed
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Schema validation failed',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }

      return res.status(500).json({
        error: 'Validation error',
        details: ['Internal validation error']
      });
    }
  };
}

/**
 * Rate limiting for sensitive operations
 */
export const createRateLimit = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      details: ['Rate limit exceeded. Please try again later.']
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * Sanitization utilities
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Extended Request interface
declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
    }
  }
}