import { Request, Response } from "express";
import { db } from "../db";
import { eq, and, gt, sql } from "drizzle-orm";
import { 
  rfis, 
  compensationEvents, 
  earlyWarnings, 
  nonConformanceReports, 
  equipmentHires,
  users
} from "@shared/schema";

// Get notification counts for a project
export const getNotificationCounts = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get last viewed times from request or use 7 days ago as default
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const defaultLastViewed = lastWeek.toISOString();

    // Get counts of items created after last viewed time
    const [rfiCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rfis)
      .where(and(
        eq(rfis.projectId, projectId),
        gt(rfis.createdAt, new Date(defaultLastViewed))
      ));

    const [ceCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(compensationEvents)
      .where(and(
        eq(compensationEvents.projectId, projectId),
        gt(compensationEvents.raisedAt, new Date(defaultLastViewed))
      ));

    const [ewCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(earlyWarnings)
      .where(and(
        eq(earlyWarnings.projectId, projectId),
        gt(earlyWarnings.raisedAt, new Date(defaultLastViewed))
      ));

    const [ncrCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(nonConformanceReports)
      .where(and(
        eq(nonConformanceReports.projectId, projectId),
        gt(nonConformanceReports.createdAt, defaultLastViewed)
      ));

    const [ehCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(equipmentHires)
      .where(and(
        eq(equipmentHires.projectId, projectId),
        gt(equipmentHires.createdAt, defaultLastViewed)
      ));

    res.json({
      rfis: Number(rfiCount.count) || 0,
      compensationEvents: Number(ceCount.count) || 0,
      earlyWarnings: Number(ewCount.count) || 0,
      nonConformanceReports: Number(ncrCount.count) || 0,
      equipmentHires: Number(ehCount.count) || 0,
    });
  } catch (error) {
    console.error("Error getting notification counts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get new items details for a project
export const getNewItems = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get last viewed times from query params or use defaults
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const defaultLastViewed = lastWeek.toISOString();

    const lastViewedRfis = req.query.lastViewedRfis as string || defaultLastViewed;
    const lastViewedCE = req.query.lastViewedCE as string || defaultLastViewed;
    const lastViewedEW = req.query.lastViewedEW as string || defaultLastViewed;
    const lastViewedNCR = req.query.lastViewedNCR as string || defaultLastViewed;
    const lastViewedEH = req.query.lastViewedEH as string || defaultLastViewed;

    // Get new RFIs with creator info
    const newRfis = await db
      .select({
        id: rfis.id,
        title: rfis.title,
        reference: rfis.reference,
        createdAt: rfis.createdAt,
        createdBy: {
          id: users.id,
          fullName: users.fullName
        }
      })
      .from(rfis)
      .leftJoin(users, eq(rfis.createdBy, users.id))
      .where(and(
        eq(rfis.projectId, projectId),
        gt(rfis.createdAt, lastViewedRfis)
      ))
      .orderBy(rfis.createdAt)
      .limit(20);

    // Get new Compensation Events
    const newCEs = await db
      .select({
        id: compensationEvents.id,
        title: compensationEvents.title,
        reference: compensationEvents.reference,
        createdAt: compensationEvents.createdAt,
        createdBy: {
          id: users.id,
          fullName: users.fullName
        }
      })
      .from(compensationEvents)
      .leftJoin(users, eq(compensationEvents.raisedBy, users.id))
      .where(and(
        eq(compensationEvents.projectId, projectId),
        gt(compensationEvents.createdAt, lastViewedCE)
      ))
      .orderBy(compensationEvents.createdAt)
      .limit(20);

    // Get new Early Warnings
    const newEWs = await db
      .select({
        id: earlyWarnings.id,
        title: earlyWarnings.description,
        reference: sql<string>`'EW-' || ${earlyWarnings.id}`,
        createdAt: earlyWarnings.createdAt,
        createdBy: {
          id: users.id,
          fullName: users.fullName
        }
      })
      .from(earlyWarnings)
      .leftJoin(users, eq(earlyWarnings.raisedBy, users.id))
      .where(and(
        eq(earlyWarnings.projectId, projectId),
        gt(earlyWarnings.createdAt, lastViewedEW)
      ))
      .orderBy(earlyWarnings.createdAt)
      .limit(20);

    // Get new Equipment Hires
    const newEHs = await db
      .select({
        id: equipmentHires.id,
        title: equipmentHires.equipmentType,
        reference: sql<string>`'EH-' || ${equipmentHires.id}`,
        createdAt: equipmentHires.createdAt,
        createdBy: {
          id: users.id,
          fullName: users.fullName
        }
      })
      .from(equipmentHires)
      .leftJoin(users, eq(equipmentHires.requestedBy, users.id))
      .where(and(
        eq(equipmentHires.projectId, projectId),
        gt(equipmentHires.createdAt, lastViewedEH)
      ))
      .orderBy(equipmentHires.createdAt)
      .limit(20);

    // Combine all new items with type information
    const allNewItems = [
      ...newRfis.map(item => ({ ...item, type: 'rfi', isNew: true })),
      ...newCEs.map(item => ({ ...item, type: 'compensation-event', isNew: true })),
      ...newEWs.map(item => ({ ...item, type: 'early-warning', isNew: true })),
      ...newEHs.map(item => ({ ...item, type: 'equipment-hire', isNew: true })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(allNewItems);
  } catch (error) {
    console.error("Error getting new items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark items as viewed
export const markAsViewed = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { type, itemIds } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const viewedAt = new Date();

    // Update viewed_at timestamp based on type
    switch (type) {
      case 'rfis':
        if (itemIds && itemIds.length > 0) {
          await db.update(rfis)
            .set({ viewedAt })
            .where(and(
              eq(rfis.projectId, projectId),
              sql`${rfis.id} = ANY(${itemIds})`
            ));
        }
        break;
      // Add other types as needed
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking items as viewed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};