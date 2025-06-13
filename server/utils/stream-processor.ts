import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { AppError } from '../middleware/error-middleware.js';

/**
 * Enhanced streaming utilities for memory-efficient file processing
 * Implements the optimized approach for handling large MSP, XML, and other programme files
 */
export class StreamProcessor {
  private static readonly CHUNK_SIZE = 16 * 1024; // 16KB chunks for optimal memory usage
  private static readonly MAX_CONCURRENT_STREAMS = 3;
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB safety limit
  private static activeStreams = 0;

  /**
   * Process large files with memory-efficient streaming
   * Ideal for MSP files up to 50MB with 16KB chunk processing
   */
  static async processLargeFile(filePath: string): Promise<Buffer> {
    if (this.activeStreams >= this.MAX_CONCURRENT_STREAMS) {
      throw new AppError('Too many concurrent file operations', 429, 'STREAM_LIMIT_EXCEEDED');
    }

    this.activeStreams++;
    
    try {
      const readStream = createReadStream(filePath, { 
        highWaterMark: this.CHUNK_SIZE 
      });

      return new Promise((resolve, reject) => {
        let chunks: Buffer[] = [];
        let totalSize = 0;

        readStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
          totalSize += chunk.length;

          // Memory safety check - prevent accumulating too much data
          if (totalSize > this.MAX_FILE_SIZE) {
            readStream.destroy();
            reject(new AppError('File too large for memory processing', 413, 'FILE_TOO_LARGE'));
          }
        });

        readStream.on('end', () => {
          const result = Buffer.concat(chunks);
          resolve(result);
        });

        readStream.on('error', (error) => {
          reject(new AppError(`File processing error: ${error.message}`, 500, 'FILE_PROCESSING_ERROR'));
        });
      });
    } finally {
      this.activeStreams--;
    }
  }

  /**
   * Stream processor with custom chunk handler
   * For specialized processing like XML parsing or data transformation
   */
  static async processWithChunkHandler(
    filePath: string,
    chunkHandler: (chunk: Buffer) => Promise<void> | void
  ): Promise<void> {
    if (this.activeStreams >= this.MAX_CONCURRENT_STREAMS) {
      throw new AppError('Too many concurrent file operations', 429, 'STREAM_LIMIT_EXCEEDED');
    }

    this.activeStreams++;
    
    try {
      const readStream = createReadStream(filePath, { 
        highWaterMark: this.CHUNK_SIZE 
      });

      return new Promise((resolve, reject) => {
        readStream.on('data', async (chunk: Buffer) => {
          try {
            await chunkHandler(chunk);
          } catch (error) {
            readStream.destroy();
            reject(error);
          }
        });

        readStream.on('end', () => resolve());
        readStream.on('error', (error) => {
          reject(new AppError(`Stream processing error: ${(error as Error).message}`, 500, 'STREAM_ERROR'));
        });
      });
    } finally {
      this.activeStreams--;
    }
  }

  /**
   * Get current streaming statistics for monitoring
   */
  static getStreamingStats() {
    return {
      activeStreams: this.activeStreams,
      maxConcurrentStreams: this.MAX_CONCURRENT_STREAMS,
      chunkSize: this.CHUNK_SIZE,
      maxFileSize: this.MAX_FILE_SIZE
    };
  }

  /**
   * Pipeline-based file copying for efficient file operations
   */
  static async copyFileStream(sourcePath: string, destPath: string): Promise<void> {
    if (this.activeStreams >= this.MAX_CONCURRENT_STREAMS) {
      throw new AppError('Too many concurrent file operations', 429, 'STREAM_LIMIT_EXCEEDED');
    }

    this.activeStreams++;
    
    try {
      const readStream = createReadStream(sourcePath, { 
        highWaterMark: this.CHUNK_SIZE 
      });
      const writeStream = createWriteStream(destPath);
      
      await pipeline(readStream, writeStream);
    } catch (error) {
      throw new AppError(`File copy error: ${(error as Error).message}`, 500, 'FILE_COPY_ERROR');
    } finally {
      this.activeStreams--;
    }
  }
}

// Export for easy integration with existing endpoints
export const { processLargeFile, processWithChunkHandler, getStreamingStats, copyFileStream } = StreamProcessor;