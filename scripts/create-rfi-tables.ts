import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import { pgTable, serial, text, date, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

// Create RFI tables for the project
async function createRFITables() {
  console.log('Creating RFI tables...');

  // Create the RFI table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "rfi" (
      "id" SERIAL PRIMARY KEY,
      "project_id" INTEGER NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
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
      "period_id" INTEGER REFERENCES "project_period"("id"),
      "created_by" INTEGER REFERENCES "user"("id"),
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
  
  // Create RFI attachments table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "rfi_attachment" (
      "id" SERIAL PRIMARY KEY,
      "rfi_id" INTEGER NOT NULL REFERENCES "rfi"("id") ON DELETE CASCADE,
      "file_name" TEXT NOT NULL,
      "file_path" TEXT NOT NULL,
      "file_size" INTEGER NOT NULL,
      "file_type" TEXT NOT NULL,
      "uploaded_by" INTEGER REFERENCES "user"("id"),
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create RFI comments table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "rfi_comment" (
      "id" SERIAL PRIMARY KEY,
      "rfi_id" INTEGER NOT NULL REFERENCES "rfi"("id") ON DELETE CASCADE,
      "comment" TEXT NOT NULL,
      "created_by" INTEGER REFERENCES "user"("id"),
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('RFI tables created successfully');
}

async function main() {
  try {
    await createRFITables();
    process.exit(0);
  } catch (error) {
    console.error('Error creating RFI tables:', error);
    process.exit(1);
  }
}

main();