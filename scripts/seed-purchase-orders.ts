import { db } from "../server/db";
import {
  purchaseOrders,
  purchaseOrderItems,
  suppliers,
  nominalCodes,
  users,
  projects
} from "@shared/schema";

// Sample purchase orders
const PURCHASE_ORDER_DATA = [
  {
    reference: "PO-2023-0001",
    description: "Site establishment materials",
    deliveryMethod: "delivery",
    estimatedCost: 245000, // £2,450.00
    totalCost: 245000,
    vatIncluded: true,
    deliveryDate: "2023-05-15",
    deliveryAddress: "Westfield Development Project, London E15 2QR",
    status: "completed",
    items: [
      {
        description: "Site fencing panels 3.5m x 2m",
        quantity: 20,
        unitPrice: 8500, // £85.00
        unit: "each",
        vatRate: 20
      },
      {
        description: "Temporary site office cabin",
        quantity: 1,
        unitPrice: 75000, // £750.00
        unit: "each",
        vatRate: 20
      }
    ]
  },
  {
    reference: "PO-2023-0002",
    description: "Concrete supply for foundations",
    deliveryMethod: "delivery",
    estimatedCost: 680000, // £6,800.00
    totalCost: 680000,
    vatIncluded: true,
    deliveryDate: "2023-05-20",
    deliveryAddress: "Westfield Development Project, London E15 2QR",
    status: "completed",
    items: [
      {
        description: "Ready-mix concrete C30",
        quantity: 80,
        unitPrice: 8500, // £85.00
        unit: "m3",
        vatRate: 20
      }
    ]
  },
  {
    reference: "PO-2023-0003",
    description: "Steel reinforcement for foundations",
    deliveryMethod: "delivery",
    estimatedCost: 320000, // £3,200.00
    totalCost: 320000,
    vatIncluded: true,
    deliveryDate: "2023-05-18",
    deliveryAddress: "Westfield Development Project, London E15 2QR",
    status: "completed",
    items: [
      {
        description: "Rebar 12mm x 12m lengths",
        quantity: 150,
        unitPrice: 1800, // £18.00
        unit: "each",
        vatRate: 20
      },
      {
        description: "Reinforcement mesh A393",
        quantity: 20,
        unitPrice: 4500, // £45.00
        unit: "sheet",
        vatRate: 20
      }
    ]
  },
  {
    reference: "PO-2023-0004",
    description: "Site safety equipment",
    deliveryMethod: "delivery",
    estimatedCost: 128500, // £1,285.00
    totalCost: 128500,
    vatIncluded: true,
    deliveryDate: "2023-05-12",
    deliveryAddress: "Central Warehouse, Barking, London IG11 7LT",
    status: "completed",
    items: [
      {
        description: "Safety helmets",
        quantity: 50,
        unitPrice: 650, // £6.50
        unit: "each",
        vatRate: 20
      },
      {
        description: "Hi-vis vests",
        quantity: 75,
        unitPrice: 450, // £4.50
        unit: "each",
        vatRate: 20
      },
      {
        description: "Safety boots S3",
        quantity: 15,
        unitPrice: 4800, // £48.00
        unit: "pair",
        vatRate: 20
      }
    ]
  },
  {
    reference: "PO-2023-0005",
    description: "Timber for formwork",
    deliveryMethod: "delivery",
    estimatedCost: 175000, // £1,750.00
    totalCost: 175000,
    vatIncluded: true,
    deliveryDate: "2023-05-25",
    deliveryAddress: "Westfield Development Project, London E15 2QR",
    status: "completed",
    items: [
      {
        description: "Plywood sheets 18mm",
        quantity: 40,
        unitPrice: 3200, // £32.00
        unit: "sheet",
        vatRate: 20
      },
      {
        description: "Timber 100x50mm",
        quantity: 120,
        unitPrice: 450, // £4.50
        unit: "m",
        vatRate: 20
      }
    ]
  },
  {
    reference: "PO-2023-0006",
    description: "Plant hire - excavator",
    deliveryMethod: "delivery",
    hireDuration: "4 weeks",
    estimatedCost: 320000, // £3,200.00
    totalCost: 320000,
    vatIncluded: true,
    deliveryDate: "2023-06-01",
    deliveryAddress: "Westfield Development Project, London E15 2QR",
    status: "approved",
    items: [
      {
        description: "Mini excavator 1.5t hire",
        quantity: 1,
        unitPrice: 320000, // £3,200.00
        unit: "4 weeks",
        vatRate: 20
      }
    ]
  },
  {
    reference: "PO-2023-0007",
    description: "Electrical site setup",
    deliveryMethod: "delivery",
    estimatedCost: 256000, // £2,560.00
    totalCost: 256000,
    vatIncluded: true,
    deliveryDate: "2023-06-05",
    deliveryAddress: "Westfield Development Project, London E15 2QR",
    status: "ordered",
    items: [
      {
        description: "Distribution board",
        quantity: 2,
        unitPrice: 45000, // £450.00
        unit: "each",
        vatRate: 20
      },
      {
        description: "Armored cable 2.5mm²",
        quantity: 300,
        unitPrice: 320, // £3.20
        unit: "m",
        vatRate: 20
      },
      {
        description: "Site lighting set",
        quantity: 4,
        unitPrice: 18000, // £180.00
        unit: "each",
        vatRate: 20
      }
    ]
  },
  {
    reference: "PO-2023-0008",
    description: "Additional safety equipment",
    deliveryMethod: "collection",
    estimatedCost: 87500, // £875.00
    totalCost: 87500,
    vatIncluded: true,
    deliveryDate: "2023-06-10",
    deliveryAddress: "N/A - Collection",
    status: "pending_approval",
    items: [
      {
        description: "Safety harnesses",
        quantity: 10,
        unitPrice: 6500, // £65.00
        unit: "each",
        vatRate: 20
      },
      {
        description: "First aid kits",
        quantity: 5,
        unitPrice: 2500, // £25.00
        unit: "each",
        vatRate: 20
      }
    ]
  },
  {
    reference: "PO-2023-0009",
    description: "Office equipment for site office",
    deliveryMethod: "delivery",
    estimatedCost: 154000, // £1,540.00
    totalCost: 154000,
    vatIncluded: true,
    deliveryDate: "2023-06-15",
    deliveryAddress: "Westfield Development Project, London E15 2QR",
    status: "draft",
    items: [
      {
        description: "Rugged laptops",
        quantity: 1,
        unitPrice: 120000, // £1,200.00
        unit: "each",
        vatRate: 20
      },
      {
        description: "Site printer",
        quantity: 1,
        unitPrice: 34000, // £340.00
        unit: "each",
        vatRate: 20
      }
    ]
  }
];

async function seedPurchaseOrders() {
  console.log("Starting purchase order data seeding...");
  
  try {
    // Get required data for foreign keys
    const firstUser = await db.select().from(users).limit(1);
    if (!firstUser.length) {
      console.error("No users found in the database. Please run the main seed script first.");
      return;
    }
    const userId = firstUser[0].id;
    
    const firstProject = await db.select().from(projects).limit(1);
    if (!firstProject.length) {
      console.error("No projects found in the database. Please run the main seed script first.");
      return;
    }
    const projectId = firstProject[0].id;
    
    const allSuppliers = await db.select().from(suppliers);
    if (!allSuppliers.length) {
      console.error("No suppliers found in the database. Please run the inventory seed script first.");
      return;
    }
    
    const allNominalCodes = await db.select().from(nominalCodes);
    if (!allNominalCodes.length) {
      console.error("No nominal codes found in the database. Please run the inventory seed script first.");
      return;
    }
    
    // Check if we already have purchase orders
    const existingPOs = await db.select().from(purchaseOrders);
    if (existingPOs.length === 0) {
      console.log("Seeding purchase orders...");
      
      // Process each purchase order
      for (const poData of PURCHASE_ORDER_DATA) {
        // Get random supplier and nominal code
        const randomSupplierIndex = Math.floor(Math.random() * allSuppliers.length);
        const randomNominalCodeIndex = Math.floor(Math.random() * allNominalCodes.length);
        
        const supplier = allSuppliers[randomSupplierIndex];
        const nominalCode = allNominalCodes[randomNominalCodeIndex];
        
        // Create base purchase order
        const [po] = await db.insert(purchaseOrders).values({
          reference: poData.reference,
          projectId: projectId,
          nominalCodeId: nominalCode.id,
          description: poData.description,
          deliveryMethod: poData.deliveryMethod,
          hireDuration: poData.hireDuration || null,
          estimatedCost: poData.estimatedCost,
          totalCost: poData.totalCost,
          vatIncluded: poData.vatIncluded,
          supplierId: supplier.id,
          deliveryDate: poData.deliveryDate,
          deliveryAddress: poData.deliveryAddress,
          status: poData.status,
          createdBy: userId,
          approvedBy: poData.status === 'approved' || poData.status === 'ordered' || poData.status === 'completed' ? userId : null,
          approvedAt: poData.status === 'approved' || poData.status === 'ordered' || poData.status === 'completed' ? new Date() : null
        }).returning();
        
        // Add purchase order items
        if (poData.items && poData.items.length > 0) {
          const itemsWithPoId = poData.items.map(item => ({
            ...item,
            purchaseOrderId: po.id
          }));
          
          await db.insert(purchaseOrderItems).values(itemsWithPoId);
        }
      }
      
      console.log("Purchase orders seeded successfully!");
    } else {
      console.log("Purchase orders already exist, skipping...");
    }
    
  } catch (error) {
    console.error("Error seeding purchase order data:", error);
  }
}

// Run the seed function
seedPurchaseOrders()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Failed to seed purchase order data:", error);
    process.exit(1);
  });