import { pool, db } from "../server/db";
import { sql } from "drizzle-orm";

// This file creates the equipment hire tables in the database
async function createEquipmentHireTables() {
  console.log("Creating equipment hire tables...");

  try {
    // Create equipment categories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS equipment_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        code TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create equipment items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS equipment_items (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES equipment_categories(id),
        asset_tag TEXT UNIQUE,
        name TEXT NOT NULL,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        serial_number TEXT UNIQUE,
        description TEXT,
        owned_status TEXT NOT NULL CHECK (owned_status IN ('owned', 'hired', 'leased')),
        purchase_date DATE,
        purchase_price REAL,
        supplier_ref INTEGER REFERENCES suppliers(id),
        status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on-hire', 'under-repair', 'off-hired', 'disposed')),
        last_maintenance_date DATE,
        next_maintenance_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id)
      );
    `);

    // Create equipment hires table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS equipment_hires (
        id SERIAL PRIMARY KEY,
        equipment_id INTEGER NOT NULL REFERENCES equipment_items(id),
        project_id INTEGER NOT NULL REFERENCES projects(id),
        po_id INTEGER REFERENCES purchase_orders(id),
        supplier_ref INTEGER REFERENCES suppliers(id),
        hire_reference TEXT NOT NULL,
        start_date DATE NOT NULL,
        expected_end_date DATE NOT NULL,
        actual_end_date DATE,
        hire_rate REAL NOT NULL,
        rate_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (rate_frequency IN ('daily', 'weekly', 'monthly')),
        status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'on-hire', 'extended', 'off-hire-requested', 'returned', 'disputed')),
        requested_by_id INTEGER NOT NULL REFERENCES users(id),
        programme_activity_id INTEGER REFERENCES programme_activities(id),
        delivery_address TEXT,
        delivery_contact TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create off-hire requests table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS off_hire_requests (
        id SERIAL PRIMARY KEY,
        hire_id INTEGER NOT NULL REFERENCES equipment_hires(id),
        reference TEXT NOT NULL,
        request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        requested_end_date DATE NOT NULL,
        actual_end_date DATE,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'confirmed', 'disputed', 'completed', 'cancelled')),
        requested_by_id INTEGER NOT NULL REFERENCES users(id),
        confirmation_number TEXT,
        confirmation_date TIMESTAMP,
        pickup_address TEXT,
        pickup_contact TEXT,
        notes TEXT,
        qr_code TEXT UNIQUE,
        barcode TEXT,
        scan_date TIMESTAMP,
        scan_location TEXT,
        scan_latitude TEXT,
        scan_longitude TEXT,
        scan_by_id INTEGER REFERENCES users(id),
        images JSONB,
        confirmed_by_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create hire notifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS hire_notifications (
        id SERIAL PRIMARY KEY,
        hire_id INTEGER NOT NULL REFERENCES equipment_hires(id),
        off_hire_request_id INTEGER REFERENCES off_hire_requests(id),
        type TEXT NOT NULL CHECK (type IN ('hire-confirmation', 'due-soon', 'overdue', 'off-hire-request', 'return-confirmation')),
        message TEXT NOT NULL,
        sent_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sent_to TEXT NOT NULL,
        sent_by_id INTEGER REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'action-taken', 'failed')),
        escalation_level INTEGER DEFAULT 0,
        reminder_count INTEGER DEFAULT 0,
        last_reminder_date TIMESTAMP,
        response_date TIMESTAMP,
        response_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Equipment hire tables created successfully.");
    return true;
  } catch (error) {
    console.error("Error creating equipment hire tables:", error);
    return false;
  }
}

// Function to execute on direct run
async function main() {
  try {
    await createEquipmentHireTables();
  } catch (err) {
    console.error("Failed to create equipment hire tables:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration right away
main();

export { createEquipmentHireTables };