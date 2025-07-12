import { aiRouter } from './multi-model-ai-router.js';

export interface GrokTestResult {
  testName: string;
  category: 'code' | 'reasoning' | 'logic';
  input: string;
  output: string;
  model: string;
  confidence: number;
  processingTime: number;
  score: number;
  analysis: string;
}

export class GrokTestSuite {
  private testResults: GrokTestResult[] = [];

  // Code Testing Scenarios
  private codeTests = [
    {
      name: "Contract Event Processing Algorithm",
      input: `
// Review this compensation event processing algorithm
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
}

// Find bugs, suggest improvements, and optimize this code
`,
      expectedFocus: "Code review, bug detection, optimization suggestions"
    },
    {
      name: "Database Query Optimization",
      input: `
// Optimize this database query for compensation events
const getCompensationEventsByProject = async (projectId: number) => {
  const events = await db.select().from(compensationEvents).where(eq(compensationEvents.projectId, projectId));
  
  for (const event of events) {
    const user = await db.select().from(users).where(eq(users.id, event.raisedBy)).limit(1);
    event.raisedByUser = user[0];
    
    const attachments = await db.select().from(attachments).where(eq(attachments.compensationEventId, event.id));
    event.attachments = attachments;
  }
  
  return events;
};

// How can this be optimized to avoid N+1 queries?
`,
      expectedFocus: "Performance optimization, database best practices"
    },
    {
      name: "Algorithm Complexity Analysis",
      input: `
// Analyze the time complexity of this critical path calculation
function findCriticalPath(activities: Activity[]): Activity[] {
  const graph = buildDependencyGraph(activities);
  const sorted = topologicalSort(graph);
  
  // Forward pass
  for (const activity of sorted) {
    activity.earlyStart = Math.max(...activity.dependencies.map(dep => dep.earlyFinish));
    activity.earlyFinish = activity.earlyStart + activity.duration;
  }
  
  // Backward pass
  const reversed = [...sorted].reverse();
  for (const activity of reversed) {
    activity.lateFinish = Math.min(...activity.successors.map(succ => succ.lateStart));
    activity.lateStart = activity.lateFinish - activity.duration;
    activity.totalFloat = activity.lateStart - activity.earlyStart;
  }
  
  return sorted.filter(activity => activity.totalFloat === 0);
}

// What's the time complexity? Can it be improved?
`,
      expectedFocus: "Algorithm analysis, complexity assessment"
    }
  ];

  // Reasoning Test Scenarios
  private reasoningTests = [
    {
      name: "Multi-Contract Framework Analysis",
      input: `
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

Analyze the contractual implications, risk allocations, and recommended compensation strategies across all three frameworks. Consider:
- Notice requirements and time limits for each contract
- Risk allocation principles
- Compensation mechanisms available
- Potential disputes and resolution approaches
`,
      expectedFocus: "Complex contractual reasoning, multi-framework analysis"
    },
    {
      name: "Financial Impact Assessment",
      input: `
A programme manager must decide between three options for a delayed project:

Option A: Acceleration
- Additional labor: £400,000
- Equipment hire: £150,000
- Overtime premiums: £200,000
- Recovery time: 4 weeks
- Risk of quality issues: 15%
- Liquidated damages avoided: £500,000

Option B: Negotiated Extension
- Extension period: 8 weeks
- Additional preliminaries: £320,000
- Liquidated damages: £800,000
- Client relationship impact: Moderate
- Future tender opportunities: May be affected

Option C: Hybrid Approach
- Partial acceleration: £300,000
- Negotiated extension: 4 weeks
- Liquidated damages: £400,000
- Additional risk mitigation: £100,000
- Client satisfaction: Higher

Analyze the financial, commercial, and strategic implications of each option. Consider net present value, risk-adjusted returns, and long-term business impact.
`,
      expectedFocus: "Financial analysis, risk assessment, strategic decision making"
    },
    {
      name: "Complex Resource Optimization",
      input: `
A project has the following constraints:
- 12 critical activities with interdependencies
- 5 different resource types (labor, equipment, materials, specialists, approvals)
- Budget limit: £2.5M
- Time limit: 18 weeks
- Quality requirements: 95% compliance minimum

Current situation:
- Activity A requires 3 weeks, costs £200k, needs 2 specialist teams
- Activity B requires 4 weeks, costs £300k, needs equipment X for full duration
- Activity C requires 2 weeks, costs £150k, but can't start until A is 50% complete
- Activities D-H have various dependencies and resource conflicts
- Equipment X is only available for 10 weeks total
- Specialist teams are shared across multiple activities

The client wants to reduce the programme by 3 weeks while maintaining quality and staying within budget. They're willing to accept a 10% budget increase if necessary.

Develop an optimization strategy that considers resource leveling, activity sequencing, and risk mitigation.
`,
      expectedFocus: "Operations research, constraint optimization"
    }
  ];

  // Logic Test Scenarios
  private logicTests = [
    {
      name: "Contract Clause Interpretation Logic",
      input: `
NEC4 ECC Clause 61.3 states: "The Project Manager assesses the compensation event if the Contractor has not submitted a quotation within the time allowed."

NEC4 ECC Clause 62.3 states: "The Project Manager replies to a quotation within the period for reply or changes a planned Completion Date to a later date."

NEC4 ECC Clause 64.1 states: "A compensation event is not notified until after the defects date."

Given these clauses, analyze this scenario:
1. Contractor discovers unforeseen ground conditions on Week 8
2. Contractor notifies compensation event on Week 10
3. Project Manager requests quotation on Week 11
4. Contractor submits quotation on Week 15
5. Project Manager doesn't respond by Week 17
6. Planned completion is Week 20
7. Defects date is Week 72

Questions:
- Was the compensation event properly notified?
- What happens to the quotation submitted in Week 15?
- What are the Project Manager's obligations?
- If the Project Manager assesses the event, what constraints apply?
- How does this affect the programme and completion date?

Provide a logical analysis of each step and the contractual consequences.
`,
      expectedFocus: "Legal logic, clause interpretation, procedural analysis"
    },
    {
      name: "Risk Assessment Logic Tree",
      input: `
A major infrastructure project faces the following risk scenario:

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
5. Optimal insurance coverage levels

Use decision tree analysis and show your logical reasoning process.
`,
      expectedFocus: "Probability logic, decision analysis, risk mathematics"
    },
    {
      name: "Programme Logic Puzzle",
      input: `
A project has 8 activities (A through H) with the following constraints:

Duration constraints:
- A: 3 days, B: 4 days, C: 2 days, D: 5 days
- E: 3 days, F: 4 days, G: 2 days, H: 6 days

Dependency constraints:
- A must finish before B starts
- B must finish before C starts
- C must finish before D starts
- A must finish before E starts
- E must finish before F starts
- F must finish before G starts
- Both D and G must finish before H starts

Resource constraints:
- Activities A, C, E, G require Resource Type X (only 1 available)
- Activities B, D, F, H require Resource Type Y (only 1 available)
- Activities A, B require the same specialist (only 1 available)
- Activities E, F require the same equipment (only 1 available)

Additional constraints:
- No activity can start on weekends
- Resource Type X is not available on day 7
- The specialist is not available on days 4-5
- Equipment for E, F is not available on days 10-11

Find the optimal schedule that minimizes total project duration while satisfying all constraints. Show your logical reasoning process and explain any assumptions made.
`,
      expectedFocus: "Scheduling logic, constraint satisfaction, optimization"
    }
  ];

  async runCodeTests(): Promise<GrokTestResult[]> {
    const results: GrokTestResult[] = [];
    
    for (const test of this.codeTests) {
      try {
        const startTime = Date.now();
        const response = await aiRouter.route({
          task: `Code Review and Analysis: ${test.name}`,
          content: test.input,
          type: 'code',
          complexity: 'complex',
          priority: 'quality'
        });
        
        const processingTime = Date.now() - startTime;
        const score = this.evaluateCodeResponse(response.result, test.expectedFocus);
        
        results.push({
          testName: test.name,
          category: 'code',
          input: test.input,
          output: response.result,
          model: response.model,
          confidence: response.confidence,
          processingTime,
          score,
          analysis: this.analyzeCodeResponse(response.result, test.expectedFocus)
        });
      } catch (error) {
        results.push({
          testName: test.name,
          category: 'code',
          input: test.input,
          output: `Error: ${error.message}`,
          model: 'unknown',
          confidence: 0,
          processingTime: 0,
          score: 0,
          analysis: 'Test failed due to error'
        });
      }
    }
    
    return results;
  }

  async runReasoningTests(): Promise<GrokTestResult[]> {
    const results: GrokTestResult[] = [];
    
    for (const test of this.reasoningTests) {
      try {
        const startTime = Date.now();
        const response = await aiRouter.route({
          task: `Complex Reasoning Analysis: ${test.name}`,
          content: test.input,
          type: 'analysis',
          complexity: 'complex',
          priority: 'reasoning'
        });
        
        const processingTime = Date.now() - startTime;
        const score = this.evaluateReasoningResponse(response.result, test.expectedFocus);
        
        results.push({
          testName: test.name,
          category: 'reasoning',
          input: test.input,
          output: response.result,
          model: response.model,
          confidence: response.confidence,
          processingTime,
          score,
          analysis: this.analyzeReasoningResponse(response.result, test.expectedFocus)
        });
      } catch (error) {
        results.push({
          testName: test.name,
          category: 'reasoning',
          input: test.input,
          output: `Error: ${error.message}`,
          model: 'unknown',
          confidence: 0,
          processingTime: 0,
          score: 0,
          analysis: 'Test failed due to error'
        });
      }
    }
    
    return results;
  }

  async runLogicTests(): Promise<GrokTestResult[]> {
    const results: GrokTestResult[] = [];
    
    for (const test of this.logicTests) {
      try {
        const startTime = Date.now();
        const response = await aiRouter.route({
          task: `Logic Analysis: ${test.name}`,
          content: test.input,
          type: 'calculation',
          complexity: 'complex',
          priority: 'reasoning'
        });
        
        const processingTime = Date.now() - startTime;
        const score = this.evaluateLogicResponse(response.result, test.expectedFocus);
        
        results.push({
          testName: test.name,
          category: 'logic',
          input: test.input,
          output: response.result,
          model: response.model,
          confidence: response.confidence,
          processingTime,
          score,
          analysis: this.analyzeLogicResponse(response.result, test.expectedFocus)
        });
      } catch (error) {
        results.push({
          testName: test.name,
          category: 'logic',
          input: test.input,
          output: `Error: ${error.message}`,
          model: 'unknown',
          confidence: 0,
          processingTime: 0,
          score: 0,
          analysis: 'Test failed due to error'
        });
      }
    }
    
    return results;
  }

  async runAllTests(): Promise<{
    codeResults: GrokTestResult[];
    reasoningResults: GrokTestResult[];
    logicResults: GrokTestResult[];
    summary: {
      totalTests: number;
      averageScore: number;
      modelDistribution: Record<string, number>;
      averageProcessingTime: number;
      categoryScores: Record<string, number>;
    };
  }> {
    console.log('🧪 Starting comprehensive Grok test suite...');
    
    const codeResults = await this.runCodeTests();
    const reasoningResults = await this.runReasoningTests();
    const logicResults = await this.runLogicTests();
    
    const allResults = [...codeResults, ...reasoningResults, ...logicResults];
    
    const summary = {
      totalTests: allResults.length,
      averageScore: allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length,
      modelDistribution: allResults.reduce((acc, r) => {
        acc[r.model] = (acc[r.model] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageProcessingTime: allResults.reduce((sum, r) => sum + r.processingTime, 0) / allResults.length,
      categoryScores: {
        code: codeResults.reduce((sum, r) => sum + r.score, 0) / codeResults.length,
        reasoning: reasoningResults.reduce((sum, r) => sum + r.score, 0) / reasoningResults.length,
        logic: logicResults.reduce((sum, r) => sum + r.score, 0) / logicResults.length
      }
    };
    
    console.log('✅ Grok test suite completed', summary);
    
    return {
      codeResults,
      reasoningResults,
      logicResults,
      summary
    };
  }

  private evaluateCodeResponse(response: string, expectedFocus: string): number {
    let score = 0;
    
    // Check for code analysis elements
    if (response.includes('bug') || response.includes('error') || response.includes('issue')) score += 2;
    if (response.includes('optimization') || response.includes('performance') || response.includes('improve')) score += 2;
    if (response.includes('complexity') || response.includes('O(')) score += 2;
    if (response.includes('security') || response.includes('validation')) score += 1;
    if (response.includes('maintainability') || response.includes('readability')) score += 1;
    if (response.includes('best practice') || response.includes('pattern')) score += 1;
    if (response.includes('testing') || response.includes('unit test')) score += 1;
    
    return Math.min(score, 10);
  }

  private evaluateReasoningResponse(response: string, expectedFocus: string): number {
    let score = 0;
    
    // Check for reasoning elements
    if (response.includes('analysis') || response.includes('analyze')) score += 2;
    if (response.includes('conclusion') || response.includes('therefore')) score += 2;
    if (response.includes('consideration') || response.includes('factor')) score += 2;
    if (response.includes('risk') || response.includes('mitigation')) score += 1;
    if (response.includes('strategy') || response.includes('approach')) score += 1;
    if (response.includes('implication') || response.includes('consequence')) score += 1;
    if (response.includes('recommendation') || response.includes('suggest')) score += 1;
    
    return Math.min(score, 10);
  }

  private evaluateLogicResponse(response: string, expectedFocus: string): number {
    let score = 0;
    
    // Check for logical elements
    if (response.includes('step') || response.includes('process')) score += 2;
    if (response.includes('if') || response.includes('then') || response.includes('because')) score += 2;
    if (response.includes('probability') || response.includes('percent') || response.includes('%')) score += 2;
    if (response.includes('calculation') || response.includes('formula')) score += 1;
    if (response.includes('constraint') || response.includes('condition')) score += 1;
    if (response.includes('logic') || response.includes('reasoning')) score += 1;
    if (response.includes('decision') || response.includes('choice')) score += 1;
    
    return Math.min(score, 10);
  }

  private analyzeCodeResponse(response: string, expectedFocus: string): string {
    const elements = [];
    if (response.includes('bug') || response.includes('error')) elements.push('Bug Detection');
    if (response.includes('optimization') || response.includes('performance')) elements.push('Performance Analysis');
    if (response.includes('complexity')) elements.push('Complexity Assessment');
    if (response.includes('security')) elements.push('Security Review');
    if (response.includes('best practice')) elements.push('Best Practices');
    
    return elements.length > 0 ? elements.join(', ') : 'General code review';
  }

  private analyzeReasoningResponse(response: string, expectedFocus: string): string {
    const elements = [];
    if (response.includes('analysis')) elements.push('Detailed Analysis');
    if (response.includes('risk')) elements.push('Risk Assessment');
    if (response.includes('strategy')) elements.push('Strategic Planning');
    if (response.includes('recommendation')) elements.push('Actionable Recommendations');
    if (response.includes('implication')) elements.push('Impact Analysis');
    
    return elements.length > 0 ? elements.join(', ') : 'General reasoning';
  }

  private analyzeLogicResponse(response: string, expectedFocus: string): string {
    const elements = [];
    if (response.includes('step')) elements.push('Step-by-step Logic');
    if (response.includes('probability')) elements.push('Probability Analysis');
    if (response.includes('calculation')) elements.push('Mathematical Calculation');
    if (response.includes('constraint')) elements.push('Constraint Analysis');
    if (response.includes('decision')) elements.push('Decision Logic');
    
    return elements.length > 0 ? elements.join(', ') : 'General logic';
  }
}