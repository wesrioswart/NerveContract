import { db } from '../server/db';
import { sql } from 'drizzle-orm';

// Create project periods table
async function createProjectPeriodsTable() {
  console.log('Creating project periods table...');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "project_period" (
      "id" SERIAL PRIMARY KEY,
      "project_id" INTEGER NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
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
  
  console.log('Project periods table created successfully');
}

async function main() {
  try {
    await createProjectPeriodsTable();
    process.exit(0);
  } catch (error) {
    console.error('Error creating project periods table:', error);
    process.exit(1);
  }
}

main();