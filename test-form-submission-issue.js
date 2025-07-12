/**
 * Grok-powered form submission issue analysis
 * Deep investigation of the textarea form submission problem
 */

import OpenAI from "openai";

const openai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY 
});

async function analyzeFormSubmissionIssue() {
  console.log("🤖 Starting Grok Analysis of Form Submission Issue");
  
  const prompt = `
CRITICAL FORM SUBMISSION BUG ANALYSIS

PROBLEM DESCRIPTION:
- User types in a textarea field labeled "General Notes"
- Form unexpectedly submits and redirects to top of page
- Issue persists despite adding preventDefault() and stopPropagation()
- Multiple event handlers added but problem continues

ATTEMPTED FIXES:
1. Added onKeyDown with preventDefault() for Enter key
2. Added onKeyPress with preventDefault() for Enter key  
3. Added onInput with stopPropagation()
4. Added explicit form onSubmit with preventDefault()
5. Added type="button" to all interactive buttons

CURRENT CODE STRUCTURE:
- React Hook Form with zodResolver
- FormField wrapper around Textarea
- Textarea inside a form element
- Form has onSubmit={form.handleSubmit(handleSubmit)}

TECHNICAL CONTEXT:
- React with TypeScript
- shadcn/ui components
- react-hook-form
- Textarea component from shadcn/ui

ANALYZE THE ROOT CAUSE:
1. What could be causing form submission on textarea input?
2. Are there React Hook Form specific issues?
3. Could it be browser behavior or event bubbling?
4. What's the most likely cause given the symptoms?
5. What's the definitive fix that will work?

Provide a detailed technical analysis and exact solution.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are an expert React developer and form behavior specialist. Analyze this form submission bug with deep technical insight and provide definitive solutions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.1
    });

    console.log("🎯 GROK ANALYSIS RESULTS:");
    console.log("═".repeat(80));
    console.log(response.choices[0].message.content);
    console.log("═".repeat(80));

    return response.choices[0].message.content;
  } catch (error) {
    console.error("❌ Grok analysis failed:", error);
    return "Analysis failed - check XAI_API_KEY";
  }
}

async function runGrokFormDiagnostic() {
  console.log("🔍 GROK FORM SUBMISSION DIAGNOSTIC");
  console.log("═".repeat(60));
  
  const analysis = await analyzeFormSubmissionIssue();
  
  console.log("\n🏁 DIAGNOSTIC COMPLETE");
  console.log("Check the analysis above for the root cause and solution.");
  
  return analysis;
}

// Run the analysis
runGrokFormDiagnostic().catch(console.error);