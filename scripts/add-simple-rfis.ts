import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function addSimpleRFIs() {
  // First delete existing RFIs
  console.log('Deleting existing RFIs...');
  await db.execute(sql`DELETE FROM "rfi"`);
  console.log('Deleted existing RFIs');
  
  // Get project ID 
  const projectResult = await db.execute(sql`
    SELECT id FROM "projects" WHERE id = 1
  `);
  
  if (!projectResult.rows.length) {
    console.error('Project with ID 1 not found');
    return;
  }
  
  const projectId = projectResult.rows[0].id;
  
  // Get period ID (for Q2 2024)
  const periodResult = await db.execute(sql`
    SELECT id FROM "project_period" WHERE name = 'Q2 2024'
  `);
  
  if (!periodResult.rows.length) {
    console.error('Period Q2 2024 not found');
    return;
  }
  
  const periodId = periodResult.rows[0].id;
  
  // Get user ID
  const userResult = await db.execute(sql`
    SELECT id FROM "users" LIMIT 1
  `);
  
  const userId = userResult.rows.length ? userResult.rows[0].id : null;
  
  console.log('Adding Open RFIs...');
  // Add Open RFIs
  await db.execute(sql`
    INSERT INTO "rfi" 
    ("project_id", "reference", "title", "description", "transmittal_method", 
     "submission_date", "contractual_reply_period", "planned_response_date", 
     "status", "ce_status", "period_id", "created_by")
    VALUES
    (${projectId}, 'RFI-001', 'Foundation Detail Clarification', 
     'Please clarify foundation details for Area B', 'Email', 
     '2024-04-20', 7, '2024-04-27', 'Open', 'Under Review', ${periodId}, ${userId}),
    (${projectId}, 'RFI-002', 'Mechanical System Routing', 
     'HVAC ductwork conflicts with beams B2 and B3', 'Email', 
     '2024-04-15', 10, '2024-04-25', 'Open', 'Under Review', ${periodId}, ${userId}),
    (${projectId}, 'RFI-003', 'Window Installation Detail', 
     'Need detail for curved facade section', 'Email', 
     '2024-04-22', 7, '2024-04-29', 'Open', 'Not a CE', ${periodId}, ${userId})
  `);
  
  console.log('Adding In Progress RFIs...');
  // Add In Progress RFIs
  await db.execute(sql`
    INSERT INTO "rfi" 
    ("project_id", "reference", "title", "description", "transmittal_method", 
     "submission_date", "contractual_reply_period", "planned_response_date", 
     "status", "ce_status", "period_id", "created_by")
    VALUES
    (${projectId}, 'RFI-004', 'Electrical Load Requirements', 
     'Temporary power exceeds specification', 'Email', 
     '2024-04-10', 10, '2024-04-20', 'In Progress', 'Under Review', ${periodId}, ${userId}),
    (${projectId}, 'RFI-005', 'Exterior Cladding Joints', 
     'Detail missing for expansion joints', 'Email', 
     '2024-04-12', 7, '2024-04-19', 'In Progress', 'CE Raised', ${periodId}, ${userId})
  `);
  
  console.log('Adding Responded RFIs...');
  // Add Responded RFIs
  await db.execute(sql`
    INSERT INTO "rfi" 
    ("project_id", "reference", "title", "description", "transmittal_method", 
     "submission_date", "contractual_reply_period", "planned_response_date", 
     "response_date", "response", "status", "ce_status", "period_id", "created_by")
    VALUES
    (${projectId}, 'RFI-006', 'Door Hardware Specification', 
     'Need clarification on hardware specs', 'Email', 
     '2024-04-05', 5, '2024-04-10', '2024-04-09', 
     'Hardware spec H-5.2 applies to fire-rated partitions only', 
     'Responded', 'Not a CE', ${periodId}, ${userId}),
    (${projectId}, 'RFI-007', 'Column Base Plate Detail', 
     'Need revised base plate detail', 'Email', 
     '2024-04-02', 7, '2024-04-09', '2024-04-08', 
     'See drawing S-502 for revised detail', 
     'Responded', 'PMI Issued', ${periodId}, ${userId})
  `);
  
  console.log('Adding Closed RFIs...');
  // Add Closed RFIs
  await db.execute(sql`
    INSERT INTO "rfi" 
    ("project_id", "reference", "title", "description", "transmittal_method", 
     "submission_date", "contractual_reply_period", "planned_response_date", 
     "response_date", "response", "status", "ce_status", "period_id", "created_by")
    VALUES
    (${projectId}, 'RFI-008', 'Floor Finish Transition', 
     'Need detail for carpet to vinyl transition', 'Email', 
     '2024-03-15', 5, '2024-03-20', '2024-03-18', 
     'Use transition strip TS-1 as per drawing A-501', 
     'Closed', 'Closed', ${periodId}, ${userId}),
    (${projectId}, 'RFI-009', 'Sprinkler Head Type', 
     'Confirm type for office ceiling areas', 'Email', 
     '2024-03-10', 7, '2024-03-17', '2024-03-15', 
     'Use pendant concealed type with white covers', 
     'Closed', 'Closed', ${periodId}, ${userId}),
    (${projectId}, 'RFI-010', 'Structural Support for Equipment', 
     'Roof units need additional support', 'Email', 
     '2024-03-20', 10, '2024-03-30', '2024-03-28', 
     'See new drawing S-205 for additional support', 
     'Closed', 'CE Approved', ${periodId}, ${userId})
  `);
  
  console.log('Successfully added RFI data');
}

async function main() {
  try {
    await addSimpleRFIs();
    console.log('Successfully completed adding RFI data');
    process.exit(0);
  } catch (error) {
    console.error('Error adding RFI data:', error);
    process.exit(1);
  }
}

main();