#!/usr/bin/env node

/**
 * API Response Compression Performance Test
 * Tests the effectiveness of the implemented compression system
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:5000';

// Test configurations
const TEST_ENDPOINTS = [
  '/api/projects',
  '/api/projects/1/compensation-events',
  '/api/projects/1/early-warnings',
  '/api/projects/1/equipment-hires',
  '/api/projects/1/programme-milestones',
  '/api/projects/1/payment-certificates',
  '/api/projects/1/rfis',
  '/api/projects/1/non-conformance-reports'
];

// Performance monitoring endpoints
const PERFORMANCE_ENDPOINTS = [
  '/api/performance/compression-stats',
  '/api/performance/compression-metrics',
  '/api/performance/bandwidth-savings'
];

async function testCompressionPerformance() {
  console.log('🚀 Starting API Response Compression Performance Test\n');
  
  const results = {
    compressionTests: [],
    performanceMetrics: {},
    summary: {}
  };

  // Test 1: Measure response times and compression
  console.log('📊 Testing API Response Times and Compression...');
  
  for (const endpoint of TEST_ENDPOINTS) {
    try {
      const startTime = performance.now();
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate'
        }
      });
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      const contentEncoding = response.headers.get('content-encoding');
      const contentLength = response.headers.get('content-length');
      const responseSize = parseInt(contentLength) || 0;
      
      const data = await response.json();
      const jsonSize = JSON.stringify(data).length;
      
      const compressionRatio = responseSize > 0 ? (jsonSize / responseSize).toFixed(2) : 'N/A';
      const compressionSavings = responseSize > 0 ? ((jsonSize - responseSize) / jsonSize * 100).toFixed(1) : 'N/A';
      
      const testResult = {
        endpoint,
        responseTime,
        isCompressed: !!contentEncoding,
        compressionType: contentEncoding || 'none',
        originalSize: jsonSize,
        compressedSize: responseSize,
        compressionRatio,
        compressionSavings: compressionSavings + '%',
        status: response.status
      };
      
      results.compressionTests.push(testResult);
      
      console.log(`  ✅ ${endpoint}: ${responseTime}ms, ${testResult.compressionSavings} savings`);
      
    } catch (error) {
      console.log(`  ❌ ${endpoint}: Error - ${error.message}`);
      results.compressionTests.push({
        endpoint,
        error: error.message
      });
    }
  }

  // Test 2: Fetch performance analytics
  console.log('\n📈 Fetching Performance Analytics...');
  
  for (const endpoint of PERFORMANCE_ENDPOINTS) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      const data = await response.json();
      
      if (data.success) {
        results.performanceMetrics[endpoint] = data.data;
        console.log(`  ✅ ${endpoint}: Retrieved analytics`);
      } else {
        console.log(`  ⚠️ ${endpoint}: No data available yet`);
      }
      
    } catch (error) {
      console.log(`  ❌ ${endpoint}: Error - ${error.message}`);
    }
  }

  // Test 3: Performance comparison test
  console.log('\n⚡ Running Performance Comparison Test...');
  
  const performanceTest = await runPerformanceComparison();
  results.summary = performanceTest;

  // Generate comprehensive report
  console.log('\n📋 COMPRESSION PERFORMANCE REPORT');
  console.log('=====================================');
  
  const successfulTests = results.compressionTests.filter(t => !t.error);
  const avgResponseTime = successfulTests.reduce((sum, t) => sum + t.responseTime, 0) / successfulTests.length;
  const compressedEndpoints = successfulTests.filter(t => t.isCompressed).length;
  const totalSavings = successfulTests
    .filter(t => t.compressionSavings !== 'N/A%')
    .reduce((sum, t) => sum + parseFloat(t.compressionSavings), 0);
  
  console.log(`Average Response Time: ${Math.round(avgResponseTime)}ms`);
  console.log(`Compressed Endpoints: ${compressedEndpoints}/${successfulTests.length}`);
  console.log(`Average Bandwidth Savings: ${(totalSavings / compressedEndpoints).toFixed(1)}%`);
  
  console.log('\nDetailed Results:');
  successfulTests.forEach(test => {
    console.log(`  ${test.endpoint}:`);
    console.log(`    Response Time: ${test.responseTime}ms`);
    console.log(`    Compression: ${test.compressionType}`);
    console.log(`    Bandwidth Savings: ${test.compressionSavings}`);
    console.log(`    Original Size: ${(test.originalSize / 1024).toFixed(2)}KB`);
    console.log(`    Compressed Size: ${(test.compressedSize / 1024).toFixed(2)}KB`);
  });

  if (results.performanceMetrics['/api/performance/compression-stats']) {
    const stats = results.performanceMetrics['/api/performance/compression-stats'];
    console.log('\nSystem-wide Compression Statistics:');
    console.log(`  Total Requests Processed: ${stats.totalRequests}`);
    console.log(`  Average Compression Ratio: ${stats.averageCompressionRatio}`);
    console.log(`  Total Bandwidth Saved: ${(stats.totalBytesSaved / 1024).toFixed(2)}KB`);
  }

  console.log('\n✅ Compression Performance Test Complete!');
  
  return results;
}

async function runPerformanceComparison() {
  console.log('  Running 10 concurrent requests to measure performance...');
  
  const testEndpoint = '/api/projects/1/compensation-events';
  const promises = [];
  
  for (let i = 0; i < 10; i++) {
    promises.push(
      fetch(`${BASE_URL}${testEndpoint}`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate'
        }
      }).then(async response => {
        const startTime = performance.now();
        await response.json();
        const endTime = performance.now();
        return {
          responseTime: Math.round(endTime - startTime),
          compressed: !!response.headers.get('content-encoding')
        };
      })
    );
  }
  
  const results = await Promise.all(promises);
  const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  const allCompressed = results.every(r => r.compressed);
  
  console.log(`    Average concurrent response time: ${Math.round(avgTime)}ms`);
  console.log(`    All responses compressed: ${allCompressed ? 'Yes' : 'No'}`);
  
  return {
    concurrentAvgTime: Math.round(avgTime),
    allCompressed,
    testCount: results.length
  };
}

// Run the test
testCompressionPerformance().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});