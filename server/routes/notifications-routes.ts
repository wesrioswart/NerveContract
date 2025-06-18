import { Router } from "express";
import { db } from "../db";
import { eq, and, gt, sql } from "drizzle-orm";
import { rfis, compensationEvents, earlyWarnings, nonConformanceReports, equipmentHires, users } from "@shared/schema";

const router = Router();

// Simple notification counts - count items from last 7 days
router.get("/projects/:projectId/notifications/counts", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const [rfiCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rfis)
      .where(and(
        eq(rfis.projectId, projectId),
        gt(rfis.createdAt, lastWeek)
      ));

    const [ceCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(compensationEvents)
      .where(and(
        eq(compensationEvents.projectId, projectId),
        gt(compensationEvents.raisedAt, lastWeek)
      ));

    const [ewCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(earlyWarnings)
      .where(and(
        eq(earlyWarnings.projectId, projectId),
        gt(earlyWarnings.raisedAt, lastWeek)
      ));

    res.json({
      rfis: Number(rfiCount.count) || 0,
      compensationEvents: Number(ceCount.count) || 0,
      earlyWarnings: Number(ewCount.count) || 0,
      total: (Number(rfiCount.count) || 0) + (Number(ceCount.count) || 0) + (Number(ewCount.count) || 0)
    });
  } catch (error) {
    console.error("Error getting notification counts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get recent items with details
router.get("/projects/:projectId/notifications/recent-items", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Get recent RFIs
    const recentRfis = await db
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
        gt(rfis.createdAt, lastWeek)
      ))
      .orderBy(rfis.createdAt)
      .limit(10);

    // Get recent Compensation Events
    const recentCEs = await db
      .select({
        id: compensationEvents.id,
        title: compensationEvents.title,
        reference: compensationEvents.reference,
        createdAt: compensationEvents.raisedAt,
        createdBy: {
          id: users.id,
          fullName: users.fullName
        }
      })
      .from(compensationEvents)
      .leftJoin(users, eq(compensationEvents.raisedBy, users.id))
      .where(and(
        eq(compensationEvents.projectId, projectId),
        gt(compensationEvents.raisedAt, lastWeek)
      ))
      .orderBy(compensationEvents.raisedAt)
      .limit(10);

    // Get recent Early Warnings
    const recentEWs = await db
      .select({
        id: earlyWarnings.id,
        title: earlyWarnings.description,
        reference: sql<string>`'EW-' || ${earlyWarnings.id}`,
        createdAt: earlyWarnings.raisedAt,
        createdBy: {
          id: users.id,
          fullName: users.fullName
        }
      })
      .from(earlyWarnings)
      .leftJoin(users, eq(earlyWarnings.raisedBy, users.id))
      .where(and(
        eq(earlyWarnings.projectId, projectId),
        gt(earlyWarnings.raisedAt, lastWeek)
      ))
      .orderBy(earlyWarnings.raisedAt)
      .limit(10);

    // Combine all items with type information
    const allItems = [
      ...recentRfis.map(item => ({ ...item, type: 'rfi' })),
      ...recentCEs.map(item => ({ ...item, type: 'compensation-event' })),
      ...recentEWs.map(item => ({ ...item, type: 'early-warning' })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(allItems);
  } catch (error) {
    console.error("Error getting recent items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as notificationsRouter };