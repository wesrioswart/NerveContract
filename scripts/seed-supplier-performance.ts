import { db } from "../server/db";
import {
  suppliers,
  users
} from "@shared/schema";
import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";

// Define the supplier performance table structure
export const supplierPerformance = pgTable("supplier_performance", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  evaluationDate: timestamp("evaluation_date").notNull().defaultNow(),
  evaluatedBy: integer("evaluated_by").notNull().references(() => users.id),
  deliveryScore: integer("delivery_score").notNull(), // 1-5
  qualityScore: integer("quality_score").notNull(), // 1-5
  serviceScore: integer("service_score").notNull(), // 1-5
  priceScore: integer("price_score").notNull(), // 1-5
  overallScore: integer("overall_score").notNull(), // 1-5
  comments: text("comments"),
  projectReference: text("project_reference"),
  orderReference: text("order_reference"),
  details: jsonb("details")
});

// Define the supplier invoice table structure
export const supplierInvoices = pgTable("supplier_invoices", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id),
  invoiceNumber: text("invoice_number").notNull(),
  invoiceDate: timestamp("invoice_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  amount: integer("amount").notNull(), // in pennies/cents
  vatAmount: integer("vat_amount").notNull(), // in pennies/cents
  totalAmount: integer("total_amount").notNull(), // in pennies/cents
  status: text("status", {
    enum: ["pending", "approved", "paid", "disputed", "cancelled"]
  }).notNull().default("pending"),
  orderReference: text("order_reference"),
  projectReference: text("project_reference"),
  paymentDate: timestamp("payment_date"),
  paymentReference: text("payment_reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Sample supplier performance data
const SUPPLIER_PERFORMANCE_DATA = [
  {
    supplierId: 1, // BuildMaster Supplies Ltd
    evaluationDate: new Date("2023-06-15"),
    deliveryScore: 4,
    qualityScore: 5,
    serviceScore: 4,
    priceScore: 3,
    overallScore: 4,
    comments: "Excellent quality materials delivered mostly on time. Prices slightly higher than competitors but justified by quality.",
    projectReference: "NEC4-2020-1234",
    orderReference: "PO-2023-0005"
  },
  {
    supplierId: 1, // BuildMaster Supplies Ltd
    evaluationDate: new Date("2023-04-10"),
    deliveryScore: 5,
    qualityScore: 4,
    serviceScore: 5,
    priceScore: 3,
    overallScore: 4,
    comments: "Very responsive service and delivery ahead of schedule. Material quality was good with minor inconsistencies.",
    projectReference: "NEC4-2020-1234",
    orderReference: "PO-2023-0002"
  },
  {
    supplierId: 2, // SafetyFirst PPE Solutions
    evaluationDate: new Date("2023-05-20"),
    deliveryScore: 5,
    qualityScore: 5,
    serviceScore: 5,
    priceScore: 2,
    overallScore: 4,
    comments: "Exceptional quality PPE with perfect delivery timing. Customer service was excellent. Premium pricing but worth it for critical safety equipment.",
    projectReference: "NEC4-2020-1234",
    orderReference: "PO-2023-0004"
  },
  {
    supplierId: 3, // HeavyLift Plant Hire
    evaluationDate: new Date("2023-06-10"),
    deliveryScore: 3,
    qualityScore: 4,
    serviceScore: 3,
    priceScore: 4,
    overallScore: 3,
    comments: "Equipment delivered a day late but in good condition. Service response was adequate but could be improved.",
    projectReference: "NEC4-2020-1234",
    orderReference: "PO-2023-0006"
  },
  {
    supplierId: 4, // ElectroPro Services
    evaluationDate: new Date("2023-06-20"),
    deliveryScore: 4,
    qualityScore: 4,
    serviceScore: 3,
    priceScore: 4,
    overallScore: 4,
    comments: "Delivery was on time and materials as specified. Some delay in responding to technical queries.",
    projectReference: "NEC4-2020-1234",
    orderReference: "PO-2023-0007"
  },
  {
    supplierId: 5, // TimberTech Solutions
    evaluationDate: new Date("2023-06-01"),
    deliveryScore: 5,
    qualityScore: 5,
    serviceScore: 5,
    priceScore: 3,
    overallScore: 5,
    comments: "Outstanding service and product quality. FSC certified timber delivered ahead of schedule. Technical advice provided was extremely helpful.",
    projectReference: "NEC4-2020-1234",
    orderReference: "PO-2023-0005"
  },
  {
    supplierId: 6, // ConcreteWorks UK
    evaluationDate: new Date("2023-05-25"),
    deliveryScore: 3,
    qualityScore: 5,
    serviceScore: 4,
    priceScore: 4,
    overallScore: 4,
    comments: "Concrete quality was excellent and met all specifications. Delivery was slightly delayed but didn't impact the project timeline.",
    projectReference: "NEC4-2020-1234",
    orderReference: "PO-2023-0002"
  },
  {
    supplierId: 7, // MetalCraft Industries
    evaluationDate: new Date("2023-05-22"),
    deliveryScore: 5,
    qualityScore: 4,
    serviceScore: 4,
    priceScore: 5,
    overallScore: 4,
    comments: "Competitive pricing and prompt delivery. Minor quality issues with some rebar batches that were quickly resolved.",
    projectReference: "NEC4-2020-1234",
    orderReference: "PO-2023-0003"
  }
];

// Sample supplier invoices
const SUPPLIER_INVOICES_DATA = [
  {
    supplierId: 1, // BuildMaster Supplies Ltd
    invoiceNumber: "INV-2023-0125",
    invoiceDate: new Date("2023-05-30"),
    dueDate: new Date("2023-06-30"),
    amount: 145833, // £1,458.33
    vatAmount: 29167, // £291.67
    totalAmount: 175000, // £1,750.00
    status: "paid",
    orderReference: "PO-2023-0005",
    projectReference: "NEC4-2020-1234",
    paymentDate: new Date("2023-06-25"),
    paymentReference: "BACS-2023-0625-001",
    notes: "Timber for formwork - payment completed within terms"
  },
  {
    supplierId: 2, // SafetyFirst PPE Solutions
    invoiceNumber: "SF-2023-4782",
    invoiceDate: new Date("2023-05-15"),
    dueDate: new Date("2023-06-15"),
    amount: 107083, // £1,070.83
    vatAmount: 21417, // £214.17
    totalAmount: 128500, // £1,285.00
    status: "paid",
    orderReference: "PO-2023-0004",
    projectReference: "NEC4-2020-1234",
    paymentDate: new Date("2023-06-10"),
    paymentReference: "BACS-2023-0610-003",
    notes: "Site safety equipment - early payment discount applied"
  },
  {
    supplierId: 3, // HeavyLift Plant Hire
    invoiceNumber: "HL-2023-0056",
    invoiceDate: new Date("2023-06-05"),
    dueDate: new Date("2023-07-05"),
    amount: 266667, // £2,666.67
    vatAmount: 53333, // £533.33
    totalAmount: 320000, // £3,200.00
    status: "approved",
    orderReference: "PO-2023-0006",
    projectReference: "NEC4-2020-1234",
    notes: "Plant hire - excavator for 4 weeks, awaiting payment processing"
  },
  {
    supplierId: 4, // ElectroPro Services
    invoiceNumber: "EP-2023-1289",
    invoiceDate: new Date("2023-06-10"),
    dueDate: new Date("2023-07-10"),
    amount: 213333, // £2,133.33
    vatAmount: 42667, // £426.67
    totalAmount: 256000, // £2,560.00
    status: "pending",
    orderReference: "PO-2023-0007",
    projectReference: "NEC4-2020-1234",
    notes: "Electrical site setup - invoice under review"
  },
  {
    supplierId: 5, // TimberTech Solutions
    invoiceNumber: "TT-2023-0784",
    invoiceDate: new Date("2023-05-28"),
    dueDate: new Date("2023-06-28"),
    amount: 37500, // £375.00
    vatAmount: 7500, // £75.00
    totalAmount: 45000, // £450.00
    status: "paid",
    orderReference: "PO-2023-0005",
    projectReference: "NEC4-2020-1234",
    paymentDate: new Date("2023-06-20"),
    paymentReference: "BACS-2023-0620-002",
    notes: "Additional timber supplies - payment completed"
  },
  {
    supplierId: 6, // ConcreteWorks UK
    invoiceNumber: "CW-2023-0235",
    invoiceDate: new Date("2023-05-25"),
    dueDate: new Date("2023-06-25"),
    amount: 566667, // £5,666.67
    vatAmount: 113333, // £1,133.33
    totalAmount: 680000, // £6,800.00
    status: "paid",
    orderReference: "PO-2023-0002",
    projectReference: "NEC4-2020-1234",
    paymentDate: new Date("2023-06-22"),
    paymentReference: "BACS-2023-0622-001",
    notes: "Concrete supply for foundations - payment completed within terms"
  },
  {
    supplierId: 7, // MetalCraft Industries
    invoiceNumber: "MC-2023-1452",
    invoiceDate: new Date("2023-05-23"),
    dueDate: new Date("2023-06-23"),
    amount: 266667, // £2,666.67
    vatAmount: 53333, // £533.33
    totalAmount: 320000, // £3,200.00
    status: "paid",
    orderReference: "PO-2023-0003",
    projectReference: "NEC4-2020-1234",
    paymentDate: new Date("2023-06-15"),
    paymentReference: "BACS-2023-0615-004",
    notes: "Steel reinforcement for foundations - payment completed within terms"
  },
  {
    supplierId: 1, // BuildMaster Supplies Ltd
    invoiceNumber: "INV-2023-0178",
    invoiceDate: new Date("2023-05-18"),
    dueDate: new Date("2023-06-18"),
    amount: 204167, // £2,041.67
    vatAmount: 40833, // £408.33
    totalAmount: 245000, // £2,450.00
    status: "paid",
    orderReference: "PO-2023-0001",
    projectReference: "NEC4-2020-1234",
    paymentDate: new Date("2023-06-12"),
    paymentReference: "BACS-2023-0612-002",
    notes: "Site establishment materials - payment completed within terms"
  },
  {
    supplierId: 2, // SafetyFirst PPE Solutions
    invoiceNumber: "SF-2023-4890",
    invoiceDate: new Date("2023-06-15"),
    dueDate: new Date("2023-07-15"),
    amount: 72917, // £729.17
    vatAmount: 14583, // £145.83
    totalAmount: 87500, // £875.00
    status: "pending",
    orderReference: "PO-2023-0008",
    projectReference: "NEC4-2020-1234",
    notes: "Additional safety equipment - pending approval"
  }
];

async function seedSupplierData() {
  console.log("Starting supplier performance and invoice data seeding...");
  
  try {
    // Get first user for evaluatedBy field
    const firstUser = await db.select().from(users).limit(1);
    if (!firstUser.length) {
      console.error("No users found in the database. Please run the main seed script first.");
      return;
    }
    const userId = firstUser[0].id;
    
    // Create the tables if they don't exist
    console.log("Checking for supplier performance table...");
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS supplier_performance (
          id SERIAL PRIMARY KEY,
          supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
          evaluation_date TIMESTAMP NOT NULL DEFAULT NOW(),
          evaluated_by INTEGER NOT NULL REFERENCES users(id),
          delivery_score INTEGER NOT NULL,
          quality_score INTEGER NOT NULL,
          service_score INTEGER NOT NULL,
          price_score INTEGER NOT NULL,
          overall_score INTEGER NOT NULL,
          comments TEXT,
          project_reference TEXT,
          order_reference TEXT,
          details JSONB
        )
      `);
      console.log("Supplier performance table created or verified.");
    } catch (error) {
      console.error("Error creating supplier performance table:", error);
      return;
    }
    
    console.log("Checking for supplier invoices table...");
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS supplier_invoices (
          id SERIAL PRIMARY KEY,
          supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
          invoice_number TEXT NOT NULL,
          invoice_date TIMESTAMP NOT NULL,
          due_date TIMESTAMP NOT NULL,
          amount INTEGER NOT NULL,
          vat_amount INTEGER NOT NULL,
          total_amount INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          order_reference TEXT,
          project_reference TEXT,
          payment_date TIMESTAMP,
          payment_reference TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("Supplier invoices table created or verified.");
    } catch (error) {
      console.error("Error creating supplier invoices table:", error);
      return;
    }
    
    // Check if we already have performance data
    const existingPerformance = await db.execute(`
      SELECT COUNT(*) as count FROM supplier_performance
    `);
    const performanceCount = parseInt(existingPerformance.rows[0].count);
    
    if (performanceCount === 0) {
      console.log("Seeding supplier performance data...");
      
      // Process each performance record with the correct user ID
      const performanceDataWithUserId = SUPPLIER_PERFORMANCE_DATA.map(record => ({
        ...record,
        evaluatedBy: userId
      }));
      
      for (const record of performanceDataWithUserId) {
        await db.execute(`
          INSERT INTO supplier_performance (
            supplier_id, evaluation_date, evaluated_by, 
            delivery_score, quality_score, service_score, price_score, overall_score,
            comments, project_reference, order_reference
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          )
        `, [
          record.supplierId,
          record.evaluationDate,
          record.evaluatedBy,
          record.deliveryScore,
          record.qualityScore,
          record.serviceScore,
          record.priceScore,
          record.overallScore,
          record.comments,
          record.projectReference,
          record.orderReference
        ]);
      }
      
      console.log("Supplier performance data seeded successfully!");
    } else {
      console.log("Supplier performance data already exists, skipping...");
    }
    
    // Check if we already have invoice data
    const existingInvoices = await db.execute(`
      SELECT COUNT(*) as count FROM supplier_invoices
    `);
    const invoiceCount = parseInt(existingInvoices.rows[0].count);
    
    if (invoiceCount === 0) {
      console.log("Seeding supplier invoice data...");
      
      for (const invoice of SUPPLIER_INVOICES_DATA) {
        await db.execute(`
          INSERT INTO supplier_invoices (
            supplier_id, invoice_number, invoice_date, due_date,
            amount, vat_amount, total_amount, status,
            order_reference, project_reference, payment_date, payment_reference, notes
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          )
        `, [
          invoice.supplierId,
          invoice.invoiceNumber,
          invoice.invoiceDate,
          invoice.dueDate,
          invoice.amount,
          invoice.vatAmount,
          invoice.totalAmount,
          invoice.status,
          invoice.orderReference,
          invoice.projectReference,
          invoice.paymentDate || null,
          invoice.paymentReference || null,
          invoice.notes
        ]);
      }
      
      console.log("Supplier invoice data seeded successfully!");
    } else {
      console.log("Supplier invoice data already exists, skipping...");
    }
    
    console.log("Supplier data seeding complete!");
    
  } catch (error) {
    console.error("Error seeding supplier data:", error);
  }
}

// Run the seed function
seedSupplierData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Failed to seed supplier data:", error);
    process.exit(1);
  });