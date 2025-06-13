import { Request, Response, NextFunction } from 'express';

interface RequestMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  userId?: number;
  userAgent: string;
  timestamp: Date;
}

interface PerformanceAlert {
  type: 'slow_request' | 'error' | 'fast_cache_hit';
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  details?: string;
}

class RequestAnalytics {
  private metrics: RequestMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private readonly maxMetrics = 2000; // Keep last 2000 requests
  private readonly maxAlerts = 500; // Keep last 500 alerts

  recordMetric(metric: RequestMetric): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Generate alerts based on performance thresholds
    this.checkForAlerts(metric);
  }

  private checkForAlerts(metric: RequestMetric): void {
    // Slow request alert
    if (metric.duration > 1000) {
      this.addAlert({
        type: 'slow_request',
        endpoint: metric.endpoint,
        method: metric.method,
        statusCode: metric.statusCode,
        duration: metric.duration,
        timestamp: metric.timestamp,
        severity: metric.duration > 5000 ? 'high' : metric.duration > 2000 ? 'medium' : 'low',
        details: `Request took ${metric.duration}ms, exceeding 1000ms threshold`
      });
    }

    // Error response alert
    if (metric.statusCode >= 400) {
      this.addAlert({
        type: 'error',
        endpoint: metric.endpoint,
        method: metric.method,
        statusCode: metric.statusCode,
        duration: metric.duration,
        timestamp: metric.timestamp,
        severity: metric.statusCode >= 500 ? 'high' : 'medium',
        details: `HTTP ${metric.statusCode} error response`
      });
    }

    // Potential cache hit (very fast API response)
    if (metric.duration < 5 && metric.endpoint.startsWith('/api/') && metric.method === 'GET') {
      this.addAlert({
        type: 'fast_cache_hit',
        endpoint: metric.endpoint,
        method: metric.method,
        statusCode: metric.statusCode,
        duration: metric.duration,
        timestamp: metric.timestamp,
        severity: 'low',
        details: `Very fast response (${metric.duration}ms) suggests caching`
      });
    }
  }

  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }
  }

  getMetrics(): RequestMetric[] {
    return [...this.metrics];
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  getPerformanceStats() {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowRequestCount: 0,
        topSlowEndpoints: [],
        statusCodeDistribution: {}
      };
    }

    const totalRequests = this.metrics.length;
    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
    
    const errorRequests = this.metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorRequests / totalRequests) * 100;
    
    const slowRequests = this.metrics.filter(m => m.duration > 1000).length;
    
    // Group by endpoint and calculate average response times
    const endpointStats = new Map<string, { count: number; totalTime: number; avgTime: number }>();
    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointStats.get(key) || { count: 0, totalTime: 0, avgTime: 0 };
      existing.count++;
      existing.totalTime += metric.duration;
      existing.avgTime = existing.totalTime / existing.count;
      endpointStats.set(key, existing);
    });

    const topSlowEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({ endpoint, ...stats }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);

    // Status code distribution
    const statusCodeDistribution: Record<string, number> = {};
    this.metrics.forEach(metric => {
      const code = metric.statusCode.toString();
      statusCodeDistribution[code] = (statusCodeDistribution[code] || 0) + 1;
    });

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      slowRequestCount: slowRequests,
      topSlowEndpoints,
      statusCodeDistribution
    };
  }

  getRecentAlerts(severity?: 'low' | 'medium' | 'high') {
    let alerts = this.alerts;
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    return alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50); // Last 50 alerts
  }

  getEndpointAnalytics(endpoint: string) {
    const endpointMetrics = this.metrics.filter(m => m.endpoint === endpoint);
    
    if (endpointMetrics.length === 0) {
      return null;
    }

    const avgResponseTime = endpointMetrics.reduce((sum, m) => sum + m.duration, 0) / endpointMetrics.length;
    const minResponseTime = Math.min(...endpointMetrics.map(m => m.duration));
    const maxResponseTime = Math.max(...endpointMetrics.map(m => m.duration));
    
    const p95Index = Math.floor(endpointMetrics.length * 0.95);
    const sortedTimes = endpointMetrics.map(m => m.duration).sort((a, b) => a - b);
    const p95ResponseTime = sortedTimes[p95Index] || 0;

    const errorCount = endpointMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / endpointMetrics.length) * 100;

    return {
      endpoint,
      requestCount: endpointMetrics.length,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      minResponseTime,
      maxResponseTime,
      p95ResponseTime,
      errorRate: Math.round(errorRate * 100) / 100,
      errorCount
    };
  }
}

export const requestAnalytics = new RequestAnalytics();

export function trackRequestMetrics(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = (req.user as any)?.id;
    const userAgent = req.get('User-Agent') || '';
    
    requestAnalytics.recordMetric({
      endpoint: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      userId,
      userAgent,
      timestamp: new Date()
    });
  });
  
  next();
}