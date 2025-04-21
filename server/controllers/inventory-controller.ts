import { Request, Response } from "express";
import { db } from "../db";
import {
  inventoryItems,
  inventoryLocations,
  stockLevels,
  stockTransactions,
  InsertInventoryItem,
  InsertInventoryLocation,
  InsertStockLevel,
  InsertStockTransaction,
} from "@shared/schema";
import { eq, and, like, ilike, desc, asc, sum, gt, gte, lte, sql } from "drizzle-orm";

// Inventory Items
export const getInventoryItems = async (req: Request, res: Response) => {
  try {
    const { search, category, lowStock } = req.query;
    
    let query = db.select().from(inventoryItems);
    
    if (search) {
      query = query.where(
        ilike(inventoryItems.name, `%${search}%`)
      );
    }
    
    if (category) {
      query = query.where(eq(inventoryItems.category, category as string));
    }
    
    const items = await query.orderBy(asc(inventoryItems.name));
    
    // If requesting low stock items, we need to join with stock levels
    if (lowStock === 'true') {
      // For each item, get its total stock across all locations
      const stockByItem = await db
        .select({
          itemId: stockLevels.itemId,
          totalStock: sql<number>`sum(${stockLevels.quantity})`.as('total_stock')
        })
        .from(stockLevels)
        .groupBy(stockLevels.itemId);
      
      // Create a map for quick lookup
      const stockMap = new Map(stockByItem.map(s => [s.itemId, s.totalStock]));
      
      // Filter items that are below their reorder point
      const lowStockItems = items.filter(item => {
        const totalStock = stockMap.get(item.id) || 0;
        return totalStock <= item.reorderPoint;
      });
      
      return res.json(lowStockItems);
    }
    
    res.json(items);
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    res.status(500).json({ error: "Failed to fetch inventory items" });
  }
};

export const getInventoryItem = async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.id);
    
    // Get the item
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId))
      .limit(1);
    
    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    
    // Get stock levels for this item across all locations
    const stockByLocation = await db
      .select({
        stock: stockLevels,
        locationName: inventoryLocations.name,
        locationType: inventoryLocations.type
      })
      .from(stockLevels)
      .leftJoin(inventoryLocations, eq(stockLevels.locationId, inventoryLocations.id))
      .where(eq(stockLevels.itemId, itemId));
    
    // Get recent transactions
    const recentTransactions = await db
      .select({
        transaction: stockTransactions,
        fromLocationName: inventoryLocations.name,
      })
      .from(stockTransactions)
      .leftJoin(inventoryLocations, eq(stockTransactions.fromLocationId, inventoryLocations.id))
      .where(eq(stockTransactions.itemId, itemId))
      .orderBy(desc(stockTransactions.transactionDate))
      .limit(10);
    
    const formattedStockLevels = stockByLocation.map(row => ({
      ...row.stock,
      locationName: row.locationName,
      locationType: row.locationType
    }));
    
    const formattedTransactions = recentTransactions.map(row => ({
      ...row.transaction,
      fromLocationName: row.fromLocationName
    }));
    
    // Calculate total stock
    const totalStock = formattedStockLevels.reduce((sum, level) => sum + level.quantity, 0);
    
    res.json({
      ...item,
      stockLevels: formattedStockLevels,
      recentTransactions: formattedTransactions,
      totalStock
    });
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    res.status(500).json({ error: "Failed to fetch inventory item" });
  }
};

export const createInventoryItem = async (req: Request, res: Response) => {
  try {
    const itemData = req.body as InsertInventoryItem;
    
    // Generate a code if not provided
    if (!itemData.code) {
      const category = itemData.category.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().substring(8);
      itemData.code = `${category}-${timestamp}`;
    }
    
    const [newItem] = await db
      .insert(inventoryItems)
      .values(itemData)
      .returning();
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating inventory item:", error);
    res.status(500).json({ error: "Failed to create inventory item" });
  }
};

export const updateInventoryItem = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body as Partial<InsertInventoryItem>;
    
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    
    if (!updatedItem) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    res.status(500).json({ error: "Failed to update inventory item" });
  }
};

// Inventory Locations
export const getInventoryLocations = async (_req: Request, res: Response) => {
  try {
    const locations = await db
      .select()
      .from(inventoryLocations)
      .orderBy(asc(inventoryLocations.name));
    
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
};

export const getInventoryLocation = async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.id);
    
    const [location] = await db
      .select()
      .from(inventoryLocations)
      .where(eq(inventoryLocations.id, locationId))
      .limit(1);
    
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }
    
    // Get all inventory at this location with stock levels
    const stockItems = await db
      .select({
        stock: stockLevels,
        item: inventoryItems
      })
      .from(stockLevels)
      .leftJoin(inventoryItems, eq(stockLevels.itemId, inventoryItems.id))
      .where(eq(stockLevels.locationId, locationId));
    
    const formattedStock = stockItems.map(row => ({
      ...row.stock,
      itemName: row.item.name,
      itemCode: row.item.code,
      category: row.item.category,
      unit: row.item.unit
    }));
    
    res.json({
      ...location,
      stock: formattedStock
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).json({ error: "Failed to fetch location" });
  }
};

export const createInventoryLocation = async (req: Request, res: Response) => {
  try {
    const locationData = req.body as InsertInventoryLocation;
    
    const [newLocation] = await db
      .insert(inventoryLocations)
      .values(locationData)
      .returning();
    
    res.status(201).json(newLocation);
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ error: "Failed to create location" });
  }
};

// Stock Transactions
export const createStockTransaction = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const transactionData = req.body as InsertStockTransaction & { adjustStockAt?: 'source' | 'destination' | 'both' };
    const { adjustStockAt = 'both', ...data } = transactionData;
    
    // Ensure the user ID is set
    data.performedBy = req.user.id;
    
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Create the stock transaction
      const [newTransaction] = await tx
        .insert(stockTransactions)
        .values(data)
        .returning();
      
      // Update stock levels based on transaction type and adjustStockAt
      if (
        (adjustStockAt === 'source' || adjustStockAt === 'both') && 
        data.fromLocationId && 
        ['issue', 'transfer'].includes(data.type)
      ) {
        // Reduce stock at source location
        const [currentLevel] = await tx
          .select()
          .from(stockLevels)
          .where(
            and(
              eq(stockLevels.itemId, data.itemId),
              eq(stockLevels.locationId, data.fromLocationId)
            )
          )
          .limit(1);
        
        if (!currentLevel) {
          // Create a new stock level record if it doesn't exist
          await tx.insert(stockLevels).values({
            itemId: data.itemId,
            locationId: data.fromLocationId,
            quantity: -data.quantity // Negative because we're reducing stock
          });
        } else {
          // Update existing stock level
          await tx
            .update(stockLevels)
            .set({ 
              quantity: currentLevel.quantity - data.quantity,
              lastUpdated: new Date()
            })
            .where(eq(stockLevels.id, currentLevel.id));
        }
      }
      
      if (
        (adjustStockAt === 'destination' || adjustStockAt === 'both') && 
        data.toLocationId && 
        ['purchase', 'transfer', 'return'].includes(data.type)
      ) {
        // Increase stock at destination location
        const [currentLevel] = await tx
          .select()
          .from(stockLevels)
          .where(
            and(
              eq(stockLevels.itemId, data.itemId),
              eq(stockLevels.locationId, data.toLocationId)
            )
          )
          .limit(1);
        
        if (!currentLevel) {
          // Create a new stock level record if it doesn't exist
          await tx.insert(stockLevels).values({
            itemId: data.itemId,
            locationId: data.toLocationId,
            quantity: data.quantity
          });
        } else {
          // Update existing stock level
          await tx
            .update(stockLevels)
            .set({ 
              quantity: currentLevel.quantity + data.quantity,
              lastUpdated: new Date()
            })
            .where(eq(stockLevels.id, currentLevel.id));
        }
      }
      
      // For stocktake type, directly set the quantity at the location
      if (data.type === 'stocktake' && data.toLocationId) {
        const [currentLevel] = await tx
          .select()
          .from(stockLevels)
          .where(
            and(
              eq(stockLevels.itemId, data.itemId),
              eq(stockLevels.locationId, data.toLocationId)
            )
          )
          .limit(1);
        
        if (!currentLevel) {
          // Create a new stock level record if it doesn't exist
          await tx.insert(stockLevels).values({
            itemId: data.itemId,
            locationId: data.toLocationId,
            quantity: data.quantity
          });
        } else {
          // Update existing stock level
          await tx
            .update(stockLevels)
            .set({ 
              quantity: data.quantity, // Direct replacement for stocktake
              lastUpdated: new Date()
            })
            .where(eq(stockLevels.id, currentLevel.id));
        }
      }
      
      // Return the created transaction
      return res.status(201).json(newTransaction);
    });
  } catch (error) {
    console.error("Error creating stock transaction:", error);
    res.status(500).json({ error: "Failed to create stock transaction" });
  }
};

// Dashboard & Analytics
export const getInventoryDashboard = async (_req: Request, res: Response) => {
  try {
    // Get low stock items count
    const lowStockQuery = await db
      .select({
        itemId: stockLevels.itemId,
        totalStock: sql<number>`sum(${stockLevels.quantity})`.as('total_stock')
      })
      .from(stockLevels)
      .groupBy(stockLevels.itemId);
    
    const items = await db.select().from(inventoryItems);
    
    // Create a map for quick lookup
    const stockMap = new Map(lowStockQuery.map(s => [s.itemId, s.totalStock]));
    
    // Filter items that are below their reorder point
    const lowStockItems = items.filter(item => {
      const totalStock = stockMap.get(item.id) || 0;
      return totalStock <= item.reorderPoint;
    });
    
    // Get total inventory value
    const totalValue = items.reduce((sum, item) => {
      const totalStock = stockMap.get(item.id) || 0;
      return sum + (totalStock * (item.unitCost || 0));
    }, 0);
    
    // Get recent transactions
    const recentTransactions = await db
      .select({
        transaction: stockTransactions,
        item: inventoryItems,
        fromLocation: inventoryLocations
      })
      .from(stockTransactions)
      .leftJoin(inventoryItems, eq(stockTransactions.itemId, inventoryItems.id))
      .leftJoin(inventoryLocations, eq(stockTransactions.fromLocationId, inventoryLocations.id))
      .orderBy(desc(stockTransactions.transactionDate))
      .limit(10);
    
    const formattedTransactions = recentTransactions.map(row => ({
      ...row.transaction,
      itemName: row.item.name,
      itemCode: row.item.code,
      fromLocationName: row.fromLocation?.name
    }));
    
    // Get stock by category
    const stockByCategory = await db
      .select({
        category: inventoryItems.category,
        totalItems: sql<number>`count(distinct ${inventoryItems.id})`.as('total_items'),
        totalStock: sql<number>`sum(${stockLevels.quantity})`.as('total_stock'),
        totalValue: sql<number>`sum(${stockLevels.quantity} * ${inventoryItems.unitCost})`.as('total_value')
      })
      .from(inventoryItems)
      .leftJoin(stockLevels, eq(inventoryItems.id, stockLevels.itemId))
      .groupBy(inventoryItems.category);
    
    res.json({
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.slice(0, 5), // Just return top 5 for dashboard
      totalItems: items.length,
      totalValue,
      recentTransactions: formattedTransactions,
      stockByCategory
    });
  } catch (error) {
    console.error("Error fetching inventory dashboard:", error);
    res.status(500).json({ error: "Failed to fetch inventory dashboard" });
  }
};