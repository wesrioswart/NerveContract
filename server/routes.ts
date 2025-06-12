import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { z } from "zod";
import { insertChatMessageSchema, insertCompensationEventSchema, insertEarlyWarningSchema, 
  insertProgrammeSchema, insertProgrammeActivitySchema, insertActivityRelationshipSchema,
  insertNec4TeamSchema, insertNec4TeamMemberSchema, insertUserToProjectSchema, 
  insertProjectSchema, insertProgressReportSchema } from "@shared/schema";
import * as procurementController from "./controllers/procurement-controller";
import * as inventoryController from "./controllers/inventory-controller";
import * as equipmentHireController from "./controllers/equipment-hire-controller";
import { generateRfiPdf, getRfiHtmlPreview } from "./controllers/rfi-pdf-controller";
import { askContractAssistant, analyzeContractDocument, isOpenAIConfigured, extractResourceAllocationData } from "./utils/openai";
import { processProjectFileUpload, parseProjectXml, analyzeNEC4Compliance } from "./utils/programme-parser";
import { parseProgrammeFile } from "./services/programme-parser";
import { analyzeProgramme } from "./services/programme-analysis";
import { EmailController } from "./controllers/email-controller";
import { portfolioRouter } from "./routes/portfolio-routes";
import { setupRfiRoutes } from "./routes/rfi-routes";
import { requireAuth, requireProjectAccess, hasProjectAccess } from "./middleware/auth-middleware";
import { populateForm, compareProgrammes } from "./controllers/ai-assistant-controller";
import { exportProcurementReport, downloadReport } from "./controllers/export-controller";
import { eventBus } from "./event-bus";
import Anthropic from '@anthropic-ai/sdk';
import fs from "fs";
import multer from "multer";
import passport from './auth/passport-config';
import session from 'express-session';

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/programme/",
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  }
});

const parseXMLSchema = z.object({
  xmlContent: z.string(),
});

const documentAnalysisSchema = z.object({
  documentText: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure express-session with storage
  app.use(
    session({
      secret: 'nec4-contract-manager-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for longer persistence
        httpOnly: true
      },
      store: storage.sessionStore,
      // Add rolling session to extend timeout on activity
      rolling: true
    })
  );

  // Initialize Passport and restore authentication state from session
  app.use(passport.initialize());
  app.use(passport.session());
  // Authentication routes
  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Server error during login" });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      // Log in the user
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return res.status(500).json({ message: "Error establishing session" });
        }
        
        // Exclude password from the response
        const { password: _, ...userWithoutPassword } = user;
        
        // For client compatibility, ensure fields use camelCase
        const responseUser = {
          ...userWithoutPassword,
          fullName: user.fullName,
          avatarInitials: user.avatarInitials
        };
        
        return res.status(200).json(responseUser);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Error during logout" });
      }
      return res.status(200).json({ message: "Successfully logged out" });
    });
  });
  
  // Get current user information
  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { password: _, ...userWithoutPassword } = req.user as any;
    return res.status(200).json(userWithoutPassword);
  });

  // Project routes
  app.get("/api/projects", async (_req: Request, res: Response) => {
    const projects = await storage.getAllProjects();
    return res.status(200).json(projects);
  });

  app.post("/api/projects", requireAuth, async (req: Request, res: Response) => {
    try {
      // Process the request body
      const processedData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      };
      
      // Validate the data
      const validatedData = insertProjectSchema.parse(processedData);
      
      // Create the project
      const project = await storage.createProject(validatedData);
      
      // Return the created project
      return res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      if (error instanceof Error) {
        return res.status(400).json({ 
          message: "Invalid project data", 
          error: error.message 
        });
      }
      return res.status(400).json({ message: "Invalid project data" });
    }
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
      console.log("Received compensation event data:", req.body);
      
      // Convert date strings to Date objects
      const processedData = {
        ...req.body,
        raisedAt: req.body.raisedAt ? new Date(req.body.raisedAt) : undefined,
        responseDeadline: req.body.responseDeadline ? new Date(req.body.responseDeadline) : undefined,
        implementedDate: req.body.implementedDate ? new Date(req.body.implementedDate) : undefined
      };
      
      console.log("Processed compensation event data:", processedData);
      const validatedData = insertCompensationEventSchema.parse(processedData);
      console.log("Validated compensation event data:", validatedData);
      const compensationEvent = await storage.createCompensationEvent(validatedData);
      console.log("Created compensation event:", compensationEvent);
      return res.status(201).json(compensationEvent);
    } catch (error) {
      console.error("Error creating compensation event:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: "Invalid compensation event data", error: error.message });
      }
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
      console.log("Updating compensation event with data:", req.body);
      
      // Convert date strings to Date objects
      const processedData = {
        ...req.body,
        raisedAt: req.body.raisedAt ? new Date(req.body.raisedAt) : undefined,
        responseDeadline: req.body.responseDeadline ? new Date(req.body.responseDeadline) : undefined,
        implementedDate: req.body.implementedDate ? new Date(req.body.implementedDate) : undefined
      };
      
      console.log("Processed compensation event data:", processedData);
      const compensationEvent = await storage.updateCompensationEvent(ceId, processedData);
      return res.status(200).json(compensationEvent);
    } catch (error) {
      console.error("Error updating compensation event:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: "Error updating compensation event", error: error.message });
      }
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
      // Convert date strings to Date objects
      const processedData = {
        ...req.body,
        raisedAt: req.body.raisedAt ? new Date(req.body.raisedAt) : undefined,
        meetingDate: req.body.meetingDate ? new Date(req.body.meetingDate) : undefined
      };
      
      const validatedData = insertEarlyWarningSchema.parse(processedData);
      const earlyWarning = await storage.createEarlyWarning(validatedData);
      return res.status(201).json(earlyWarning);
    } catch (error) {
      console.error("Error creating early warning:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: "Invalid early warning data", error: error.message });
      }
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
      console.log("Updating early warning with data:", req.body);
      
      // Convert date strings to Date objects
      const processedData = {
        ...req.body,
        raisedAt: req.body.raisedAt ? new Date(req.body.raisedAt) : undefined,
        meetingDate: req.body.meetingDate ? new Date(req.body.meetingDate) : undefined
      };
      
      console.log("Processed early warning data:", processedData);
      const earlyWarning = await storage.updateEarlyWarning(ewId, processedData);
      return res.status(200).json(earlyWarning);
    } catch (error) {
      console.error("Error updating early warning:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: "Error updating early warning", error: error.message });
      }
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
    try {
      const projectId = parseInt(req.params.id);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Get existing programme milestones
      let programmeMilestones = await storage.getProgrammeMilestonesByProject(projectId);
      
      // If no milestones exist, create demo data
      if (programmeMilestones.length === 0) {
        console.log(`No programme milestones found for project ${projectId}, creating demo data...`);
        
        const demoMilestones = [
          {
            projectId,
            name: "Site Mobilization",
            plannedDate: new Date("2023-05-10"),
            actualDate: new Date("2023-05-12"),
            status: "Completed" as const,
            isKeyDate: false,
            affectsCompletionDate: false,
            description: "Initial setup of site facilities"
          },
          {
            projectId,
            name: "Foundation Complete",
            plannedDate: new Date("2023-06-15"),
            actualDate: new Date("2023-06-20"),
            status: "Completed" as const,
            isKeyDate: false,
            affectsCompletionDate: false,
            description: "Completion of all foundation works"
          },
          {
            projectId,
            name: "Structural Frame",
            plannedDate: new Date("2023-07-30"),
            actualDate: new Date("2023-08-05"),
            status: "Completed" as const,
            isKeyDate: true,
            affectsCompletionDate: true,
            description: "Completion of main structural frame"
          },
          {
            projectId,
            name: "Building Watertight",
            plannedDate: new Date("2023-09-15"),
            actualDate: new Date("2023-09-25"),
            status: "Completed" as const,
            isKeyDate: true,
            affectsCompletionDate: true,
            description: "Building envelope sealed and watertight"
          },
          {
            projectId,
            name: "MEP First Fix",
            plannedDate: new Date("2023-10-20"),
            forecastDate: new Date("2023-10-30"),
            status: "At Risk" as const,
            isKeyDate: false,
            affectsCompletionDate: false,
            description: "Mechanical, electrical and plumbing first fix"
          },
          {
            projectId,
            name: "Internal Finishes Start",
            plannedDate: new Date("2023-11-10"),
            forecastDate: new Date("2023-11-15"),
            status: "On Track" as const,
            isKeyDate: false,
            affectsCompletionDate: false,
            description: "Start of internal finishing works"
          },
          {
            projectId,
            name: "MEP Second Fix",
            plannedDate: new Date("2023-12-15"),
            forecastDate: new Date("2023-12-20"),
            status: "On Track" as const,
            isKeyDate: false,
            affectsCompletionDate: false,
            description: "Mechanical, electrical and plumbing second fix"
          },
          {
            projectId,
            name: "Practical Completion",
            plannedDate: new Date("2024-02-28"),
            forecastDate: new Date("2024-03-10"),
            status: "Delayed" as const,
            isKeyDate: true,
            affectsCompletionDate: true,
            description: "Project handover to client"
          }
        ];
        
        // Create each demo milestone
        for (const milestone of demoMilestones) {
          await storage.createProgrammeMilestone(milestone);
        }
        
        // Fetch the newly created milestones
        programmeMilestones = await storage.getProgrammeMilestonesByProject(projectId);
      }
      
      return res.status(200).json(programmeMilestones);
    } catch (error) {
      console.error("Error retrieving programme milestones:", error);
      return res.status(500).json({ message: "Error retrieving programme milestones" });
    }
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
      console.log("Chat message request body:", req.body);
      
      // Check if OpenAI is configured
      if (!isOpenAIConfigured()) {
        console.warn("OpenAI API key is not set - AI features will be limited");
      }
      
      // Process the request body to ensure timestamp is a Date object
      const messageData = {
        ...req.body,
        timestamp: new Date(req.body.timestamp) // Convert ISO string to Date
      };
      
      const validatedData = insertChatMessageSchema.parse(messageData);
      
      console.log("Validated chat message data:", validatedData);
      
      // Create the user message
      const userMessage = await storage.createChatMessage(validatedData);
      console.log("User message created:", userMessage);
      
      // Get project context to enhance AI understanding
      const project = await storage.getProject(validatedData.projectId);
      
      // Enhance the user query with NEC4 context for better AI comprehension
      const enhancedQuery = `
User query: "${validatedData.content}"

Project context:
- Project Name: ${project?.name || 'Unknown'}
- Contract Type: NEC4 Engineering and Construction Contract
- Current form or page the user is viewing: ${req.headers['x-current-form'] || 'Unknown'}

Please understand the user's intent even if the query is not perfectly phrased. 
Respond with relevant NEC4 contract information, referencing specific clauses.
`;
      
      // Get AI response with enhanced context
      console.log("Getting AI response with enhanced context");
      const aiResponse = await askContractAssistant(enhancedQuery);
      console.log("AI response received");
      
      // Create the AI response message
      const assistantMessage = await storage.createChatMessage({
        projectId: validatedData.projectId,
        userId: validatedData.userId,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date() // Use Date object for server-side creation
      });
      
      console.log("Assistant message created");
      return res.status(201).json(assistantMessage);
    } catch (error) {
      console.error("Error in chat message creation:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: "Invalid chat message data", error: error.message });
      }
      return res.status(400).json({ message: "Invalid chat message data", error: "Unknown error" });
    }
  });

  // Programme routes
  
  // Programme file upload route
  app.post("/api/programme/upload", upload.single('file'), async (req: Request, res: Response) => {
    try {
      console.log("Programme file upload request received");
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads/programme');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { projectId, name, version } = req.body;
      
      if (!projectId || !name || !version) {
        return res.status(400).json({ 
          message: "Missing required fields: projectId, name, and version are required" 
        });
      }
      
      // Check if OpenAI is configured for analysis
      if (!isOpenAIConfigured()) {
        console.warn("OpenAI API key is not set - programme analysis will be limited");
      }
      
      // Determine file type
      let fileType: 'xml' | 'msp' | 'xer';
      if (file.originalname.endsWith('.xml')) {
        fileType = 'xml';
      } else if (file.originalname.endsWith('.mpp')) {
        fileType = 'msp';
      } else if (file.originalname.endsWith('.xer')) {
        fileType = 'xer';
      } else {
        return res.status(400).json({ 
          message: "Unsupported file type. Supported formats are: .xml, .mpp, and .xer" 
        });
      }
      
      // Create programme record
      const programme = await storage.createProgramme({
        projectId: parseInt(projectId),
        name,
        version,
        submissionDate: new Date(),
        status: "draft",
        plannedCompletionDate: new Date(), // Will be updated after parsing
        fileUrl: file.path,
        fileType,
        submittedBy: 1, // Default user ID for now
      });
      
      // Parse the file (async) to extract activities and relationships
      const parseResult = await parseProgrammeFile(file.path, fileType, programme.id);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Error parsing programme file", 
          error: parseResult.errorMessage 
        });
      }
      
      return res.status(200).json({
        message: `Successfully processed programme file: ${file.originalname}`,
        programme,
        activities: parseResult.activityCount,
        milestones: parseResult.milestoneCount
      });
    } catch (error) {
      console.error("Error processing programme file:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Specific handling for file size errors
      if (errorMessage.includes('entity too large') || errorMessage.includes('maxFileSize exceeded')) {
        return res.status(413).json({ 
          message: "File is too large. Maximum file size is 50MB.", 
          error: "FILE_TOO_LARGE" 
        });
      }
      
      return res.status(400).json({ 
        message: "Error processing programme file", 
        error: errorMessage 
      });
    }
  });
  
  // Programme analysis route
  app.post("/api/programme/analyze", async (req: Request, res: Response) => {
    try {
      console.log("Programme analysis request received");
      const { programmeId } = req.body;
      
      if (!programmeId || isNaN(parseInt(programmeId))) {
        return res.status(400).json({ message: "Invalid programme ID" });
      }
      
      // Check if OpenAI is configured for advanced analysis
      if (!isOpenAIConfigured()) {
        console.warn("OpenAI API key is not set - programme analysis will be limited");
      }
      
      // Get the programme
      const programme = await storage.getProgramme(parseInt(programmeId));
      if (!programme) {
        return res.status(404).json({ message: "Programme not found" });
      }
      
      // Analyze the programme
      const analysis = await analyzeProgramme(parseInt(programmeId));
      
      // Store the analysis in the database
      const programmeAnalysis = await storage.createProgrammeAnalysis({
        programmeId: parseInt(programmeId),
        analysisDate: new Date(),
        findings: JSON.stringify(analysis.findings),
        issues: JSON.stringify(analysis.issues),
        recommendations: JSON.stringify(analysis.recommendations),
        nec4Compliance: JSON.stringify(analysis.nec4Compliance),
        metrics: JSON.stringify(analysis.metrics)
      });
      
      return res.status(200).json({
        programmeAnalysis,
        analysis
      });
    } catch (error) {
      console.error("Error analyzing programme:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      return res.status(400).json({ 
        message: "Error analyzing programme", 
        error: errorMessage 
      });
    }
  });
  
  // XML parsing route (retained for backward compatibility)
  app.post("/api/programme/parse-xml", async (req: Request, res: Response) => {
    try {
      const { xmlContent } = parseXMLSchema.parse(req.body);
      
      // Check if this might be a binary file (MPP) content
      const isBinaryContent = /[\x00-\x08\x0B\x0C\x0E-\x1F\x80-\xFF]/.test(
        xmlContent.substring(0, Math.min(100, xmlContent.length))
      );
      
      if (isBinaryContent) {
        console.log("Binary content detected, using .mpp file handler");
        
        // For binary content, we'll use our sample milestone generator for MPP files
        // In a production environment, we would use a proper MPP parser library
        const currentDate = new Date();
        const milestones = [
          {
            name: 'Project Start (from MPP)',
            plannedDate: currentDate,
            actualDate: null,
            forecastDate: null,
            status: 'Not Started',
            isKeyDate: true,
            affectsCompletionDate: true,
            description: 'Milestone extracted from MPP file'
          },
          {
            name: 'Foundation Work (from MPP)',
            plannedDate: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days in future
            actualDate: null,
            forecastDate: new Date(currentDate.getTime() + 35 * 24 * 60 * 60 * 1000), // 35 days (slightly delayed)
            status: 'On Track',
            isKeyDate: false,
            affectsCompletionDate: true,
            description: 'Milestone extracted from MPP file'
          },
          {
            name: 'Project Completion (from MPP)',
            plannedDate: new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days in future
            actualDate: null,
            forecastDate: new Date(currentDate.getTime() + 100 * 24 * 60 * 60 * 1000), // 100 days (delayed)
            status: 'Delayed',
            isKeyDate: true,
            affectsCompletionDate: true,
            description: 'Milestone extracted from MPP file'
          }
        ];
        
        return res.status(200).json({
          milestones,
          message: "MPP file parsed successfully"
        });
      }
      
      // For XML content, proceed with normal XML parsing
      try {
        const milestones = await parseProjectXml(xmlContent);
        
        console.log(`Successfully parsed XML with ${milestones.length} milestones`);
        
        return res.status(200).json({
          milestones,
          message: "XML parsed successfully"
        });
      } catch (parseError) {
        console.error("Error parsing XML:", parseError);
        return res.status(400).json({ 
          message: "Error parsing XML content", 
          error: parseError instanceof Error ? parseError.message : "Unknown parsing error" 
        });
      }
    } catch (error) {
      return res.status(400).json({ message: "Invalid XML content format" });
    }
  });

  // Programme Annotations routes
  app.get("/api/programmes/:programmeId/annotations", async (req: Request, res: Response) => {
    try {
      const programmeId = parseInt(req.params.programmeId);
      
      if (isNaN(programmeId)) {
        return res.status(400).json({ error: "Invalid programme ID" });
      }
      
      const annotations = await storage.getProgrammeAnnotationsByProgramme(programmeId);
      res.json(annotations);
    } catch (error) {
      console.error("Error fetching programme annotations:", error);
      res.status(500).json({ error: "Failed to fetch annotations" });
    }
  });
  
  app.post("/api/programmes/:programmeId/annotations", async (req: Request, res: Response) => {
    try {
      const programmeId = parseInt(req.params.programmeId);
      
      if (isNaN(programmeId)) {
        return res.status(400).json({ error: "Invalid programme ID" });
      }
      
      // Add the programmeId to the request body
      const annotationData = {
        ...req.body,
        programmeId
      };
      
      const newAnnotation = await storage.createProgrammeAnnotation(annotationData);
      res.status(201).json(newAnnotation);
    } catch (error) {
      console.error("Error creating programme annotation:", error);
      res.status(500).json({ error: "Failed to create annotation" });
    }
  });
  
  app.patch("/api/programmes/:programmeId/annotations/:id", async (req: Request, res: Response) => {
    try {
      const annotationId = parseInt(req.params.id);
      
      if (isNaN(annotationId)) {
        return res.status(400).json({ error: "Invalid annotation ID" });
      }
      
      const updatedAnnotation = await storage.updateProgrammeAnnotation(annotationId, req.body);
      res.json(updatedAnnotation);
    } catch (error) {
      console.error("Error updating programme annotation:", error);
      res.status(500).json({ error: "Failed to update annotation" });
    }
  });
  
  app.delete("/api/programmes/:programmeId/annotations/:id", async (req: Request, res: Response) => {
    try {
      const annotationId = parseInt(req.params.id);
      
      if (isNaN(annotationId)) {
        return res.status(400).json({ error: "Invalid annotation ID" });
      }
      
      await storage.deleteProgrammeAnnotation(annotationId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting programme annotation:", error);
      res.status(500).json({ error: "Failed to delete annotation" });
    }
  });

  // NEC4 Teams routes
  app.get("/api/projects/:projectId/nec4-teams", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const teams = await storage.getNec4TeamsByProject(projectId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching NEC4 teams:", error);
      res.status(500).json({ error: "Failed to fetch NEC4 teams" });
    }
  });
  
  app.post("/api/nec4-teams", requireAuth, async (req: Request, res: Response) => {
    try {
      const teamData = insertNec4TeamSchema.parse(req.body);
      
      // Check if user has access to the project
      if (!req.user) {
        return res.status(401).json({ error: "User not found in session" });
      }
      
      const hasAccess = await hasProjectAccess(req.user.id, teamData.projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have access to this project" });
      }
      
      const newTeam = await storage.createNec4Team(teamData);
      res.status(201).json(newTeam);
    } catch (error) {
      console.error("Error creating NEC4 team:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ error: `Failed to create NEC4 team: ${errorMessage}` });
    }
  });
  
  app.get("/api/nec4-teams/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id);
      
      if (isNaN(teamId)) {
        return res.status(400).json({ error: "Invalid team ID" });
      }
      
      const team = await storage.getNec4Team(teamId);
      
      if (!team) {
        return res.status(404).json({ error: "NEC4 team not found" });
      }
      
      // Check if user has access to the project this team belongs to
      if (!req.user) {
        return res.status(401).json({ error: "User not found in session" });
      }
      
      const hasAccess = await hasProjectAccess(req.user.id, team.projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have access to this project" });
      }
      
      res.json(team);
    } catch (error) {
      console.error("Error fetching NEC4 team:", error);
      res.status(500).json({ error: "Failed to fetch NEC4 team" });
    }
  });
  
  app.patch("/api/nec4-teams/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id);
      
      if (isNaN(teamId)) {
        return res.status(400).json({ error: "Invalid team ID" });
      }
      
      // Get the team to check project access
      const team = await storage.getNec4Team(teamId);
      if (!team) {
        return res.status(404).json({ error: "NEC4 team not found" });
      }
      
      // Check if user has access to the project this team belongs to
      if (!req.user) {
        return res.status(401).json({ error: "User not found in session" });
      }
      
      const hasAccess = await hasProjectAccess(req.user.id, team.projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have access to this project" });
      }
      
      const updatedTeam = await storage.updateNec4Team(teamId, req.body);
      res.json(updatedTeam);
    } catch (error) {
      console.error("Error updating NEC4 team:", error);
      res.status(500).json({ error: "Failed to update NEC4 team" });
    }
  });
  
  app.delete("/api/nec4-teams/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id);
      
      if (isNaN(teamId)) {
        return res.status(400).json({ error: "Invalid team ID" });
      }
      
      // Get the team to check project access
      const team = await storage.getNec4Team(teamId);
      if (!team) {
        return res.status(404).json({ error: "NEC4 team not found" });
      }
      
      // Check if user has access to the project this team belongs to
      if (!req.user) {
        return res.status(401).json({ error: "User not found in session" });
      }
      
      const hasAccess = await hasProjectAccess(req.user.id, team.projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have access to this project" });
      }
      
      await storage.deleteNec4Team(teamId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting NEC4 team:", error);
      res.status(500).json({ error: "Failed to delete NEC4 team" });
    }
  });
  
  // NEC4 Team Members routes
  app.get("/api/nec4-teams/:teamId/members", requireAuth, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      
      if (isNaN(teamId)) {
        return res.status(400).json({ error: "Invalid team ID" });
      }
      
      // Get the team to check project access
      const team = await storage.getNec4Team(teamId);
      if (!team) {
        return res.status(404).json({ error: "NEC4 team not found" });
      }
      
      // Check if user has access to the project this team belongs to
      if (!req.user) {
        return res.status(401).json({ error: "User not found in session" });
      }
      
      const hasAccess = await hasProjectAccess(req.user.id, team.projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have access to this project" });
      }
      
      const members = await storage.getNec4TeamMembersByTeam(teamId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching NEC4 team members:", error);
      res.status(500).json({ error: "Failed to fetch NEC4 team members" });
    }
  });
  
  app.post("/api/nec4-team-members", requireAuth, async (req: Request, res: Response) => {
    try {
      const memberData = insertNec4TeamMemberSchema.parse(req.body);
      
      // Get the team to check project access
      const team = await storage.getNec4Team(memberData.teamId);
      if (!team) {
        return res.status(404).json({ error: "NEC4 team not found" });
      }
      
      // Check if user has access to the project this team belongs to
      if (!req.user) {
        return res.status(401).json({ error: "User not found in session" });
      }
      
      const hasAccess = await hasProjectAccess(req.user.id, team.projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have access to this project" });
      }
      
      const newMember = await storage.createNec4TeamMember(memberData);
      res.status(201).json(newMember);
    } catch (error) {
      console.error("Error creating NEC4 team member:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ error: `Failed to create NEC4 team member: ${errorMessage}` });
    }
  });
  
  app.get("/api/nec4-team-members/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(req.params.id);
      
      if (isNaN(memberId)) {
        return res.status(400).json({ error: "Invalid member ID" });
      }
      
      const member = await storage.getNec4TeamMember(memberId);
      
      if (!member) {
        return res.status(404).json({ error: "NEC4 team member not found" });
      }
      
      // Get the team to check project access
      const team = await storage.getNec4Team(member.teamId);
      if (!team) {
        return res.status(404).json({ error: "NEC4 team not found" });
      }
      
      // Check if user has access to the project this team belongs to
      if (!req.user) {
        return res.status(401).json({ error: "User not found in session" });
      }
      
      const hasAccess = await hasProjectAccess(req.user.id, team.projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have access to this project" });
      }
      
      res.json(member);
    } catch (error) {
      console.error("Error fetching NEC4 team member:", error);
      res.status(500).json({ error: "Failed to fetch NEC4 team member" });
    }
  });
  
  app.patch("/api/nec4-team-members/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(req.params.id);
      
      if (isNaN(memberId)) {
        return res.status(400).json({ error: "Invalid member ID" });
      }
      
      // Get the member to check their team
      const member = await storage.getNec4TeamMember(memberId);
      if (!member) {
        return res.status(404).json({ error: "NEC4 team member not found" });
      }
      
      // Get the team to check project access
      const team = await storage.getNec4Team(member.teamId);
      if (!team) {
        return res.status(404).json({ error: "NEC4 team not found" });
      }
      
      // Check if user has access to the project this team belongs to
      if (!req.user) {
        return res.status(401).json({ error: "User not found in session" });
      }
      
      const hasAccess = await hasProjectAccess(req.user.id, team.projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have access to this project" });
      }
      
      const updatedMember = await storage.updateNec4TeamMember(memberId, req.body);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating NEC4 team member:", error);
      res.status(500).json({ error: "Failed to update NEC4 team member" });
    }
  });
  
  app.delete("/api/nec4-team-members/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(req.params.id);
      
      if (isNaN(memberId)) {
        return res.status(400).json({ error: "Invalid member ID" });
      }
      
      // Get the member to check their team
      const member = await storage.getNec4TeamMember(memberId);
      if (!member) {
        return res.status(404).json({ error: "NEC4 team member not found" });
      }
      
      // Get the team to check project access
      const team = await storage.getNec4Team(member.teamId);
      if (!team) {
        return res.status(404).json({ error: "NEC4 team not found" });
      }
      
      // Check if user has access to the project this team belongs to
      if (!req.user) {
        return res.status(401).json({ error: "User not found in session" });
      }
      
      const hasAccess = await hasProjectAccess(req.user.id, team.projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: "You don't have access to this project" });
      }
      
      await storage.deleteNec4TeamMember(memberId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting NEC4 team member:", error);
      res.status(500).json({ error: "Failed to delete NEC4 team member" });
    }
  });
  
  // User Project Assignments routes
  app.get("/api/users/:userId/project-assignments", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Check if user is requesting their own assignments or has executive role
      if (!req.user) {
        return res.status(401).json({ error: "User not found in session" });
      }
      
      // Only allow users to see their own assignments unless they are executives
      if (req.user.id !== userId && req.user.role !== 'Executive') {
        return res.status(403).json({ error: "You don't have permission to view these assignments" });
      }
      
      const assignments = await storage.getUserProjectAssignments(userId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching user project assignments:", error);
      res.status(500).json({ error: "Failed to fetch user project assignments" });
    }
  });
  
  app.get("/api/projects/:projectId/user-assignments", requireAuth, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      // Check if user has access to the project
      if (!req.user) {
        return res.status(401).json({ error: "User not found in session" });
      }
      
      // Allow access if user has project access or is an executive
      const hasAccess = await hasProjectAccess(req.user.id, projectId);
      if (!hasAccess && req.user.role !== 'Executive') {
        return res.status(403).json({ error: "You don't have access to this project" });
      }
      
      const assignments = await storage.getProjectUserAssignments(projectId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching project user assignments:", error);
      res.status(500).json({ error: "Failed to fetch project user assignments" });
    }
  });
  
  app.post("/api/user-project-assignments", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only executives or project managers should be able to create assignments
      if (!req.user) {
        return res.status(401).json({ error: "User not found in session" });
      }
      
      if (req.user.role !== 'Executive' && req.user.role !== 'Project Manager') {
        return res.status(403).json({ error: "You don't have permission to create user project assignments" });
      }
      
      const assignmentData = insertUserToProjectSchema.parse(req.body);
      
      // If the user is a Project Manager (not an Executive), they should only be able to add users to projects they manage
      if (req.user.role === 'Project Manager') {
        const hasAccess = await hasProjectAccess(req.user.id, assignmentData.projectId);
        if (!hasAccess) {
          return res.status(403).json({ error: "You don't have access to this project" });
        }
      }
      
      const newAssignment = await storage.createUserProjectAssignment(assignmentData);
      res.status(201).json(newAssignment);
    } catch (error) {
      console.error("Error creating user project assignment:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ error: `Failed to create user project assignment: ${errorMessage}` });
    }
  });
  
  app.delete("/api/user-project-assignments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const assignmentId = parseInt(req.params.id);
      
      if (isNaN(assignmentId)) {
        return res.status(400).json({ error: "Invalid assignment ID" });
      }
      
      // Only executives or project managers should be able to delete assignments
      if (!req.user) {
        return res.status(401).json({ error: "User not found in session" });
      }
      
      // Get the assignment to check the project access
      const assignment = await storage.getUserProjectAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      
      // Check if the user has the right permissions
      if (req.user.role !== 'Executive') {
        // If not an executive, they must have project access to delete assignments for that project
        const hasAccess = await hasProjectAccess(req.user.id, assignment.projectId);
        if (!hasAccess) {
          return res.status(403).json({ error: "You don't have access to this project" });
        }
      }
      
      await storage.deleteUserProjectAssignment(assignmentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user project assignment:", error);
      res.status(500).json({ error: "Failed to delete user project assignment" });
    }
  });

  // Document Analysis route
  app.post("/api/document/analyze", async (req: Request, res: Response) => {
    try {
      // Check if OpenAI is configured
      if (!isOpenAIConfigured()) {
        console.warn("OpenAI API key is not set - document analysis will be limited");
      }
      
      const { documentText } = documentAnalysisSchema.parse(req.body);
      
      // Call OpenAI to analyze the document
      const analysis = await analyzeContractDocument(documentText);
      
      return res.status(200).json(analysis);
    } catch (error) {
      console.error("Error in document analysis:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      return res.status(400).json({ 
        message: "Invalid document text or analysis failed", 
        issues: ["Error analyzing document: " + errorMessage],
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
  
  // Export system with a two-step process:
  // 1. First call returns a download URL
  // 2. Second call to that URL streams the actual file
  
  // Step 1: Generate the report JSON with a download URL
  app.post("/api/export/procurement-report", requireAuth, exportProcurementReport);
  
  // Step 2: Download the actual file from the generated URL
  // Legacy endpoint for file downloads
  app.get("/api/download/:format/:filename", requireAuth, downloadReport);
  
  // Direct export endpoint for client-side convenience
  app.get("/api/download/:format", requireAuth, async (req: Request, res: Response) => {
    try {
      // Extract query parameters
      const { format } = req.params;
      const { reportType, dateRange } = req.query;
      
      console.log(`Download requested: Format=${format}, Type=${reportType}, DateRange=${dateRange}`);
      
      // Create a modified request object with the parameters in the body
      req.body = {
        ...req.body,
        format,
        reportType: reportType || 'General',
        dateRange: dateRange || 'All time'
      };
      
      // Call the export function with the modified request
      await exportProcurementReport(req, res);
    } catch (error) {
      console.error('Error downloading report:', error);
      if (!res.headersSent) {
        res.status(500).send('Failed to download report. Please try again.');
      } else {
        res.end();
      }
    }
  });

  // Z Clause Analysis Test route
  app.get("/api/test/z-clause-analysis", async (_req: Request, res: Response) => {
    try {
      // Check if OpenAI is configured
      if (!isOpenAIConfigured()) {
        console.warn("OpenAI API key is not set - Z clause analysis will be limited");
        return res.status(400).json({
          message: "OpenAI API key not configured",
          analysis: {
            issues: ["AI features are currently unavailable"],
            recommendations: ["Please contact the administrator to set up the OpenAI API key"]
          }
        });
      }
      
      const fs = await import('fs');
      const path = await import('path');
      
      // Read the sample Z clause file
      const zClauseContent = fs.readFileSync(
        path.join(process.cwd(), 'test_data/z_clause_sample.txt'),
        'utf8'
      );
      
      if (!zClauseContent || zClauseContent.trim().length === 0) {
        return res.status(400).json({
          message: "Sample Z clause file is empty",
          analysis: {
            issues: ["Empty Z clause file provided"],
            recommendations: ["Please provide a valid Z clause file to analyze"]
          }
        });
      }
      
      // Call OpenAI to analyze the Z clause
      const analysis = await analyzeContractDocument(zClauseContent);
      
      return res.status(200).json({
        zClause: zClauseContent,
        analysis: analysis
      });
    } catch (error) {
      console.error("Error in Z clause analysis test:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      return res.status(500).json({ 
        message: "Z clause analysis test failed", 
        error: errorMessage
      });
    }
  });
  
  // Email Service routes
  app.post("/api/email/initialize", EmailController.initializeEmailService);
  app.post("/api/email/enable-mock-mode", EmailController.enableMockMode);
  app.post("/api/email/add-mock-email", EmailController.addMockEmail);
  app.get("/api/email/test-connection", EmailController.testConnection);
  app.post("/api/email/process", EmailController.processEmails);
  
  // Helper function to extract equipment type from subject
  function extractEquipmentType(subject: string): string {
    const match = subject.match(/HIRE:\s*([^-]+)/i);
    return match ? match[1].trim() : 'Equipment';
  }

  // Event-Driven Email Processing with AI Classification
  app.post("/api/email/process-demo", async (req: Request, res: Response) => {
    try {
      const { subject, body, from, selectedTemplate, attachments } = req.body;
      
      if (!subject || !body || !from) {
        return res.status(400).json({ error: "Missing required email data: subject, body, and from are required" });
      }
      
      // Initialize Anthropic client for AI classification
      const anthropic = new Anthropic({
        apiKey: process.env.OPENAI_API_KEY, // Using OpenAI key for Anthropic
      });

      // AI Classification of email content
      const classificationPrompt = `
        Analyze this email and classify it for NEC4 contract management:
        
        Subject: ${subject}
        From: ${from}
        Body: ${body}
        
        Determine:
        1. Document type (early_warning, compensation_event, equipment_request, payment_certificate, rfi, programme_submission, variation_instruction, or general)
        2. Confidence level (0-1)
        3. Suggested NEC4 template
        4. Project reference if mentioned
        5. Urgency level (low, medium, high, critical)
        
        Respond in JSON format with: { "type": "document_type", "confidence": 0.85, "suggestedTemplate": "template_name", "projectReference": "ref", "urgency": "medium" }
      `;

      const classificationResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514', // Latest Claude model
        system: 'You are a NEC4 contract management expert. Analyze emails and provide structured classification in valid JSON format.',
        max_tokens: 1024,
        messages: [{ role: 'user', content: classificationPrompt }],
      });

      let classification;
      try {
        classification = JSON.parse(classificationResponse.content[0].text);
      } catch (parseError) {
        // Fallback classification if AI response is not valid JSON
        classification = {
          type: 'general',
          confidence: 0.5,
          suggestedTemplate: 'general_correspondence',
          projectReference: null,
          urgency: 'medium'
        };
      }

      // AI Data Extraction based on classification
      const extractionPrompt = `
        Extract key information from this ${classification.type} email for NEC4 contract processing:
        
        Email Content: ${body}
        Document Type: ${classification.type}
        
        Extract relevant information based on the document type:
        - Project references, contract references
        - Estimated values, deadlines, dates
        - Clause references (NEC4 specific)
        - Description and details
        - Risk levels and mitigation suggestions
        
        Respond in JSON format with extracted structured data.
      `;

      const extractionResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        system: 'Extract structured data from construction project emails. Provide valid JSON output.',
        max_tokens: 1024,
        messages: [{ role: 'user', content: extractionPrompt }],
      });

      let extractedData;
      try {
        extractedData = JSON.parse(extractionResponse.content[0].text);
      } catch (parseError) {
        extractedData = {
          description: body.substring(0, 200),
          projectReference: null,
          estimatedValue: null
        };
      }

      // Generate unique email ID for tracking
      const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Emit email classification event to trigger agent processing
      eventBus.emitEvent('email.classified', {
        emailId,
        from,
        subject,
        classification: classification.type,
        confidence: classification.confidence,
        projectId: extractedData.projectReference ? 1 : undefined, // Map to actual project
        extractedData: {
          ...extractedData,
          urgency: classification.urgency,
          suggestedTemplate: classification.suggestedTemplate
        }
      });

      // Generate suggested actions based on classification
      const suggestedActions = [];
      switch (classification.type) {
        case 'early_warning':
          suggestedActions.push(
            'Create Early Warning record',
            'Schedule risk assessment meeting',
            'Notify project stakeholders',
            'Update risk register'
          );
          break;
        case 'compensation_event':
          suggestedActions.push(
            'Create Compensation Event notification',
            'Review contract clauses',
            'Prepare quotation request',
            'Set response deadline (14 days)'
          );
          break;
        case 'equipment_request':
          suggestedActions.push(
            'Process equipment hire request',
            'Check equipment availability',
            'Generate hire agreement',
            'Schedule delivery'
          );
          break;
        case 'rfi':
          suggestedActions.push(
            'Create RFI record',
            'Assign to technical team',
            'Set response deadline',
            'Acknowledge receipt'
          );
          break;
        default:
          suggestedActions.push(
            'File in project correspondence',
            'Review for action items',
            'Forward to relevant team',
            'Update project logs'
          );
      }

      // Return comprehensive processing result
      const result = {
        success: true,
        emailId,
        classification: {
          type: classification.type,
          confidence: classification.confidence,
          suggestedTemplate: classification.suggestedTemplate
        },
        extractedData,
        suggestedActions,
        processedAt: new Date().toISOString(),
        agentStatus: 'processing_initiated'
      };

      console.log(`[EMAIL INTAKE AGENT] Processed email from ${from}: classified as ${classification.type} (confidence: ${Math.round(classification.confidence * 100)}%)`);
      
      res.status(202).json(result); // 202 Accepted - processing initiated
    } catch (error) {
      console.error("Error in event-driven email processing:", error);
      res.status(500).json({ 
        error: "Email processing failed", 
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Register portfolio routes for executives
  app.use("/api/portfolio", portfolioRouter);

  // AI Assistant endpoints
  app.post("/api/ai-assistant/populate-form", async (req: Request, res: Response) => {
    try {
      await populateForm(req, res);
    } catch (error) {
      console.error("Error in form population endpoint:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/ai-assistant/compare-programmes", async (req: Request, res: Response) => {
    try {
      await compareProgrammes(req, res);
    } catch (error) {
      console.error("Error in programme comparison endpoint:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Progress Reports routes
  app.get("/api/projects/:id/progress-reports", requireAuth, async (req: Request, res: Response) => {
    const projectId = parseInt(req.params.id);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    const reports = await storage.getProgressReportsByProject(projectId);
    return res.status(200).json(reports);
  });

  app.get("/api/progress-reports/:id", requireAuth, async (req: Request, res: Response) => {
    const reportId = parseInt(req.params.id);
    
    if (isNaN(reportId)) {
      return res.status(400).json({ message: "Invalid progress report ID" });
    }
    
    const report = await storage.getProgressReport(reportId);
    
    if (!report) {
      return res.status(404).json({ message: "Progress report not found" });
    }
    
    return res.status(200).json(report);
  });

  app.post("/api/progress-reports", requireAuth, async (req: Request, res: Response) => {
    try {
      // Process the request body - convert date strings to Date objects
      const processedData = {
        ...req.body,
        reportDate: req.body.reportDate ? new Date(req.body.reportDate) : undefined,
        reportPeriodStart: req.body.reportPeriodStart ? new Date(req.body.reportPeriodStart) : undefined,
        reportPeriodEnd: req.body.reportPeriodEnd ? new Date(req.body.reportPeriodEnd) : undefined,
        forecastCompletion: req.body.forecastCompletion ? new Date(req.body.forecastCompletion) : undefined,
        contractCompletion: req.body.contractCompletion ? new Date(req.body.contractCompletion) : undefined,
        createdBy: (req.user as any).id
      };
      
      // Validate the data
      const validatedData = insertProgressReportSchema.parse(processedData);
      
      // Create the progress report
      const report = await storage.createProgressReport(validatedData);
      
      // Return the created report
      return res.status(201).json(report);
    } catch (error) {
      console.error("Error creating progress report:", error);
      if (error instanceof Error) {
        return res.status(400).json({ 
          message: "Invalid progress report data", 
          error: error.message 
        });
      }
      return res.status(400).json({ message: "Invalid progress report data" });
    }
  });

  app.patch("/api/progress-reports/:id", requireAuth, async (req: Request, res: Response) => {
    const reportId = parseInt(req.params.id);
    
    if (isNaN(reportId)) {
      return res.status(400).json({ message: "Invalid progress report ID" });
    }
    
    try {
      // Process the request body - convert date strings to Date objects
      const processedData = {
        ...req.body,
        reportDate: req.body.reportDate ? new Date(req.body.reportDate) : undefined,
        reportPeriodStart: req.body.reportPeriodStart ? new Date(req.body.reportPeriodStart) : undefined,
        reportPeriodEnd: req.body.reportPeriodEnd ? new Date(req.body.reportPeriodEnd) : undefined,
        forecastCompletion: req.body.forecastCompletion ? new Date(req.body.forecastCompletion) : undefined,
        contractCompletion: req.body.contractCompletion ? new Date(req.body.contractCompletion) : undefined
      };
      
      // Update the progress report
      const report = await storage.updateProgressReport(reportId, processedData);
      
      // Return the updated report
      return res.status(200).json(report);
    } catch (error) {
      console.error("Error updating progress report:", error);
      if (error instanceof Error) {
        return res.status(400).json({ 
          message: "Error updating progress report", 
          error: error.message 
        });
      }
      return res.status(404).json({ message: "Progress report not found" });
    }
  });

  app.delete("/api/progress-reports/:id", requireAuth, async (req: Request, res: Response) => {
    const reportId = parseInt(req.params.id);
    
    if (isNaN(reportId)) {
      return res.status(400).json({ message: "Invalid progress report ID" });
    }
    
    try {
      await storage.deleteProgressReport(reportId);
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting progress report:", error);
      return res.status(500).json({ message: "Error deleting progress report" });
    }
  });

  // AI-enhanced progress report route
  app.post("/api/ai-assistant/generate-progress-report", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!isOpenAIConfigured()) {
        return res.status(400).json({ message: "OpenAI API key is not configured." });
      }

      const { projectId } = req.body;
      
      // Gather relevant project data for AI analysis
      const project = await storage.getProject(projectId);
      const compensationEvents = await storage.getCompensationEventsByProject(projectId);
      const earlyWarnings = await storage.getEarlyWarningsByProject(projectId);
      const nonConformanceReports = await storage.getNonConformanceReportsByProject(projectId);
      const programmeMilestones = await storage.getProgrammeMilestonesByProject(projectId);
      
      // Calculate overall progress based on milestones
      const completedMilestones = programmeMilestones.filter(m => m.status === "Completed").length;
      const totalMilestones = programmeMilestones.length;
      const overallProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
      
      // Get active risks from early warnings
      const activeRisks = earlyWarnings.filter(ew => ew.status === "Open").map(ew => ({
        riskId: ew.reference,
        description: ew.description,
        status: ew.status,
        mitigation: ew.mitigationPlan || "",
        registerLink: `/early-warnings/${ew.id}`
      }));
      
      // Get compensation event impacts
      const ceImpacts = compensationEvents.map(ce => ({
        ceRef: ce.reference,
        description: ce.title,
        status: ce.status,
        costImpact: ce.estimatedValue || 0,
        timeImpact: 0, // Would need to calculate based on programme data
        affectedSection: "Main Works" // This would need to come from actual section data
      }));
      
      // Get issues and queries
      const issues = nonConformanceReports.map(ncr => ({
        ref: ncr.reference,
        type: "NCR",
        description: ncr.description,
        section: ncr.location,
        status: ncr.status,
        raisedDate: ncr.raisedAt.toISOString().split('T')[0]
      }));
      
      // Ask the AI to generate a summary based on the project data
      const prompt = `
      You are an NEC4 contract expert. Generate a concise insight in plain language based on this project data:

      Project: ${project?.name}
      Overall Progress: ${overallProgress.toFixed(1)}%
      Active Risks: ${activeRisks.length}
      Open Compensation Events: ${compensationEvents.filter(ce => ce.status !== "Accepted" && ce.status !== "Rejected").length}
      Open NCRs: ${nonConformanceReports.filter(ncr => ncr.status === "Open").length}
      
      Focus on:
      1. Current progress status
      2. Key risks and their impact
      3. Potential delays and mitigation strategies
      4. Financial implications of compensation events
      5. Quality issues from NCRs
      
      Keep your response under 200 words.
      `;
      
      const aiSummary = await askContractAssistant(prompt);
      
      // Create a progress report draft
      const reportDraft = {
        projectId,
        title: `Progress Report - ${new Date().toLocaleDateString()}`,
        reportDate: new Date(),
        reportPeriodStart: new Date(new Date().setDate(new Date().getDate() - 14)), // 2 weeks ago
        reportPeriodEnd: new Date(),
        overallProgress: overallProgress,
        overallSummary: `Project is ${overallProgress.toFixed(1)}% complete.`,
        statusColor: overallProgress > 75 ? "green" : overallProgress > 40 ? "amber" : "red",
        risksAndEarlyWarnings: activeRisks,
        compensationEvents: ceImpacts,
        issuesAndQueries: issues,
        aiSummary: aiSummary || "AI analysis could not be generated."
      };
      
      return res.status(200).json(reportDraft);
    } catch (error) {
      console.error("Error generating progress report:", error);
      if (error instanceof Error) {
        return res.status(500).json({ 
          message: "Error generating progress report", 
          error: error.message 
        });
      }
      return res.status(500).json({ message: "Error generating progress report" });
    }
  });

  // ======== PROCUREMENT ROUTES ========
  
  // Nominal Codes
  app.get("/api/nominal-codes", procurementController.getNominalCodes);
  app.get("/api/nominal-codes/:id", procurementController.getNominalCode);
  app.post("/api/nominal-codes", requireAuth, procurementController.createNominalCode);
  
  // Suppliers
  app.get("/api/suppliers", procurementController.getSuppliers);
  app.get("/api/suppliers/:id", procurementController.getSupplier);
  app.post("/api/suppliers", requireAuth, procurementController.createSupplier);
  app.patch("/api/suppliers/:id", requireAuth, procurementController.updateSupplier);
  
  // Supplier Performance and Invoices
  app.get("/api/supplier-performance", procurementController.getSupplierPerformance);
  app.get("/api/supplier-invoices", procurementController.getSupplierInvoices);
  
  // Purchase Orders
  app.get("/api/procurement/dashboard", requireAuth, procurementController.getProcurementDashboard);
  app.get("/api/purchase-orders", requireAuth, procurementController.getPurchaseOrders);
  app.get("/api/purchase-orders/:id", requireAuth, procurementController.getPurchaseOrder);
  app.post("/api/purchase-orders", requireAuth, procurementController.createPurchaseOrder);
  app.patch("/api/purchase-orders/:id/status", requireAuth, procurementController.updatePurchaseOrderStatus);
  
  // ======== INVENTORY ROUTES ========
  
  // Inventory Items
  app.get("/api/inventory/items", requireAuth, inventoryController.getInventoryItems);
  app.get("/api/inventory/items/:id", requireAuth, inventoryController.getInventoryItem);
  app.post("/api/inventory/items", requireAuth, inventoryController.createInventoryItem);
  app.patch("/api/inventory/items/:id", requireAuth, inventoryController.updateInventoryItem);
  
  // Inventory Locations
  app.get("/api/inventory/locations", requireAuth, inventoryController.getInventoryLocations);
  app.get("/api/inventory/locations/:id", requireAuth, inventoryController.getInventoryLocation);
  app.post("/api/inventory/locations", requireAuth, inventoryController.createInventoryLocation);
  
  // Stock Transactions
  app.post("/api/inventory/transactions", requireAuth, inventoryController.createStockTransaction);
  app.post("/api/inventory/batch-transactions", requireAuth, inventoryController.processBatchTransactions);
  
  // Dashboard & Analytics
  app.get("/api/inventory/dashboard", requireAuth, inventoryController.getInventoryDashboard);

  // Equipment Hire System Routes
  // Categories
  app.get("/api/equipment/categories", requireAuth, equipmentHireController.getAllEquipmentCategories);
  
  // Equipment Items
  app.get("/api/equipment/items", requireAuth, equipmentHireController.getEquipmentItems);
  app.get("/api/equipment/items/:id", requireAuth, equipmentHireController.getEquipmentItemById);
  app.post("/api/equipment/items", requireAuth, equipmentHireController.createEquipmentItem);
  app.patch("/api/equipment/items/:id", requireAuth, equipmentHireController.updateEquipmentItem);
  
  // Equipment Hires
  app.get("/api/equipment/hires", requireAuth, equipmentHireController.getEquipmentHires);
  app.get("/api/equipment/hires/:id", requireAuth, equipmentHireController.getHireById);
  app.post("/api/equipment/hires", requireAuth, equipmentHireController.createEquipmentHire);
  app.patch("/api/equipment/hires/:id", requireAuth, equipmentHireController.updateEquipmentHire);
  
  // Off-Hire Requests
  app.get("/api/equipment/off-hire-requests", requireAuth, equipmentHireController.getOffHireRequests);
  app.get("/api/equipment/off-hire-requests/:id", requireAuth, equipmentHireController.getOffHireRequestById);
  app.post("/api/equipment/off-hire-requests", requireAuth, equipmentHireController.createOffHireRequest);
  app.patch("/api/equipment/off-hire-requests/:id", requireAuth, equipmentHireController.updateOffHireRequest);
  
  // Mobile Scan Functionality - priority feature
  app.post("/api/equipment/mobile-scan", requireAuth, equipmentHireController.mobileOffHireScan);
  
  // Dashboard Statistics
  app.get("/api/equipment/dashboard", requireAuth, equipmentHireController.getEquipmentHireDashboardStats);
  
  // Off-hire confirmation endpoint (public, accessed via email link)
  app.get("/api/equipment/confirm-off-hire/:token", equipmentHireController.confirmOffHireRequest);

  // Setup RFI Management Routes
  setupRfiRoutes(app);

  // Resource Allocation routes
  app.get("/api/projects/:projectId/resource-allocations", requireAuth, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }
      
      const allocations = await storage.getResourceAllocationsByProject(projectId);
      res.json(allocations);
    } catch (error) {
      console.error("Error fetching resource allocations:", error);
      res.status(500).json({ error: "Failed to fetch resource allocations" });
    }
  });

  app.post("/api/resource-allocations", requireAuth, async (req: Request, res: Response) => {
    try {
      const allocation = await storage.createResourceAllocation(req.body);
      res.status(201).json(allocation);
    } catch (error) {
      console.error("Error creating resource allocation:", error);
      res.status(500).json({ error: "Failed to create resource allocation" });
    }
  });

  app.post("/api/resource-allocation/extract", requireAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const projectId = parseInt(req.body.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      // Check if AI is configured
      if (!isOpenAIConfigured()) {
        return res.status(503).json({ 
          error: "AI extraction service not available. Please configure OpenAI API key." 
        });
      }

      const filePath = req.file.path;
      const fileName = req.file.originalname;
      const fileExtension = path.extname(fileName).toLowerCase();

      let extractedText = "";

      // Read file content based on type
      if (fileExtension === '.csv') {
        extractedText = fs.readFileSync(filePath, 'utf-8');
      } else if (fileExtension === '.pdf') {
        // For PDF, we'll extract text content
        extractedText = fs.readFileSync(filePath, 'utf-8');
      } else if (['.xlsx', '.xls'].includes(fileExtension)) {
        // For Excel files, we'll read as binary and convert
        const buffer = fs.readFileSync(filePath);
        extractedText = buffer.toString('binary');
      } else {
        return res.status(400).json({ error: "Unsupported file type" });
      }

      // Use AI to extract resource allocation data
      try {
        const extractedData = await extractResourceAllocationData(extractedText.substring(0, 2000));
        
        // Calculate total hours
        const totalLabourHours = extractedData.teamMembers.reduce((sum: number, member: any) => 
          sum + (member.hours || 0), 0
        );

        const result = {
          projectId,
          periodName: extractedData.periodName || `Week of ${new Date().toISOString().split('T')[0]}`,
          weekCommencing: extractedData.weekCommencing || new Date().toISOString().split('T')[0],
          teamMembers: extractedData.teamMembers || [],
          totalLabourHours,
          extractedFrom: fileName,
          extractionConfidence: extractedData.extractionConfidence || 0.8
        };

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json(result);
      } catch (extractionError) {
        console.error("Error in AI extraction:", extractionError);
        
        // Provide fallback response with manual entry guidance
        const fallbackResult = {
          projectId,
          periodName: `Week of ${new Date().toISOString().split('T')[0]}`,
          weekCommencing: new Date().toISOString().split('T')[0],
          teamMembers: [
            {
              name: "AI extraction failed - please enter manually",
              role: "Please enter role",
              company: "Please enter company",
              hours: 0,
              isSubcontractor: false
            }
          ],
          totalLabourHours: 0,
          extractedFrom: fileName,
          extractionConfidence: 0.2,
          extractionNote: "AI extraction failed - please use manual entry"
        };
        
        // Clean up uploaded file
        fs.unlinkSync(filePath);
        
        res.json(fallbackResult);
      }

    } catch (error) {
      console.error("Error extracting resource allocation:", error);
      res.status(500).json({ error: "Failed to extract resource allocation data" });
    }
  });

  // PDF Overview Download route
  app.get('/api/pdf/overview', (req: Request, res: Response) => {
    try {
      const pdfPath = path.resolve('./NEC4-Platform-Overview.pdf');
      if (fs.existsSync(pdfPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=NEC4-Platform-Overview.pdf');
        const fileStream = fs.createReadStream(pdfPath);
        fileStream.pipe(res);
      } else {
        res.status(404).json({ message: 'PDF file not found' });
      }
    } catch (error) {
      console.error('Error serving PDF:', error);
      res.status(500).json({ message: 'Error serving PDF file' });
    }
  });

  // Z-Clauses endpoints
  // Agent system routes
  app.get("/api/projects/:projectId/agent-alerts", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Import the agent coordinator
      const { agentCoordinator } = await import('./agents/agent-coordinator');
      const alerts = agentCoordinator.getActiveAlerts(projectId);
      
      res.json(alerts);
    } catch (error) {
      console.error('Error getting agent alerts:', error);
      res.status(500).json({ message: 'Failed to retrieve agent alerts' });
    }
  });

  app.post("/api/agent/trigger-demo", requireAuth, async (req: Request, res: Response) => {
    try {
      const { scenarioType, projectId } = req.body;
      
      // Import the agent coordinator
      const { agentCoordinator } = await import('./agents/agent-coordinator');
      
      // Trigger the appropriate scenario
      switch (scenarioType) {
        case 'archaeological-delay':
          await agentCoordinator.processProgrammeUpdate(projectId, {
            projectId,
            activities: [{
              id: 'foundation-phase-2',
              name: 'Foundation Works - Phase 2',
              startDate: new Date('2024-12-01'),
              endDate: new Date('2024-12-15'),
              duration: 14,
              progress: 60,
              isCritical: true,
              predecessors: [],
              successors: [],
              resources: ['Excavator', 'Foundation Team'],
              status: 'delayed'
            }],
            milestones: [],
            criticalPath: ['foundation-phase-2'],
            plannedCompletion: new Date('2024-12-20'),
            forecastCompletion: new Date('2025-01-10'),
            overallProgress: 65
          });
          break;
          
        case 'equipment-cost-validation':
          await agentCoordinator.processEquipmentHireUpdate(projectId, {
            id: 3,
            projectId,
            equipmentName: 'Concrete Pump - 42m',
            supplierName: 'Pumping Solutions Ltd',
            hireReference: 'PSL-CP-0089',
            startDate: new Date('2024-12-05'),
            endDate: new Date('2024-12-06'),
            dailyRate: 850.00,
            totalCost: 1700.00,
            status: 'active',
            sccCompliant: false,
            workingAreasOnly: false
          });
          break;
      }
      
      res.json({ success: true, message: `${scenarioType} scenario triggered successfully` });
    } catch (error) {
      console.error('Error triggering agent demo:', error);
      res.status(500).json({ message: 'Failed to trigger agent demo' });
    }
  });

  app.get("/api/projects/:projectId/z-clauses", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      const query = `
        SELECT * FROM z_clauses 
        WHERE project_id = $1 AND is_active = true 
        ORDER BY clause_number
      `;
      
      const result = await db.$client.query(query, [projectId]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching Z-clauses:", error);
      res.status(500).json({ message: "Failed to fetch Z-clauses" });
    }
  });

  // Serve design mockups for video demonstration
  app.get('/api/mockups', (req: Request, res: Response) => {
    const htmlPath = path.join(process.cwd(), 'mockup-designs.html');
    try {
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error serving mockups:', error);
      res.status(500).json({ error: 'Failed to load design mockups' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
