import OpenAI from "openai";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const apiKey = process.env.OPENAI_API_KEY;

// Validate OpenAI API key
if (!apiKey) {
  console.warn("WARNING: OPENAI_API_KEY environment variable is not set. AI features will not work properly.");
}

// Function to check if the OpenAI API key is properly configured
function isOpenAIConfigured(): boolean {
  return !!apiKey;
}

const openai = new OpenAI({ 
  apiKey: apiKey || "dummy-key", // Use a dummy key to prevent initialization errors, actual requests will be checked
});

// Structure for NEC4 contract knowledge base
type ClauseInfo = {
  text: string;
  explanation: string;
  relatedClauses?: string[];
  actionableBy?: string;
  timeframe?: string;
  riskTrigger?: string;
};

type KnowledgeBase = {
  [clauseNumber: string]: ClauseInfo;
};

const NEC4_KNOWLEDGE_BASE: KnowledgeBase = {
  // Standard Progress Reporting Clause
  "13.4": {
    text: "The Contractor submits a report on progress and performance to the Project Manager at the intervals stated in the Contract Data.",
    explanation: "Standard NEC4 progress reporting requirement, typically monthly unless amended by contract-specific provisions.",
    relatedClauses: ["13.1", "13.2", "50.1"],
    actionableBy: "Contractor",
    timeframe: "At intervals stated in Contract Data (usually monthly)"
  },
  // Northern Gateway Z-Clause for reporting
  "Z1.1": {
    text: "Notwithstanding Clause 13.4, the Contractor shall submit a detailed progress report to the Project Manager every two weeks, in the format specified in the Scope.",
    explanation: "Project-specific amendment for Northern Gateway Interchange that overrides standard monthly reporting with fortnightly requirements.",
    relatedClauses: ["13.4", "50.1", "51.1"],
    actionableBy: "Contractor",
    timeframe: "Every two weeks throughout the project",
    riskTrigger: "Failure to submit fortnightly reports may impact payment certification and contract compliance"
  },
  // Programme revision clauses for Option C
  "32.1": {
    text: "The Contractor submits a revised programme to the Project Manager for acceptance showing the actual progress achieved on each operation and its effect upon the timing of the remaining work.",
    explanation: "For Option C contracts, revised programmes must show actual progress and effects on remaining work. Critical for compensation event impacts and programme recovery.",
    relatedClauses: ["31.2", "62.2", "63.5"],
    actionableBy: "Contractor",
    timeframe: "When requested by Project Manager or when compensation events affect programme",
    riskTrigger: "Failure to submit compliant revised programme can lead to Project Manager making own assessment of time impacts"
  },
  "62.2": {
    text: "The quotation comprises proposed changes to the Prices and any delay to the Completion Date and Key Dates assessed by the Contractor. The Contractor submits details of his assessment with each quotation.",
    explanation: "Compensation event quotations must include time impact assessment. For programme-affecting events, this requires revised programme submission.",
    relatedClauses: ["32.1", "63.1", "63.5"],
    actionableBy: "Contractor", 
    timeframe: "With compensation event quotation (3 weeks from instruction)",
    riskTrigger: "Inadequate time impact assessment can lead to quotation rejection and Project Manager assessment"
  },
  // Option E Defined Cost and Schedule of Cost Components
  "11.2(23)": {
    text: "Defined Cost is the cost of the components in the Schedule of Cost Components whether work is subcontracted or not, but excluding the cost of preparing quotations for compensation events.",
    explanation: "For Option E contracts, Defined Cost includes all costs listed in the Schedule of Cost Components. This covers people, equipment, plant and materials, charges, manufacture and fabrication.",
    relatedClauses: ["52.1", "SCC-Item2"],
    actionableBy: "Contractor",
    timeframe: "Ongoing cost recording throughout project",
    riskTrigger: "Costs not included in SCC or improperly recorded become Disallowed Cost"
  },
  "52.1": {
    text: "The amount due in each assessment period is the Price for Work Done to Date plus other amounts to be paid to the Contractor minus amounts to be paid by or retained from the Contractor.",
    explanation: "For Option E, Price for Work Done to Date is the total Defined Cost which the Contractor has paid plus the Fee. Critical for equipment hire cost validation.",
    relatedClauses: ["11.2(23)", "SCC-Item2"],
    actionableBy: "Project Manager",
    timeframe: "Each assessment period (usually monthly)",
    riskTrigger: "Incorrect Defined Cost assessment affects payment amounts"
  },
  // Schedule of Cost Components - Item 2: Equipment
  "SCC-Item2": {
    text: "Schedule of Cost Components - Item 2: Equipment. For equipment hired from others, the amounts paid to the hiring company as stated in the hire contract for the period of hire within the Working Areas.",
    explanation: "Equipment hire costs are Defined Cost only when: (1) Paid to external hiring company as per hire contract, (2) Used within Working Areas, (3) For Providing the Works. Requires hire agreements, invoices, and proof of payment.",
    relatedClauses: ["11.2(23)", "52.1"],
    actionableBy: "Contractor",
    timeframe: "For duration of equipment hire",
    riskTrigger: "Equipment used outside Working Areas or without proper documentation becomes Disallowed Cost"
  },
  // Compensation Event Clauses
  "61.3": {
    text: "The Contractor notifies the Project Manager of an event which has happened or which is expected to happen as a compensation event if the Contractor believes that the event is a compensation event and the Project Manager has not notified the event to the Contractor.",
    explanation: "This requires the Contractor to notify the Project Manager of any events they consider to be compensation events if the Project Manager hasn't already notified them about it.",
    relatedClauses: ["60.1", "61.4", "61.5", "15.1"],
    actionableBy: "Contractor",
    timeframe: "As soon as becoming aware of the event"
  },
  "61.4": {
    text: "If the Contractor does not notify a compensation event within eight weeks of becoming aware that the event has happened, the Prices, the Completion Date or a Key Date are not changed unless the Project Manager should have notified the event to the Contractor but did not.",
    explanation: "The Contractor must notify a compensation event within 8 weeks of becoming aware of it, otherwise they lose the right to claim unless the Project Manager should have notified it but didn't.",
    relatedClauses: ["61.3", "60.1", "61.1", "15.1"],
    actionableBy: "Contractor",
    timeframe: "Within 8 weeks of becoming aware of the event",
    riskTrigger: "Exceeding the 8-week notification period leads to loss of entitlement"
  },
  "60.1": {
    text: "The following are compensation events...",
    explanation: "This clause lists all the situations that qualify as compensation events under the contract.",
    relatedClauses: ["61.1", "61.3", "63.1", "11.2(29)"],
    actionableBy: "Project Manager/Contractor",
    timeframe: "Varies by event type"
  },
  
  // Early Warning Clauses
  "15.1": {
    text: "The Contractor and the Project Manager give an early warning by notifying the other as soon as either becomes aware of any matter which could increase the total of the Prices, delay Completion, delay meeting a Key Date or impair the performance of the works in use.",
    explanation: "Both parties must notify each other as soon as they become aware of any issue that could affect cost, time, or quality.",
    relatedClauses: ["15.2", "15.3", "61.5", "36"],
    actionableBy: "Both Contractor and Project Manager",
    timeframe: "As soon as becoming aware of the matter",
    riskTrigger: "Failing to raise early warnings may affect later compensation event assessments"
  },
  "15.2": {
    text: "The Contractor or the Project Manager may instruct the other to attend an early warning meeting.",
    explanation: "Either party can call a meeting to discuss early warnings.",
    relatedClauses: ["15.1", "15.3"],
    actionableBy: "Both Contractor and Project Manager",
    timeframe: "After an early warning has been notified"
  },
  "15.3": {
    text: "At an early warning meeting, those who attend co-operate in making and considering proposals about how the effect of each matter which has been notified as an early warning can be avoided or reduced.",
    explanation: "Early warning meetings are collaborative sessions to find solutions to notified issues.",
    relatedClauses: ["15.1", "15.2", "63.7"],
    actionableBy: "All meeting attendees",
    timeframe: "During the early warning meeting"
  },
  
  // Programme Clauses
  "31.2": {
    text: "The Contractor shows on each programme which he submits for acceptance the information which the Scope requires the Contractor to show on a programme submitted for acceptance, the starting date, possession dates, access dates, Key Dates, Completion Date, planned Completion, the order and timing of the operations which the Contractor plans to do in order to Provide the Works, the order and timing of the work of the Client and Others as last agreed with them by the Contractor or, if not so agreed, as stated in the Scope, the dates when the Contractor plans to meet each Condition stated for a Key Date and to complete other work which is a condition precedent for achieving a Key Date and provisions for float, time risk allowances, health and safety requirements and the procedures set out in this contract.",
    explanation: "Defines the required content of the Contractor's programme submittals.",
    relatedClauses: ["31.1", "31.3", "32.1", "36"],
    actionableBy: "Contractor",
    timeframe: "Within 8 weeks of receiving request for programme"
  },
  "32.1": {
    text: "The Contractor submits a revised programme to the Project Manager for acceptance within the period for reply after the Project Manager has instructed the Contractor to submit a revised programme or the Contractor has notified the Project Manager of a compensation event.",
    explanation: "Requires the Contractor to submit revised programmes when instructed or after compensation events.",
    relatedClauses: ["31.2", "61.1", "63.5", "36"],
    actionableBy: "Contractor",
    timeframe: "Within the period for reply after instruction or CE notification"
  },
  
  // Instructions Clauses
  "14.3": {
    text: "The Project Manager may give an instruction to the Contractor which changes the Scope or a Key Date.",
    explanation: "This is a key clause giving the Project Manager authority to issue instructions that change the project Scope or deadlines through a PMI (Project Manager's Instruction).",
    relatedClauses: ["14.1", "27.3", "60.1(1)"],
    actionableBy: "Project Manager",
    timeframe: "As needed throughout the project",
    riskTrigger: "If the instruction creates a compensation event, must be notified within 8 weeks"
  },
  "27.3": {
    text: "The Contractor obeys an instruction which is in accordance with this contract and is given to it by the Project Manager or the Supervisor.",
    explanation: "This clause obligates the Contractor to follow all valid instructions from either the Project Manager or Supervisor.",
    relatedClauses: ["14.3", "27.1", "27.2"],
    actionableBy: "Contractor",
    timeframe: "Immediately upon receiving an instruction"
  },
  
  // Subcontract Management
  "26.3": {
    text: "If the Contractor subcontracts work, it is responsible for Providing the Works as if it had not subcontracted. This contract applies as if a Subcontractor's employees and equipment were the Contractor's.",
    explanation: "The Contractor remains fully responsible for all subcontracted work and all subcontractor actions are treated as if they were the Contractor's own.",
    relatedClauses: ["26.1", "26.2", "26.4"],
    actionableBy: "Contractor",
    timeframe: "Throughout the subcontract",
    riskTrigger: "Contractor remains liable for subcontractor performance issues"
  },
  
  // Communication Requirements
  "13.1": {
    text: "Each instruction, certificate, submission, proposal, record, acceptance, notification, reply and other communication which this contract requires is communicated in a form which can be read, copied and recorded.",
    explanation: "All formal communications under the contract must be in a recordable format. This means emails, formal letters, or the project's document management system, not verbal instructions.",
    relatedClauses: ["13.2", "13.3", "13.4"],
    actionableBy: "All parties",
    timeframe: "For all communications throughout the project"
  },
  "13.2": {
    text: "A communication has effect when it is received at the last address notified by the recipient for receiving communications or, if none is notified, at the address of the recipient stated in the Contract Data.",
    explanation: "Communications are only effective once received at the designated address.",
    relatedClauses: ["13.1", "13.7"],
    actionableBy: "All parties",
    timeframe: "For all communications throughout the project"
  }
};

// Function to ask question to OpenAI about NEC4 contracts
async function askContractAssistant(question: string): Promise<string> {
  try {
    // Check if API key is available
    if (!apiKey) {
      console.error("OpenAI API key is not set");
      return "AI features are currently unavailable. Please contact the administrator to set up the OpenAI API key.";
    }
    
    // Define common NEC4 topics and their related clauses
    const topicMap: Record<string, string[]> = {
      "instruction": ["14.3", "27.3", "13.1", "14.1"],
      "subcontract": ["26.3", "26.1", "26.2"],
      "early warning": ["15.1", "15.2", "15.3"],
      "programme": ["31.2", "32.1", "32.2", "36"],
      "compensation event": ["60.1", "61.3", "61.4", "63.1", "65.2"],
      "payment": ["50.1", "51.1", "51.2"],
      "dispute": ["90.1", "92", "93"],
      "defect": ["41.1", "42.1", "43.1", "44.1"],
      "change": ["14.3", "60.1", "65.1"],
      "delay": ["32.1", "15.1", "61.3", "62.2"],
      "key date": ["31.2", "14.3", "36", "60.1(5)"],
      "time": ["30.1", "31.2", "32.1", "36", "60.1(5)", "60.1(16)"],
      "cost": ["60.1", "63.1", "65.2"],
      "quality": ["40.1", "41.1", "42.1", "43.1", "44.1"],
      "completion": ["30.1", "31.2", "35.1", "36"],
      "risk": ["15.1", "80.1", "81.1", "82.1", "83.1"],
      "document": ["13.1", "13.2", "13.4"],
      "certificate": ["35.2", "50.1", "51.1"],
      "report": ["13.4", "Z1.1"],
      "reporting": ["13.4", "Z1.1"],
      "progress report": ["13.4", "Z1.1"],
      "northern gateway": ["Z1.1", "13.4"],
      "z clause": ["Z1.1"],
      "z-clause": ["Z1.1"],
      "project specific": ["Z1.1"],
      "two weeks": ["Z1.1"],
      "fortnightly": ["Z1.1"],
      "weekly": ["Z1.1"],
      "programme revision": ["32.1", "62.2", "31.2"],
      "revised programme": ["32.1", "62.2", "31.2"],
      "programme impact": ["32.1", "62.2", "63.5"],
      "option c": ["32.1", "62.2", "63.5"],
      "westfield": ["32.1", "62.2"],
      "slippage": ["32.1", "15.1", "62.2"],
      "critical path": ["32.1", "31.2"],
      "archaeological": ["60.1", "15.1", "61.3"],
      "ce-040": ["60.1", "61.3", "62.2"],
      "equipment cost": ["11.2(23)", "52.1", "SCC-Item2"],
      "hired equipment": ["11.2(23)", "52.1", "SCC-Item2"],
      "equipment hire": ["11.2(23)", "52.1", "SCC-Item2"],
      "schedule of cost components": ["SCC-Item1", "SCC-Item2", "SCC-Item3", "SCC-Item4", "SCC-Item5"],
      "defined cost": ["11.2(23)", "52.1"],
      "scc": ["SCC-Item1", "SCC-Item2", "SCC-Item3", "SCC-Item4", "SCC-Item5"],
      "commercial agent": ["52.1", "11.2(23)", "SCC-Item2"],
      "northern gateway": ["Z1.1", "13.4", "SCC-Item2"],
      "option e": ["11.2(23)", "52.1", "SCC-Item2"]
    };
    
    // Search for relevant clauses in our knowledge base
    let relevantClauseNumbers: string[] = [];
    
    // Direct mention of a clause number
    Object.keys(NEC4_KNOWLEDGE_BASE).forEach(clause => {
      if (question.toLowerCase().includes(clause)) {
        relevantClauseNumbers.push(clause);
        
        // Also include related clauses if we have an exact clause match
        const clauseInfo = NEC4_KNOWLEDGE_BASE[clause];
        if (clauseInfo.relatedClauses) {
          // Add related clauses without using spread operator
          clauseInfo.relatedClauses.forEach(relatedClause => {
            relevantClauseNumbers.push(relatedClause);
          });
        }
      }
    });
    
    // Topic-based search if no direct clause number is found
    if (relevantClauseNumbers.length === 0) {
      // Check for topic mentions
      Object.entries(topicMap).forEach(([topic, clauses]) => {
        if (question.toLowerCase().includes(topic)) {
          // Add clauses without using spread operator
          clauses.forEach(clause => {
            relevantClauseNumbers.push(clause);
          });
        }
      });
    }
    
    // Detect questions about dispute/delay patterns if no other matches
    if (relevantClauseNumbers.length === 0) {
      const delayPattern = /delay|late|behind schedule|miss(ed|ing)? deadline|overrun/i;
      const disputePattern = /disagree|dispute|conflict|reject|challenge|denied|refuse/i;
      
      if (delayPattern.test(question)) {
        // Add delay-related clauses without using spread
        topicMap["delay"].forEach(clause => {
          relevantClauseNumbers.push(clause);
        });
      }
      
      if (disputePattern.test(question)) {
        // Add dispute-related clauses without using spread
        topicMap["dispute"].forEach(clause => {
          relevantClauseNumbers.push(clause);
        });
      }
    }
    
    // Remove duplicates using filter
    relevantClauseNumbers = relevantClauseNumbers.filter((clause, index) => {
      return relevantClauseNumbers.indexOf(clause) === index;
    });
    
    // Format the relevant clauses as context with enhanced information
    let knowledgeContext = "";
    if (relevantClauseNumbers.length > 0) {
      knowledgeContext = "Here are the relevant NEC4 clauses:\n\n";
      relevantClauseNumbers.forEach(clause => {
        const clauseInfo = NEC4_KNOWLEDGE_BASE[clause];
        if (clauseInfo) {
          knowledgeContext += `Clause ${clause}: "${clauseInfo.text}"\n`;
          
          if (clauseInfo.actionableBy) {
            knowledgeContext += `Actionable by: ${clauseInfo.actionableBy}\n`;
          }
          
          if (clauseInfo.timeframe) {
            knowledgeContext += `Timeframe: ${clauseInfo.timeframe}\n`;
          }
          
          if (clauseInfo.riskTrigger) {
            knowledgeContext += `Risk trigger: ${clauseInfo.riskTrigger}\n`;
          }
          
          knowledgeContext += "\n";
        }
      });
    }
    
    console.log("Sending request to OpenAI...");
    
    // Extract the actual user query when receiving an enhanced query
    const userQueryMatch = question.match(/User query: "([^"]+)"/);
    const actualQuestion = userQueryMatch ? userQueryMatch[1] : question;
    
    // Check if this is a common, everyday language query about NEC4 topics
    const isEverydayLanguageQuery = (
      // Check for everyday phrases about delays
      !!actualQuestion.match(/delay|behind schedule|late|slow progress|falling behind|not on time/i) ||
      // Check for everyday phrases about changes
      !!actualQuestion.match(/change|different|modify|adjust|update|alteration/i) ||
      // Check for everyday phrases about quality issues
      !!actualQuestion.match(/quality|not good enough|defect|problem|issue|broken|damage/i) ||
      // Check for everyday phrases about disputes
      !!actualQuestion.match(/disagree|conflict|argue|dispute|problem with contractor|not happy with/i) ||
      // Check for everyday phrases about payments
      !!actualQuestion.match(/pay|money|funds|cost|expense|invoice|bill/i)
    );
    
    // Prepare the prompt with context mapping for everyday language
    let enhancedPrompt = question;
    
    if (isEverydayLanguageQuery) {
      console.log("Detected everyday language query, enhancing with NEC4 context");
      enhancedPrompt = `
The user is asking about NEC4 contracts using everyday language. Their query is:
"${actualQuestion}"

Please interpret their intent and provide a helpful response that references the specific relevant NEC4 clauses. 
Consider whether this might relate to:
- Compensation events (Clause 60)
- Programme requirements (Clause 31/32)
- Early warning procedures (Clause 15)
- Payment procedures (Clause 50-51)
- Defects management (Clause 40-45)
- Dispute resolution procedures (Clause 90-93)
      `;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are a highly skilled NEC4 contract consultant with extensive construction industry experience. Follow these guidelines precisely:\n\n" +
            "1. Format all responses in clear, professional markdown\n" +
            "2. ALWAYS begin your answer by referencing the specific NEC4 clause number that relates to the question\n" +
            "3. Use **bold headings** to organize your response\n" +
            "4. Utilize bullet points for clear, structured information\n" +
            "5. For each contractual point, specify:\n   - The relevant contract clause\n   - WHO is responsible (PM, Contractor, Supervisor)\n   - WHAT action is required\n   - WHEN it must be completed (timeframes)\n" +
            "6. Use industry-specific terminology appropriate to NEC4 contracts\n" +
            "7. Be precise about notice periods, timeframes, and procedural requirements\n" +
            "8. For questions about compensation events, always reference relevant assessment provisions\n" +
            "9. Always conclude with practical implications and recommended next steps\n\n" +
            "10. Understand the user's intent even when their phrasing is imperfect or unclear\n" +
            "11. Recognize implicit references to contract elements without requiring exact terminology\n" +
            "12. Infer the relevant NEC4 context even from vague or incomplete queries\n\n" +
            "Your responses should be authoritative, technically accurate, and formatted for maximum clarity. Remember that users may not use precise NEC4 terminology or perfect grammar - understand their intent and respond helpfully regardless of how the question is phrased."
        },
        {
          role: "user",
          content: knowledgeContext ? 
            `${knowledgeContext}\n\nPlease answer the following question using the NEC4 clauses above:\n${enhancedPrompt}` : 
            enhancedPrompt
        }
      ],
      max_tokens: 500,
    });

    console.log("Received response from OpenAI");
    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error("Error in OpenAI request:", error);
    
    // More specific error handling based on error type
    if (error.name === 'AuthenticationError') {
      console.error("OpenAI API authentication error - check your API key");
      return "AI features are unavailable due to an authentication issue. Please contact the administrator.";
    } else if (error.name === 'RateLimitError') {
      console.error("OpenAI API rate limit exceeded");
      return "The AI service is currently experiencing high demand. Please try again in a few minutes.";
    } else if (error.name === 'TimeoutError') {
      console.error("OpenAI API request timed out");
      return "The AI service is taking too long to respond. Please try again later.";
    }
    
    return "Sorry, I encountered an error processing your request. Please try again later.";
  }
}

// Function to analyze documents for potential contract issues
async function analyzeContractDocument(documentText: string): Promise<{
  riskAreas: Array<{
    clause: string;
    issue: string;
    severity: 'Critical' | 'Moderate' | 'Minor';
    recommendation: string;
  }>;
  compliantClauses: string[];
  missingClauses: string[];
  overallRisk: 'High' | 'Medium' | 'Low';
  summary: string;
}> {
  try {
    // Check if API key is available
    if (!apiKey) {
      console.error("OpenAI API key is not set");
      return {
        riskAreas: [{
          clause: "System Error",
          issue: "AI features are currently unavailable",
          severity: 'Critical',
          recommendation: "Please contact the administrator to set up the OpenAI API key"
        }],
        compliantClauses: [],
        missingClauses: [],
        overallRisk: 'High',
        summary: "Document analysis unavailable due to missing API configuration."
      };
    }
    
    if (!documentText || documentText.trim().length === 0) {
      return {
        riskAreas: [{
          clause: "Input Error",
          issue: "Empty document provided",
          severity: 'Critical',
          recommendation: "Please provide a valid document to analyze"
        }],
        compliantClauses: [],
        missingClauses: [],
        overallRisk: 'High',
        summary: "No document content available for analysis."
      };
    }
    
    // Detect if this is a Z-clause analysis
    const isZClauseAnalysis = documentText.toLowerCase().includes('z clause') || 
                            documentText.toLowerCase().includes('z1') || 
                            documentText.toLowerCase().includes('additional conditions of contract');
    
    const prompt = `
    Analyze the following construction contract document for deviations from NEC4 principles and potential risks:
    
    ${documentText}
    
    Provide a comprehensive structured analysis with:
    1. Specific risk areas with clause references, severity, and recommendations
    2. Missing clauses that are core NEC4 requirements
    3. Compliant clauses that align with NEC4 principles
    4. Overall risk assessment and summary
    
    For risk areas, categorize severity as:
    - Critical: Fundamentally conflicts with NEC4 or creates severe liability
    - Moderate: Creates potential disputes or ambiguity
    - Minor: Technical issues that should be addressed
    
    Respond ONLY in valid JSON format:
    {
      "riskAreas": [
        {
          "clause": "Clause reference (e.g., 'Clause 5.3 Liability')",
          "issue": "Specific issue description",
          "severity": "Critical|Moderate|Minor",
          "recommendation": "Specific actionable recommendation"
        }
      ],
      "missingClauses": ["List of missing NEC4 requirements"],
      "compliantClauses": ["List of clauses that appear compliant"],
      "overallRisk": "High|Medium|Low",
      "summary": "Brief overall assessment"
    }`;

    console.log("Sending document analysis request to OpenAI...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: isZClauseAnalysis ? 
            "You are an expert NEC4 construction contract Z-clause analyzer with legal expertise. Your analysis must:\n\n" +
            "1. Identify clauses that shift risk in ways that contradict NEC4 philosophy of fair risk allocation\n" +
            "2. Highlight ambiguous wording that could lead to disputes\n" +
            "3. Focus on liability caps, time bars, notice periods, and payment terms that differ from standard NEC4\n" +
            "4. Reference specific main NEC4 clause numbers (e.g. 'conflicts with clause 60.1')\n" +
            "5. Provide very specific, actionable recommendations to improve each Z clause\n" +
            "6. Categorize issues by severity (Critical/Moderate/Minor)\n" +
            "7. Explain which party (Client or Contractor) is disadvantaged by each problematic clause\n\n" +
            "Use plain language for construction professionals without legal training. Focus on practical implications." :
            "You are an expert NEC4 contract analyzer that identifies practical issues and provides specific, actionable recommendations. Focus on clarity and directness in your analysis. Highlight who needs to take what action. Use plain language that professionals without legal training can understand."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    console.log("Received document analysis response from OpenAI");
    
    if (!response.choices || response.choices.length === 0 || !response.choices[0].message.content) {
      console.error("Empty response from OpenAI");
      return {
        issues: ["Error: Received empty response from AI service"],
        recommendations: ["Please try again later"]
      };
    }
    
    try {
      const parsedResponse = JSON.parse(response.choices[0].message.content);
      return {
        issues: parsedResponse.issues || [],
        recommendations: parsedResponse.recommendations || []
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      return {
        issues: ["Error parsing AI response"],
        recommendations: ["The AI service returned an invalid response format. Please try again later."]
      };
    }
  } catch (error: any) {
    console.error("Error in document analysis:", error);
    
    // More specific error handling based on error type
    if (error.name === 'AuthenticationError') {
      console.error("OpenAI API authentication error - check your API key");
      return {
        issues: ["AI features are unavailable due to an authentication issue"],
        recommendations: ["Please contact the administrator"]
      };
    } else if (error.name === 'RateLimitError') {
      console.error("OpenAI API rate limit exceeded");
      return {
        issues: ["The AI service is currently experiencing high demand"],
        recommendations: ["Please try again in a few minutes"]
      };
    } else if (error.name === 'TimeoutError') {
      console.error("OpenAI API request timed out");
      return {
        issues: ["The AI service is taking too long to respond"],
        recommendations: ["Please try again later with a simpler document"]
      };
    }
    
    return {
      issues: ["Error analyzing document: " + (error.message || "Unknown error")],
      recommendations: ["Please try again later or contact support"]
    };
  }
}

// Function specifically for resource allocation data extraction
async function extractResourceAllocationData(documentContent: string): Promise<any> {
  try {
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a data extraction expert. Extract resource allocation data from construction documents and return ONLY valid JSON. Look for team member information including names, roles, companies, hours worked, and whether they are subcontractors. Also extract period information like week commencing dates.

You must respond with valid JSON in this exact format:
{
  "periodName": "Week 23" or "Week of [date]",
  "weekCommencing": "YYYY-MM-DD",
  "teamMembers": [
    {
      "name": "Full Name",
      "role": "Job Role/Position",
      "company": "Company Name", 
      "hours": 40,
      "isSubcontractor": false
    }
  ],
  "extractionConfidence": 0.85
}

If you cannot extract clear data, return this fallback structure with confidence 0.3.`
        },
        {
          role: "user",
          content: `Extract resource allocation data from this document content:\n\n${documentContent}`
        }
      ],
      max_tokens: 1000,
    });

    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(result);
  } catch (error: any) {
    console.error("Error in resource allocation extraction:", error);
    throw error;
  }
}

export { askContractAssistant, analyzeContractDocument, isOpenAIConfigured, extractResourceAllocationData };
