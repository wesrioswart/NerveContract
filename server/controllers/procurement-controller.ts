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