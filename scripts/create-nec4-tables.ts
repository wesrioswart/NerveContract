import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure neon to use the ws package
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createNec4Tables() {
  try {
    console.log('Creating NEC4 team tables...');
    
    // SQL for creating NEC4 teams table
    const createNec4TeamsTableSQL = `
      CREATE TABLE IF NOT EXISTS "nec4_teams" (
        "id" serial PRIMARY KEY NOT NULL,
        "project_id" integer NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "type" text NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `;
    
    // SQL for creating NEC4 team members table
    const createNec4TeamMembersTableSQL = `
      CREATE TABLE IF NOT EXISTS "nec4_team_members" (
        "id" serial PRIMARY KEY NOT NULL,
        "team_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "role" text NOT NULL,
        "responsibilities" text,
        "is_key_person" boolean DEFAULT false,
        "joined_at" timestamp DEFAULT now(),
        "left_at" timestamp,
        "is_active" boolean DEFAULT true
      );
    `;
    
    // SQL for creating users to projects table
    const createUsersToProjectsTableSQL = `
      CREATE TABLE IF NOT EXISTS "users_to_projects" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "project_id" integer NOT NULL,
        "role" text NOT NULL,
        "joined_at" timestamp DEFAULT now()
      );
    `;
    
    // SQL for adding foreign key constraints - each statement executed separately
    const addForeignKey1 = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'nec4_team_members_team_id_nec4_teams_id_fk'
        ) THEN
          ALTER TABLE "nec4_team_members" 
          ADD CONSTRAINT "nec4_team_members_team_id_nec4_teams_id_fk" 
          FOREIGN KEY ("team_id") REFERENCES "nec4_teams"("id") 
          ON DELETE no action ON UPDATE no action;
        END IF;
      END
      $$;
    `;
    
    const addForeignKey2 = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'nec4_team_members_user_id_users_id_fk'
        ) THEN
          ALTER TABLE "nec4_team_members" 
          ADD CONSTRAINT "nec4_team_members_user_id_users_id_fk" 
          FOREIGN KEY ("user_id") REFERENCES "users"("id") 
          ON DELETE no action ON UPDATE no action;
        END IF;
      END
      $$;
    `;
    
    const addForeignKey3 = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'nec4_teams_project_id_projects_id_fk'
        ) THEN
          ALTER TABLE "nec4_teams" 
          ADD CONSTRAINT "nec4_teams_project_id_projects_id_fk" 
          FOREIGN KEY ("project_id") REFERENCES "projects"("id") 
          ON DELETE no action ON UPDATE no action;
        END IF;
      END
      $$;
    `;
    
    const addForeignKey4 = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_to_projects_user_id_users_id_fk'
        ) THEN
          ALTER TABLE "users_to_projects" 
          ADD CONSTRAINT "users_to_projects_user_id_users_id_fk" 
          FOREIGN KEY ("user_id") REFERENCES "users"("id") 
          ON DELETE no action ON UPDATE no action;
        END IF;
      END
      $$;
    `;
    
    const addForeignKey5 = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_to_projects_project_id_projects_id_fk'
        ) THEN
          ALTER TABLE "users_to_projects" 
          ADD CONSTRAINT "users_to_projects_project_id_projects_id_fk" 
          FOREIGN KEY ("project_id") REFERENCES "projects"("id") 
          ON DELETE no action ON UPDATE no action;
        END IF;
      END
      $$;
    `;
    
    // Execute the SQL statements
    await pool.query(createNec4TeamsTableSQL);
    console.log('NEC4 teams table created');
    
    await pool.query(createNec4TeamMembersTableSQL);
    console.log('NEC4 team members table created');
    
    await pool.query(createUsersToProjectsTableSQL);
    console.log('Users to projects table created');
    
    // Add foreign key constraints separately
    await pool.query(addForeignKey1);
    console.log('Foreign key 1 added');
    
    await pool.query(addForeignKey2);
    console.log('Foreign key 2 added');
    
    await pool.query(addForeignKey3);
    console.log('Foreign key 3 added');
    
    await pool.query(addForeignKey4);
    console.log('Foreign key 4 added');
    
    await pool.query(addForeignKey5);
    console.log('Foreign key 5 added');
    
    console.log('NEC4 team tables created successfully.');
  } catch (error) {
    console.error('Error creating NEC4 team tables:', error);
  } finally {
    await pool.end();
  }
}

createNec4Tables();