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

    // Add equipment categories based on the requested specification
    const categoryIds = await db.insert(equipmentCategories).values([
      { name: "Piling Hammers", description: "Impact hammers for driving piles into the ground", code: "PIL" },
      { name: "Excavators", description: "Excavation equipment of various sizes for construction", code: "EXC" },
      { name: "Welding Units", description: "Equipment for welding metal components", code: "WLD" },
      { name: "Barges", description: "Floating platforms for marine construction", code: "BRG" },
      { name: "Welfare Units", description: "Mobile facilities providing amenities for site workers", code: "WLF" },
      { name: "Telehandlers", description: "Versatile lifting and handling machines", code: "TLH" },
      { name: "Generators", description: "Power generation equipment for construction sites", code: "GEN" },
      { name: "Lighting Towers", description: "Mobile lighting systems for construction sites", code: "LGT" },
      { name: "Scaffolding Systems", description: "Modular scaffolding and access systems", code: "SCF" },
      { name: "Pumps & Dewatering", description: "Water and fluid pumps for site drainage", code: "PMP" },
      { name: "Site Accommodation", description: "Temporary site offices and facilities", code: "ACC" },
      { name: "Cranes & Lifting", description: "Heavy lifting equipment for construction", code: "CRN" },
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
    
    // Create more comprehensive equipment dataset based on the requested specifications
    const equipmentData = [
      // PILING HAMMERS (category index 0)
      {
        categoryId: categoryIds[0].id, // Piling Hammers
        name: "Hydraulic Piling Hammer 7t",
        make: "BSP",
        model: "CX85",
        serialNumber: "BSP-CX85-78421",
        description: "7 ton hydraulic impact hammer for sheet piling",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[0],
        createdBy: userIds[0],
      },
      {
        categoryId: categoryIds[0].id, // Piling Hammers
        name: "Diesel Piling Hammer 9t",
        make: "Delmag",
        model: "D19-42",
        serialNumber: "DEL-D19-12457",
        description: "9 ton diesel impact hammer with 42kJ energy class",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[0],
        createdBy: userIds[0],
      },
      {
        categoryId: categoryIds[0].id, // Piling Hammers
        name: "Vibratory Piling Hammer",
        make: "Movax",
        model: "SG-75V",
        serialNumber: "MVX-SG75-87631",
        description: "75kN excavator-mounted vibratory pile driver",
        ownedStatus: "hired" as const,
        status: "available" as const,
        supplierRef: supplierIds[1],
        createdBy: userIds[1],
        lastMaintenanceDate: new Date(today.getFullYear(), today.getMonth() - 1, 15),
      },
      
      // EXCAVATORS (category index 1)
      {
        categoryId: categoryIds[1].id, // Excavators
        name: "Mini Excavator 1.5T",
        make: "Caterpillar",
        model: "301.7D CR",
        serialNumber: "CAT301-78965",
        description: "1.5 ton mini excavator with cab for confined spaces",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[0],
        createdBy: userIds[0],
      },
      {
        categoryId: categoryIds[1].id, // Excavators
        name: "Midi Excavator 8T",
        make: "JCB",
        model: "85Z-1",
        serialNumber: "JCB85Z-54321",
        description: "8 ton zero tail swing excavator for urban environments",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[0],
        createdBy: userIds[0],
      },
      {
        categoryId: categoryIds[1].id, // Excavators
        name: "Large Excavator 25T",
        make: "Komatsu",
        model: "PC210LC-11",
        serialNumber: "KPC210-98745",
        description: "25 ton tracked excavator with long carriage for deep excavation",
        ownedStatus: "hired" as const,
        status: "available" as const,
        supplierRef: supplierIds[0],
        createdBy: userIds[1],
        lastMaintenanceDate: new Date(today.getFullYear(), today.getMonth() - 2, 15),
      },
      
      // WELDING UNITS (category index 2)
      {
        categoryId: categoryIds[2].id, // Welding Units
        name: "Diesel Welder 400A",
        make: "Lincoln Electric",
        model: "Vantage 400",
        serialNumber: "LE-V400-54782",
        description: "400A diesel welding generator with multi-process capabilities",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[2],
        createdBy: userIds[1],
      },
      {
        categoryId: categoryIds[2].id, // Welding Units
        name: "Inverter Welder 200A",
        make: "Miller",
        model: "XMT 304",
        serialNumber: "ML-XMT304-98735",
        description: "200A multi-process inverter welding system",
        ownedStatus: "owned" as const,
        status: "under-repair" as const,
        purchaseDate: new Date(today.getFullYear() - 1, 5, 12),
        purchasePrice: 8500,
        createdBy: userIds[0],
        lastMaintenanceDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5),
        nextMaintenanceDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 25),
        notes: "Control board replacement needed. ETA 3 days."
      },
      {
        categoryId: categoryIds[2].id, // Welding Units
        name: "Pipeline Welding Spread",
        make: "Lincoln Electric",
        model: "Pipeliner 200D",
        serialNumber: "LE-PL200-12458",
        description: "Complete pipeline welding spread with 6 welding stations",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[2],
        createdBy: userIds[0],
      },
      {
        categoryId: categoryIds[2].id, // Welding Units
        name: "MIG Welder 300A",
        make: "ESAB",
        model: "Rebel EMP 285",
        serialNumber: "ESAB-RE285-57428",
        description: "300A MIG/TIG/Stick multi-process welding system",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[1],
        createdBy: userIds[2],
      },
      
      // BARGES (category index 3)
      {
        categoryId: categoryIds[3].id, // Barges
        name: "Flat-Top Barge 400T",
        make: "Damen",
        model: "Stan Pontoon B-4020",
        serialNumber: "DM-SP4020-54621",
        description: "400 ton capacity flat-top barge for marine construction",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[3],
        createdBy: userIds[2],
      },
      {
        categoryId: categoryIds[3].id, // Barges
        name: "Crane Barge 200T",
        make: "Maritime Services Ltd",
        model: "CB-200",
        serialNumber: "MSL-CB200-45712",
        description: "200 ton floating crane barge with 50T lifting capacity",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[3],
        createdBy: userIds[1],
      },
      
      // WELFARE UNITS (category index 4)
      {
        categoryId: categoryIds[4].id, // Welfare Units
        name: "Site Welfare Unit 12-person",
        make: "Groundhog",
        model: "Fusion 7",
        serialNumber: "GH-FUS7-87456",
        description: "Mobile welfare unit with kitchen, toilet and 12-person seating area",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[0],
        createdBy: userIds[2],
      },
      {
        categoryId: categoryIds[4].id, // Welfare Units
        name: "Welfare Van 6-person",
        make: "Armadillo",
        model: "Towable Eco",
        serialNumber: "ARM-ECO-54711",
        description: "Towable 6-person welfare unit with generator and solar panels",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[4],
        createdBy: userIds[0],
      },
      {
        categoryId: categoryIds[4].id, // Welfare Units
        name: "Toilet Block 5-bay",
        make: "Wernick",
        model: "WC5",
        serialNumber: "WRN-WC5-76523",
        description: "5-bay site toilet block with water-saving flush system",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[2],
        createdBy: userIds[1],
      },
      
      // TELEHANDLERS (category index 5)
      {
        categoryId: categoryIds[5].id, // Telehandlers
        name: "Telehandler 14m",
        make: "JCB",
        model: "540-140",
        serialNumber: "JCB-540140-74523",
        description: "14m reach telehandler with 4 ton lifting capacity",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[1],
        createdBy: userIds[1],
      },
      {
        categoryId: categoryIds[5].id, // Telehandlers
        name: "Telehandler 17m",
        make: "Manitou",
        model: "MT1740",
        serialNumber: "MAN-MT1740-65472",
        description: "17m reach telehandler with 4 ton lifting capacity",
        ownedStatus: "hired" as const,
        status: "available" as const,
        supplierRef: supplierIds[1],
        createdBy: userIds[0],
      },
      
      // SHORING EQUIPMENT (category index 6)
      {
        categoryId: categoryIds[6].id, // Shoring Equipment
        name: "Trench Box System",
        make: "MGF",
        model: "KKD 600 Series",
        serialNumber: "MGF-KKD600-78456",
        description: "Modular trench box shoring system for excavation safety",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[4],
        createdBy: userIds[1],
      },
      {
        categoryId: categoryIds[6].id, // Shoring Equipment
        name: "Hydraulic Waler Frame",
        make: "Groundforce",
        model: "MP150",
        serialNumber: "GF-MP150-45612",
        description: "Hydraulic frame for supporting excavation walls",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[4],
        createdBy: userIds[2],
      },
      {
        categoryId: categoryIds[6].id, // Shoring Equipment
        name: "Sheet Pile Driver",
        make: "ABI",
        model: "Mobilram TM 14/17",
        serialNumber: "ABI-TM1417-95621",
        description: "Telescopic leader rig for driving sheet piles",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[0],
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
      
      // PILING HAMMERS (category index 8)
      {
        categoryId: categoryIds[8].id, // Piling Hammers
        name: "Hydraulic Piling Hammer",
        make: "BSP",
        model: "CX85",
        serialNumber: "BSP-CX85-47851",
        description: "Hydraulic impact hammer for sheet and tubular piling",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[3],
        createdBy: userIds[1],
      },
      {
        categoryId: categoryIds[8].id, // Piling Hammers
        name: "Diesel Piling Hammer",
        make: "Delmag",
        model: "D46-32",
        serialNumber: "DLM-D4632-96523",
        description: "Diesel hammer for heavy piling applications",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[3],
        createdBy: userIds[0],
      },
      {
        categoryId: categoryIds[8].id, // Piling Hammers
        name: "Pile Vibrator",
        make: "Movax",
        model: "SG-75V",
        serialNumber: "MVX-SG75V-85412",
        description: "High-frequency vibrator for installing and extracting sheet piles",
        ownedStatus: "hired" as const,
        status: "available" as const,
        supplierRef: supplierIds[3],
        createdBy: userIds[2],
      },
      
      // SPECIALIZED CONSTRUCTION PUMPS (category index 9)
      {
        categoryId: categoryIds[9].id, // Specialized Construction Pumps
        name: "Concrete Pump 70m³/hr",
        make: "Putzmeister",
        model: "BSA 1409 D",
        serialNumber: "PM-BSA1409-85741",
        description: "Trailer-mounted concrete pump with 70m³/hr output capacity",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[1],
        createdBy: userIds[0],
      },
      {
        categoryId: categoryIds[9].id, // Specialized Construction Pumps
        name: "Grout Pump 45 bar",
        make: "Atlas Copco",
        model: "Unigrout E22H",
        serialNumber: "AC-UGE22H-98671",
        description: "High-pressure grout pump for construction applications",
        ownedStatus: "hired" as const,
        status: "on-hire" as const,
        supplierRef: supplierIds[4],
        createdBy: userIds[1],
      },
      {
        categoryId: categoryIds[9].id, // Specialized Construction Pumps
        name: "Bentonite Pump System",
        make: "Colcrete Eurodrill",
        model: "CP15",
        serialNumber: "CE-CP15-74125",
        description: "Bentonite slurry mixing and pumping system for diaphragm walls",
        ownedStatus: "hired" as const,
        status: "available" as const,
        supplierRef: supplierIds[3],
        createdBy: userIds[2],
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
        
        const createdDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (4 + index));
        const confirmDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        requests.push({
          hireId: hire.id,
          reference: `OFFHIRE-S-${(3000 + index).toString()}`,
          requestedEndDate: requestedEndDate,
          status: "sent" as const,
          requestedById: userIds[index % userIds.length],
          confirmationNumber: `CONF-${(5000 + index).toString()}`,
          confirmationDate: confirmDate,
          pickupAddress: `Project Site ${index % 3 + 1}, Construction Way, London`,
          pickupContact: `Site Manager: 07700 9002${(index % 100).toString().padStart(2, '0')}`,
          notes: `Collection confirmed for ${requestedEndDate.toLocaleDateString()}. Please advise time of arrival.`,
          qrCode: `EQ-S-${hire.id}-${index}`,
          createdAt: createdDate,
          requestDate: createdDate
        });
      });
      
      // Add confirmed requests
      const confirmedRequestHires = hires.slice(10, 13);
      confirmedRequestHires.forEach((hire, index) => {
        const requestedEndDate = new Date(today);
        requestedEndDate.setDate(today.getDate() + (1 + index));
        
        const createdDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 + index));
        const confirmDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2);
        requests.push({
          hireId: hire.id,
          reference: `OFFHIRE-C-${(4000 + index).toString()}`,
          requestedEndDate: requestedEndDate,
          status: "confirmed" as const,
          requestedById: userIds[index % userIds.length],
          confirmationNumber: `CONF-${(6000 + index).toString()}`,
          confirmationDate: confirmDate,
          confirmedById: userIds[(index + 1) % userIds.length],
          pickupAddress: `Project Site ${index % 3 + 1}, Construction Way, London`,
          pickupContact: `Site Manager: 07700 9003${(index % 100).toString().padStart(2, '0')}`,
          notes: `Collection scheduled for ${requestedEndDate.toLocaleDateString()} between 08:00-12:00.`,
          qrCode: `EQ-C-${hire.id}-${index}`,
          createdAt: createdDate,
          requestDate: createdDate
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
      
      const lastReminderDate = type === "overdue" ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1) : null;
      const responseDate = status === "action-taken" ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1) : null;
      
      notificationData.push({
        hireId: hire.id,
        offHireRequestId: type === "off-hire-request" ? offHires[index % offHires.length].id : null,
        type,
        message,
        sentDate: sentDate,
        sentTo,
        sentById: userIds[index % userIds.length],
        status,
        escalationLevel,
        reminderCount: type === "overdue" ? (1 + index % 3) : 0,
        lastReminderDate,
        responseDate,
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