import OpenAI from "openai";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

// Structure for NEC4 contract knowledge base
const NEC4_KNOWLEDGE_BASE = {
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
  }
};

// Function to ask question to OpenAI about NEC4 contracts
async function askContractAssistant(question: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an expert NEC4 contract assistant. Follow these guidelines carefully:\n\n" +
            "1. Always provide clear, direct, and actionable answers\n" +
            "2. Use simple language and avoid complex terminology\n" +
            "3. Structure your answers with bullet points or numbered steps when appropriate\n" +
            "4. For questions about process or communications, clearly state WHO should do WHAT and HOW\n" +
            "5. For questions about clauses, state the clause number and brief summary first, then explain in practical terms\n" +
            "6. Be specific about the actions required by different parties (Contractor, Subcontractor, Project Manager)\n" +
            "7. Always conclude with practical implications or next steps\n\n" +
            "Keep answers focused on practical NEC4 contract management guidance."
        },
        {
          role: "user",
          content: question
        }
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Error in OpenAI request:", error);
    return "Sorry, I encountered an error processing your request. Please try again later.";
  }
}

// Function to analyze documents for potential contract issues
async function analyzeContractDocument(documentText: string): Promise<{
  issues: string[],
  recommendations: string[]
}> {
  try {
    const prompt = `
    Analyze the following NEC4 construction contract document extract for specific practical issues:
    
    ${documentText}
    
    Provide a structured analysis with:
    1. Clear, specific issues that could impact project delivery or create liability
    2. Practical, actionable recommendations for addressing each issue
    3. For each issue, identify which party (Contractor, Subcontractor, Project Manager) should take action
    
    Focus on clarity and practical application. Avoid vague statements.
    Format your response as JSON with 'issues' and 'recommendations' arrays.
    `;

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

    const parsedResponse = JSON.parse(response.choices[0].message.content || "{}");
    return {
      issues: parsedResponse.issues || [],
      recommendations: parsedResponse.recommendations || []
    };
  } catch (error) {
    console.error("Error in document analysis:", error);
    return {
      issues: ["Error analyzing document"],
      recommendations: ["Please try again later or contact support"]
    };
  }
}

export { askContractAssistant, analyzeContractDocument };
