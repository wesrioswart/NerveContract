import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { askContractAssistant } from "../utils/openai";

// Validation schema for form population requests
const formPopulationSchema = z.object({
  projectId: z.number(),
  formType: z.string(),
  currentData: z.record(z.any()).optional()
});

// Types of forms the AI can populate
type FormType = 
  | "early-warning" 
  | "compensation-event" 
  | "instruction" 
  | "technical-query"
  | "non-conformance"
  | "payment-application";

/**
 * Generate AI-populated form data for various NEC4 forms
 */
export async function populateForm(req: Request, res: Response) {
  try {
    // Validate request data
    const { projectId, formType, currentData } = formPopulationSchema.parse(req.body);
    
    // Get project data for context
    const project = await storage.getProject(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    // Get relevant project data to provide context to the AI
    const [compensationEvents, earlyWarnings] = await Promise.all([
      storage.getCompensationEventsByProject(projectId),
      storage.getEarlyWarningsByProject(projectId)
    ]);
    
    // Build context for the AI
    let prompt = "";
    
    switch (formType as FormType) {
      case "early-warning":
        prompt = buildEarlyWarningPrompt(project, earlyWarnings, currentData);
        break;
      case "compensation-event":
        prompt = buildCompensationEventPrompt(project, compensationEvents, earlyWarnings, currentData);
        break;
      case "instruction":
        prompt = buildInstructionPrompt(project, compensationEvents, currentData);
        break;
      case "technical-query":
        prompt = buildTechnicalQueryPrompt(project, currentData);
        break;
      case "non-conformance":
        prompt = buildNonConformancePrompt(project, currentData);
        break;
      case "payment-application":
        prompt = buildPaymentApplicationPrompt(project, currentData);
        break;
      default:
        return res.status(400).json({ message: "Unsupported form type" });
    }
    
    // Get AI response
    const aiResponse = await askContractAssistant(prompt);
    
    // Parse JSON response from AI
    try {
      const formData = extractJsonFromAiResponse(aiResponse);
      
      // Return populated form data
      return res.status(200).json({ 
        formData,
        message: "Form data generated successfully" 
      });
    } catch (jsonError) {
      console.error("Error parsing AI response as JSON:", jsonError);
      return res.status(500).json({ 
        message: "Error parsing AI response",
        rawResponse: aiResponse
      });
    }
  } catch (error) {
    console.error("Error in form population:", error);
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
}

/**
 * Extracts JSON from AI response which might contain explanatory text
 */
function extractJsonFromAiResponse(response: string): any {
  // Find JSON content between triple backticks if present
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch && jsonMatch[1]) {
    return JSON.parse(jsonMatch[1]);
  }
  
  // Try to find any JSON object in the response
  const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    return JSON.parse(jsonObjectMatch[0]);
  }
  
  throw new Error("No valid JSON found in AI response");
}

/**
 * Build prompt for early warning form
 */
function buildEarlyWarningPrompt(
  project: any, 
  existingEarlyWarnings: any[], 
  currentData?: Record<string, any>
): string {
  return `You are an expert NEC4 contract assistant helping to populate an Early Warning Notification form.
  
Project Context:
- Project Name: ${project.name}
- Contract Reference: ${project.contractReference}
- Client: ${project.clientName}
${existingEarlyWarnings.length > 0 
  ? `- There are already ${existingEarlyWarnings.length} early warnings on this project` 
  : '- This will be the first early warning on this project'
}

${currentData && Object.keys(currentData).length > 0 
  ? `The user has already entered the following information:
${Object.entries(currentData).map(([key, value]) => `- ${key}: ${value}`).join('\n')}` 
  : 'The user has not entered any information yet.'
}

According to NEC4 clause 15, an early warning notification should be given by the Contractor or the Project Manager as soon as either becomes aware of any matter which could:
- increase the total of the Prices,
- delay Completion,
- delay meeting a Key Date, or
- impair the performance of the works in use.

Based on this context, generate a complete early warning notification form with the following fields:
- reference: A unique identifier (e.g., "EW-001")
- description: A clear description of the issue and potential impact
- status: Should be "Open" for a new early warning
- mitigationPlan: Suggested actions to mitigate the issue
- ownerId: Who should own this early warning (user ID)

Respond with ONLY a JSON object containing these fields.`;
}

/**
 * Build prompt for compensation event form
 */
function buildCompensationEventPrompt(
  project: any,
  existingCEs: any[],
  earlyWarnings: any[],
  currentData?: Record<string, any>
): string {
  // Get relevant early warnings that might be related to this CE
  const relevantEWs = earlyWarnings
    .filter(ew => ew.status !== 'Closed')
    .slice(0, 3);

  return `You are an expert NEC4 contract assistant helping to populate a Compensation Event notification form.
  
Project Context:
- Project Name: ${project.name}
- Contract Reference: ${project.contractReference}
- Client: ${project.clientName}
${existingCEs.length > 0 
  ? `- There are already ${existingCEs.length} compensation events on this project` 
  : '- This will be the first compensation event on this project'
}

${relevantEWs.length > 0 
  ? `Relevant Early Warnings:
${relevantEWs.map(ew => `- ${ew.reference}: ${ew.description.substring(0, 100)}...`).join('\n')}` 
  : 'There are no relevant open early warnings.'
}

${currentData && Object.keys(currentData).length > 0 
  ? `The user has already entered the following information:
${Object.entries(currentData).map(([key, value]) => `- ${key}: ${value}`).join('\n')}` 
  : 'The user has not entered any information yet.'
}

According to NEC4, a compensation event could arise from various situations including:
- Changes to the Scope/Works Information
- Employer's or Project Manager's actions or lack of actions
- Weather conditions exceeding weather data
- Physical conditions which an experienced contractor would have judged to have such a small chance of occurring
- Etc.

Based on this context, generate a complete compensation event notification with the following fields:
- reference: A unique identifier (e.g., "CE-001")
- title: A short, descriptive title
- description: Detailed description of the event and its impact
- clauseReference: The relevant NEC4 clause(s) that justify this as a compensation event (e.g., "60.1(1)")
- estimatedValue: Estimated financial impact (in £)
- status: Should be "Notification" for a new CE
- responseDeadline: When a response is needed (default to 1 week from now)

Respond with ONLY a JSON object containing these fields.`;
}

/**
 * Build prompt for instruction form
 */
function buildInstructionPrompt(
  project: any,
  compensationEvents: any[],
  currentData?: Record<string, any>
): string {
  return `You are an expert NEC4 contract assistant helping to populate a Project Manager's Instruction form.
  
Project Context:
- Project Name: ${project.name}
- Contract Reference: ${project.contractReference}
- Client: ${project.clientName}

${currentData && Object.keys(currentData).length > 0 
  ? `The user has already entered the following information:
${Object.entries(currentData).map(([key, value]) => `- ${key}: ${value}`).join('\n')}` 
  : 'The user has not entered any information yet.'
}

According to NEC4, a Project Manager's Instruction (PMI) is a formal direction given by the Project Manager to the Contractor. Common types of instructions include:
- Changes to the Scope/Works Information (Clause 14.3)
- Accepting or not accepting a design submitted by the Contractor (Clause 21.2)
- Changing a Key Date (Clause 30.3)
- Changing the Completion Date (Clause 32.2)
- Changing the Prices, the Completion Date or a Key Date if a compensation event occurs (Clause 65.1)

Based on this context, generate a complete Project Manager's Instruction with the following fields:
- reference: A unique identifier (e.g., "PMI-001")
- title: A short, descriptive title
- description: Clear and detailed description of the instruction
- clauseReference: The relevant NEC4 clause that authorizes this instruction
- isCompensationEvent: Boolean indicating if this instruction constitutes a compensation event
- requiredResponseDate: When a response is needed from the Contractor (if applicable)

Respond with ONLY a JSON object containing these fields.`;
}

/**
 * Build prompt for technical query form
 */
function buildTechnicalQueryPrompt(
  project: any,
  currentData?: Record<string, any>
): string {
  return `You are an expert NEC4 contract assistant helping to populate a Technical Query form.
  
Project Context:
- Project Name: ${project.name}
- Contract Reference: ${project.contractReference}
- Client: ${project.clientName}

${currentData && Object.keys(currentData).length > 0 
  ? `The user has already entered the following information:
${Object.entries(currentData).map(([key, value]) => `- ${key}: ${value}`).join('\n')}` 
  : 'The user has not entered any information yet.'
}

A Technical Query (TQ) is used when the Contractor needs clarification on technical aspects of the design, specification, or works information.

Based on this context, generate a complete Technical Query with the following fields:
- reference: A unique identifier (e.g., "TQ-001")
- question: A clear, specific technical question
- status: Should be "Open" for a new query
- drawingReferences: Any relevant drawing references
- specificationReferences: Any relevant specification references

Respond with ONLY a JSON object containing these fields.`;
}

/**
 * Build prompt for non-conformance report form
 */
function buildNonConformancePrompt(
  project: any,
  currentData?: Record<string, any>
): string {
  return `You are an expert NEC4 contract assistant helping to populate a Non-Conformance Report form.
  
Project Context:
- Project Name: ${project.name}
- Contract Reference: ${project.contractReference}
- Client: ${project.clientName}

${currentData && Object.keys(currentData).length > 0 
  ? `The user has already entered the following information:
${Object.entries(currentData).map(([key, value]) => `- ${key}: ${value}`).join('\n')}` 
  : 'The user has not entered any information yet.'
}

A Non-Conformance Report (NCR) is used to document work that does not meet the requirements of the contract, specifications, or quality standards.

Based on this context, generate a complete Non-Conformance Report with the following fields:
- reference: A unique identifier (e.g., "NCR-001")
- description: A clear description of the non-conforming work
- location: Where the non-conformance was found
- status: Should be "Open" for a new NCR
- correctiveAction: Suggested actions to correct the issue

Respond with ONLY a JSON object containing these fields.`;
}

/**
 * Compare programmes and analyze changes/impacts
 */
export async function compareProgrammes(req: Request, res: Response) {
  try {
    const { baselineProgrammeId, currentProgrammeId } = req.body;
    
    // Validate inputs
    if (!baselineProgrammeId || !currentProgrammeId) {
      return res.status(400).json({ message: "Both baseline and current programme IDs are required" });
    }
    
    // Get programme data
    const [baselineProgramme, currentProgramme] = await Promise.all([
      storage.getProgramme(baselineProgrammeId),
      storage.getProgramme(currentProgrammeId)
    ]);
    
    // Check programmes exist
    if (!baselineProgramme || !currentProgramme) {
      return res.status(404).json({ 
        message: "One or both programmes not found",
        baselineFound: !!baselineProgramme,
        currentFound: !!currentProgramme
      });
    }
    
    // Get activities for both programmes
    const [baselineActivities, currentActivities] = await Promise.all([
      storage.getProgrammeActivities(baselineProgrammeId),
      storage.getProgrammeActivities(currentProgrammeId)
    ]);
    
    // Perform comparison analysis
    const analysis = {
      programmeDifference: {
        name: baselineProgramme.name === currentProgramme.name ? "Unchanged" : "Changed",
        version: baselineProgramme.version === currentProgramme.version ? "Unchanged" : "Changed",
        completionDateDelta: calculateDateDifference(
          baselineProgramme.plannedCompletionDate,
          currentProgramme.plannedCompletionDate
        )
      },
      activities: {
        added: currentActivities.filter(ca => 
          !baselineActivities.some(ba => ba.externalId === ca.externalId)).length,
        removed: baselineActivities.filter(ba => 
          !currentActivities.some(ca => ca.externalId === ba.externalId)).length,
        modified: currentActivities.filter(ca => {
          const baselineActivity = baselineActivities.find(ba => ba.externalId === ca.externalId);
          if (!baselineActivity) return false;
          return (
            ca.startDate.toString() !== baselineActivity.startDate.toString() ||
            ca.endDate.toString() !== baselineActivity.endDate.toString() ||
            ca.duration !== baselineActivity.duration
          );
        }).length,
        unchanged: currentActivities.filter(ca => {
          const baselineActivity = baselineActivities.find(ba => ba.externalId === ca.externalId);
          if (!baselineActivity) return false;
          return (
            ca.startDate.toString() === baselineActivity.startDate.toString() &&
            ca.endDate.toString() === baselineActivity.endDate.toString() &&
            ca.duration === baselineActivity.duration
          );
        }).length
      },
      criticalPath: {
        changed: hasCriticalPathChanged(baselineActivities, currentActivities),
        newCriticalActivities: currentActivities
          .filter(ca => ca.isCritical)
          .filter(ca => {
            const baselineActivity = baselineActivities.find(ba => ba.externalId === ca.externalId);
            return !baselineActivity || !baselineActivity.isCritical;
          })
          .map(a => a.name),
        removedFromCritical: baselineActivities
          .filter(ba => ba.isCritical)
          .filter(ba => {
            const currentActivity = currentActivities.find(ca => ca.externalId === ba.externalId);
            return !currentActivity || !currentActivity.isCritical;
          })
          .map(a => a.name)
      },
      totalFloat: {
        decreased: currentActivities.filter(ca => {
          const baselineActivity = baselineActivities.find(ba => ba.externalId === ca.externalId);
          if (!baselineActivity) return false;
          return (ca.totalFloat || 0) < (baselineActivity.totalFloat || 0);
        }).length,
        increased: currentActivities.filter(ca => {
          const baselineActivity = baselineActivities.find(ba => ba.externalId === ca.externalId);
          if (!baselineActivity) return false;
          return (ca.totalFloat || 0) > (baselineActivity.totalFloat || 0);
        }).length
      },
      keyConcerns: [] as string[]
    };
    
    // Identify key concerns
    const keyConcerns: string[] = [];
    
    if (analysis.programmeDifference.completionDateDelta > 0) {
      keyConcerns.push(`Completion date delayed by ${analysis.programmeDifference.completionDateDelta} days`);
    }
    
    if (analysis.criticalPath.changed) {
      keyConcerns.push("Critical path has changed");
    }
    
    if (analysis.totalFloat.decreased > analysis.totalFloat.increased) {
      keyConcerns.push("Overall reduction in float across the programme");
    }
    
    if (analysis.activities.added > 0 && analysis.activities.removed > 0) {
      keyConcerns.push(`Significant scope changes: ${analysis.activities.added} activities added, ${analysis.activities.removed} removed`);
    }
    
    // Add key concerns to analysis
    analysis.keyConcerns = keyConcerns;
    
    // Return analysis
    return res.status(200).json({ analysis });
    
  } catch (error) {
    console.error("Error comparing programmes:", error);
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
}

/**
 * Calculate difference between two dates in days
 */
function calculateDateDifference(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Return positive if date2 is later than date1, negative otherwise
  return d2 > d1 ? diffDays : -diffDays;
}

/**
 * Build prompt for payment application form
 */
function buildPaymentApplicationPrompt(
  project: any,
  currentData?: Record<string, any>
): string {
  return `You are an expert NEC4 contract assistant helping to populate a Payment Application form.
  
Project Context:
- Project Name: ${project.name}
- Contract Reference: ${project.contractReference}
- Client: ${project.clientName}

${currentData && Object.keys(currentData).length > 0 
  ? `The user has already entered the following information:
${Object.entries(currentData).map(([key, value]) => `- ${key}: ${value}`).join('\n')}` 
  : 'The user has not entered any information yet.'
}

According to NEC4 clause 50, the contractor submits payment applications to the Project Manager at assessment intervals. 
A payment application should include:
- The amount due and how it was calculated
- Details of how this payment relates to the Accepted Programme
- Supporting documentation

Based on this context, generate a complete Payment Application with the following fields:
- projectName: The project name (use the provided context)
- applicationNumber: A unique application number (e.g., "PA-001")
- applicationDate: Today's date
- contractReference: The contract reference (use the provided context)
- contractorName: The name of the contractor submitting the application
- paymentPeriod: The period this payment covers (e.g., "1 Mar 2025 - 31 Mar 2025")
- paymentDueDate: When payment is due (typically 3 weeks from application date)
- previouslyPaid: Amount previously paid on the project (in £)
- paymentItems: An array of payment items with the following structure:
  - description: Description of the work completed
  - workSection: The section of work this item relates to
  - amount: The amount claimed for this item (in £)
- subTotal: The sum of all payment items
- vat: VAT amount (20% of subtotal)
- deductions: Any deductions to be applied
- retentionPercentage: Retention percentage (typically 3% or 5%)
- retentionAmount: Calculated retention amount
- totalDue: Calculated total due (subTotal + vat - deductions - retention)
- supportingDocuments: References to any supporting documentation
- notes: Any additional notes
- applicantName: Name of the person submitting the application
- applicantRole: Role of the person submitting the application

Respond with ONLY a JSON object containing these fields.`;
}

/**
 * Check if critical path has changed
 */
function hasCriticalPathChanged(
  baselineActivities: any[], 
  currentActivities: any[]
): boolean {
  const baselineCritical = baselineActivities
    .filter(a => a.isCritical)
    .map(a => a.externalId)
    .sort();
    
  const currentCritical = currentActivities
    .filter(a => a.isCritical)
    .map(a => a.externalId)
    .sort();
  
  if (baselineCritical.length !== currentCritical.length) {
    return true;
  }
  
  for (let i = 0; i < baselineCritical.length; i++) {
    if (baselineCritical[i] !== currentCritical[i]) {
      return true;
    }
  }
  
  return false;
}