import { pool, db } from "../server/db";
import { equipmentCategories, equipmentItems, equipmentHires, offHireRequests } from "../shared/schema";
import { sql } from "drizzle-orm";

async function seedEquipmentHire() {
  console.log("Seeding equipment hire data...");

  try {
    // Check if categories already exist
    const existingCategories = await db.select().from(equipmentCategories);
    if (existingCategories.length > 0) {
      console.log("Equipment categories already exist, skipping seeding.");
      return;
    }

    // Add equipment categories
    const categoryIds = await db.insert(equipmentCategories).values([
      { name: "Excavators", description: "Excavation equipment for construction", code: "EXC" },
      { name: "Loaders", description: "Loading equipment", code: "LDR" },
      { name: "Generators", description: "Power generation equipment", code: "GEN" },
      { name: "Lifts & Platforms", description: "Aerial work platforms and lifts", code: "LFT" },
      { name: "Concrete Equipment", description: "Concrete mixers and pumps", code: "CNC" },
      { name: "Compactors", description: "Ground compaction equipment", code: "CMP" },
      { name: "Scaffolding", description: "Scaffolding and access systems", code: "SCF" },
      { name: "Portable Cabins", description: "Temporary site offices and facilities", code: "CAB" },
      { name: "Pumps", description: "Water and fluid pumps", code: "PMP" },
      { name: "Tools & Light Equipment", description: "Hand tools and light equipment", code: "TLE" },
    ]).returning();

    console.log(`Added ${categoryIds.length} equipment categories`);

    // Get user IDs to use for references
    const users = await db.execute(sql`SELECT id FROM users LIMIT 5`);
    const userIds = users.rows.map(row => Number(row.id));
    
    // Get supplier IDs
    const suppliers = await db.execute(sql`SELECT id FROM suppliers LIMIT 3`);
    const supplierIds = suppliers.rows.map(row => Number(row.id));
    
    // Get project IDs
    const projects = await db.execute(sql`SELECT id FROM projects LIMIT 2`);
    const projectIds = projects.rows.map(row => Number(row.id));

    // Add equipment items
    const equipmentData = [
      {
        categoryId: categoryIds[0].id, // Excavators
        name: "Mini Excavator 1.5T",
        make: "Caterpillar",
        model: "301.7D CR",
        serialNumber: "CAT301-78965",
        description: "1.5 ton mini excavator with cab",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        createdBy: userIds[0],
      },
      {
        categoryId: categoryIds[0].id, // Excavators
        name: "Excavator 8T",
        make: "JCB",
        model: "85Z-1",
        serialNumber: "JCB85Z-54321",
        description: "8 ton zero tail swing excavator",
        ownedStatus: "hired" as const,
        status: "available" as const,
        createdBy: userIds[0],
      },
      {
        categoryId: categoryIds[1].id, // Loaders
        name: "Compact Wheel Loader",
        make: "Volvo",
        model: "L25",
        serialNumber: "VLV-L25-12345",
        description: "Compact wheel loader with GP bucket",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        createdBy: userIds[1],
      },
      {
        categoryId: categoryIds[2].id, // Generators
        name: "Mobile Generator 100kVA",
        make: "Atlas Copco",
        model: "QAS 100",
        serialNumber: "QAS100-78945",
        description: "100kVA silent diesel generator",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[0],
        createdBy: userIds[0],
      },
      {
        categoryId: categoryIds[3].id, // Lifts & Platforms
        name: "Telescopic Boom Lift",
        make: "JLG",
        model: "600AJ",
        serialNumber: "JLG600-235689",
        description: "60ft telescopic boom lift",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[1],
        createdBy: userIds[1],
      },
      {
        categoryId: categoryIds[4].id, // Concrete Equipment
        name: "Concrete Mixer",
        make: "Belle",
        model: "Minimix 150",
        serialNumber: "BLM150-456789",
        description: "150L cement mixer",
        ownedStatus: "owned" as const,
        status: "available" as const,
        purchaseDate: new Date("2022-06-15"),
        purchasePrice: 750,
        createdBy: userIds[0],
      },
      {
        categoryId: categoryIds[7].id, // Portable Cabins
        name: "Site Office 20ft",
        make: "Portable Space",
        model: "Office 20",
        serialNumber: "PSOFF20-123654",
        description: "20ft anti-vandal site office",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[2],
        createdBy: userIds[2],
      },
      {
        categoryId: categoryIds[7].id, // Portable Cabins
        name: "Welfare Unit",
        make: "Groundhog",
        model: "Fusion",
        serialNumber: "GHFUS-789456",
        description: "Mobile welfare unit with kitchen and toilet",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[2],
        createdBy: userIds[2],
      },
      {
        categoryId: categoryIds[8].id, // Pumps
        name: "Submersible Pump 3\"",
        make: "Tsurumi",
        model: "LB-800",
        serialNumber: "TSLB-124578",
        description: "3 inch submersible pump for dirty water",
        ownedStatus: "owned" as const,
        status: "available" as const,
        purchaseDate: new Date("2023-02-10"),
        purchasePrice: 630,
        createdBy: userIds[1],
      },
      {
        categoryId: categoryIds[6].id, // Scaffolding
        name: "Tower Scaffold",
        make: "Boss",
        model: "Clima",
        serialNumber: "BSCL-458796",
        description: "Mobile scaffold tower 2.5m x 1.3m",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[1],
        createdBy: userIds[0],
      },
    ];
    
    const equipmentResult = await db.insert(equipmentItems).values(equipmentData).returning();

    console.log(`Added ${equipmentItems.length} equipment items`);
    
    // Add equipment hires for items with status "on-hire"
    const today = new Date();
    const onHireEquipment = equipmentItems.filter(item => item.status === "on-hire");
    
    const hireData = onHireEquipment.map((item, index) => {
      // Set varied hire periods - some coming due, some overdue
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - (15 + index * 3)); // Different start dates
      
      const expectedEndDate = new Date(startDate);
      if (index % 3 === 0) {
        // Make some items overdue
        expectedEndDate.setDate(startDate.getDate() + 14); // 2 weeks hire
      } else {
        // Make some items coming due soon
        expectedEndDate.setDate(today.getDate() + (2 + index)); // Due in next few days
      }
      
      return {
        equipmentId: item.id,
        projectId: projectIds[index % projectIds.length],
        supplierRef: item.supplierRef || supplierIds[index % supplierIds.length],
        hireReference: `HIRE-${(1000 + index).toString()}`,
        startDate: startDate,
        expectedEndDate: expectedEndDate,
        hireRate: 100 + (index * 25),
        rateFrequency: (index % 2 === 0 ? "weekly" : "daily") as "weekly" | "daily",
        requestedById: userIds[index % userIds.length],
        deliveryAddress: "Project Site, Construction Way, London",
        notes: `Equipment hire for project phase ${index + 1}`,
      };
    });
    
    const hires = await db.insert(equipmentHires).values(hireData).returning();
    
    console.log(`Added ${hires.length} equipment hires`);
    
    // Create some off-hire requests
    const offHireData = hires.slice(0, 3).map((hire, index) => {
      const requestedEndDate = new Date(today);
      requestedEndDate.setDate(today.getDate() + (1 + index)); // Request for the next few days
      
      return {
        hireId: hire.id,
        reference: `OFFHIRE-${(2000 + index).toString()}`,
        requestedEndDate: requestedEndDate,
        status: (index === 0 ? "pending" : (index === 1 ? "sent" : "confirmed")) as "pending" | "sent" | "confirmed",
        requestedById: userIds[index % userIds.length],
        pickupAddress: "Project Site, Construction Way, London",
        pickupContact: "Site Manager: 07700 900123",
        notes: `Please collect equipment by ${requestedEndDate.toLocaleDateString()}`,
        qrCode: `EQ-OFFHIRE-${hire.id}-${index}`,
      };
    });
    
    const offHires = await db.insert(offHireRequests).values(offHireData).returning();
    
    console.log(`Added ${offHires.length} off-hire requests`);

    console.log("Equipment hire data seeded successfully");
    return true;
  } catch (error) {
    console.error("Error seeding equipment hire data:", error);
    return false;
  }
}

// Function to execute on direct run
async function main() {
  try {
    await seedEquipmentHire();
    console.log("Completed equipment hire seeding");
  } catch (err) {
    console.error("Failed to seed equipment hire data:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the seeding
main();