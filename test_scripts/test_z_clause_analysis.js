// Test script for Z clause analysis using OpenAI
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeContractDocument } from '../server/utils/openai.js';

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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