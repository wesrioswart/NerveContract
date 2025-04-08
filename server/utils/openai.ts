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
};

type KnowledgeBase = {
  [clauseNumber: string]: ClauseInfo;
};

const NEC4_KNOWLEDGE_BASE: KnowledgeBase = {
  // Compensation Event Clauses
  "61.3": {
    text: "The Contractor notifies the Project Manager of an event which has happened or which is expected to happen as a compensation event if the Contractor believes that the event is a compensation event and the Project Manager has not notified the event to the Contractor.",
    explanation: "This requires the Contractor to notify the Project Manager of any events they consider to be compensation events if the Project Manager hasn't already notified them about it."
  },
  "61.4": {
    text: "If the Contractor does not notify a compensation event within eight weeks of becoming aware that the event has happened, the Prices, the Completion Date or a Key Date are not changed unless the Project Manager should have notified the event to the Contractor but did not.",
    explanation: "The Contractor must notify a compensation event within 8 weeks of becoming aware of it, otherwise they lose the right to claim unless the Project Manager should have notified it but didn't."
  },
  "60.1": {
    text: "The following are compensation events...",
    explanation: "This clause lists all the situations that qualify as compensation events under the contract."
  },
  
  // Instructions Clauses
  "14.3": {
    text: "The Project Manager may give an instruction to the Contractor which changes the Scope or a Key Date.",
    explanation: "This is a key clause giving the Project Manager authority to issue instructions that change the project Scope or deadlines through a PMI (Project Manager's Instruction)."
  },
  "27.3": {
    text: "The Contractor obeys an instruction which is in accordance with this contract and is given to it by the Project Manager or the Supervisor.",
    explanation: "This clause obligates the Contractor to follow all valid instructions from either the Project Manager or Supervisor."
  },
  
  // Subcontract Management
  "26.3": {
    text: "If the Contractor subcontracts work, it is responsible for Providing the Works as if it had not subcontracted. This contract applies as if a Subcontractor's employees and equipment were the Contractor's.",
    explanation: "The Contractor remains fully responsible for all subcontracted work and all subcontractor actions are treated as if they were the Contractor's own."
  },
  
  // Communication Requirements
  "13.1": {
    text: "Each instruction, certificate, submission, proposal, record, acceptance, notification, reply and other communication which this contract requires is communicated in a form which can be read, copied and recorded.",
    explanation: "All formal communications under the contract must be in a recordable format. This means emails, formal letters, or the project's document management system, not verbal instructions."
  },
  "13.2": {
    text: "A communication has effect when it is received at the last address notified by the recipient for receiving communications or, if none is notified, at the address of the recipient stated in the Contract Data.",
    explanation: "Communications are only effective once received at the designated address."
  },
  
  // Early Warning and Risk Reduction
  "15.1": {
    text: "The Contractor and the Project Manager give an early warning by notifying the other as soon as either becomes aware of any matter which could increase the total of the Prices, delay Completion, delay meeting a Key Date or impair the performance of the works in use.",
    explanation: "Both parties must promptly notify each other of any issues that could affect cost, time, or quality of the project."
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
    
    // Define known clause numbers
    const instructionClauses = ["14.3", "27.3", "13.1"];
    const subcontractClauses = ["26.3"];
    
    // Search for relevant clauses in our knowledge base
    const relevantClauseNumbers = Object.keys(NEC4_KNOWLEDGE_BASE).filter(clause => {
      // Direct mention of a clause number
      if (question.toLowerCase().includes(clause)) {
        return true;
      }
      
      // Question about instructions
      if (question.toLowerCase().includes("instruction") && instructionClauses.includes(clause)) {
        return true;
      }
      
      // Question about subcontracts
      if (question.toLowerCase().includes("subcontract") && subcontractClauses.includes(clause)) {
        return true;
      }
      
      return false;
    });
    
    // Format the relevant clauses as context
    let knowledgeContext = "";
    if (relevantClauseNumbers.length > 0) {
      knowledgeContext = "Here are the relevant NEC4 clauses:\n\n";
      relevantClauseNumbers.forEach(clause => {
        const clauseInfo = NEC4_KNOWLEDGE_BASE[clause];
        knowledgeContext += `Clause ${clause}: "${clauseInfo.text}"\n\n`;
      });
    }
    
    console.log("Sending request to OpenAI...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an expert NEC4 contract assistant. Follow these guidelines carefully:\n\n" +
            "1. ALWAYS begin your answer by referencing the specific NEC4 clause number that relates to the question (e.g., 'According to Clause 14.3 of the NEC4 contract...')\n" +
            "2. For questions about instructions, always explain that under NEC4, formal instructions are issued as Project Manager's Instructions (PMIs) with reference to the relevant clause\n" +
            "3. Structure your answers with bullet points or numbered steps\n" +
            "4. Clearly state WHO should do WHAT and HOW, with specific reference to the contract clauses\n" +
            "5. Always provide the exact process that should be followed according to the contract\n" +
            "6. Be specific about the actions required by different parties (Contractor, Subcontractor, Project Manager, Supervisor)\n" +
            "7. Include any relevant notice periods or timeframes from the contract\n" +
            "8. Always conclude with practical implications or next steps\n\n" +
            "Use simple language but ensure all answers are technically accurate and reference the correct NEC4 clauses."
        },
        {
          role: "user",
          content: knowledgeContext ? 
            `${knowledgeContext}\n\nPlease answer the following question using the NEC4 clauses above:\n${question}` : 
            question
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
  issues: string[],
  recommendations: string[]
}> {
  try {
    // Check if API key is available
    if (!apiKey) {
      console.error("OpenAI API key is not set");
      return {
        issues: ["AI features are currently unavailable"],
        recommendations: ["Please contact the administrator to set up the OpenAI API key"]
      };
    }
    
    if (!documentText || documentText.trim().length === 0) {
      return {
        issues: ["Empty document provided"],
        recommendations: ["Please provide a valid document to analyze"]
      };
    }
    
    const prompt = `
    Analyze the following NEC4 construction contract document extract for specific practical issues:
    
    ${documentText}
    
    Provide a structured analysis with:
    1. Clear, specific issues that could impact project delivery or create liability
    2. For each issue, reference the specific NEC4 clause number that relates to the issue
    3. Practical, actionable recommendations for addressing each issue
    4. For each issue, identify which party (Contractor, Subcontractor, Project Manager) should take action and by when
    
    Focus on clarity and practical application. Avoid vague statements.
    For each issue and recommendation, include the specific NEC4 clause number.
    Format your response as JSON with 'issues' and 'recommendations' arrays.
    `;

    console.log("Sending document analysis request to OpenAI...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert NEC4 contract analyzer that identifies practical issues and provides specific, actionable recommendations. Focus on clarity and directness in your analysis. Highlight who needs to take what action. Use plain language that professionals without legal training can understand."
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

export { askContractAssistant, analyzeContractDocument, isOpenAIConfigured };
