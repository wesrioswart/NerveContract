import { Request, Response, Router } from "express";
import { storage } from "../storage";
import { hasExecutiveAccess } from "../middleware/auth-middleware";

export const portfolioRouter = Router();

// Get all programmes across projects for executives
portfolioRouter.get("/programmes", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Check if the user has executive access
    const hasAccess = await hasExecutiveAccess(req.user.id);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        error: "Access denied: You need executive role to view portfolio data" 
      });
    }
    
    // Parse query parameters
    const status = req.query.status as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    // Get all programmes with any filters
    const programmes = await storage.getAllProgrammes({
      status,
      startDate,
      endDate
    });
    
    // Augment programme data with project info for the UI
    const result = await Promise.all(
      programmes.map(async (programme) => {
        const project = await storage.getProject(programme.projectId);
        return {
          ...programme,
          projectName: project?.name || 'Unknown Project',
          clientName: project?.clientName || 'Unknown Client'
        };
      })
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching portfolio programmes:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: `Failed to fetch portfolio data: ${errorMessage}` });
  }
});

// Get project metrics for executives (dashboard)
portfolioRouter.get("/dashboard", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Check if the user has executive access
    const hasAccess = await hasExecutiveAccess(req.user.id);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        error: "Access denied: You need executive role to view portfolio dashboard" 
      });
    }
    
    // Get all projects
    const projects = await storage.getAllProjects();
    
    // For each project, get high-level metrics
    const dashboardData = await Promise.all(
      projects.map(async (project) => {
        // Get counts of key items for this project
        const compensationEvents = await storage.getCompensationEventsByProject(project.id);
        const openCompensationEvents = compensationEvents.filter(ce => 
          ce.status !== "Implemented" && ce.status !== "Accepted"
        );
        
        const earlyWarnings = await storage.getEarlyWarningsByProject(project.id);
        const openEarlyWarnings = earlyWarnings.filter(ew => ew.status === "Open");
        
        const programmes = await storage.getProgrammesByProject(project.id);
        const latestProgramme = programmes.length > 0 ? 
          programmes.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())[0] : 
          null;
        
        return {
          id: project.id,
          name: project.name,
          contractReference: project.contractReference,
          clientName: project.clientName,
          startDate: project.startDate,
          endDate: project.endDate,
          metrics: {
            compensationEventCount: compensationEvents.length,
            openCompensationEventCount: openCompensationEvents.length,
            earlyWarningCount: earlyWarnings.length,
            openEarlyWarningCount: openEarlyWarnings.length,
            programmeCount: programmes.length,
            latestProgrammeStatus: latestProgramme?.status || "No programmes",
            latestProgrammeDate: latestProgramme?.submissionDate || null
          }
        };
      })
    );
    
    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Error fetching portfolio dashboard:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: `Failed to fetch dashboard data: ${errorMessage}` });
  }
});

// Get user's assigned projects with role information
portfolioRouter.get("/my-projects", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Get the user's project assignments
    const assignments = await storage.getUserProjectAssignments(req.user.id);
    
    // Get the full project data for each assignment
    const projects = await Promise.all(
      assignments.map(async (assignment) => {
        const project = await storage.getProject(assignment.projectId);
        return {
          ...project,
          role: assignment.role,
          joinedAt: assignment.joinedAt
        };
      })
    );
    
    return res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching user's projects:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: `Failed to fetch projects: ${errorMessage}` });
  }
});