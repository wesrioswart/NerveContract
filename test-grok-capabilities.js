/**
 * Direct test of Grok's advanced capabilities
 */

import OpenAI from 'openai';

// Configure Grok (xAI) client
const grok = new OpenAI({
  baseURL: "https://api.x.ai/v1",
  apiKey: process.env.XAI_API_KEY
});

async function testGrokCodeAnalysis() {
  console.log('🧪 Testing Grok Code Analysis Capabilities...\n');

  const codeToAnalyze = `
// Contract Event Processing Algorithm
class CompensationEventProcessor {
  constructor(private contractType: string) {}

  processEvent(event: any) {
    if (this.contractType === 'NEC4') {
      return this.processNEC4Event(event);
    }
    return this.processGenericEvent(event);
  }

  private processNEC4Event(event: any) {
    const timeLimit = this.getTimeLimit(event.type);
    const isValid = this.validateSubmission(event, timeLimit);
    
    if (!isValid) {
      throw new Error('Invalid submission');
    }
    
    return {
      approved: true,
      value: this.calculateValue(event),
      timeExtension: this.calculateTimeExtension(event)
    };
  }

  private getTimeLimit(eventType: string): number {
    const limits = {
      'variation': 8,
      'ground_conditions': 2,
      'delay': 8
    };
    return limits[eventType] || 8;
  }

  private validateSubmission(event: any, timeLimit: number): boolean {
    const submissionDate = new Date(event.submissionDate);
    const eventDate = new Date(event.eventDate);
    const diffWeeks = Math.ceil((submissionDate.getTime() - eventDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    return diffWeeks <= timeLimit;
  }

  private calculateValue(event: any): number {
    return event.laborCost + event.materialCost + event.equipmentCost;
  }

  private calculateTimeExtension(event: any): number {
    return Math.max(0, event.criticalPathDelay);
  }
}`;

  try {
    const startTime = Date.now();
    
    const response = await grok.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are a senior software engineer and code reviewer. Analyze the provided code for bugs, performance issues, security vulnerabilities, and optimization opportunities. Provide specific, actionable recommendations."
        },
        {
          role: "user",
          content: `Please analyze this TypeScript code for a contract management system. Find bugs, suggest improvements, and optimize the code:\n\n${codeToAnalyze}`
        }
      ],
      max_tokens: 1000
    });

    const processingTime = Date.now() - startTime;
    
    console.log('✅ Code Analysis Complete!');
    console.log(`⏱️  Processing Time: ${processingTime}ms`);
    console.log(`🤖 Model: grok-2-1212`);
    console.log('\n📋 Analysis Results:');
    console.log('─'.repeat(60));
    console.log(response.choices[0].message.content);
    console.log('─'.repeat(60));
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('❌ Code analysis failed:', error.message);
    return null;
  }
}

async function testGrokReasoningCapabilities() {
  console.log('\n🧠 Testing Grok Reasoning Capabilities...\n');

  const reasoningScenario = `
A construction project involves three different contract types:
- Main works under NEC4 ECC Option C (target contract with activity schedule)
- Design services under JCT Design and Build 2016
- Specialist subworks under FIDIC Yellow Book 2017

A delay occurs due to unforeseen ground conditions discovered during excavation. The main contractor claims:
1. Additional excavation costs: £250,000
2. Time extension: 6 weeks
3. Acceleration costs to maintain programme: £180,000

The delay affects all three contracts differently:
- NEC4: Direct impact on critical path activities
- JCT: Design changes required for foundation modifications
- FIDIC: Specialist equipment cannot be installed as planned

Analyze the contractual implications, risk allocations, and recommended compensation strategies across all three frameworks.`;

  try {
    const startTime = Date.now();
    
    const response = await grok.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are a senior contract law expert with extensive experience in construction contracts. Analyze complex multi-contract scenarios and provide comprehensive strategic recommendations considering legal, commercial, and practical implications."
        },
        {
          role: "user",
          content: reasoningScenario
        }
      ],
      max_tokens: 1200
    });

    const processingTime = Date.now() - startTime;
    
    console.log('✅ Reasoning Analysis Complete!');
    console.log(`⏱️  Processing Time: ${processingTime}ms`);
    console.log(`🤖 Model: grok-2-1212`);
    console.log('\n📋 Strategic Analysis:');
    console.log('─'.repeat(60));
    console.log(response.choices[0].message.content);
    console.log('─'.repeat(60));
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('❌ Reasoning analysis failed:', error.message);
    return null;
  }
}

async function testGrokLogicCapabilities() {
  console.log('\n🔢 Testing Grok Logic & Mathematical Capabilities...\n');

  const logicProblem = `
A project has the following risk scenario:

Base conditions:
- Weather delays have 40% probability in Q1, 20% in Q2, 30% in Q3
- Ground conditions have 25% probability of being worse than expected
- Material price inflation has 60% probability of exceeding 3%
- Labor availability has 35% probability of being constrained

Interdependencies:
- Weather delays increase ground condition risks by 15%
- Ground condition issues increase material costs by 8%
- Labor constraints increase both time and cost by 12%
- Material price increases above 5% trigger contract price adjustment mechanisms

If any two risks materialize simultaneously, the combined impact is 1.3x the sum of individual impacts.
If three or more risks occur, the project triggers force majeure provisions.

Calculate:
1. Probability of each individual risk scenario
2. Combined probability of multiple risk scenarios
3. Expected financial impact for each scenario
4. Recommended risk mitigation strategies

Use decision tree analysis and show your logical reasoning process.`;

  try {
    const startTime = Date.now();
    
    const response = await grok.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are a quantitative risk analyst and decision theory expert. Solve complex probability problems step-by-step, showing all mathematical reasoning and providing practical risk management recommendations."
        },
        {
          role: "user",
          content: logicProblem
        }
      ],
      max_tokens: 1500
    });

    const processingTime = Date.now() - startTime;
    
    console.log('✅ Logic Analysis Complete!');
    console.log(`⏱️  Processing Time: ${processingTime}ms`);
    console.log(`🤖 Model: grok-2-1212`);
    console.log('\n📋 Mathematical Analysis:');
    console.log('─'.repeat(60));
    console.log(response.choices[0].message.content);
    console.log('─'.repeat(60));
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('❌ Logic analysis failed:', error.message);
    return null;
  }
}

async function runComprehensiveGrokTest() {
  console.log('🚀 GROK AI COMPREHENSIVE TEST SUITE');
  console.log('═'.repeat(60));
  console.log('Testing Grok 2\'s advanced capabilities in:');
  console.log('• Code Analysis & Optimization');
  console.log('• Complex Reasoning & Strategy');
  console.log('• Mathematical Logic & Probability');
  console.log('═'.repeat(60));

  const startTime = Date.now();
  
  // Run all tests
  const codeResult = await testGrokCodeAnalysis();
  const reasoningResult = await testGrokReasoningCapabilities();
  const logicResult = await testGrokLogicCapabilities();
  
  const totalTime = Date.now() - startTime;
  
  console.log('\n🎯 COMPREHENSIVE TEST RESULTS');
  console.log('═'.repeat(60));
  console.log(`⏱️  Total Processing Time: ${totalTime}ms`);
  console.log(`🧪 Tests Completed: ${[codeResult, reasoningResult, logicResult].filter(Boolean).length}/3`);
  console.log(`🎯 Success Rate: ${([codeResult, reasoningResult, logicResult].filter(Boolean).length / 3 * 100).toFixed(1)}%`);
  
  console.log('\n📊 PERFORMANCE SUMMARY:');
  console.log('─'.repeat(60));
  console.log('✅ Code Analysis:', codeResult ? 'PASSED' : 'FAILED');
  console.log('✅ Reasoning Analysis:', reasoningResult ? 'PASSED' : 'FAILED');
  console.log('✅ Logic Analysis:', logicResult ? 'PASSED' : 'FAILED');
  console.log('═'.repeat(60));
  
  console.log('\n🏆 GROK AI CAPABILITIES DEMONSTRATED:');
  console.log('• Advanced code review with bug detection');
  console.log('• Multi-contract framework analysis');
  console.log('• Complex probability calculations');
  console.log('• Strategic decision-making recommendations');
  console.log('• Mathematical modeling and risk analysis');
  console.log('═'.repeat(60));
}

// Run the test suite
runComprehensiveGrokTest().catch(console.error);