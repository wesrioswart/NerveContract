import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertChatMessageSchema, insertCompensationEventSchema, insertEarlyWarningSchema } from "@shared/schema";
import { askContractAssistant, analyzeContractDocument } from "./utils/openai";

const parseXMLSchema = z.object({
  xmlContent: z.string(),
});

const documentAnalysisSchema = z.object({
  documentText: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Exclude password from the response
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(200).json(userWithoutPassword);
  });

  // Project routes
  app.get("/api/projects", async (_req: Request, res: Response) => {
    const projects = await storage.getAllProjects();
    return res.status(200).json(projects);
  });

  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    const project = await storage.getProject(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    return res.status(200).json(project);
  });

  // Compensation Events routes
  app.get("/api/projects/:id/compensation-events", async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    const compensationEvents = await storage.getCompensationEventsByProject(projectId);
    return res.status(200).json(compensationEvents);
  });

  app.post("/api/compensation-events", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCompensationEventSchema.parse(req.body);
      const compensationEvent = await storage.createCompensationEvent(validatedData);
      return res.status(201).json(compensationEvent);
    } catch (error) {
      return res.status(400).json({ message: "Invalid compensation event data" });
    }
  });

  app.get("/api/compensation-events/:id", async (req: Request, res: Response) => {
    const ceId = parseInt(req.params.id);
    
    if (isNaN(ceId)) {
      return res.status(400).json({ message: "Invalid compensation event ID" });
    }
    
    const compensationEvent = await storage.getCompensationEvent(ceId);
    
    if (!compensationEvent) {
      return res.status(404).json({ message: "Compensation event not found" });
    }
    
    return res.status(200).json(compensationEvent);
  });

  app.patch("/api/compensation-events/:id", async (req: Request, res: Response) => {
    const ceId = parseInt(req.params.id);
    
    if (isNaN(ceId)) {
      return res.status(400).json({ message: "Invalid compensation event ID" });
    }
    
    try {
      const compensationEvent = await storage.updateCompensationEvent(ceId, req.body);
      return res.status(200).json(compensationEvent);
    } catch (error) {
      return res.status(404).json({ message: "Compensation event not found" });
    }
  });

  // Early Warnings routes
  app.get("/api/projects/:id/early-warnings", async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    const earlyWarnings = await storage.getEarlyWarningsByProject(projectId);
    return res.status(200).json(earlyWarnings);
  });

  app.post("/api/early-warnings", async (req: Request, res: Response) => {
    try {
      const validatedData = insertEarlyWarningSchema.parse(req.body);
      const earlyWarning = await storage.createEarlyWarning(validatedData);
      return res.status(201).json(earlyWarning);
    } catch (error) {
      return res.status(400).json({ message: "Invalid early warning data" });
    }
  });

  app.get("/api/early-warnings/:id", async (req: Request, res: Response) => {
    const ewId = parseInt(req.params.id);
    
    if (isNaN(ewId)) {
      return res.status(400).json({ message: "Invalid early warning ID" });
    }
    
    const earlyWarning = await storage.getEarlyWarning(ewId);
    
    if (!earlyWarning) {
      return res.status(404).json({ message: "Early warning not found" });
    }
    
    return res.status(200).json(earlyWarning);
  });

  app.patch("/api/early-warnings/:id", async (req: Request, res: Response) => {
    const ewId = parseInt(req.params.id);
    
    if (isNaN(ewId)) {
      return res.status(400).json({ message: "Invalid early warning ID" });
    }
    
    try {
      const earlyWarning = await storage.updateEarlyWarning(ewId, req.body);
      return res.status(200).json(earlyWarning);
    } catch (error) {
      return res.status(404).json({ message: "Early warning not found" });
    }
  });

  // Non-Conformance Reports routes
  app.get("/api/projects/:id/non-conformance-reports", async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    const nonConformanceReports = await storage.getNonConformanceReportsByProject(projectId);
    return res.status(200).json(nonConformanceReports);
  });

  // Programme Milestones routes
  app.get("/api/projects/:id/programme-milestones", async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    const programmeMilestones = await storage.getProgrammeMilestonesByProject(projectId);
    return res.status(200).json(programmeMilestones);
  });

  // Payment Certificates routes
  app.get("/api/projects/:id/payment-certificates", async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    const paymentCertificates = await storage.getPaymentCertificatesByProject(projectId);
    return res.status(200).json(paymentCertificates);
  });

  // AI Assistant routes
  app.get("/api/projects/:id/chat-messages", async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    const chatMessages = await storage.getChatMessagesByProject(projectId);
    return res.status(200).json(chatMessages);
  });

  app.post("/api/chat-messages", async (req: Request, res: Response) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      
      // Create the user message
      await storage.createChatMessage(validatedData);
      
      // Get AI response
      const aiResponse = await askContractAssistant(validatedData.content);
      
      // Create the AI response message
      const assistantMessage = await storage.createChatMessage({
        projectId: validatedData.projectId,
        userId: validatedData.userId,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date()
      });
      
      return res.status(201).json(assistantMessage);
    } catch (error) {
      return res.status(400).json({ message: "Invalid chat message data" });
    }
  });

  // Programme sync XML parsing route
  app.post("/api/programme/parse-xml", async (req: Request, res: Response) => {
    try {
      const { xmlContent } = parseXMLSchema.parse(req.body);
      
      // In a real implementation, we would parse the XML and extract milestone data
      // For the MVP, we'll just return a dummy response
      return res.status(200).json({
        milestones: [
          {
            name: "Foundation Work",
            plannedDate: new Date("2023-07-15"),
            status: "Completed"
          },
          {
            name: "Structural Steel",
            plannedDate: new Date("2023-08-30"),
            status: "In Progress"
          },
          {
            name: "Roof Installation",
            plannedDate: new Date("2023-10-15"),
            status: "Not Started"
          }
        ]
      });
    } catch (error) {
      return res.status(400).json({ message: "Invalid XML content" });
    }
  });

  // Document Analysis route
  app.post("/api/document/analyze", async (req: Request, res: Response) => {
    try {
      const { documentText } = documentAnalysisSchema.parse(req.body);
      
      // Call OpenAI to analyze the document
      const analysis = await analyzeContractDocument(documentText);
      
      return res.status(200).json(analysis);
    } catch (error) {
      console.error("Error in document analysis:", error);
      return res.status(400).json({ 
        message: "Invalid document text or analysis failed", 
        issues: ["Error analyzing document"],
        recommendations: ["Please try again later or contact support"]
      });
    }
  });

  // Export routes
  app.post("/api/export/compensation-events", async (req: Request, res: Response) => {
    const { projectId, format } = req.body;
    
    if (!projectId || !format || !["pdf", "excel"].includes(format)) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }
    
    // In a real implementation, we would generate a PDF or Excel file
    // For the MVP, we'll just return a success message
    return res.status(200).json({
      message: `${format.toUpperCase()} export for compensation events generated successfully`,
      downloadUrl: `/api/downloads/${format}/compensation-events-${projectId}.${format}`
    });
  });

  // Z Clause Analysis Test route
  app.get("/api/test/z-clause-analysis", async (_req: Request, res: Response) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Read the sample Z clause file
      const zClauseContent = fs.readFileSync(
        path.join(process.cwd(), 'test_data/z_clause_sample.txt'),
        'utf8'
      );
      
      // Call OpenAI to analyze the Z clause
      const analysis = await analyzeContractDocument(zClauseContent);
      
      return res.status(200).json({
        zClause: zClauseContent,
        analysis: analysis
      });
    } catch (error) {
      console.error("Error in Z clause analysis test:", error);
      return res.status(500).json({ 
        message: "Z clause analysis test failed", 
        error: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
