import { db } from "../server/db";
import {
  nominalCodes,
  suppliers,
  inventoryItems,
  inventoryLocations,
  stockLevels,
  users
} from "@shared/schema";

// GPSMACS codes for materials, plants, etc.
const GPSMACS_NOMINAL_CODES = [
  // Materials (5000-5999)
  { code: "5100", description: "CONCRETE", category: "MATERIAL COSTS", isProjectSpecific: true },
  { code: "5200", description: "TIMBER", category: "MATERIAL COSTS", isProjectSpecific: true },
  { code: "5300", description: "SITE CONSUMABLES", category: "MATERIAL COSTS", isProjectSpecific: true },
  { code: "5400", description: "METAL MATERIALS", category: "MATERIAL COSTS", isProjectSpecific: true },
  { code: "5500", description: "ELECTRICAL MATERIALS", category: "MATERIAL COSTS", isProjectSpecific: true },
  
  // Plant (6000-6999)
  { code: "6100", description: "EXCAVATORS", category: "PLANT COSTS", isProjectSpecific: true },
  { code: "6200", description: "GENERATORS", category: "PLANT COSTS", isProjectSpecific: true },
  { code: "6300", description: "TOOLS & EQUIPMENT", category: "PLANT COSTS", isProjectSpecific: true },
  { code: "6400", description: "TEMPORARY WORKS", category: "PLANT COSTS", isProjectSpecific: true },
  
  // PPE & Tools (7000-7999)
  { code: "7100", description: "HEAD PROTECTION", category: "PPE", isProjectSpecific: false },
  { code: "7200", description: "HAND PROTECTION", category: "PPE", isProjectSpecific: false },
  { code: "7300", description: "BODY PROTECTION", category: "PPE", isProjectSpecific: false },
  { code: "7400", description: "FOOT PROTECTION", category: "PPE", isProjectSpecific: false },
  { code: "7500", description: "SMALL TOOLS", category: "TOOLS", isProjectSpecific: false },
  
  // Equipment & Machinery (8000-8999)
  { code: "8100", description: "OFFICE EQUIPMENT", category: "EQUIPMENT", isProjectSpecific: false },
  { code: "8200", description: "SITE FACILITIES", category: "EQUIPMENT", isProjectSpecific: false },
  { code: "8300", description: "MEASURING EQUIPMENT", category: "EQUIPMENT", isProjectSpecific: false }
];

// Sample suppliers
const SUPPLIERS_DATA = [
  {
    name: "BuildMaster Supplies Ltd",
    contactPerson: "James Wilson",
    contactEmail: "sales@buildmaster.co.uk",
    contactPhone: "+44 20 7123 4567",
    address: "Unit 15, Industrial Estate, Manchester, M1 2WX",
    isPreferred: true,
    notes: "Reliable supplier of construction materials with excellent delivery times."
  },
  {
    name: "SafetyFirst PPE Solutions",
    contactPerson: "Emma Thompson",
    contactEmail: "orders@safetyfirst.com",
    contactPhone: "+44 20 7234 5678",
    address: "Safety House, 45 Protection Road, Birmingham, B2 6QR",
    isPreferred: true,
    notes: "Specialized in high-quality PPE and safety equipment."
  },
  {
    name: "HeavyLift Plant Hire",
    contactPerson: "Robert Johnson",
    contactEmail: "hire@heavylift.co.uk",
    contactPhone: "+44 20 7345 6789",
    address: "Machinery Yard, Excavation Lane, Leeds, LS3 7TG",
    isPreferred: false,
    notes: "Plant hire with competitive rates for long-term projects."
  },
  {
    name: "ElectroPro Services",
    contactPerson: "Sarah Davies",
    contactEmail: "info@electropro.co.uk",
    contactPhone: "+44 20 7456 7890",
    address: "Power House, 78 Circuit Road, Bristol, BS4 8HJ",
    isPreferred: false,
    notes: "Electrical materials and services provider."
  },
  {
    name: "TimberTech Solutions",
    contactPerson: "David Miller",
    contactEmail: "sales@timbertech.co.uk",
    contactPhone: "+44 20 7567 8901",
    address: "Woodland Works, 23 Forest Way, Glasgow, G5 9KL",
    isPreferred: true,
    notes: "Sustainable timber products with FSC certification."
  },
  {
    name: "ConcreteWorks UK",
    contactPerson: "Lisa Brown",
    contactEmail: "orders@concreteworks.co.uk",
    contactPhone: "+44 20 7678 9012",
    address: "Cement House, 56 Aggregate Street, Newcastle, NE6 2PQ",
    isPreferred: false,
    notes: "Specialized in concrete materials and mixes."
  },
  {
    name: "MetalCraft Industries",
    contactPerson: "Michael Jones",
    contactEmail: "sales@metalcraft.co.uk",
    contactPhone: "+44 20 7789 0123",
    address: "Steel Works, 89 Ironforge Road, Sheffield, S7 3RS",
    isPreferred: true,
    notes: "Quality metal materials and fabrication services."
  }
];

// Sample inventory locations
const LOCATIONS_DATA = [
  {
    name: "Main Site Yard",
    address: "Project Site, Westfield Development, London E15 2QR",
    type: "yard",
    contactPerson: "Tom Richards",
    contactPhone: "+44 7890 123456"
  },
  {
    name: "Central Warehouse",
    address: "Unit 7-9, Industrial Estate, Barking, London IG11 7LT",
    type: "warehouse",
    contactPerson: "Maria Chen",
    contactPhone: "+44 7891 234567"
  },
  {
    name: "East London Store",
    address: "45 Storage Lane, Stratford, London E15 4PQ",
    type: "store",
    contactPerson: "Ahmed Khan",
    contactPhone: "+44 7892 345678"
  },
  {
    name: "Northern Depot",
    address: "Depot Road, Walthamstow, London E17 6FR",
    type: "warehouse",
    contactPerson: "Samantha Lee",
    contactPhone: "+44 7893 456789"
  }
];

// Sample inventory items
const INVENTORY_ITEMS = [
  // Construction Materials
  {
    code: "M-5100-001",
    name: "Ready-mix Concrete C30",
    description: "General purpose concrete mix, 30 N/mm² strength",
    category: "Materials",
    subcategory: "Concrete",
    unit: "m3",
    minStockLevel: 0,
    reorderPoint: 5,
    unitCost: 8500 // £85.00
  },
  {
    code: "M-5200-001",
    name: "Treated Timber 100x50mm",
    description: "Pressure treated construction timber",
    category: "Materials",
    subcategory: "Timber",
    unit: "m",
    minStockLevel: 50,
    maxStockLevel: 500,
    reorderPoint: 100,
    unitCost: 450 // £4.50
  },
  {
    code: "M-5200-002",
    name: "Plywood Sheets 18mm",
    description: "Construction grade plywood, 1220x2440mm",
    category: "Materials",
    subcategory: "Timber",
    unit: "sheet",
    minStockLevel: 10,
    maxStockLevel: 100,
    reorderPoint: 25,
    unitCost: 3200 // £32.00
  },
  {
    code: "M-5300-001",
    name: "Building Sand",
    description: "General purpose building sand",
    category: "Materials",
    subcategory: "Aggregates",
    unit: "tonne",
    minStockLevel: 1,
    maxStockLevel: 20,
    reorderPoint: 3,
    unitCost: 4500 // £45.00
  },
  {
    code: "M-5400-001",
    name: "Rebar 12mm",
    description: "Steel reinforcement bar, 12mm diameter",
    category: "Materials",
    subcategory: "Steel",
    unit: "m",
    minStockLevel: 100,
    maxStockLevel: 1000,
    reorderPoint: 200,
    unitCost: 150 // £1.50
  },
  {
    code: "M-5500-001",
    name: "Armored Cable 2.5mm²",
    description: "SWA cable 2.5mm² 3-core",
    category: "Materials",
    subcategory: "Electrical",
    unit: "m",
    minStockLevel: 50,
    maxStockLevel: 500,
    reorderPoint: 100,
    unitCost: 320 // £3.20
  },
  
  // Plant & Equipment
  {
    code: "P-6100-001",
    name: "Mini Excavator 1.5t",
    description: "Kubota 1.5 tonne mini excavator",
    category: "Plant",
    subcategory: "Excavators",
    unit: "each",
    minStockLevel: 0,
    reorderPoint: 1,
    unitCost: 2500000 // £25,000.00
  },
  {
    code: "P-6200-001",
    name: "Generator 20kVA",
    description: "Diesel generator 20kVA, silent running",
    category: "Plant",
    subcategory: "Power",
    unit: "each",
    minStockLevel: 1,
    maxStockLevel: 5,
    reorderPoint: 1,
    unitCost: 650000 // £6,500.00
  },
  {
    code: "P-6300-001",
    name: "Cement Mixer 150L",
    description: "Electric cement mixer, 150L capacity",
    category: "Plant",
    subcategory: "Tools",
    unit: "each",
    minStockLevel: 2,
    maxStockLevel: 10,
    reorderPoint: 2,
    unitCost: 28000 // £280.00
  },
  {
    code: "P-6400-001",
    name: "Acrow Props (Medium)",
    description: "Adjustable steel props for temporary support",
    category: "Plant",
    subcategory: "Temporary Works",
    unit: "each",
    minStockLevel: 20,
    maxStockLevel: 200,
    reorderPoint: 30,
    unitCost: 1800 // £18.00
  },
  
  // PPE
  {
    code: "S-7100-001",
    name: "Safety Helmet",
    description: "Construction hard hat with ratchet adjustment",
    category: "PPE",
    subcategory: "Head Protection",
    unit: "each",
    minStockLevel: 25,
    maxStockLevel: 100,
    reorderPoint: 30,
    unitCost: 650 // £6.50
  },
  {
    code: "S-7200-001",
    name: "Rigger Gloves",
    description: "Heavy-duty leather work gloves",
    category: "PPE",
    subcategory: "Hand Protection",
    unit: "pair",
    minStockLevel: 30,
    maxStockLevel: 150,
    reorderPoint: 50,
    unitCost: 350 // £3.50
  },
  {
    code: "S-7300-001",
    name: "Hi-Vis Vest Class 2",
    description: "Yellow high visibility vest with reflective strips",
    category: "PPE",
    subcategory: "Body Protection",
    unit: "each",
    minStockLevel: 50,
    maxStockLevel: 200,
    reorderPoint: 75,
    unitCost: 450 // £4.50
  },
  {
    code: "S-7400-001",
    name: "Safety Boots S3",
    description: "Steel toe cap and midsole safety boots",
    category: "PPE",
    subcategory: "Foot Protection",
    unit: "pair",
    minStockLevel: 10,
    maxStockLevel: 50,
    reorderPoint: 15,
    unitCost: 4800 // £48.00
  },
  
  // Tools & Equipment
  {
    code: "T-7500-001",
    name: "Claw Hammer 16oz",
    description: "Steel shaft claw hammer",
    category: "Tools",
    subcategory: "Hand Tools",
    unit: "each",
    minStockLevel: 5,
    maxStockLevel: 30,
    reorderPoint: 10,
    unitCost: 1200 // £12.00
  },
  {
    code: "T-7500-002",
    name: "Measuring Tape 8m",
    description: "Professional measuring tape with lock",
    category: "Tools",
    subcategory: "Measuring",
    unit: "each",
    minStockLevel: 10,
    maxStockLevel: 50,
    reorderPoint: 15,
    unitCost: 750 // £7.50
  },
  {
    code: "E-8100-001",
    name: "Site Laptop",
    description: "Rugged laptop for site use",
    category: "Equipment",
    subcategory: "Office",
    unit: "each",
    minStockLevel: 2,
    maxStockLevel: 10,
    reorderPoint: 3,
    unitCost: 120000 // £1,200.00
  },
  {
    code: "E-8200-001",
    name: "Portable Toilet",
    description: "Single self-contained portable toilet unit",
    category: "Equipment",
    subcategory: "Site Facilities",
    unit: "each",
    minStockLevel: 1,
    maxStockLevel: 10,
    reorderPoint: 2,
    unitCost: 85000 // £850.00
  },
  {
    code: "E-8300-001",
    name: "Laser Level",
    description: "Self-leveling rotary laser level kit",
    category: "Equipment",
    subcategory: "Measuring",
    unit: "each",
    minStockLevel: 1,
    maxStockLevel: 5,
    reorderPoint: 1,
    unitCost: 65000 // £650.00
  }
];

async function seedInventory() {
  console.log("Starting inventory data seeding...");
  
  try {
    // Get the first user to assign for performed_by field
    const firstUser = await db.select().from(users).limit(1);
    if (!firstUser.length) {
      console.error("No users found in the database. Please run the main seed script first.");
      return;
    }
    const userId = firstUser[0].id;
    
    // Check if we already have nominal codes
    const existingCodes = await db.select().from(nominalCodes);
    if (existingCodes.length === 0) {
      console.log("Seeding nominal codes...");
      await db.insert(nominalCodes).values(GPSMACS_NOMINAL_CODES);
    } else {
      console.log("Nominal codes already exist, skipping...");
    }
    
    // Check if we already have suppliers
    const existingSuppliers = await db.select().from(suppliers);
    if (existingSuppliers.length === 0) {
      console.log("Seeding suppliers...");
      await db.insert(suppliers).values(SUPPLIERS_DATA);
    } else {
      console.log("Suppliers already exist, skipping...");
    }
    
    // Check if we already have inventory locations
    const existingLocations = await db.select().from(inventoryLocations);
    if (existingLocations.length === 0) {
      console.log("Seeding inventory locations...");
      await db.insert(inventoryLocations).values(LOCATIONS_DATA);
    } else {
      console.log("Inventory locations already exist, skipping...");
    }
    
    // Check if we already have inventory items
    const existingItems = await db.select().from(inventoryItems);
    if (existingItems.length === 0) {
      console.log("Seeding inventory items...");
      
      // Get nominal code IDs for reference
      const codes = await db.select().from(nominalCodes);
      const codeMap = new Map();
      codes.forEach(code => {
        codeMap.set(code.code.substring(0, 2), code.id);
      });
      
      // Assign nominal code IDs to items based on their category
      const itemsWithNominalCodes = INVENTORY_ITEMS.map(item => {
        const codePrefix = item.code.substring(0, 1) === 'M' ? '51' : 
                          item.code.substring(0, 1) === 'P' ? '61' :
                          item.code.substring(0, 1) === 'S' ? '71' : '81';
        
        const nominalCodeId = codeMap.get(codePrefix) || null;
        
        return {
          ...item,
          nominalCodeId
        };
      });
      
      await db.insert(inventoryItems).values(itemsWithNominalCodes);
      
      // Add initial stock levels
      const items = await db.select().from(inventoryItems);
      const locations = await db.select().from(inventoryLocations);
      
      if (items.length > 0 && locations.length > 0) {
        console.log("Seeding initial stock levels...");
        
        const stockLevelsData = [];
        
        // Distribute items across locations with varying quantities
        items.forEach(item => {
          // Assign random location (but make sure it's distributed)
          const locationIndex = Math.floor(Math.random() * locations.length);
          const location = locations[locationIndex];
          
          // Generate random stock quantity between min and reorder+10
          const minStock = item.minStockLevel || 0;
          const reorderPoint = item.reorderPoint || 5;
          const quantity = Math.floor(Math.random() * (reorderPoint + 10 - minStock + 1)) + minStock;
          
          stockLevelsData.push({
            itemId: item.id,
            locationId: location.id,
            quantity
          });
        });
        
        await db.insert(stockLevels).values(stockLevelsData);
      }
    } else {
      console.log("Inventory items already exist, skipping...");
    }
    
    console.log("Inventory seeding complete!");
  } catch (error) {
    console.error("Error seeding inventory data:", error);
  }
}

// Run the seed function
seedInventory()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Failed to seed inventory data:", error);
    process.exit(1);
  });