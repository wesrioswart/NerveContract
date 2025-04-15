import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users, usersToProjects } from "@shared/schema";
import { eq } from "drizzle-orm";
import { User } from "../types/express";

// Executive role types that have cross-project access
export const EXECUTIVE_ROLES = ["CEO", "Operations Manager", "Executive", "Director"];

/**
 * Middleware to check if user is authenticated
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

/**
 * Check if a user has executive-level access (can view across all projects)
 */
export async function hasExecutiveAccess(userId: number): Promise<boolean> {
  try {
    // Get the user
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return false;
    }
    
    // Check if user has an executive role
    return EXECUTIVE_ROLES.includes(user.role);
  } catch (error) {
    console.error("Error checking executive access:", error);
    return false;
  }
}

/**
 * Check if a user has access to a specific project
 */
export async function hasProjectAccess(userId: number, projectId: number): Promise<boolean> {
  try {
    // Check if the user has executive access first
    const isExecutive = await hasExecutiveAccess(userId);
    if (isExecutive) {
      return true;
    }
    
    // Otherwise check if they're specifically assigned to the project
    const [assignment] = await db
      .select()
      .from(usersToProjects)
      .where(
        eq(usersToProjects.userId, userId) && 
        eq(usersToProjects.projectId, projectId)
      );
    
    return !!assignment;
  } catch (error) {
    console.error("Error checking project access:", error);
    return false;
  }
}

/**
 * Middleware to check if a user has access to a specific project
 */
export function requireProjectAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  if (!req.user) {
    return res.status(401).json({ error: "User not found in session" });
  }
  
  const projectId = parseInt(req.params.projectId || req.params.id);
  if (isNaN(projectId)) {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  hasProjectAccess(req.user.id, projectId)
    .then(hasAccess => {
      if (hasAccess) {
        next();
      } else {
        res.status(403).json({ error: "You don't have access to this project" });
      }
    })
    .catch(error => {
      console.error("Error in requireProjectAccess middleware:", error);
      res.status(500).json({ error: "Server error checking project access" });
    });
}