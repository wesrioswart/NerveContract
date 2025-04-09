// Test script for Z clause analysis using OpenAI
const fs = require('fs');
const path = require('path');
const { analyzeContractDocument } = require('../server/utils/openai');

// __dirname is available in CommonJS

async function testZClauseAnalysis() {
  try {
    // Read the sample Z clause document
    const zClauseContent = fs.readFileSync(
      path.join(__dirname, '../test_data/z_clause_sample.txt'),
      'utf8'
    );
    
    console.log('Analyzing Z clause document...');
    
    // Call the OpenAI analysis function
    const analysis = await analyzeContractDocument(zClauseContent);
    
    console.log('\n===== Analysis Results =====\n');
    
    // Display identified issues
    console.log('IDENTIFIED ISSUES:');
    analysis.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    console.log('\nRECOMMENDATIONS:');
    analysis.recommendations.forEach((recommendation, index) => {
      console.log(`${index + 1}. ${recommendation}`);
    });
    
  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

// Run the test
testZClauseAnalysis();