import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { AppError } from './error-middleware.js';

// Memory-efficient file storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(new AppError('Failed to create upload directory', 500, 'UPLOAD_DIR_ERROR'), '');
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random suffix
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).slice(0, 50); // Limit filename length
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

// File filter for security and memory management
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-project',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/xml',
    'application/xml',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  // Allowed extensions
  const allowedExtensions = ['.pdf', '.mpp', '.xlsx', '.xls', '.xml', '.txt', '.jpg', '.jpeg', '.png', '.gif'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new AppError(400, `File type not allowed: ${file.mimetype}`, 'INVALID_FILE_TYPE'), false);
  }
};

// Memory-efficient multer configuration with streaming
export const createMemoryEfficientUpload = (options: {
  maxFiles?: number;
  maxFileSize?: number;
  fieldName?: string;
} = {}) => {
  const {
    maxFiles = 5,
    maxFileSize = 50 * 1024 * 1024, // 50MB default
    fieldName = 'files'
  } = options;

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
      fields: 10,
      fieldNameSize: 100,
      fieldSize: 1024 * 1024 // 1MB for field values
    }
  });
};

// Streaming file processor for large files
export class StreamingFileProcessor {
  private static readonly CHUNK_SIZE = 64 * 1024; // 64KB chunks
  private static readonly MAX_CONCURRENT_STREAMS = 3;
  private static activeStreams = 0;

  static async processFileStream(
    filePath: string,
    processor: (chunk: Buffer) => Promise<void> | void
  ): Promise<void> {
    if (this.activeStreams >= this.MAX_CONCURRENT_STREAMS) {
      throw new AppError(429, 'Too many concurrent file operations', 'STREAM_LIMIT_EXCEEDED');
    }

    this.activeStreams++;
    
    try {
      const stream = createReadStream(filePath, { 
        highWaterMark: this.CHUNK_SIZE 
      });

      return new Promise((resolve, reject) => {
        stream.on('data', async (chunk: Buffer) => {
          try {
            await processor(chunk);
          } catch (error) {
            stream.destroy();
            reject(error);
          }
        });

        stream.on('end', () => resolve());
        stream.on('error', reject);
      });
    } finally {
      this.activeStreams--;
    }
  }

  static async copyFileStream(sourcePath: string, destPath: string): Promise<void> {
    if (this.activeStreams >= this.MAX_CONCURRENT_STREAMS) {
      throw new AppError(429, 'Too many concurrent file operations', 'STREAM_LIMIT_EXCEEDED');
    }

    this.activeStreams++;
    
    try {
      const readStream = createReadStream(sourcePath);
      const writeStream = createWriteStream(destPath);
      
      await pipeline(readStream, writeStream);
    } finally {
      this.activeStreams--;
    }
  }
}

// Memory monitoring middleware
export const memoryMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startMemory = process.memoryUsage();
  
  res.on('finish', () => {
    const endMemory = process.memoryUsage();
    const memoryDiff = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    };

    // Log significant memory increases
    if (memoryDiff.heapUsed > 10 * 1024 * 1024) { // 10MB threshold
      console.warn(`High memory usage detected: ${req.method} ${req.path}`, {
        memoryDiff,
        heapUsedMB: Math.round(endMemory.heapUsed / 1024 / 1024),
        rss: Math.round(endMemory.rss / 1024 / 1024)
      });
    }
  });

  next();
};

// Cleanup middleware for temporary files
export const fileCleanupMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  const cleanup = async () => {
    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      
      for (const file of files) {
        try {
          await fs.unlink(file.path);
        } catch (error) {
          console.warn(`Failed to cleanup file: ${file.path}`, error);
        }
      }
    }
  };

  // Override response methods to trigger cleanup
  res.send = function(body) {
    cleanup().catch(console.error);
    return originalSend.call(this, body);
  };

  res.json = function(body) {
    cleanup().catch(console.error);
    return originalJson.call(this, body);
  };

  // Cleanup on error
  res.on('error', () => {
    cleanup().catch(console.error);
  });

  next();
};

// Memory-efficient file upload configurations for different use cases
export const documentUpload = createMemoryEfficientUpload({
  maxFiles: 5,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  fieldName: 'documents'
});

export const programmeUpload = createMemoryEfficientUpload({
  maxFiles: 3,
  maxFileSize: 50 * 1024 * 1024, // 50MB for MS Project files
  fieldName: 'programmeFiles'
});

export const imageUpload = createMemoryEfficientUpload({
  maxFiles: 10,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  fieldName: 'images'
});

// Periodic memory cleanup function
export const scheduleMemoryCleanup = () => {
  setInterval(() => {
    if (global.gc) {
      global.gc();
      console.log('Manual garbage collection triggered');
    }
    
    const memUsage = process.memoryUsage();
    console.log('Memory usage:', {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    });
  }, 5 * 60 * 1000); // Every 5 minutes
};

// Error handling for memory-related issues
export const handleMemoryErrors = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error.message.includes('EMFILE') || error.message.includes('ENFILE')) {
    console.error('File descriptor limit reached:', error);
    return res.status(503).json({
      success: false,
      error: 'Server temporarily unavailable due to high load',
      code: 'RESOURCE_EXHAUSTED'
    });
  }

  if (error.message.includes('ENOSPC')) {
    console.error('Disk space exhausted:', error);
    return res.status(507).json({
      success: false,
      error: 'Insufficient storage space',
      code: 'STORAGE_FULL'
    });
  }

  next(error);
};