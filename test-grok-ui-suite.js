/**
 * Run Grok UI Testing Suite
 * Comprehensive UI/UX testing for missing implementations
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Configure Grok (xAI) client
const grok = new OpenAI({
  baseURL: "https://api.x.ai/v1",
  apiKey: process.env.XAI_API_KEY
});

async function runGrokUITests() {
  console.log('🚀 STARTING GROK UI/UX TESTING SUITE');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Testing for missing implementations across all components...');
  console.log('════════════════════════════════════════════════════════════\n');

  const results = [];
  
  try {
    // Quick test of compensation events first
    console.log('🔍 Testing compensation events functionality...');
    
    const compEventsPath = 'client/src/pages/compensation-events.tsx';
    if (fs.existsSync(compEventsPath)) {
      const content = fs.readFileSync(compEventsPath, 'utf8');
      
      // Test with Grok
      const response = await grok.chat.completions.create({
        model: "grok-2-1212",
        messages: [{
          role: "user",
          content: `Analyze this React component for missing or non-functional UI elements:

${content}

Look for:
1. Buttons without proper onClick handlers
2. Missing function implementations
3. Placeholder functions (console.log, empty functions)
4. Non-functional UI elements
5. Missing state management

Be specific about what's broken and needs fixing.`
        }],
        max_tokens: 1000
      });
      
      console.log('✅ Grok Analysis Complete:');
      console.log(response.choices[0].message.content);
      
      // Test other critical components
      const criticalComponents = [
        'client/src/pages/early-warnings.tsx',
        'client/src/pages/procurement.tsx',
        'client/src/pages/suppliers.tsx',
        'client/src/pages/equipment-hire.tsx'
      ];
      
      for (const componentPath of criticalComponents) {
        if (fs.existsSync(componentPath)) {
          console.log(`\n🔍 Testing ${path.basename(componentPath)}...`);
          const compContent = fs.readFileSync(componentPath, 'utf8');
          
          // Quick check for missing handlers
          const buttons = compContent.match(/<Button[^>]*onClick={([^}]+)}/g) || [];
          const missingHandlers = buttons.filter(btn => 
            btn.includes('undefined') || 
            btn.includes('() => {}') || 
            btn.includes('console.log')
          );
          
          if (missingHandlers.length > 0) {
            console.log(`⚠️  Found ${missingHandlers.length} missing handlers in ${path.basename(componentPath)}`);
            results.push({
              component: path.basename(componentPath),
              issues: missingHandlers,
              severity: 'high'
            });
          } else {
            console.log(`✅ ${path.basename(componentPath)} appears functional`);
          }
        }
      }
      
    } else {
      console.log('❌ Compensation events file not found');
    }
    
    console.log('\n📊 GROK UI TEST SUMMARY:');
    console.log(`Total Issues Found: ${results.length}`);
    results.forEach(result => {
      console.log(`- ${result.component}: ${result.issues.length} issues`);
    });
    
  } catch (error) {
    console.error('\n❌ Grok UI Testing Suite failed:', error);
  }
}

// Run the test suite
runGrokUITests();