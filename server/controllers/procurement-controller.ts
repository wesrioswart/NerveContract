import { Request, Response } from "express";
import { db } from "../db";
import {
  suppliers,
  nominalCodes,
  purchaseOrders,
  purchaseOrderItems,
  InsertPurchaseOrder,
  InsertPurchaseOrderItem,
  InsertSupplier,
  InsertNominalCode,
} from "@shared/schema";
import { eq, and, like, ilike, desc, asc } from "drizzle-orm";

// Nominal Codes
export const getNominalCodes = async (_req: Request, res: Response) => {
  try {
    const codes = await db.select().from(nominalCodes);
    res.json(codes);
  } catch (error) {
    console.error("Error fetching nominal codes:", error);
    res.status(500).json({ error: "Failed to fetch nominal codes" });
  }
};

export const getNominalCode = async (req: Request, res: Response) => {
  try {
    const code = await db.select().from(nominalCodes).where(eq(nominalCodes.id, parseInt(req.params.id))).limit(1);
    
    if (!code.length) {
      return res.status(404).json({ error: "Nominal code not found" });
    }
    
    res.json(code[0]);
  } catch (error) {
    console.error("Error fetching nominal code:", error);
    res.status(500).json({ error: "Failed to fetch nominal code" });
  }
};

export const createNominalCode = async (req: Request, res: Response) => {
  try {
    const data = req.body as InsertNominalCode;
    const [newCode] = await db.insert(nominalCodes).values(data).returning();
    res.status(201).json(newCode);
  } catch (error) {
    console.error("Error creating nominal code:", error);
    res.status(500).json({ error: "Failed to create nominal code" });
  }
};

// Suppliers
export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    let query = db.select().from(suppliers);
    
    if (search) {
      query = query.where(like(suppliers.name, `%${search}%`));
    }
    
    const allSuppliers = await query.orderBy(asc(suppliers.name));
    
    // If we have no suppliers, return mock data for demonstration
    if (allSuppliers.length === 0) {
      const mockSuppliers = [
        {
          id: 1,
          name: "Thurrock Engineering",
          contactPerson: "Ross Fullbrook",
          email: "ross.fullbrook@thurrockengineering.com",
          phone: "+44 20 7123 4567",
          address: "58 River Road, Barking, IG11 0DS",
          accountNumber: "THUR-2023-001",
          isGpsmacs: true,
          createdAt: new Date(),
          updatedAt: null
        },
        {
          id: 2,
          name: "City Materials Ltd",
          contactPerson: "Sarah Johnson",
          email: "sarah.j@citymaterials.co.uk",
          phone: "+44 20 7890 1234",
          address: "Unit 7, Industrial Estate, Manchester, M1 1AB",
          accountNumber: "CITY-2022-154",
          isGpsmacs: true,
          createdAt: new Date(),
          updatedAt: null
        },
        {
          id: 3,
          name: "FastTrack Equipment Hire",
          contactPerson: "David Williams",
          email: "d.williams@fasttrackequipment.com",
          phone: "+44 20 7456 7890",
          address: "245 Hire Way, Birmingham, B2 5QT",
          accountNumber: "FAST-2023-078",
          isGpsmacs: false,
          createdAt: new Date(),
          updatedAt: null
        },
        {
          id: 4,
          name: "SafeGuard PPE Solutions",
          contactPerson: "Emma Parker",
          email: "sales@safeguardppe.com",
          phone: "+44 20 7234 5678",
          address: "Safety House, 12 Protection Road, Leeds, LS1 4BD",
          accountNumber: "SAFE-2023-042",
          isGpsmacs: true,
          createdAt: new Date(),
          updatedAt: null
        },
        {
          id: 5,
          name: "Concrete Express",
          contactPerson: "Michael Thompson",
          email: "m.thompson@concreteexpress.co.uk",
          phone: "+44 20 7345 6789",
          address: "78 Cement Lane, Glasgow, G1 2CD",
          accountNumber: "CONC-2022-031",
          isGpsmacs: true,
          createdAt: new Date(),
          updatedAt: null
        },
        {
          id: 6,
          name: "Eco Timber Supplies",
          contactPerson: "Lisa Chen",
          email: "l.chen@ecotimber.co.uk",
          phone: "+44 20 7654 3210",
          address: "145 Green Way, Bristol, BS1 3FD",
          accountNumber: "ECO-2023-098",
          isGpsmacs: true,
          createdAt: new Date(),
          updatedAt: null
        },
        {
          id: 7,
          name: "PowerTech Electrical",
          contactPerson: "James Wilson",
          email: "j.wilson@powertechelectrical.com",
          phone: "+44 20 7987 6543",
          address: "Voltage House, 72 Circuit Road, Newcastle, NE1 2ET",
          accountNumber: "POWER-2022-123",
          isGpsmacs: false,
          createdAt: new Date(),
          updatedAt: null
        }
      ];
      
      return res.json(mockSuppliers);
    }
    
    res.json(allSuppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
};

export const getSupplier = async (req: Request, res: Response) => {
  try {
    const supplier = await db.select().from(suppliers).where(eq(suppliers.id, parseInt(req.params.id))).limit(1);
    
    if (!supplier.length) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    
    res.json(supplier[0]);
  } catch (error) {
    console.error("Error fetching supplier:", error);
    res.status(500).json({ error: "Failed to fetch supplier" });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const data = req.body as InsertSupplier;
    const [newSupplier] = await db.insert(suppliers).values(data).returning();
    res.status(201).json(newSupplier);
  } catch (error) {
    console.error("Error creating supplier:", error);
    res.status(500).json({ error: "Failed to create supplier" });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body as Partial<InsertSupplier>;
    
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    
    if (!updatedSupplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    
    res.json(updatedSupplier);
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(500).json({ error: "Failed to update supplier" });
  }
};

// Purchase Orders
export const getPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const { projectId, status, search } = req.query;
    
    let query = db.select({
      po: purchaseOrders,
      supplierName: suppliers.name,
      nominalCodeDescription: nominalCodes.description
    })
    .from(purchaseOrders)
    .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
    .leftJoin(nominalCodes, eq(purchaseOrders.nominalCodeId, nominalCodes.id));
    
    if (projectId) {
      query = query.where(eq(purchaseOrders.projectId, parseInt(projectId as string)));
    }
    
    if (status) {
      query = query.where(eq(purchaseOrders.status, status as string));
    }
    
    if (search) {
      query = query.where(
        like(purchaseOrders.reference, `%${search}%`)
      );
    }
    
    const result = await query.orderBy(desc(purchaseOrders.createdAt));
    
    // Format the result for the client
    const formattedResult = result.map(row => ({
      ...row.po,
      supplierName: row.supplierName,
      nominalCodeDescription: row.nominalCodeDescription
    }));
    
    res.json(formattedResult);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
};

export const getPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const poId = parseInt(req.params.id);
    
    // Get the purchase order with supplier and nominal code info
    const [purchaseOrder] = await db.select({
      po: purchaseOrders,
      supplierName: suppliers.name,
      supplierContact: suppliers.contactPerson,
      supplierEmail: suppliers.contactEmail,
      nominalCodeDescription: nominalCodes.description
    })
    .from(purchaseOrders)
    .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
    .leftJoin(nominalCodes, eq(purchaseOrders.nominalCodeId, nominalCodes.id))
    .where(eq(purchaseOrders.id, poId))
    .limit(1);
    
    if (!purchaseOrder) {
      return res.status(404).json({ error: "Purchase order not found" });
    }
    
    // Get all items for this purchase order
    const items = await db.select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, poId));
    
    const result = {
      ...purchaseOrder.po,
      supplierName: purchaseOrder.supplierName,
      supplierContact: purchaseOrder.supplierContact,
      supplierEmail: purchaseOrder.supplierEmail,
      nominalCodeDescription: purchaseOrder.nominalCodeDescription,
      items
    };
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    res.status(500).json({ error: "Failed to fetch purchase order" });
  }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
  const { items, ...poData } = req.body;
  
  try {
    // Generate reference number (e.g., PO-2024-0001)
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    
    // Get the count of POs for this year to generate sequential reference
    const poCount = await db.select({ count: db.fn.count() })
      .from(purchaseOrders)
      .where(like(purchaseOrders.reference, `PO-${year}-%`));
    
    const count = parseInt(poCount[0]?.count?.toString() || '0') + 1;
    const paddedCount = count.toString().padStart(4, '0');
    const reference = `PO-${year}-${paddedCount}`;
    
    // Set the user ID from the authenticated user
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Create the PO
    const [newPO] = await db.insert(purchaseOrders).values({
      ...poData as InsertPurchaseOrder,
      reference,
      createdBy: req.user.id
    }).returning();
    
    // Add the items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const itemsWithPoId = items.map((item: InsertPurchaseOrderItem) => ({
        ...item,
        purchaseOrderId: newPO.id
      }));
      
      await db.insert(purchaseOrderItems).values(itemsWithPoId);
    }
    
    // Fetch the complete PO with items
    const completeOrder = await getPurchaseOrderById(newPO.id);
    
    res.status(201).json(completeOrder);
  } catch (error) {
    console.error("Error creating purchase order:", error);
    res.status(500).json({ error: "Failed to create purchase order" });
  }
};

export const updatePurchaseOrderStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    const validStatuses = ["draft", "pending_approval", "approved", "ordered", "delivered", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    // If status is being set to approved, record the approver
    let updateData: any = { status };
    if (status === "approved") {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      updateData.approvedBy = req.user.id;
      updateData.approvedAt = new Date();
    }
    
    const [updatedPO] = await db
      .update(purchaseOrders)
      .set(updateData)
      .where(eq(purchaseOrders.id, id))
      .returning();
    
    if (!updatedPO) {
      return res.status(404).json({ error: "Purchase order not found" });
    }
    
    // Fetch the complete updated PO with items
    const completeOrder = await getPurchaseOrderById(id);
    
    res.json(completeOrder);
  } catch (error) {
    console.error("Error updating purchase order status:", error);
    res.status(500).json({ error: "Failed to update purchase order status" });
  }
};

// Supplier Performance records
export const getSupplierPerformance = async (_req: Request, res: Response) => {
  try {
    // Mock performance data for demonstration
    const mockPerformanceRecords = [
      {
        id: 1,
        supplierId: 1,
        supplierName: "Thurrock Engineering",
        projectId: 1,
        projectName: "Westfield Development Project",
        performanceDate: new Date(2025, 3, 12),
        category: "quality",
        rating: 4,
        comments: "Materials delivered were of high quality, matching specifications exactly.",
        reviewer: "Jane Cooper",
        createdAt: new Date(2025, 3, 12)
      },
      {
        id: 2,
        supplierId: 1,
        supplierName: "Thurrock Engineering",
        projectId: 1,
        projectName: "Westfield Development Project",
        performanceDate: new Date(2025, 3, 5),
        category: "delivery",
        rating: 3,
        comments: "Delivery was 1 day late but they communicated well about the delay.",
        reviewer: "Jane Cooper",
        createdAt: new Date(2025, 3, 5)
      },
      {
        id: 3,
        supplierId: 2,
        supplierName: "City Materials Ltd",
        projectId: 1,
        projectName: "Westfield Development Project",
        performanceDate: new Date(2025, 3, 10),
        category: "quality",
        rating: 5,
        comments: "Exceptional quality on all items supplied.",
        reviewer: "Jane Cooper",
        createdAt: new Date(2025, 3, 10)
      },
      {
        id: 4,
        supplierId: 3,
        supplierName: "FastTrack Equipment Hire",
        projectId: 1,
        projectName: "Westfield Development Project",
        performanceDate: new Date(2025, 3, 2),
        category: "service",
        rating: 2,
        comments: "Equipment arrived in poor condition and technical support was difficult to reach.",
        reviewer: "Jane Cooper",
        createdAt: new Date(2025, 3, 2)
      },
      {
        id: 5,
        supplierId: 4,
        supplierName: "SafeGuard PPE Solutions",
        projectId: 1,
        projectName: "Westfield Development Project",
        performanceDate: new Date(2025, 3, 8),
        category: "quality",
        rating: 5,
        comments: "All PPE exceeded safety standards and was delivered with proper certification.",
        reviewer: "Jane Cooper",
        createdAt: new Date(2025, 3, 8)
      },
      {
        id: 6,
        supplierId: 5,
        supplierName: "Concrete Express",
        projectId: 1,
        projectName: "Westfield Development Project",
        performanceDate: new Date(2025, 2, 25),
        category: "delivery",
        rating: 5,
        comments: "On-time delivery and excellent communication.",
        reviewer: "Jane Cooper",
        createdAt: new Date(2025, 2, 25)
      }
    ];
    
    res.json(mockPerformanceRecords);
  } catch (error) {
    console.error("Error fetching supplier performance:", error);
    res.status(500).json({ error: "Failed to fetch supplier performance records" });
  }
};

// Procurement Dashboard
export const getProcurementDashboard = async (_req: Request, res: Response) => {
  try {
    // Get total count of purchase orders
    const [totalPOs] = await db
      .select({ count: sql<number>`count(*)::integer`.as('count') })
      .from(purchaseOrders);
    
    // Get count of pending orders
    const [pendingPOs] = await db
      .select({ count: sql<number>`count(*)::integer`.as('count') })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.status, "pending_approval"));
    
    // Get total value of all purchase orders
    const [totalValue] = await db
      .select({ sum: sql<number>`coalesce(sum(${purchaseOrders.totalCost}), 0)::integer`.as('sum') })
      .from(purchaseOrders);
    
    // Get supplier count
    const [supplierCount] = await db
      .select({ count: sql<number>`count(*)::integer`.as('count') })
      .from(suppliers);
    
    // Get recent purchase orders
    const recentPOs = await db
      .select({
        id: purchaseOrders.id,
        reference: purchaseOrders.reference,
        supplierName: suppliers.name,
        totalCost: purchaseOrders.totalCost,
        status: purchaseOrders.status,
        createdAt: purchaseOrders.createdAt
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(10);
    
    // Get POs by status
    const posByStatus = await db
      .select({
        status: purchaseOrders.status,
        count: sql<number>`count(*)::integer`.as('count')
      })
      .from(purchaseOrders)
      .groupBy(purchaseOrders.status);
    
    res.json({
      totalPOs: totalPOs.count || 0,
      pendingPOs: pendingPOs.count || 0,
      totalValue: totalValue.sum || 0,
      supplierCount: supplierCount.count || 0,
      recentPOs,
      posByStatus
    });
  } catch (error) {
    console.error("Error fetching procurement dashboard:", error);
    res.status(500).json({ error: "Failed to fetch procurement dashboard" });
  }
};

// Supplier Invoices
export const getSupplierInvoices = async (_req: Request, res: Response) => {
  try {
    // Mock invoice data for demonstration
    const mockInvoices = [
      {
        id: 1,
        supplierId: 1,
        supplierName: "Thurrock Engineering",
        invoiceNumber: "INV-2025-0042",
        purchaseOrderId: 1,
        purchaseOrderReference: "PO-2025-0001",
        amount: 4586.40,
        status: "paid",
        invoiceDate: new Date(2025, 3, 5),
        dueDate: new Date(2025, 4, 5),
        paidDate: new Date(2025, 3, 15),
        createdAt: new Date(2025, 3, 5)
      },
      {
        id: 2,
        supplierId: 2,
        supplierName: "City Materials Ltd",
        invoiceNumber: "INV-2025-1124",
        purchaseOrderId: 2,
        purchaseOrderReference: "PO-2025-0002",
        amount: 2350.75,
        status: "pending",
        invoiceDate: new Date(2025, 3, 10),
        dueDate: new Date(2025, 4, 10),
        paidDate: null,
        createdAt: new Date(2025, 3, 10)
      },
      {
        id: 3,
        supplierId: 3,
        supplierName: "FastTrack Equipment Hire",
        invoiceNumber: "INV-2025-0078",
        purchaseOrderId: 3,
        purchaseOrderReference: "PO-2025-0003",
        amount: 1890.00,
        status: "overdue",
        invoiceDate: new Date(2025, 2, 15),
        dueDate: new Date(2025, 3, 15),
        paidDate: null,
        createdAt: new Date(2025, 2, 15)
      },
      {
        id: 4,
        supplierId: 4,
        supplierName: "SafeGuard PPE Solutions",
        invoiceNumber: "INV-2025-0356",
        purchaseOrderId: 4,
        purchaseOrderReference: "PO-2025-0004",
        amount: 3456.25,
        status: "paid",
        invoiceDate: new Date(2025, 2, 20),
        dueDate: new Date(2025, 3, 20),
        paidDate: new Date(2025, 3, 10),
        createdAt: new Date(2025, 2, 20)
      },
      {
        id: 5,
        supplierId: 5,
        supplierName: "Concrete Express",
        invoiceNumber: "INV-2025-0987",
        purchaseOrderId: 5,
        purchaseOrderReference: "PO-2025-0005",
        amount: 12568.50,
        status: "pending",
        invoiceDate: new Date(2025, 3, 18),
        dueDate: new Date(2025, 4, 18),
        paidDate: null,
        createdAt: new Date(2025, 3, 18)
      }
    ];
    
    res.json(mockInvoices);
  } catch (error) {
    console.error("Error fetching supplier invoices:", error);
    res.status(500).json({ error: "Failed to fetch supplier invoices" });
  }
};

// Helper function to get a complete purchase order by ID
async function getPurchaseOrderById(id: number) {
  const [purchaseOrder] = await db.select({
    po: purchaseOrders,
    supplierName: suppliers.name,
    supplierContact: suppliers.contactPerson,
    supplierEmail: suppliers.contactEmail,
    nominalCodeDescription: nominalCodes.description
  })
  .from(purchaseOrders)
  .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
  .leftJoin(nominalCodes, eq(purchaseOrders.nominalCodeId, nominalCodes.id))
  .where(eq(purchaseOrders.id, id))
  .limit(1);
  
  if (!purchaseOrder) {
    return null;
  }
  
  // Get all items for this purchase order
  const items = await db.select()
    .from(purchaseOrderItems)
    .where(eq(purchaseOrderItems.purchaseOrderId, id));
  
  return {
    ...purchaseOrder.po,
    supplierName: purchaseOrder.supplierName,
    supplierContact: purchaseOrder.supplierContact,
    supplierEmail: purchaseOrder.supplierEmail,
    nominalCodeDescription: purchaseOrder.nominalCodeDescription,
    items
  };
}