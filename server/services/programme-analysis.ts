import { OpenAI } from "openai";
import { db } from '../db';
import { 
  programmes, 
  programmeActivities, 
  programmeAnalyses,
  activityRelationships
} from '@shared/schema';
import { eq } from 'drizzle-orm';

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.warn("OpenAI API key not found. AI-powered programme analysis will be unavailable.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze a programme for quality, issues, and NEC4 compliance
 * @param programmeId ID of the programme to analyze
 */
export async function analyzeProgramme(programmeId: number) {
  try {
    console.log(`Analyzing programme ID: ${programmeId}`);
    
    // Fetch programme and activities
    const programme = await db.query.programmes.findFirst({
      where: eq(programmes.id, programmeId),
    });
    
    if (!programme) {
      throw new Error(`Programme with ID ${programmeId} not found`);
    }
    
    // Fetch all activities for this programme
    const activities = await db.select().from(programmeActivities)
      .where(eq(programmeActivities.programmeId, programmeId));
      
    // Fetch all relationships for this programme's activities
    const activityIds = activities.map(activity => activity.id);
    const relationships = await db.select().from(activityRelationships)
      .where(
        activityIds.length > 0 ? 
          db.or(
            db.inArray(activityRelationships.predecessorId, activityIds),
            db.inArray(activityRelationships.successorId, activityIds)
          ) : 
          eq(activityRelationships.id, -1) // No activities, so no relationships (dummy condition)
      );
    
    // Prepare data for analysis
    const programmeData = {
      name: programme.name,
      version: programme.version,
      plannedCompletionDate: programme.plannedCompletionDate,
      activities: activities.map(activity => ({
        id: activity.id,
        externalId: activity.externalId,
        name: activity.name,
        description: activity.description,
        startDate: activity.startDate,
        endDate: activity.endDate,
        duration: activity.duration,
        percentComplete: activity.percentComplete,
        isCritical: activity.isCritical,
        totalFloat: activity.totalFloat,
        milestone: activity.milestone,
        wbsCode: activity.wbsCode,
      })),
      relationships: relationships.map(rel => ({
        predecessorId: rel.predecessorId,
        successorId: rel.successorId,
        type: rel.type,
        lag: rel.lag,
      })),
    };
    
    // If no OpenAI API key, perform basic analysis without AI
    if (!process.env.OPENAI_API_KEY) {
      return performBasicAnalysis(programmeData);
    }
    
    // Perform AI-powered analysis
    const prompt = `
      As an NEC4 programme expert, analyze this construction programme in detail:
      
      ${JSON.stringify(programmeData, null, 2)}
      
      Your analysis should include:
      1. Overall programme quality assessment (score out of 100)
      2. Identification of any schedule issues (logical problems, unrealistic durations, etc.)
      3. NEC4 compliance check specifically for clauses 31 and 32
      4. Recommendations for improvement
      
      Format your response as JSON with the following structure:
      {
        "qualityScore": number,
        "criticalPathLength": number,
        "scheduleRisk": "low" | "medium" | "high",
        "issuesFound": [{ 
          "severity": "low" | "medium" | "high", 
          "category": string, 
          "description": string, 
          "activities": number[] 
        }],
        "nec4Compliance": {
          "clause31": boolean,
          "clause32": boolean,
          "overallCompliant": boolean,
          "issues": string[]
        },
        "recommendations": string[]
      }
    `;
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    
    const analysisResult = JSON.parse(response.choices[0].message.content);
    
    // Store analysis in database
    const [analysis] = await db.insert(programmeAnalyses).values({
      programmeId,
      qualityScore: analysisResult.qualityScore,
      criticalPathLength: analysisResult.criticalPathLength,
      scheduleRisk: analysisResult.scheduleRisk,
      issuesFound: analysisResult.issuesFound,
      nec4Compliance: analysisResult.nec4Compliance,
      recommendations: analysisResult.recommendations,
    }).returning();
    
    return {
      ...analysisResult,
      id: analysis.id,
      analysisDate: analysis.analysisDate,
    };
    
  } catch (error: any) {
    console.error('Error analyzing programme:', error);
    throw new Error(`Failed to analyze programme: ${error.message}`);
  }
}

/**
 * Perform basic analysis without using AI
 * This is a fallback when no OpenAI API key is available
 */
function performBasicAnalysis(programmeData: any) {
  const activities = programmeData.activities;
  const relationships = programmeData.relationships;
  
  // Calculate basic metrics
  const totalActivities = activities.length;
  const milestones = activities.filter(a => a.milestone).length;
  const criticalActivities = activities.filter(a => a.isCritical).length;
  
  // Check for activities without predecessors (except the first few)
  const activitiesWithoutPredecessors = activities.filter(activity => {
    return !relationships.some(rel => rel.successorId === activity.id);
  }).length;
  
  // Check for activities without successors (except the last few)
  const activitiesWithoutSuccessors = activities.filter(activity => {
    return !relationships.some(rel => rel.predecessorId === activity.id);
  }).length;
  
  // Calculate quality score based on basic metrics
  let qualityScore = 70; // Base score
  
  // Reduce score for disconnected activities
  if (activities.length > 0) {
    const disconnectedPercentage = (activitiesWithoutPredecessors + activitiesWithoutSuccessors) / (activities.length * 2);
    qualityScore -= Math.round(disconnectedPercentage * 30);
  }
  
  // Check if critical path is defined
  if (criticalActivities === 0) {
    qualityScore -= 20;
  }
  
  // Ensure quality score is between 0 and 100
  qualityScore = Math.max(0, Math.min(100, qualityScore));
  
  // Determine schedule risk based on quality score
  let scheduleRisk: 'low' | 'medium' | 'high';
  if (qualityScore >= 70) {
    scheduleRisk = 'low';
  } else if (qualityScore >= 40) {
    scheduleRisk = 'medium';
  } else {
    scheduleRisk = 'high';
  }
  
  // Assess basic NEC4 compliance
  const hasActivities = activities.length > 0;
  const hasMilestones = milestones > 0;
  const hasCriticalPath = criticalActivities > 0;
  
  const clause31Compliance = hasActivities && hasMilestones && hasCriticalPath;
  
  // Build the analysis result
  const analysisResult = {
    qualityScore,
    criticalPathLength: criticalActivities,
    scheduleRisk,
    issuesFound: [
      {
        severity: 'medium' as const,
        category: 'Network Logic',
        description: `${activitiesWithoutPredecessors} activities without predecessors and ${activitiesWithoutSuccessors} activities without successors.`,
        activities: []
      }
    ],
    nec4Compliance: {
      clause31: clause31Compliance,
      clause32: true, // Assume true for basic analysis
      overallCompliant: clause31Compliance,
      issues: !clause31Compliance ? ['Programme missing required elements per clause 31 (critical path, key dates, etc.)'] : []
    },
    recommendations: [
      'Review network logic to ensure all activities are properly connected',
      'Ensure critical path is properly defined',
      'Add key milestones to track project progress',
      'Include total float values for all activities'
    ]
  };
  
  return analysisResult;
}