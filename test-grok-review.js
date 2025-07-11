/**
 * Test script to run Grok code review
 */

import { GrokCodeReviewer } from './server/utils/grok-code-reviewer.js';

async function runGrokReview() {
  console.log('🧠 Starting Grok code review...');
  
  try {
    const reviewer = new GrokCodeReviewer();
    
    // Scan the codebase
    console.log('📁 Scanning codebase...');
    await reviewer.scanCodebase(process.cwd());
    
    // Run the analysis
    console.log('🔍 Running analysis...');
    const review = await reviewer.analyzeCodebase();
    
    // Generate report
    console.log('📋 Generating report...');
    const report = reviewer.generateReport(review);
    
    console.log('\n' + '='.repeat(80));
    console.log('GROK CODE REVIEW RESULTS');
    console.log('='.repeat(80));
    console.log(report);
    
    // Save report to file
    import('fs').then(fs => {
      fs.writeFileSync('grok-review-report.md', report);
      console.log('\n✅ Report saved to grok-review-report.md');
    });
    
  } catch (error) {
    console.error('❌ Grok review failed:', error);
    process.exit(1);
  }
}

runGrokReview();