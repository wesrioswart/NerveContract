import { parseString } from 'xml2js';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { 
  programmes, 
  programmeActivities, 
  activityRelationships,
  programmeMilestones
} from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Parse an XML file from MS Project
 * @param filePath Path to the XML file
 * @param programmeId ID of the programme record to associate with
 */
export async function parseMSProjectXML(filePath: string, programmeId: number): Promise<{
  success: boolean;
  activityCount: number;
  milestoneCount: number;
  errorMessage?: string;
}> {
  return new Promise((resolve, reject) => {
    try {
      const xmlData = fs.readFileSync(filePath, 'utf8');
      
      parseString(xmlData, { explicitArray: false }, async (err, result) => {
        if (err) {
          return reject({
            success: false,
            activityCount: 0,
            milestoneCount: 0,
            errorMessage: `Error parsing XML: ${err.message}`
          });
        }
        
        try {
          // Check for expected structure
          if (!result.Project || !result.Project.Tasks || !result.Project.Tasks.Task) {
            return reject({
              success: false,
              activityCount: 0,
              milestoneCount: 0,
              errorMessage: "Invalid MS Project XML format: Missing Task structure"
            });
          }
          
          // Get programme for updating planned completion date
          const [programme] = await db.select().from(programmes).where(eq(programmes.id, programmeId));
          if (!programme) {
            return reject({
              success: false,
              activityCount: 0,
              milestoneCount: 0,
              errorMessage: `Programme with ID ${programmeId} not found`
            });
          }
          
          // Get the project finish date if available
          let plannedCompletionDate = programme.plannedCompletionDate;
          if (result.Project.FinishDate) {
            plannedCompletionDate = new Date(result.Project.FinishDate);
            
            // Update the programme with the planned completion date
            await db.update(programmes)
              .set({ plannedCompletionDate })
              .where(eq(programmes.id, programmeId));
          }
          
          // Normalize tasks to array
          const tasks = Array.isArray(result.Project.Tasks.Task) 
            ? result.Project.Tasks.Task 
            : [result.Project.Tasks.Task];
            
          // Process tasks/activities
          const activityIdMap = new Map<string, number>(); // Maps external IDs to internal IDs
          const milestones = [];
          
          for (const task of tasks) {
            // Skip summary tasks in first pass (they'll be processed after all tasks are added)
            if (task.Summary === 'true') {
              continue;
            }
            
            const isMilestone = task.Milestone === 'true';
            const startDate = new Date(task.Start);
            const endDate = new Date(task.Finish);
            
            // Insert activity into database
            const [activity] = await db.insert(programmeActivities).values({
              programmeId,
              externalId: task.ID,
              name: task.Name,
              description: task.Notes || '',
              startDate,
              endDate,
              duration: parseInt(task.Duration || '0', 10),
              percentComplete: parseInt(task.PercentComplete || '0', 10),
              isCritical: task.Critical === 'true',
              totalFloat: parseInt(task.TotalSlack || '0', 10),
              wbsCode: task.WBS || '',
              milestone: isMilestone,
            }).returning();
            
            // Store the mapping of external ID to internal ID
            activityIdMap.set(task.ID, activity.id);
            
            // If this is a milestone, track it for later insertion to milestones table
            if (isMilestone) {
              milestones.push({
                programmeId,
                activityId: activity.id,
                name: task.Name,
                plannedDate: startDate,
                status: task.PercentComplete === '100' ? 'Completed' : 'Not Started',
                isKeyDate: false, // Default, user can update later
                affectsCompletionDate: task.Critical === 'true',
                projectId: programme.projectId,
              });
            }
          }
          
          // Process summary tasks in second pass
          for (const task of tasks) {
            if (task.Summary === 'true') {
              const [activity] = await db.insert(programmeActivities).values({
                programmeId,
                externalId: task.ID,
                name: task.Name,
                description: task.Notes || '',
                startDate: new Date(task.Start),
                endDate: new Date(task.Finish),
                duration: parseInt(task.Duration || '0', 10),
                percentComplete: parseInt(task.PercentComplete || '0', 10),
                isCritical: task.Critical === 'true',
                totalFloat: parseInt(task.TotalSlack || '0', 10),
                wbsCode: task.WBS || '',
                milestone: false,
              }).returning();
              
              // Store the mapping of external ID to internal ID
              activityIdMap.set(task.ID, activity.id);
            }
          }
          
          // Process hierarchical relationships (parent/child)
          for (const task of tasks) {
            if (task.OutlineNumber && task.OutlineLevel > 1) {
              // Find the parent task
              const parentTask = tasks.find(parentTask => {
                // Check if this task could be a parent based on outline level
                if (parseInt(parentTask.OutlineLevel, 10) < parseInt(task.OutlineLevel, 10)) {
                  // Check if the outline number is a prefix of the child's outline number
                  return task.OutlineNumber.startsWith(parentTask.OutlineNumber + '.');
                }
                return false;
              });
              
              if (parentTask && activityIdMap.has(parentTask.ID) && activityIdMap.has(task.ID)) {
                // Update the parent ID for this task
                await db.update(programmeActivities)
                  .set({ 
                    parentId: activityIdMap.get(parentTask.ID) 
                  })
                  .where(eq(programmeActivities.id, activityIdMap.get(task.ID)!));
              }
            }
          }
          
          // Process dependencies/relationships
          if (result.Project.Links && result.Project.Links.Link) {
            const links = Array.isArray(result.Project.Links.Link) 
              ? result.Project.Links.Link 
              : [result.Project.Links.Link];
              
            for (const link of links) {
              const predecessorId = activityIdMap.get(link.From);
              const successorId = activityIdMap.get(link.To);
              
              if (predecessorId && successorId) {
                await db.insert(activityRelationships).values({
                  predecessorId,
                  successorId,
                  type: link.Type || 'FS',
                  lag: parseInt(link.Lag || '0', 10),
                });
              }
            }
          }
          
          // Insert milestones into database
          if (milestones.length > 0) {
            await db.insert(programmeMilestones).values(milestones);
          }
          
          resolve({
            success: true,
            activityCount: activityIdMap.size,
            milestoneCount: milestones.length
          });
        } catch (error: any) {
          reject({
            success: false,
            activityCount: 0,
            milestoneCount: 0,
            errorMessage: `Error processing XML data: ${error.message}`
          });
        }
      });
    } catch (error: any) {
      reject({
        success: false,
        activityCount: 0,
        milestoneCount: 0,
        errorMessage: `Error reading file: ${error.message}`
      });
    }
  });
}

/**
 * Main parser function that detects file type and calls the appropriate parser
 */
export async function parseProgrammeFile(filePath: string, fileType: 'xml' | 'msp' | 'xer', programmeId: number) {
  try {
    console.log(`Parsing programme file: ${filePath} (${fileType})`);
    
    switch (fileType) {
      case 'xml':
        return await parseMSProjectXML(filePath, programmeId);
        
      case 'msp':
        // For .mpp files, we'd use an MS Project MPP parsing library
        // As a fallback for Phase 1, we'll try to convert it to XML first
        throw new Error('MPP parsing not implemented in Phase 1');
        
      case 'xer':
        // For .xer files, we'd use a Primavera XER parsing library
        throw new Error('XER parsing not implemented in Phase 1');
        
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error: any) {
    console.error('Error parsing programme file:', error);
    return {
      success: false,
      activityCount: 0,
      milestoneCount: 0,
      errorMessage: error.message || 'Unknown error'
    };
  }
}