import { pool, db } from "../server/db";
import { equipmentCategories, equipmentItems, equipmentHires, offHireRequests, hireNotifications } from "../shared/schema";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm/expressions";

async function seedEquipmentHire(force = false) {
  console.log("Seeding equipment hire data...");

  try {
    // Check if categories already exist
    const existingCategories = await db.select().from(equipmentCategories);
    if (existingCategories.length > 0 && !force) {
      console.log("Equipment categories already exist, skipping seeding.");
      return;
    }
    
    // If force is true, clear existing data
    if (force) {
      console.log("Force mode - clearing existing data...");
      await db.delete(hireNotifications);
      await db.delete(offHireRequests);
      await db.delete(equipmentHires);
      await db.delete(equipmentItems);
      await db.delete(equipmentCategories);
      console.log("Existing equipment hire data cleared.");
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
      { name: "Lighting", description: "Site lighting solutions", code: "LGT" },
      { name: "Tools & Light Equipment", description: "Hand tools and light equipment", code: "TLE" },
    ]).returning();

    console.log(`Added ${categoryIds.length} equipment categories`);

    // Get user IDs to use for references
    const users = await db.execute(sql`SELECT id FROM users LIMIT 5`);
    const userIds = users.rows.map(row => Number(row.id));
    
    // Get supplier IDs
    const suppliers = await db.execute(sql`SELECT id, name FROM suppliers LIMIT 5`);
    const supplierIds = suppliers.rows.map(row => Number(row.id));
    const supplierNames = suppliers.rows.map(row => row.name);
    
    // Get project IDs
    const projects = await db.execute(sql`SELECT id FROM projects LIMIT 3`);
    const projectIds = projects.rows.map(row => Number(row.id));

    // Track current date for creating relative dates
    const today = new Date();
    
    // Create more comprehensive equipment dataset
    const equipmentData = [
      // EXCAVATORS
      {
        categoryId: categoryIds[0].id, // Excavators
        name: "Mini Excavator 1.5T",
        make: "Caterpillar",
        model: "301.7D CR",
        serialNumber: "CAT301-78965",
        description: "1.5 ton mini excavator with cab",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[0],
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
        status: "on-hire" as const,
        supplierRef: supplierIds[0],
        createdBy: userIds[0],
      },
      {
        categoryId: categoryIds[0].id, // Excavators
        name: "Tracked Excavator 25T",
        make: "Komatsu",
        model: "PC210LC-11",
        serialNumber: "KPC210-98745",
        description: "25 ton tracked excavator with long carriage",
        ownedStatus: "hired" as const,
        status: "available" as const,
        supplierRef: supplierIds[0],
        createdBy: userIds[1],
        lastMaintenanceDate: new Date(today.getFullYear(), today.getMonth() - 2, 15),
      },
      
      // LOADERS
      {
        categoryId: categoryIds[1].id, // Loaders
        name: "Compact Wheel Loader",
        make: "Volvo",
        model: "L25",
        serialNumber: "VLV-L25-12345",
        description: "Compact wheel loader with GP bucket",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[1],
        createdBy: userIds[1],
      },
      {
        categoryId: categoryIds[1].id, // Loaders
        name: "Skid Steer Loader",
        make: "Bobcat",
        model: "S650",
        serialNumber: "BBS650-45678",
        description: "Skid steer loader with multiple attachments",
        ownedStatus: "owned" as const,
        status: "under-repair" as const,
        purchaseDate: new Date(today.getFullYear() - 1, 5, 12),
        purchasePrice: 35000,
        createdBy: userIds[0],
        lastMaintenanceDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5),
        nextMaintenanceDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 25),
        notes: "Currently undergoing transmission repair. ETA 3 days."
      },
      
      // GENERATORS - Multiple sizes
      {
        categoryId: categoryIds[2].id, // Generators
        name: "Mobile Generator 20kVA",
        make: "Atlas Copco",
        model: "QAS 20",
        serialNumber: "QAS20-13579",
        description: "20kVA silent diesel generator",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[2],
        createdBy: userIds[0],
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
        supplierRef: supplierIds[2],
        createdBy: userIds[0],
      },
      {
        categoryId: categoryIds[2].id, // Generators
        name: "Mobile Generator 350kVA",
        make: "FG Wilson",
        model: "P350-1",
        serialNumber: "FGW350-85296",
        description: "350kVA containerized generator",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[2],
        createdBy: userIds[1],
      },
      {
        categoryId: categoryIds[2].id, // Generators
        name: "Mobile Generator 500kVA",
        make: "Cummins",
        model: "C500D5",
        serialNumber: "CUM500-74125",
        description: "500kVA prime power generator",
        ownedStatus: "hired" as const,
        status: "off-hired" as const,
        supplierRef: supplierIds[2],
        createdBy: userIds[2],
      },
      
      // LIFTS AND PLATFORMS
      {
        categoryId: categoryIds[3].id, // Lifts & Platforms
        name: "Scissor Lift 8m",
        make: "Genie",
        model: "GS-2669 RT",
        serialNumber: "GNS2669-41258",
        description: "8m rough terrain scissor lift",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[3], 
        createdBy: userIds[1],
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
        supplierRef: supplierIds[3],
        createdBy: userIds[1],
      },
      
      // CONCRETE EQUIPMENT
      {
        categoryId: categoryIds[4].id, // Concrete Equipment
        name: "Concrete Mixer",
        make: "Belle",
        model: "Minimix 150",
        serialNumber: "BLM150-456789",
        description: "150L cement mixer",
        ownedStatus: "owned" as const,
        status: "available" as const,
        purchaseDate: new Date(today.getFullYear() - 1, 5, 15),
        purchasePrice: 750,
        createdBy: userIds[0],
      },
      {
        categoryId: categoryIds[4].id, // Concrete Equipment
        name: "Concrete Poker Vibrator",
        make: "Wacker Neuson",
        model: "IREN 38",
        serialNumber: "WNIR38-753159",
        description: "38mm high frequency poker vibrator",
        ownedStatus: "owned" as const,
        status: "on-hire" as const,
        purchaseDate: new Date(today.getFullYear() - 1, 2, 8),
        purchasePrice: 425,
        createdBy: userIds[0],
      },
      
      // COMPACTORS
      {
        categoryId: categoryIds[5].id, // Compactors
        name: "Plate Compactor",
        make: "Wacker Neuson",
        model: "WP1550A",
        serialNumber: "WNWP15-951357",
        description: "15kN plate compactor",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[4],
        createdBy: userIds[2],
      },
      
      // SCAFFOLDING
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
      {
        categoryId: categoryIds[6].id, // Scaffolding
        name: "System Scaffold 1000m²",
        make: "Layher",
        model: "Allround",
        serialNumber: "LYH-AR-789123",
        description: "Layher system scaffold package for facade",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[1],
        createdBy: userIds[0],
      },
      
      // SITE ACCOMMODATION
      {
        categoryId: categoryIds[7].id, // Portable Cabins
        name: "Site Office 20ft",
        make: "Portable Space",
        model: "Office 20",
        serialNumber: "PSOFF20-123654",
        description: "20ft anti-vandal site office",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[0],
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
        supplierRef: supplierIds[0],
        createdBy: userIds[2],
      },
      {
        categoryId: categoryIds[7].id, // Portable Cabins
        name: "Drying Room 16ft",
        make: "Elliott",
        model: "DR16",
        serialNumber: "ELT-DR16-85296",
        description: "16ft drying room with heating",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[0],
        createdBy: userIds[0],
      },
      
      // PUMPS
      {
        categoryId: categoryIds[8].id, // Pumps
        name: "Submersible Pump 3\"",
        make: "Tsurumi",
        model: "LB-800",
        serialNumber: "TSLB-124578",
        description: "3 inch submersible pump for dirty water",
        ownedStatus: "owned" as const,
        status: "available" as const,
        purchaseDate: new Date(today.getFullYear() - 1, 1, 10),
        purchasePrice: 630,
        createdBy: userIds[1],
      },
      {
        categoryId: categoryIds[8].id, // Pumps
        name: "Diesel Water Pump 6\"",
        make: "Selwood",
        model: "Drainer D150",
        serialNumber: "SWD150-456123",
        description: "6 inch diesel water pump",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[4],
        createdBy: userIds[2],
      },
      
      // LIGHTING
      {
        categoryId: categoryIds[9].id, // Lighting
        name: "Lighting Tower",
        make: "Towerlight",
        model: "VT1 Eco",
        serialNumber: "TLVT1-125478",
        description: "LED lighting tower with auto start",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[2],
        createdBy: userIds[1],
      },
      {
        categoryId: categoryIds[9].id, // Lighting
        name: "Lighting Tower LED",
        make: "Trime",
        model: "X-Eco",
        serialNumber: "TRX-ECO-789654",
        description: "Low-emission LED lighting tower",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[2],
        createdBy: userIds[0],
      }
    ];
    
    // Process dates on all equipment items
    const equipmentDataWithDates = equipmentData.map(item => {
      // Use actual Date objects instead of converting to ISO strings
      return { 
        ...item, 
        createdAt: new Date(today.getFullYear(), today.getMonth() - Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1),
        purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : undefined,
        lastMaintenanceDate: item.lastMaintenanceDate ? new Date(item.lastMaintenanceDate) : undefined,
        nextMaintenanceDate: item.nextMaintenanceDate ? new Date(item.nextMaintenanceDate) : undefined
      };
    });

    const equipmentResult = await db.insert(equipmentItems).values(equipmentDataWithDates).returning();

    console.log(`Added ${equipmentDataWithDates.length} equipment items`);
    
    // Associate equipment IDs with their data
    const equipmentWithIds = equipmentResult.map((result, index) => {
      return {
        ...equipmentDataWithDates[index],
        id: result.id
      };
    });
    
    // Filter on-hire equipment
    const onHireEquipment = equipmentWithIds.filter(item => item.status === "on-hire");
    
    // Create hire data with varied dates - some overdue, some due soon, some with longer periods
    const hireData = onHireEquipment.map((item, index) => {
      // Calculate varied dates
      let startDate = new Date(today);
      let expectedEndDate = new Date(today);
      let status = "on-hire" as const;
      
      // Create different scenarios
      if (index % 5 === 0) {
        // Overdue items
        startDate.setDate(today.getDate() - (45 + (index % 30)));
        expectedEndDate.setDate(today.getDate() - (5 + (index % 10)));
      } else if (index % 5 === 1) {
        // Due very soon (1-3 days)
        startDate.setDate(today.getDate() - (30 + (index % 15)));
        expectedEndDate.setDate(today.getDate() + (1 + (index % 3)));
      } else if (index % 5 === 2) {
        // Due soon (4-7 days)
        startDate.setDate(today.getDate() - (21 + (index % 10)));
        expectedEndDate.setDate(today.getDate() + (4 + (index % 4)));
      } else {
        // Regular hire periods
        startDate.setDate(today.getDate() - (15 + (index % 30)));
        expectedEndDate.setDate(startDate.getDate() + (30 + (index % 60)));
      }
      
      // Vary hire rates by equipment type and supplier
      let hireRate = 0;
      let rateFrequency = "weekly" as const;
      
      // Set rates based on category
      const categoryName = categoryIds.find(cat => cat.id === item.categoryId)?.name.toLowerCase() || "";
      
      if (categoryName.includes("excavator")) {
        hireRate = 150 + (50 * (index % 5));
        rateFrequency = index % 2 === 0 ? "daily" : "weekly";
      } else if (categoryName.includes("generator")) {
        hireRate = 75 + (25 * (index % 4));
        rateFrequency = "weekly";
      } else if (categoryName.includes("scaffold")) {
        hireRate = 300 + (100 * (index % 3));
        rateFrequency = "weekly";
      } else if (categoryName.includes("cabin")) {
        hireRate = 90 + (30 * (index % 4));
        rateFrequency = "weekly";
      } else if (categoryName.includes("lighting")) {
        hireRate = 85 + (15 * (index % 3));
        rateFrequency = "weekly";
      } else {
        hireRate = 50 + (index * 10);
        rateFrequency = index % 3 === 0 ? "daily" : "weekly";
      }
      
      return {
        equipmentId: item.id,
        projectId: projectIds[index % projectIds.length],
        supplierRef: item.supplierRef || supplierIds[index % supplierIds.length],
        hireReference: `HIRE-${supplierNames[index % supplierNames.length].substring(0, 3).toUpperCase()}-${(1000 + index).toString()}`,
        startDate: startDate,
        expectedEndDate: expectedEndDate,
        hireRate,
        rateFrequency,
        requestedById: userIds[index % userIds.length],
        deliveryAddress: `Project Site ${index % 3 + 1}, Construction Way, London`,
        deliveryContact: `Site Manager: 07700 9001${(index % 100).toString().padStart(2, '0')}`,
        notes: `Equipment hire for ${categoryName} operations in phase ${index % 5 + 1}`,
        createdAt: startDate,
        status
      };
    });
    
    const hires = await db.insert(equipmentHires).values(hireData).returning();
    
    console.log(`Added ${hires.length} equipment hires`);
    
    // Create varied off-hire requests - pending, sent, confirmed
    // Create multiple types of requests:
    // 1. Pending requests (waiting for confirmation)
    // 2. Sent requests (communicated to supplier)
    // 3. Confirmed requests (scheduled for collection)
    // 4. Some requests for equipment due soon
    // 5. Some requests for overdue equipment
    
    const createOffHireRequests = () => {
      const requests = [];
      
      // Add pending requests for some items
      const pendingRequestHires = hires.slice(0, 5);
      pendingRequestHires.forEach((hire, index) => {
        const requestedEndDate = new Date(today);
        requestedEndDate.setDate(today.getDate() + (2 + index)); // Request for the next few days
        
        const createdDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (2 + index));
        requests.push({
          hireId: hire.id,
          reference: `OFFHIRE-P-${(2000 + index).toString()}`,
          requestedEndDate: requestedEndDate,
          status: "pending" as const,
          requestedById: userIds[index % userIds.length],
          pickupAddress: `Project Site ${index % 3 + 1}, Construction Way, London`,
          pickupContact: `Site Manager: 07700 9001${(index % 100).toString().padStart(2, '0')}`,
          notes: `Please collect equipment by ${requestedEndDate.toLocaleDateString()}. Reference project phase ${index + 1}.`,
          qrCode: `EQ-P-${hire.id}-${index}`,
          createdAt: createdDate,
          requestDate: createdDate
        });
      });
      
      // Add sent requests for some items
      const sentRequestHires = hires.slice(5, 10);
      sentRequestHires.forEach((hire, index) => {
        const requestedEndDate = new Date(today);
        requestedEndDate.setDate(today.getDate() + (1 + index)); // Request for the next few days
        
        requests.push({
          hireId: hire.id,
          reference: `OFFHIRE-S-${(3000 + index).toString()}`,
          requestedEndDate: requestedEndDate.toISOString(),
          status: "sent" as const,
          requestedById: userIds[index % userIds.length],
          confirmationNumber: `CONF-${(5000 + index).toString()}`,
          confirmationDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString(),
          pickupAddress: `Project Site ${index % 3 + 1}, Construction Way, London`,
          pickupContact: `Site Manager: 07700 9002${(index % 100).toString().padStart(2, '0')}`,
          notes: `Collection confirmed for ${requestedEndDate.toLocaleDateString()}. Please advise time of arrival.`,
          qrCode: `EQ-S-${hire.id}-${index}`,
          createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - (4 + index)).toISOString(),
          requestDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - (4 + index)).toISOString()
        });
      });
      
      // Add confirmed requests
      const confirmedRequestHires = hires.slice(10, 13);
      confirmedRequestHires.forEach((hire, index) => {
        const requestedEndDate = new Date(today);
        requestedEndDate.setDate(today.getDate() + (1 + index));
        
        requests.push({
          hireId: hire.id,
          reference: `OFFHIRE-C-${(4000 + index).toString()}`,
          requestedEndDate: requestedEndDate.toISOString(),
          status: "confirmed" as const,
          requestedById: userIds[index % userIds.length],
          confirmationNumber: `CONF-${(6000 + index).toString()}`,
          confirmationDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2).toISOString(),
          confirmedById: userIds[(index + 1) % userIds.length],
          pickupAddress: `Project Site ${index % 3 + 1}, Construction Way, London`,
          pickupContact: `Site Manager: 07700 9003${(index % 100).toString().padStart(2, '0')}`,
          notes: `Collection scheduled for ${requestedEndDate.toLocaleDateString()} between 08:00-12:00.`,
          qrCode: `EQ-C-${hire.id}-${index}`,
          createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 + index)).toISOString(),
          requestDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 + index)).toISOString()
        });
      });
      
      return requests;
    };
    
    const offHireData = createOffHireRequests();    
    const offHires = await db.insert(offHireRequests).values(offHireData).returning();
    
    console.log(`Added ${offHires.length} off-hire requests`);
    
    // Create notifications
    const notificationData = [];
    
    // Add notifications for some hires
    hires.slice(0, 10).forEach((hire, index) => {
      // Determine notification type based on index
      let type, message, sentTo, status, escalationLevel;
      
      if (index % 5 === 0) {
        type = "hire-confirmation" as const;
        message = `Equipment hire confirmed - ${hire.hireReference}. Delivery scheduled.`;
        sentTo = "project.manager@example.com";
        status = "delivered" as const;
        escalationLevel = 0;
      } else if (index % 5 === 1) {
        type = "due-soon" as const;
        message = `REMINDER: Equipment ${hire.hireReference} is due for return in 7 days.`;
        sentTo = "site.manager@example.com";
        status = "read" as const;
        escalationLevel = 0;
      } else if (index % 5 === 2) {
        type = "due-soon" as const;
        message = `URGENT: Equipment ${hire.hireReference} is due for return in 3 days.`;
        sentTo = "site.manager@example.com, project.manager@example.com";
        status = "sent" as const;
        escalationLevel = 1;
      } else if (index % 5 === 3) {
        type = "overdue" as const;
        message = `OVERDUE NOTICE: Equipment ${hire.hireReference} was due for return 5 days ago. Please action immediately.`;
        sentTo = "site.manager@example.com, project.manager@example.com, operations@example.com";
        status = "pending" as const;
        escalationLevel = 2;
      } else {
        type = "off-hire-request" as const;
        message = `Off-hire request submitted for ${hire.hireReference}. Awaiting supplier confirmation.`;
        sentTo = "project.manager@example.com";
        status = "action-taken" as const;
        escalationLevel = 0;
      }
      
      // Create notification date based on type
      let sentDate = new Date(today);
      if (type === "hire-confirmation") {
        sentDate.setDate(today.getDate() - 30);
      } else if (type === "due-soon") {
        sentDate.setDate(today.getDate() - (index % 3));
      } else if (type === "overdue") {
        sentDate.setDate(today.getDate() - 1);
      } else {
        sentDate.setDate(today.getDate() - (2 + index % 3));
      }
      
      notificationData.push({
        hireId: hire.id,
        offHireRequestId: type === "off-hire-request" ? offHires[index % offHires.length].id : null,
        type,
        message,
        sentDate: sentDate.toISOString(),
        sentTo,
        sentById: userIds[index % userIds.length],
        status,
        escalationLevel,
        reminderCount: type === "overdue" ? (1 + index % 3) : 0,
        lastReminderDate: type === "overdue" ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString() : null,
        responseDate: status === "action-taken" ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString() : null,
        responseMessage: status === "action-taken" ? "Action has been taken, equipment will be returned on schedule." : null,
      });
    });
    
    if (notificationData.length > 0) {
      const notifications = await db.insert(hireNotifications).values(notificationData).returning();
      console.log(`Added ${notifications.length} hire notifications`);
    }

    console.log("Equipment hire data seeded successfully");
    return true;
  } catch (error) {
    console.error("Error seeding equipment hire data:", error);
    return false;
  }
}

// Export the seed function for use in other files
export { seedEquipmentHire };

// Function to execute on direct run
async function main() {
  try {
    // Pass true to force seeding even if data exists
    await seedEquipmentHire(true);
    console.log("Completed equipment hire seeding with comprehensive test data");
  } catch (err) {
    console.error("Failed to seed equipment hire data:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the seeding
main();