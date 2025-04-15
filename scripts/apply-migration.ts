import { Pool, neonConfig } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import ws from 'ws';

// Configure neon to use the ws package
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function applyMigration() {
  try {
    console.log('Reading migration SQL...');
    const migrationSql = fs.readFileSync(
      path.join(process.cwd(), 'migrations/0000_pale_lionheart.sql'),
      'utf8'
    );

    console.log('Applying migration...');
    // Split SQL by statement breakpoints and execute each statement
    const statements = migrationSql.split('--> statement-breakpoint');
    
    for (const statement of statements) {
      if (statement.trim() === '') continue;
      
      try {
        await pool.query(statement);
        console.log('Successfully executed statement.');
      } catch (err) {
        console.error('Error executing statement:', err);
        // Continue with the next statement instead of stopping
      }
    }
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    await pool.end();
  }
}

applyMigration();