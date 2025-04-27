import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkProjectsTable() {
  try {
    const result = await db.execute(sql`
      SELECT * FROM "projects" LIMIT 1
    `);
    return !!result.rows.length;
  } catch (error) {
    console.error('Error checking projects table:', error);
    return false;
  }
}

async function checkAndFixProjectPeriodsForeignKey() {
  try {
    // Check if project_period table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_tables WHERE tablename = 'project_period'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Creating project_period table...');
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "project_period" (
          "id" SERIAL PRIMARY KEY,
          "project_id" INTEGER NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "start_date" DATE NOT NULL,
          "end_date" DATE NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'Active',
          "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create index
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS "project_period_project_id_idx" ON "project_period"("project_id")
      `);
    }
    
    // Add foreign key if it doesn't exist
    try {
      await db.execute(sql`
        ALTER TABLE "project_period" 
        ADD CONSTRAINT fk_project_period_project 
        FOREIGN KEY ("project_id") 
        REFERENCES "projects"("id") ON DELETE CASCADE
      `);
      console.log('Added foreign key constraint to project_period');
    } catch (error) {
      // Constraint might already exist, which is fine
      console.log('Foreign key constraint might already exist');
    }
  } catch (error) {
    console.error('Error checking/fixing project_period table:', error);
  }
}

async function createRfiTable() {
  try {
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_tables WHERE tablename = 'rfi'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Creating RFI table...');
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "rfi" (
          "id" SERIAL PRIMARY KEY,
          "project_id" INTEGER NOT NULL,
          "reference" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "transmittal_method" TEXT NOT NULL,
          "submission_date" DATE NOT NULL,
          "contractual_reply_period" INTEGER NOT NULL,
          "planned_response_date" DATE NOT NULL,
          "response_date" DATE,
          "response" TEXT,
          "status" TEXT NOT NULL DEFAULT 'Open',
          "ce_status" TEXT,
          "ce_reference" TEXT,
          "period_id" INTEGER,
          "created_by" INTEGER,
          "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create index for faster searches
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS "rfi_project_id_idx" ON "rfi"("project_id")
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS "rfi_reference_idx" ON "rfi"("reference")
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS "rfi_status_idx" ON "rfi"("status")
      `);
      
      // Add foreign keys
      try {
        await db.execute(sql`
          ALTER TABLE "rfi" 
          ADD CONSTRAINT fk_rfi_project 
          FOREIGN KEY ("project_id") 
          REFERENCES "projects"("id") ON DELETE CASCADE
        `);
        
        await db.execute(sql`
          ALTER TABLE "rfi" 
          ADD CONSTRAINT fk_rfi_period 
          FOREIGN KEY ("period_id") 
          REFERENCES "project_period"("id")
        `);
        
        await db.execute(sql`
          ALTER TABLE "rfi" 
          ADD CONSTRAINT fk_rfi_user 
          FOREIGN KEY ("created_by") 
          REFERENCES "users"("id")
        `);
      } catch (error) {
        console.log('Foreign key constraints might already exist:', error);
      }
    }
  } catch (error) {
    console.error('Error creating RFI table:', error);
  }
}

async function seedProjectPeriods() {
  // Check if we already have periods
  const existingPeriods = await db.execute(sql`
    SELECT COUNT(*) FROM "project_period"
  `);
  
  if (parseInt(existingPeriods.rows[0].count) > 0) {
    console.log('Project periods already exist, skipping seeding');
    return;
  }
  
  console.log('Seeding project periods...');
  
  // Get the project ID
  const projectResult = await db.execute(sql`
    SELECT id FROM "projects" LIMIT 1
  `);
  
  if (!projectResult.rows.length) {
    console.error('No projects found in the database');
    return;
  }
  
  const projectId = projectResult.rows[0].id;
  
  // Seed periods
  await db.execute(sql`
    INSERT INTO "project_period" 
    ("project_id", "name", "description", "start_date", "end_date", "status")
    VALUES
    (${projectId}, 'Q1 2023', 'First quarter of 2023', '2023-01-01', '2023-03-31', 'Completed'),
    (${projectId}, 'Q2 2023', 'Second quarter of 2023', '2023-04-01', '2023-06-30', 'Completed'),
    (${projectId}, 'Q3 2023', 'Third quarter of 2023', '2023-07-01', '2023-09-30', 'Completed'),
    (${projectId}, 'Q4 2023', 'Fourth quarter of 2023', '2023-10-01', '2023-12-31', 'Completed'),
    (${projectId}, 'Q1 2024', 'First quarter of 2024', '2024-01-01', '2024-03-31', 'Completed'),
    (${projectId}, 'Q2 2024', 'Second quarter of 2024', '2024-04-01', '2024-06-30', 'Active'),
    (${projectId}, 'Q3 2024', 'Third quarter of 2024', '2024-07-01', '2024-09-30', 'Active'),
    (${projectId}, 'Q4 2024', 'Fourth quarter of 2024', '2024-10-01', '2024-12-31', 'Planned')
  `);
  
  console.log('Project periods seeded successfully');
}

async function seedRFIs() {
  // Check if we already have RFIs
  const existingRFIs = await db.execute(sql`
    SELECT COUNT(*) FROM "rfi"
  `);
  
  if (parseInt(existingRFIs.rows[0].count) > 0) {
    console.log('RFIs already exist, skipping seeding');
    return;
  }
  
  console.log('Seeding RFIs...');
  
  // Get the project ID
  const projectResult = await db.execute(sql`
    SELECT id FROM "projects" LIMIT 1
  `);
  
  if (!projectResult.rows.length) {
    console.error('No projects found in the database');
    return;
  }
  
  const projectId = projectResult.rows[0].id;
  
  // Get period IDs
  const periodResult = await db.execute(sql`
    SELECT id, name FROM "project_period" ORDER BY "start_date"
  `);
  
  if (!periodResult.rows.length) {
    console.error('No project periods found in the database');
    return;
  }
  
  const periods = periodResult.rows;
  
  // Get a user ID
  const userResult = await db.execute(sql`
    SELECT id FROM "users" LIMIT 1
  `);
  
  const userId = userResult.rows.length ? userResult.rows[0].id : null;
  
  // Current date for calculation
  const now = new Date();
  
  // Seed RFIs with different statuses
  // Responded RFIs
  await db.execute(sql`
    INSERT INTO "rfi" 
    ("project_id", "reference", "title", "description", "transmittal_method", 
     "submission_date", "contractual_reply_period", "planned_response_date", 
     "response_date", "response", "status", "ce_status", "ce_reference", "period_id", "created_by")
    VALUES
    (
      ${projectId}, 'RFI-001', 'Foundation Detail Clarification', 
      'Please provide clarification on the foundation details for Area B as there appears to be a discrepancy between the structural drawings and architectural plans.',
      'Email', '2023-01-15', 7, '2023-01-22', '2023-01-20',
      'The foundation details on structural drawing S-101 Rev C supersede the architectural plans. Please refer to detail 3 on sheet S-101 for the correct foundation specification.',
      'Responded', 'Not a CE', null, ${periods[0].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-002', 'Mechanical System Routing Query', 
      'The HVAC ductwork as shown in drawing M-203 conflicts with structural beams B2 and B3. Please advise on alternate routing or resolution.',
      'Email', '2023-02-10', 10, '2023-02-20', '2023-02-18',
      'Structural beam B3 can be notched as per detail 5 on S-310. Beam B2 cannot be modified - HVAC routing must be altered to go below beam B2 with a maximum deflection of 150mm.',
      'Responded', 'Raise a CE', 'CE-014', ${periods[0].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-007', 'Finish Schedule Discrepancy', 
      'Finish schedule on A-601 shows vinyl flooring in Room 235, but the room data sheets specify ceramic tile. Please confirm the correct finish.',
      'Email', '2023-05-05', 5, '2023-05-10', '2023-05-09',
      'Room 235 should have ceramic tile flooring as per the room data sheet. The finish schedule will be updated in the next revision.',
      'Responded', 'Not a CE', null, ${periods[1].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-010', 'Site Access Requirements', 
      'Please confirm the site access requirements for heavy equipment delivery during the concrete pour scheduled for next month.',
      'Email', '2023-09-12', 7, '2023-09-19', '2023-09-15',
      'Heavy equipment access is permitted via the north entrance between 7am and 3pm. All deliveries must be scheduled at least 48 hours in advance with the site manager.',
      'Responded', 'PMI Issued', 'PMI-023', ${periods[2].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-014', 'Electrical Load Requirements', 
      'The temporary power requirements for the testing phase seem to exceed what was originally specified. Can you confirm the maximum load expectations?',
      'Email', '2024-01-05', 10, '2024-01-15', '2024-01-13',
      'The maximum load requirement for the testing phase is 250kVA. This is indeed higher than originally specified. The contractor should provide a temporary generator if needed.',
      'Responded', 'NCE Raised', 'CE-053', ${periods[4].id}, ${userId}
    )
  `);
  
  // Open RFIs with various due dates
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);
  const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
  
  const twoDaysFromNow = new Date(today);
  twoDaysFromNow.setDate(today.getDate() + 2);
  const twoDaysFromNowStr = twoDaysFromNow.toISOString().split('T')[0];
  
  const fiveDaysFromNow = new Date(today);
  fiveDaysFromNow.setDate(today.getDate() + 5);
  const fiveDaysFromNowStr = fiveDaysFromNow.toISOString().split('T')[0];
  
  const tenDaysFromNow = new Date(today);
  tenDaysFromNow.setDate(today.getDate() + 10);
  const tenDaysFromNowStr = tenDaysFromNow.toISOString().split('T')[0];
  
  await db.execute(sql`
    INSERT INTO "rfi" 
    ("project_id", "reference", "title", "description", "transmittal_method", 
     "submission_date", "contractual_reply_period", "planned_response_date", 
     "response_date", "response", "status", "ce_status", "ce_reference", "period_id", "created_by")
    VALUES
    (
      ${projectId}, 'RFI-016', 'Revised Drainage Plan Approval', 
      'With the recent changes to the drainage layout, we need approval for the revised plan before proceeding with the underground work.',
      'Email', ${todayStr}, 5, ${threeDaysAgoStr}, 
      null, null, 'Open', 'Under Review', null, ${periods[5].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-017', 'Material Substitution Query', 
      'Due to supply chain issues, we propose substituting the specified cladding material with an alternative that meets the same specifications.',
      'Email', ${todayStr}, 7, ${yesterdayStr}, 
      null, null, 'Open', 'Under Review', null, ${periods[5].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-018', 'Window Installation Detail', 
      'Please clarify the window installation detail for the curved façade section as the standard detail doesn't address this unique condition.',
      'Email', ${todayStr}, 7, ${twoDaysFromNowStr}, 
      null, null, 'Open', 'Not a CE', null, ${periods[5].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-019', 'Fire Rating Requirement Clarification', 
      'Please confirm the fire rating requirements for the partition walls between unit types A and B as there is a discrepancy in the documentation.',
      'Email', ${todayStr}, 10, ${fiveDaysFromNowStr}, 
      null, null, 'Open', 'Under Review', null, ${periods[5].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-020', 'Roof Insulation Specification', 
      'The roof insulation specification refers to an outdated product. Please confirm if we should use the latest version or source the specified product.',
      'Email', ${todayStr}, 14, ${tenDaysFromNowStr}, 
      null, null, 'Open', 'Under Review', null, ${periods[5].id}, ${userId}
    )
  `);
  
  // Closed RFIs
  await db.execute(sql`
    INSERT INTO "rfi" 
    ("project_id", "reference", "title", "description", "transmittal_method", 
     "submission_date", "contractual_reply_period", "planned_response_date", 
     "response_date", "response", "status", "ce_status", "ce_reference", "period_id", "created_by")
    VALUES
    (
      ${projectId}, 'RFI-005', 'Reinforcement Specification', 
      'Drawing S-105 shows reinforcement grade as 500N but specification document mentions 460B. Please confirm which is correct.',
      'Email', '2023-03-20', 7, '2023-03-27', '2023-03-25',
      'Reinforcement grade 500N is correct. The specification will be updated in the next revision.',
      'Closed', 'Closed', null, ${periods[0].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-008', 'Door Hardware Conflict', 
      'The door hardware schedule conflicts with the security requirements for doors D112-D115. Please clarify the correct hardware set to be used.',
      'Email', '2023-06-15', 5, '2023-06-20', '2023-06-18',
      'Use hardware set H5 as described in the security specifications. The door schedule will be updated.',
      'Closed', 'Closed', 'CE-025', ${periods[1].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-012', 'Ceiling Height Discrepancy', 
      'The reflected ceiling plan shows a 2.7m ceiling height in the main lobby, but sections show 3.0m. Please confirm the correct height.',
      'Email', '2023-11-05', 7, '2023-11-12', '2023-11-10',
      'The correct ceiling height for the main lobby is 3.0m as shown in the sections. The reflected ceiling plan will be corrected.',
      'Closed', 'Closed', null, ${periods[3].id}, ${userId}
    )
  `);
  
  console.log('RFIs seeded successfully');
}

async function main() {
  try {
    // Check if projects table exists
    const projectsExist = await checkProjectsTable();
    if (!projectsExist) {
      console.error('Projects table does not exist or is empty');
      process.exit(1);
    }
    
    // Check and fix project periods table
    await checkAndFixProjectPeriodsForeignKey();
    
    // Create RFI table
    await createRfiTable();
    
    // Seed project periods
    await seedProjectPeriods();
    
    // Seed RFIs
    await seedRFIs();
    
    console.log('All data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

main();