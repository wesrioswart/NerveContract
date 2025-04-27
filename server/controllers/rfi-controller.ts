import { Request, Response } from "express";
import { db } from "../db";
import { eq, and, asc, desc, sql, isNull, isNotNull, gte, lte, like } from "drizzle-orm";
import { 
  rfis, 
  rfiAttachments, 
  rfiComments, 
  projectPeriods,
  projects,
  users,
  insertRfiSchema, 
  insertRfiAttachmentSchema, 
  insertRfiCommentSchema,
  insertProjectPeriodSchema
} from "@shared/schema";
import { z } from "zod";
import { addDays, differenceInDays, parseISO, format } from "date-fns";
import multer from "multer";
import path from "path";
import fs from "fs";

// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads", "rfi-attachments");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });

// Create a new RFI
export const createRfi = async (req: Request, res: Response) => {
  try {
    const userData = req.user;
    if (!userData) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const validatedData = insertRfiSchema.parse(req.body);
    
    // Calculate planned response date based on submission date and contractual reply period
    const submissionDate = parseISO(validatedData.submissionDate.toString());
    const plannedResponseDate = addDays(submissionDate, validatedData.contractualReplyPeriod);
    
    // Create RFI record
    const [rfi] = await db.insert(rfis).values({
      ...validatedData,
      plannedResponseDate,
      createdBy: userData.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    res.status(201).json(rfi);
  } catch (error) {
    console.error("Error creating RFI:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create RFI" });
  }
};

// Get all RFIs for a project with optional filtering
export const getRfis = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { period, status, ceStatus, search, sortBy, sortOrder, within, overdue } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    let query = db.select({
      rfi: rfis,
      createdByUser: {
        id: users.id,
        fullName: users.fullName,
      },
      periodName: projectPeriods.name,
    }).from(rfis)
      .leftJoin(users, eq(rfis.createdBy, users.id))
      .leftJoin(projectPeriods, eq(rfis.periodId, projectPeriods.id))
      .where(eq(rfis.projectId, parseInt(projectId)));

    // Apply filters
    if (period) {
      query = query.where(eq(rfis.periodId, parseInt(period as string)));
    }

    if (status) {
      query = query.where(eq(rfis.status, status as string));
    }

    if (ceStatus) {
      query = query.where(eq(rfis.ceStatus, ceStatus as string));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        sql`(${rfis.reference} ILIKE ${searchTerm} OR ${rfis.title} ILIKE ${searchTerm})`
      );
    }

    // Filter by response status
    if (within === 'reply-period') {
      query = query.where(isNull(rfis.responseDate));
    } else if (within === 'due-soon') {
      const sevenDaysFromNow = addDays(new Date(), 7);
      query = query.where(
        and(
          isNull(rfis.responseDate),
          lte(rfis.plannedResponseDate, sevenDaysFromNow),
          gte(rfis.plannedResponseDate, new Date())
        )
      );
    } else if (overdue === 'less-than-7') {
      const sevenDaysAgo = addDays(new Date(), -7);
      query = query.where(
        and(
          isNull(rfis.responseDate),
          lte(rfis.plannedResponseDate, new Date()),
          gte(rfis.plannedResponseDate, sevenDaysAgo)
        )
      );
    } else if (overdue === 'more-than-7') {
      const sevenDaysAgo = addDays(new Date(), -7);
      query = query.where(
        and(
          isNull(rfis.responseDate),
          lte(rfis.plannedResponseDate, sevenDaysAgo)
        )
      );
    }

    // Apply sorting
    if (sortBy && sortOrder) {
      const order = sortOrder === 'asc' ? asc : desc;
      
      if (sortBy === 'reference') {
        query = query.orderBy(order(rfis.reference));
      } else if (sortBy === 'title') {
        query = query.orderBy(order(rfis.title));
      } else if (sortBy === 'submissionDate') {
        query = query.orderBy(order(rfis.submissionDate));
      } else if (sortBy === 'plannedResponseDate') {
        query = query.orderBy(order(rfis.plannedResponseDate));
      } else if (sortBy === 'status') {
        query = query.orderBy(order(rfis.status));
      }
    } else {
      // Default sorting by reference
      query = query.orderBy(asc(rfis.reference));
    }

    const results = await query;

    // Add performance status
    const rfiResults = results.map(item => {
      let responseStatus;
      
      if (item.rfi.responseDate) {
        // Already responded
        const daysToRespond = item.rfi.responseDate ? 
          differenceInDays(parseISO(item.rfi.responseDate.toString()), parseISO(item.rfi.submissionDate.toString())) : 
          null;
          
        const onTime = daysToRespond !== null && daysToRespond <= item.rfi.contractualReplyPeriod;
        responseStatus = onTime ? 'on-time' : 'late';
      } else {
        // Not yet responded
        const today = new Date();
        const daysLeft = differenceInDays(parseISO(item.rfi.plannedResponseDate.toString()), today);
        
        if (daysLeft < 0) {
          responseStatus = 'overdue'; // Red
        } else if (daysLeft <= 7) {
          responseStatus = 'due-soon'; // Orange
        } else {
          responseStatus = 'within-period'; // Green
        }
      }

      return {
        ...item.rfi,
        createdBy: item.createdByUser,
        periodName: item.periodName,
        responseStatus,
      };
    });

    res.json(rfiResults);
  } catch (error) {
    console.error("Error fetching RFIs:", error);
    res.status(500).json({ message: "Failed to fetch RFIs" });
  }
};

// Get a single RFI by ID
export const getRfiById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rfiData = await db.select({
      rfi: rfis,
      createdByUser: {
        id: users.id,
        fullName: users.fullName,
      },
      project: {
        id: projects.id,
        name: projects.name,
      },
      period: {
        id: projectPeriods.id,
        name: projectPeriods.name,
      },
    })
    .from(rfis)
    .leftJoin(users, eq(rfis.createdBy, users.id))
    .leftJoin(projects, eq(rfis.projectId, projects.id))
    .leftJoin(projectPeriods, eq(rfis.periodId, projectPeriods.id))
    .where(eq(rfis.id, parseInt(id)))
    .limit(1);

    if (rfiData.length === 0) {
      return res.status(404).json({ message: "RFI not found" });
    }

    // Fetch attachments
    const attachments = await db.select()
      .from(rfiAttachments)
      .where(eq(rfiAttachments.rfiId, parseInt(id)));

    // Fetch comments
    const comments = await db.select({
      comment: rfiComments,
      user: {
        id: users.id,
        fullName: users.fullName,
      },
    })
    .from(rfiComments)
    .leftJoin(users, eq(rfiComments.createdBy, users.id))
    .where(eq(rfiComments.rfiId, parseInt(id)))
    .orderBy(asc(rfiComments.createdAt));

    // Calculate response status
    const rfi = rfiData[0].rfi;
    let responseStatus;
    
    if (rfi.responseDate) {
      // Already responded
      const daysToRespond = rfi.responseDate ? 
        differenceInDays(parseISO(rfi.responseDate.toString()), parseISO(rfi.submissionDate.toString())) : 
        null;
        
      const onTime = daysToRespond !== null && daysToRespond <= rfi.contractualReplyPeriod;
      responseStatus = onTime ? 'on-time' : 'late';
    } else {
      // Not yet responded
      const today = new Date();
      const daysLeft = differenceInDays(parseISO(rfi.plannedResponseDate.toString()), today);
      
      if (daysLeft < 0) {
        responseStatus = 'overdue'; // Red
      } else if (daysLeft <= 7) {
        responseStatus = 'due-soon'; // Orange
      } else {
        responseStatus = 'within-period'; // Green
      }
    }

    res.json({
      ...rfi,
      project: rfiData[0].project,
      createdBy: rfiData[0].createdByUser,
      period: rfiData[0].period,
      attachments,
      comments: comments.map(c => ({
        ...c.comment,
        user: c.user
      })),
      responseStatus,
    });
  } catch (error) {
    console.error("Error fetching RFI:", error);
    res.status(500).json({ message: "Failed to fetch RFI" });
  }
};

// Update an RFI
export const updateRfi = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userData = req.user;

    if (!userData) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Partial validation schema for updates
    const updateRfiSchema = insertRfiSchema.partial();
    const validatedData = updateRfiSchema.parse(req.body);

    // Handle planned response date recalculation if contractual reply period or submission date changed
    if (validatedData.contractualReplyPeriod !== undefined || validatedData.submissionDate !== undefined) {
      // Fetch current RFI data if needed
      const [currentRfi] = await db.select().from(rfis).where(eq(rfis.id, parseInt(id)));
      
      if (!currentRfi) {
        return res.status(404).json({ message: "RFI not found" });
      }

      const submissionDate = validatedData.submissionDate 
        ? parseISO(validatedData.submissionDate.toString()) 
        : currentRfi.submissionDate;
      
      const replyPeriod = validatedData.contractualReplyPeriod !== undefined 
        ? validatedData.contractualReplyPeriod 
        : currentRfi.contractualReplyPeriod;
      
      validatedData.plannedResponseDate = addDays(submissionDate, replyPeriod);
    }

    const [updatedRfi] = await db
      .update(rfis)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(rfis.id, parseInt(id)))
      .returning();

    if (!updatedRfi) {
      return res.status(404).json({ message: "RFI not found" });
    }

    res.json(updatedRfi);
  } catch (error) {
    console.error("Error updating RFI:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update RFI" });
  }
};

// Delete an RFI
export const deleteRfi = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userData = req.user;

    if (!userData) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Delete RFI (cascade will handle attachments and comments)
    const [deletedRfi] = await db
      .delete(rfis)
      .where(eq(rfis.id, parseInt(id)))
      .returning();

    if (!deletedRfi) {
      return res.status(404).json({ message: "RFI not found" });
    }

    res.json({ message: "RFI deleted successfully" });
  } catch (error) {
    console.error("Error deleting RFI:", error);
    res.status(500).json({ message: "Failed to delete RFI" });
  }
};

// Add an attachment to an RFI
export const addRfiAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userData = req.user;
    const file = req.file;

    if (!userData) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const attachmentData = {
      rfiId: parseInt(id),
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      fileType: file.mimetype,
      uploadedBy: userData.id,
    };

    const [attachment] = await db
      .insert(rfiAttachments)
      .values(attachmentData)
      .returning();

    res.status(201).json(attachment);
  } catch (error) {
    console.error("Error adding RFI attachment:", error);
    res.status(500).json({ message: "Failed to add attachment" });
  }
};

// Delete an attachment
export const deleteRfiAttachment = async (req: Request, res: Response) => {
  try {
    const { id, attachmentId } = req.params;
    const userData = req.user;

    if (!userData) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Find the attachment to get the file path
    const [attachment] = await db
      .select()
      .from(rfiAttachments)
      .where(and(
        eq(rfiAttachments.id, parseInt(attachmentId)),
        eq(rfiAttachments.rfiId, parseInt(id))
      ));

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Delete from database
    await db
      .delete(rfiAttachments)
      .where(eq(rfiAttachments.id, parseInt(attachmentId)));

    // Delete the file if it exists
    if (fs.existsSync(attachment.filePath)) {
      fs.unlinkSync(attachment.filePath);
    }

    res.json({ message: "Attachment deleted successfully" });
  } catch (error) {
    console.error("Error deleting RFI attachment:", error);
    res.status(500).json({ message: "Failed to delete attachment" });
  }
};

// Add a comment to an RFI
export const addRfiComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userData = req.user;
    const { comment } = req.body;

    if (!userData) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!comment) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const commentData = {
      rfiId: parseInt(id),
      comment,
      createdBy: userData.id,
    };

    const [newComment] = await db
      .insert(rfiComments)
      .values(commentData)
      .returning();

    // Get user information for the response
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userData.id));

    res.status(201).json({
      ...newComment,
      user: {
        id: user.id,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error("Error adding RFI comment:", error);
    res.status(500).json({ message: "Failed to add comment" });
  }
};

// Delete a comment
export const deleteRfiComment = async (req: Request, res: Response) => {
  try {
    const { id, commentId } = req.params;
    const userData = req.user;

    if (!userData) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Ensure the comment exists and belongs to the RFI
    const [comment] = await db
      .select()
      .from(rfiComments)
      .where(and(
        eq(rfiComments.id, parseInt(commentId)),
        eq(rfiComments.rfiId, parseInt(id))
      ));

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Only allow the comment creator or an admin to delete
    if (comment.createdBy !== userData.id && userData.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    // Delete the comment
    await db
      .delete(rfiComments)
      .where(eq(rfiComments.id, parseInt(commentId)));

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting RFI comment:", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

// Get all project periods
export const getProjectPeriods = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    const periods = await db
      .select()
      .from(projectPeriods)
      .where(eq(projectPeriods.projectId, parseInt(projectId)))
      .orderBy(asc(projectPeriods.startDate));

    res.json(periods);
  } catch (error) {
    console.error("Error fetching project periods:", error);
    res.status(500).json({ message: "Failed to fetch project periods" });
  }
};

// Create a new project period
export const createProjectPeriod = async (req: Request, res: Response) => {
  try {
    const userData = req.user;
    if (!userData) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const validatedData = insertProjectPeriodSchema.parse(req.body);
    
    const [period] = await db
      .insert(projectPeriods)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json(period);
  } catch (error) {
    console.error("Error creating project period:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create project period" });
  }
};

// Get RFI metrics (for dashboard)
export const getRfiMetrics = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    // Total RFIs
    const [totalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rfis)
      .where(eq(rfis.projectId, parseInt(projectId)));
    
    // Within reply period
    const withinReplyPeriod = await db
      .select({ count: sql<number>`count(*)` })
      .from(rfis)
      .where(
        and(
          eq(rfis.projectId, parseInt(projectId)),
          isNull(rfis.responseDate),
          gte(rfis.plannedResponseDate, new Date())
        )
      );
    
    // Due within 7 days
    const sevenDaysFromNow = addDays(new Date(), 7);
    const dueSoon = await db
      .select({ count: sql<number>`count(*)` })
      .from(rfis)
      .where(
        and(
          eq(rfis.projectId, parseInt(projectId)),
          isNull(rfis.responseDate),
          lte(rfis.plannedResponseDate, sevenDaysFromNow),
          gte(rfis.plannedResponseDate, new Date())
        )
      );
    
    // Overdue less than 7 days
    const sevenDaysAgo = addDays(new Date(), -7);
    const overdueLessThan7 = await db
      .select({ count: sql<number>`count(*)` })
      .from(rfis)
      .where(
        and(
          eq(rfis.projectId, parseInt(projectId)),
          isNull(rfis.responseDate),
          lte(rfis.plannedResponseDate, new Date()),
          gte(rfis.plannedResponseDate, sevenDaysAgo)
        )
      );
    
    // Overdue more than 7 days
    const overdueMoreThan7 = await db
      .select({ count: sql<number>`count(*)` })
      .from(rfis)
      .where(
        and(
          eq(rfis.projectId, parseInt(projectId)),
          isNull(rfis.responseDate),
          lte(rfis.plannedResponseDate, sevenDaysAgo)
        )
      );
    
    // CE Status counts
    const ceStatusCounts = await db
      .select({
        status: rfis.ceStatus,
        count: sql<number>`count(*)`
      })
      .from(rfis)
      .where(
        and(
          eq(rfis.projectId, parseInt(projectId)),
          isNotNull(rfis.ceStatus)
        )
      )
      .groupBy(rfis.ceStatus);
    
    // Period counts
    const periodCounts = await db
      .select({
        period: projectPeriods.name,
        periodId: projectPeriods.id,
        count: sql<number>`count(*)`
      })
      .from(rfis)
      .leftJoin(projectPeriods, eq(rfis.periodId, projectPeriods.id))
      .where(
        and(
          eq(rfis.projectId, parseInt(projectId)),
          isNotNull(rfis.periodId)
        )
      )
      .groupBy(projectPeriods.id, projectPeriods.name);

    // Recent RFIs
    const recentRfis = await db
      .select({
        id: rfis.id,
        reference: rfis.reference,
        title: rfis.title,
        status: rfis.status,
        submissionDate: rfis.submissionDate,
        plannedResponseDate: rfis.plannedResponseDate,
        responseDate: rfis.responseDate,
      })
      .from(rfis)
      .where(eq(rfis.projectId, parseInt(projectId)))
      .orderBy(desc(rfis.createdAt))
      .limit(5);

    res.json({
      total: totalCount.count,
      withinReplyPeriod: withinReplyPeriod[0]?.count || 0,
      dueSoon: dueSoon[0]?.count || 0,
      overdueLessThan7: overdueLessThan7[0]?.count || 0,
      overdueMoreThan7: overdueMoreThan7[0]?.count || 0,
      ceStatusCounts,
      periodCounts,
      recentRfis
    });
  } catch (error) {
    console.error("Error fetching RFI metrics:", error);
    res.status(500).json({ message: "Failed to fetch RFI metrics" });
  }
};