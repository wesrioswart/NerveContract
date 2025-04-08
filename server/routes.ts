import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertChatMessageSchema, insertCompensationEventSchema, insertEarlyWarningSchema } from "@shared/schema";
import { askContractAssistant, analyzeContractDocument, isOpenAIConfigured } from "./utils/openai";

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
    
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
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
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error during login" });
    }
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
      
      // Get AI response
      console.log("Getting AI response for:", validatedData.content);
      const aiResponse = await askContractAssistant(validatedData.content);
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
  app.post("/api/programme/upload", async (req: Request, res: Response) => {
    try {
      console.log("Programme file upload request received");
      
      // In a real implementation, we would process the uploaded file
      // For now, we'll just simulate success
      
      // Check if OpenAI is configured for analysis
      if (!isOpenAIConfigured()) {
        console.warn("OpenAI API key is not set - programme analysis will be limited");
      }
      
      // Process form data
      const projectId = parseInt(req.body.projectId);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate simulated milestones
      const milestones = [
        {
          id: 1,
          projectId,
          name: "Site Mobilization",
          plannedDate: new Date("2023-05-10"),
          actualDate: new Date("2023-05-12"),
          status: "Completed",
          isKeyDate: false,
          affectsCompletionDate: false,
          description: "Initial setup of site facilities"
        },
        {
          id: 2,
          projectId,
          name: "Foundation Complete",
          plannedDate: new Date("2023-06-15"),
          actualDate: new Date("2023-06-20"),
          status: "Completed",
          isKeyDate: false,
          affectsCompletionDate: false,
          description: "Completion of all foundation works"
        },
        {
          id: 3,
          projectId,
          name: "Structural Frame",
          plannedDate: new Date("2023-07-30"),
          actualDate: new Date("2023-08-05"),
          status: "Completed",
          isKeyDate: true,
          affectsCompletionDate: true,
          description: "Completion of main structural frame"
        },
        {
          id: 4,
          projectId,
          name: "Building Watertight",
          plannedDate: new Date("2023-09-15"),
          actualDate: new Date("2023-09-25"),
          status: "Completed",
          isKeyDate: true,
          affectsCompletionDate: true,
          description: "Building envelope sealed and watertight"
        },
        {
          id: 5,
          projectId,
          name: "MEP First Fix",
          plannedDate: new Date("2023-10-20"),
          forecastDate: new Date("2023-10-30"),
          status: "At Risk",
          isKeyDate: false,
          affectsCompletionDate: false,
          description: "Mechanical, electrical and plumbing first fix"
        },
        {
          id: 6,
          projectId,
          name: "Internal Finishes Start",
          plannedDate: new Date("2023-11-10"),
          forecastDate: new Date("2023-11-15"),
          status: "On Track",
          isKeyDate: false,
          affectsCompletionDate: false,
          description: "Start of internal finishing works"
        },
        {
          id: 7,
          projectId,
          name: "MEP Second Fix",
          plannedDate: new Date("2023-12-15"),
          forecastDate: new Date("2023-12-20"),
          status: "On Track",
          isKeyDate: false,
          affectsCompletionDate: false,
          description: "Mechanical, electrical and plumbing second fix"
        },
        {
          id: 8,
          projectId,
          name: "Practical Completion",
          plannedDate: new Date("2024-02-28"),
          forecastDate: new Date("2024-03-10"),
          status: "Delayed",
          isKeyDate: true,
          affectsCompletionDate: true,
          description: "Project handover to client"
        }
      ];
      
      // Store the milestones (in a real implementation)
      // For now, we'll just create them in memory
      for (const milestone of milestones) {
        try {
          // Check if milestone already exists
          const existingMilestone = await storage.getProgrammeMilestone(milestone.id);
          
          if (!existingMilestone) {
            // Create new milestone
            await storage.createProgrammeMilestone(milestone);
          }
        } catch (error) {
          console.error(`Error creating milestone ${milestone.name}:`, error);
        }
      }
      
      // Generate analysis results
      const analysis = {
        issuesFound: [
          {
            severity: "high",
            description: "Practical Completion milestone delayed by 10 days",
            nec4Clause: "31.2",
            recommendation: "Submit Early Warning and evaluate impact to Key Dates"
          },
          {
            severity: "medium",
            description: "MEP First Fix at risk with 10 days delay forecast",
            nec4Clause: "32.1",
            recommendation: "Review resource allocation and consider mitigation measures"
          },
          {
            severity: "low",
            description: "Insufficient float on Internal Finishes activities",
            nec4Clause: "31.2",
            recommendation: "Review durations and consider parallel working where possible"
          }
        ],
        metrics: {
          critical_path_tasks: 12,
          float_less_than_5days: 8,
          totalDuration: 295,
          completionDateChange: 10
        }
      };
      
      return res.status(200).json({
        message: "Programme file uploaded and processed successfully",
        analysis
      });
    } catch (error) {
      console.error("Error processing programme file:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
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
      const { projectId } = req.body;
      
      if (!projectId || isNaN(parseInt(projectId))) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Check if OpenAI is configured for advanced analysis
      if (!isOpenAIConfigured()) {
        console.warn("OpenAI API key is not set - programme analysis will be limited");
      }
      
      // In a real implementation, we would analyze the programme data
      // For now, we'll just return a simulated analysis
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const analysis = {
        issuesFound: [
          {
            severity: "high",
            description: "Practical Completion milestone delayed by 10 days",
            nec4Clause: "31.2",
            recommendation: "Submit Early Warning and evaluate impact to Key Dates"
          },
          {
            severity: "medium",
            description: "MEP First Fix at risk with 10 days delay forecast",
            nec4Clause: "32.1",
            recommendation: "Review resource allocation and consider mitigation measures"
          },
          {
            severity: "medium",
            description: "Critical path has insufficient float (<5 days)",
            nec4Clause: "31.2",
            recommendation: "Identify opportunities to increase float on critical activities"
          },
          {
            severity: "low",
            description: "Insufficient float on Internal Finishes activities",
            nec4Clause: "31.2",
            recommendation: "Review durations and consider parallel working where possible"
          },
          {
            severity: "low",
            description: "Programme lacks sufficient detail for MEP works",
            nec4Clause: "31.2",
            recommendation: "Enhance programme detail for MEP activities"
          }
        ],
        metrics: {
          critical_path_tasks: 12,
          float_less_than_5days: 8,
          totalDuration: 295,
          completionDateChange: 10
        }
      };
      
      return res.status(200).json({
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

  const httpServer = createServer(app);
  return httpServer;
}
