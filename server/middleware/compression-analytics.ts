import { Request, Response, NextFunction } from 'express';

interface CompressionMetrics {
  endpoint: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  duration: number;
  timestamp: Date;
}

class CompressionAnalytics {
  private metrics: CompressionMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  recordMetric(metric: CompressionMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the last maxMetrics entries to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(): CompressionMetrics[] {
    return [...this.metrics];
  }

  getCompressionStats() {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageCompressionRatio: 0,
        totalBytesSaved: 0,
        averageResponseTime: 0
      };
    }

    const totalRequests = this.metrics.length;
    const averageCompressionRatio = this.metrics.reduce((sum, m) => sum + m.compressionRatio, 0) / totalRequests;
    const totalBytesSaved = this.metrics.reduce((sum, m) => sum + (m.originalSize - m.compressedSize), 0);
    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;

    return {
      totalRequests,
      averageCompressionRatio: Math.round(averageCompressionRatio * 100) / 100,
      totalBytesSaved,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100
    };
  }

  getTopEndpointsByCompression() {
    const endpointStats = new Map<string, { count: number; totalSaved: number; avgRatio: number }>();
    
    this.metrics.forEach(metric => {
      const existing = endpointStats.get(metric.endpoint) || { count: 0, totalSaved: 0, avgRatio: 0 };
      existing.count++;
      existing.totalSaved += (metric.originalSize - metric.compressedSize);
      existing.avgRatio = ((existing.avgRatio * (existing.count - 1)) + metric.compressionRatio) / existing.count;
      endpointStats.set(metric.endpoint, existing);
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({ endpoint, ...stats }))
      .sort((a, b) => b.totalSaved - a.totalSaved)
      .slice(0, 10);
  }
}

export const compressionAnalytics = new CompressionAnalytics();

export function compressionMonitoring(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  let originalSize = 0;

  // Capture the original response size
  const originalWrite = res.write;
  const originalEnd = res.end;
  
  res.write = function(chunk: any, ...args: any[]): boolean {
    if (chunk) {
      originalSize += Buffer.byteLength(chunk);
    }
    return originalWrite.apply(res, [chunk, ...args]);
  };

  res.end = function(chunk?: any, ...args: any[]): Response {
    if (chunk) {
      originalSize += Buffer.byteLength(chunk);
    }

    // Record compression metrics for API endpoints
    if (req.path.startsWith('/api') && originalSize > 0) {
      const duration = Date.now() - startTime;
      const contentEncoding = res.get('Content-Encoding');
      
      if (contentEncoding === 'gzip' || contentEncoding === 'deflate') {
        // For compressed responses, estimate compression ratio
        // Note: Actual compressed size is harder to measure without intercepting the compression stream
        // We'll use a reasonable estimate based on typical JSON compression ratios
        const estimatedCompressedSize = Math.round(originalSize * 0.3); // ~70% compression typical for JSON
        const compressionRatio = originalSize / estimatedCompressedSize;

        compressionAnalytics.recordMetric({
          endpoint: req.path,
          originalSize,
          compressedSize: estimatedCompressedSize,
          compressionRatio,
          duration,
          timestamp: new Date()
        });
      }
    }

    return originalEnd.apply(res, [chunk, ...args]);
  };

  next();
}

// Middleware to add compression headers for better analytics
export function compressionHeaders(req: Request, res: Response, next: NextFunction): void {
  // Add headers to help with compression analysis
  res.set('X-Response-Time', Date.now().toString());
  
  // Encourage compression for API responses
  if (req.path.startsWith('/api')) {
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache for API responses
    res.set('Vary', 'Accept-Encoding'); // Indicate that response varies based on encoding
  }

  next();
}