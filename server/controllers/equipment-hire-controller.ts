import { Request, Response } from "express";
import { db } from "../db";
import { 
  equipmentCategories,
  equipmentItems, 
  equipmentHires, 
  offHireRequests,
  offHireConfirmations,
  hireNotifications 
} from "../../shared/schema";
import { 
  insertEquipmentItemSchema, 
  insertEquipmentHireSchema, 
  insertOffHireRequestSchema 
} from "../../shared/schema";
import { eq, and, gte, lte, desc, asc, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";

// Get all equipment categories
export async function getAllEquipmentCategories(req: Request, res: Response) {
  try {
    const categories = await db.select().from(equipmentCategories).orderBy(asc(equipmentCategories.name));
    return res.status(200).json(categories);
  } catch (error) {
    console.error("Error getting equipment categories:", error);
    return res.status(500).json({ message: "Error retrieving equipment categories" });
  }
}

// Get all equipment items with filters
export async function getEquipmentItems(req: Request, res: Response) {
  try {
    const { categoryId, status, ownedStatus } = req.query;
    
    let query = db.select().from(equipmentItems);
    
    if (categoryId) {
      query = query.where(eq(equipmentItems.categoryId, Number(categoryId)));
    }
    
    if (status) {
      query = query.where(eq(equipmentItems.status, String(status)));
    }
    
    if (ownedStatus) {
      query = query.where(eq(equipmentItems.ownedStatus, String(ownedStatus)));
    }
    
    const equipment = await query.orderBy(asc(equipmentItems.name));
    return res.status(200).json(equipment);
  } catch (error) {
    console.error("Error getting equipment items:", error);
    return res.status(500).json({ message: "Error retrieving equipment items" });
  }
}

// Get equipment item by ID
export async function getEquipmentItemById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid equipment ID" });
    }
    
    const [equipment] = await db.select().from(equipmentItems).where(eq(equipmentItems.id, id));
    
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }
    
    return res.status(200).json(equipment);
  } catch (error) {
    console.error(`Error getting equipment item ID ${req.params.id}:`, error);
    return res.status(500).json({ message: "Error retrieving equipment item" });
  }
}

// Create new equipment item
export async function createEquipmentItem(req: Request, res: Response) {
  try {
    const validatedData = insertEquipmentItemSchema.parse(req.body);
    
    const [newEquipment] = await db.insert(equipmentItems)
      .values({
        ...validatedData,
        createdBy: req.user!.id,
      })
      .returning();
    
    return res.status(201).json(newEquipment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid equipment data", errors: error.errors });
    }
    console.error("Error creating equipment item:", error);
    return res.status(500).json({ message: "Error creating equipment item" });
  }
}

// Update equipment item
export async function updateEquipmentItem(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid equipment ID" });
    }
    
    // Get current equipment to ensure it exists
    const [existingEquipment] = await db.select().from(equipmentItems).where(eq(equipmentItems.id, id));
    
    if (!existingEquipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    // Partial validation - only validate the fields that are provided
    const validatedData = req.body;
    
    // Update equipment item
    const [updatedEquipment] = await db.update(equipmentItems)
      .set({
        ...validatedData,
        // Don't update createdBy or createdAt fields
      })
      .where(eq(equipmentItems.id, id))
      .returning();
    
    return res.status(200).json(updatedEquipment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid equipment data", errors: error.errors });
    }
    console.error(`Error updating equipment item ID ${req.params.id}:`, error);
    return res.status(500).json({ message: "Error updating equipment item" });
  }
}

// Get all equipment hires with filters
export async function getEquipmentHires(req: Request, res: Response) {
  try {
    const { projectId, status, startDate, endDate } = req.query;
    
    let query = db.select().from(equipmentHires);
    
    if (projectId) {
      query = query.where(eq(equipmentHires.projectId, Number(projectId)));
    }
    
    if (status) {
      query = query.where(eq(equipmentHires.status, String(status)));
    }
    
    if (startDate) {
      query = query.where(gte(equipmentHires.startDate, new Date(String(startDate))));
    }
    
    if (endDate) {
      query = query.where(lte(equipmentHires.expectedEndDate, new Date(String(endDate))));
    }
    
    const hires = await query.orderBy(desc(equipmentHires.startDate));
    return res.status(200).json(hires);
  } catch (error) {
    console.error("Error getting equipment hires:", error);
    return res.status(500).json({ message: "Error retrieving equipment hires" });
  }
}

// Get hire by ID
export async function getHireById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid hire ID" });
    }
    
    const [hire] = await db.select().from(equipmentHires).where(eq(equipmentHires.id, id));
    
    if (!hire) {
      return res.status(404).json({ message: "Hire record not found" });
    }
    
    return res.status(200).json(hire);
  } catch (error) {
    console.error(`Error getting hire ID ${req.params.id}:`, error);
    return res.status(500).json({ message: "Error retrieving hire" });
  }
}

// Create equipment hire
export async function createEquipmentHire(req: Request, res: Response) {
  try {
    const validatedData = insertEquipmentHireSchema.parse(req.body);
    
    // Check if equipment exists and is available
    const [equipment] = await db.select().from(equipmentItems)
      .where(eq(equipmentItems.id, validatedData.equipmentId));
    
    if (!equipment) {
      return res.status(404).json({ message: "Equipment not found" });
    }
    
    if (equipment.status !== "available") {
      return res.status(400).json({ message: "Equipment is not available for hire" });
    }
    
    // Create hire record
    const [newHire] = await db.insert(equipmentHires)
      .values({
        ...validatedData,
        requestedById: req.user!.id,
        status: "scheduled",
      })
      .returning();
    
    // Update equipment status
    await db.update(equipmentItems)
      .set({ status: "on-hire" })
      .where(eq(equipmentItems.id, validatedData.equipmentId));
    
    return res.status(201).json(newHire);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid hire data", errors: error.errors });
    }
    console.error("Error creating equipment hire:", error);
    return res.status(500).json({ message: "Error creating equipment hire" });
  }
}

// Update equipment hire
export async function updateEquipmentHire(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid hire ID" });
    }
    
    // Get current hire to ensure it exists
    const [existingHire] = await db.select().from(equipmentHires).where(eq(equipmentHires.id, id));
    
    if (!existingHire) {
      return res.status(404).json({ message: "Hire record not found" });
    }

    // Partial validation - only validate the fields that are provided
    const validatedData = req.body;
    
    // Handle status change - if status changing to "returned", set actualEndDate if not provided
    if (validatedData.status === "returned" && !validatedData.actualEndDate) {
      validatedData.actualEndDate = new Date();
      
      // If returning equipment, update equipment status
      await db.update(equipmentItems)
        .set({ status: "available" })
        .where(eq(equipmentItems.id, existingHire.equipmentId));
    }
    
    // Update hire record
    const [updatedHire] = await db.update(equipmentHires)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(equipmentHires.id, id))
      .returning();
    
    return res.status(200).json(updatedHire);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid hire data", errors: error.errors });
    }
    console.error(`Error updating hire ID ${req.params.id}:`, error);
    return res.status(500).json({ message: "Error updating hire" });
  }
}

// --- Supplier Email Confirmation Feature ---

/**
 * Confirm an off-hire request via token from email
 * This is a public endpoint (no auth required) accessed via email
 */
export async function confirmOffHireRequest(req: Request, res: Response) {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).send('Invalid token');
    }
    
    // Find confirmation token
    const [confirmation] = await db.select()
      .from(offHireConfirmations)
      .where(eq(offHireConfirmations.token, token))
      .limit(1);
    
    if (!confirmation) {
      return res.status(404).send('Token not found');
    }
    
    if (confirmation.used) {
      return res.status(400).send('This confirmation link has already been used');
    }
    
    if (new Date() > confirmation.expiresAt) {
      return res.status(400).send('This confirmation link has expired');
    }
    
    // Mark token as used and record IP and user agent
    await db.update(offHireConfirmations)
      .set({
        used: true,
        usedAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      })
      .where(eq(offHireConfirmations.id, confirmation.id));
      
    // Update the off-hire request status to "confirmed"
    const [offHireRequest] = await db.update(offHireRequests)
      .set({
        status: "confirmed",
        confirmationDate: new Date(),
        confirmationNumber: `CNF-${Date.now().toString().substring(7)}`,
      })
      .where(eq(offHireRequests.id, confirmation.offHireRequestId))
      .returning();
      
    // Get hire information for reference
    const [hire] = await db.select()
      .from(equipmentHires)
      .where(eq(equipmentHires.id, offHireRequest.hireId));
      
    // Update the hire status to "off-hire-requested"
    await db.update(equipmentHires)
      .set({
        status: "off-hire-requested",
        updatedAt: new Date(),
      })
      .where(eq(equipmentHires.id, offHireRequest.hireId));
      
    // Create notification for the confirmation
    await db.insert(hireNotifications)
      .values({
        hireId: offHireRequest.hireId,
        offHireRequestId: offHireRequest.id,
        type: "return-confirmation",
        message: `Supplier confirmed off-hire request ${offHireRequest.reference}`,
        sentTo: "system",
        status: "action-taken",
        sentById: 1, // System user
      });
      
    // Return a success page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Off-Hire Confirmation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container {
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #28a745;
            padding: 20px;
            text-align: center;
            color: white;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            margin: -20px -20px 20px -20px;
          }
          .content {
            padding: 20px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .info-box {
            background-color: #e8f4f8;
            border-left: 4px solid #0056b3;
            padding: 15px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Off-Hire Confirmation</h1>
          </div>
          <div class="content">
            <h2>Thank You!</h2>
            
            <p>You have successfully confirmed the off-hire request for:</p>
            
            <div class="info-box">
              <p><strong>Reference:</strong> ${offHireRequest.reference}</p>
              <p><strong>Confirmation Number:</strong> ${offHireRequest.confirmationNumber}</p>
              <p><strong>Requested End Date:</strong> ${offHireRequest.requestedEndDate.toLocaleDateString()}</p>
              <p><strong>Hire Reference:</strong> ${hire.hireReference}</p>
            </div>
            
            <p>Our team will get in touch with you to arrange collection of the equipment.</p>
            
            <p>If you have any questions or need to make changes, please contact us directly.</p>
          </div>
          <div class="footer">
            <p>This is an automated response from the NEC4 Contract Management System.</p>
            <p>&copy; ${new Date().getFullYear()} NEC4 Contract Manager</p>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error confirming off-hire request:", error);
    return res.status(500).send('An error occurred while processing your request');
  }
}

// --- Mobile Equipment Scan and Off-Hire Request Feature ---

// Get off-hire requests
export async function getOffHireRequests(req: Request, res: Response) {
  try {
    const { status, projectId } = req.query;
    
    let query = db.select({
      offHire: offHireRequests,
      hire: equipmentHires,
    })
    .from(offHireRequests)
    .innerJoin(equipmentHires, eq(offHireRequests.hireId, equipmentHires.id));
    
    if (status) {
      query = query.where(eq(offHireRequests.status, String(status)));
    }
    
    if (projectId) {
      query = query.where(eq(equipmentHires.projectId, Number(projectId)));
    }
    
    const results = await query.orderBy(desc(offHireRequests.requestDate));
    
    // Reshape data for frontend
    const offHireRequestsData = results.map(r => ({
      ...r.offHire,
      projectId: r.hire.projectId,
      equipmentId: r.hire.equipmentId,
      hireReference: r.hire.hireReference,
    }));
    
    return res.status(200).json(offHireRequestsData);
  } catch (error) {
    console.error("Error getting off-hire requests:", error);
    return res.status(500).json({ message: "Error retrieving off-hire requests" });
  }
}

// Get off-hire request by ID
export async function getOffHireRequestById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid off-hire request ID" });
    }
    
    const [result] = await db.select({
      offHire: offHireRequests,
      hire: equipmentHires,
      equipment: equipmentItems,
    })
    .from(offHireRequests)
    .innerJoin(equipmentHires, eq(offHireRequests.hireId, equipmentHires.id))
    .innerJoin(equipmentItems, eq(equipmentHires.equipmentId, equipmentItems.id))
    .where(eq(offHireRequests.id, id));
    
    if (!result) {
      return res.status(404).json({ message: "Off-hire request not found" });
    }
    
    // Combine data for frontend
    const offHireData = {
      ...result.offHire,
      hire: result.hire,
      equipment: result.equipment,
    };
    
    return res.status(200).json(offHireData);
  } catch (error) {
    console.error(`Error getting off-hire request ID ${req.params.id}:`, error);
    return res.status(500).json({ message: "Error retrieving off-hire request" });
  }
}

// Create off-hire request
export async function createOffHireRequest(req: Request, res: Response) {
  try {
    const validatedData = insertOffHireRequestSchema.parse(req.body);
    
    // Check if hire exists
    const [hire] = await db.select().from(equipmentHires)
      .where(eq(equipmentHires.id, validatedData.hireId));
    
    if (!hire) {
      return res.status(404).json({ message: "Hire record not found" });
    }
    
    // Check if there's already an active off-hire request
    const [existingRequest] = await db.select().from(offHireRequests)
      .where(
        and(
          eq(offHireRequests.hireId, validatedData.hireId),
          eq(offHireRequests.status, "pending")
        )
      );
    
    if (existingRequest) {
      return res.status(400).json({ 
        message: "An off-hire request already exists for this hire",
        existingRequest
      });
    }
    
    // Generate reference number
    const reference = `OFF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    
    // Generate QR code value - secure random ID that can be scanned
    const qrCode = `EQ-${randomUUID().substring(0, 8)}`;
    
    // Create off-hire request
    const [newOffHireRequest] = await db.insert(offHireRequests)
      .values({
        ...validatedData,
        reference,
        qrCode,
        requestedById: req.user!.id,
        status: "pending",
      })
      .returning();
    
    // Update hire status
    await db.update(equipmentHires)
      .set({ 
        status: "off-hire-requested",
        updatedAt: new Date()
      })
      .where(eq(equipmentHires.id, validatedData.hireId));
    
    return res.status(201).json(newOffHireRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid off-hire request data", errors: error.errors });
    }
    console.error("Error creating off-hire request:", error);
    return res.status(500).json({ message: "Error creating off-hire request" });
  }
}

// Update off-hire request
export async function updateOffHireRequest(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid off-hire request ID" });
    }
    
    // Get current request to ensure it exists
    const [existingRequest] = await db.select().from(offHireRequests).where(eq(offHireRequests.id, id));
    
    if (!existingRequest) {
      return res.status(404).json({ message: "Off-hire request not found" });
    }
    
    // Validate the data to update
    const validatedData = req.body;
    
    // If status changing to "completed", set actualEndDate if not provided
    if (validatedData.status === "completed" && !validatedData.actualEndDate) {
      validatedData.actualEndDate = new Date();
    }
    
    // Handle special case - if this is a scan confirmation
    if (validatedData.scanDate && !existingRequest.scanDate) {
      validatedData.scanById = req.user!.id;
      validatedData.status = "confirmed";
      
      // Also mark the hire as returned
      const [hire] = await db.select().from(equipmentHires)
        .where(eq(equipmentHires.id, existingRequest.hireId));
      
      if (hire) {
        await db.update(equipmentHires)
          .set({ 
            status: "returned",
            actualEndDate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(equipmentHires.id, existingRequest.hireId));
        
        // Also update equipment status to available
        await db.update(equipmentItems)
          .set({ status: "available" })
          .where(eq(equipmentItems.id, hire.equipmentId));
      }
    }
    
    // Update off-hire request
    const [updatedRequest] = await db.update(offHireRequests)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(offHireRequests.id, id))
      .returning();
    
    return res.status(200).json(updatedRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid off-hire request data", errors: error.errors });
    }
    console.error(`Error updating off-hire request ID ${req.params.id}:`, error);
    return res.status(500).json({ message: "Error updating off-hire request" });
  }
}

// Mobile scan functionality
export async function mobileOffHireScan(req: Request, res: Response) {
  try {
    const { qrCode, latitude, longitude, location, images } = req.body;
    
    if (!qrCode) {
      return res.status(400).json({ message: "QR code is required" });
    }
    
    // Look up off-hire request by QR code
    const [offHireRequest] = await db.select().from(offHireRequests)
      .where(eq(offHireRequests.qrCode, qrCode));
    
    if (!offHireRequest) {
      return res.status(404).json({ message: "Invalid QR code - no matching off-hire request found" });
    }
    
    // Check if already scanned
    if (offHireRequest.scanDate) {
      return res.status(400).json({ 
        message: "Equipment already scanned for off-hire", 
        alreadyScanned: true,
        scanDate: offHireRequest.scanDate 
      });
    }
    
    // Process the scan
    const scanData = {
      scanDate: new Date(),
      scanById: req.user!.id,
      scanLatitude: latitude || null,
      scanLongitude: longitude || null,
      scanLocation: location || null,
      images: images || null,
      status: "confirmed",
      updatedAt: new Date(),
    };
    
    // Update the off-hire request
    const [updatedRequest] = await db.update(offHireRequests)
      .set(scanData)
      .where(eq(offHireRequests.id, offHireRequest.id))
      .returning();
    
    // Get the hire record
    const [hire] = await db.select().from(equipmentHires)
      .where(eq(equipmentHires.id, updatedRequest.hireId));
    
    if (hire) {
      // Update the hire status
      await db.update(equipmentHires)
        .set({
          status: "returned",
          actualEndDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(equipmentHires.id, hire.id));
      
      // Update equipment status
      await db.update(equipmentItems)
        .set({ status: "available" })
        .where(eq(equipmentItems.id, hire.equipmentId));
    }
    
    // Add notification
    await db.insert(hireNotifications)
      .values({
        hireId: offHireRequest.hireId,
        offHireRequestId: offHireRequest.id,
        type: "return-confirmation",
        message: `Equipment scan confirmed for off-hire request ${offHireRequest.reference}`,
        sentTo: "system",
        sentById: req.user!.id,
        status: "sent",
      });
    
    // Get details to return
    const [result] = await db.select({
      offHire: offHireRequests,
      hire: equipmentHires,
      equipment: equipmentItems,
    })
    .from(offHireRequests)
    .innerJoin(equipmentHires, eq(offHireRequests.hireId, equipmentHires.id))
    .innerJoin(equipmentItems, eq(equipmentHires.equipmentId, equipmentItems.id))
    .where(eq(offHireRequests.id, offHireRequest.id));
    
    return res.status(200).json({
      success: true,
      message: "Equipment successfully scanned for off-hire",
      offHireRequest: updatedRequest,
      details: result,
    });
  } catch (error) {
    console.error("Error processing mobile off-hire scan:", error);
    return res.status(500).json({ message: "Error processing equipment scan" });
  }
}

// Dashboard statistics
export async function getEquipmentHireDashboardStats(req: Request, res: Response) {
  try {
    const today = new Date();
    
    // Total number of equipment items
    const [totalEquipmentResult] = await db.select({ 
      count: sql`count(*)` 
    })
    .from(equipmentItems);
    
    // Equipment on hire
    const [onHireResult] = await db.select({ 
      count: sql`count(*)` 
    })
    .from(equipmentItems)
    .where(eq(equipmentItems.status, "on-hire"));
    
    // Current hires
    const [totalHiresResult] = await db.select({ 
      count: sql`count(*)` 
    })
    .from(equipmentHires)
    .where(eq(equipmentHires.status, "on-hire"));
    
    // Hires due in next 7 days
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const [dueSoonResult] = await db.select({ 
      count: sql`count(*)` 
    })
    .from(equipmentHires)
    .where(
      and(
        eq(equipmentHires.status, "on-hire"),
        lte(equipmentHires.expectedEndDate, nextWeek),
        gte(equipmentHires.expectedEndDate, today)
      )
    );
    
    // Overdue hires
    const [overdueResult] = await db.select({ 
      count: sql`count(*)` 
    })
    .from(equipmentHires)
    .where(
      and(
        eq(equipmentHires.status, "on-hire"),
        lte(equipmentHires.expectedEndDate, today),
        isNull(equipmentHires.actualEndDate)
      )
    );
    
    // Pending off-hire requests
    const [pendingOffHireResult] = await db.select({ 
      count: sql`count(*)` 
    })
    .from(offHireRequests)
    .where(eq(offHireRequests.status, "pending"));
    
    return res.status(200).json({
      totalEquipment: Number(totalEquipmentResult.count),
      onHire: Number(onHireResult.count),
      totalHires: Number(totalHiresResult.count),
      dueSoon: Number(dueSoonResult.count),
      overdue: Number(overdueResult.count),
      pendingOffHire: Number(pendingOffHireResult.count),
    });
  } catch (error) {
    console.error("Error getting equipment hire dashboard stats:", error);
    return res.status(500).json({ message: "Error retrieving dashboard statistics" });
  }
}

import { sql } from "drizzle-orm";