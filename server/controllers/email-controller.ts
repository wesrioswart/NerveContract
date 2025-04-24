import { Request, Response } from 'express';
import * as emailService from '../services/email-service';
import { z } from 'zod';

// Schema for email configuration validation
const emailConfigSchema = z.object({
  user: z.string(),
  password: z.string(),
  host: z.string(),
  port: z.number(),
  tls: z.boolean(),
  tlsOptions: z.object({
    rejectUnauthorized: z.boolean(),
  }).optional(),
  markSeen: z.boolean().optional(),
});

export const EmailController = {
  /**
   * Initialize the email service with provided configuration
   */
  initializeEmailService: async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const validatedConfig = emailConfigSchema.parse(req.body);
      
      // Initialize the email service
      emailService.initialize(validatedConfig);
      
      res.status(200).json({ message: 'Email service initialized successfully' });
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      res.status(400).json({ error: 'Invalid configuration' });
    }
  },
  
  /**
   * Enable mock mode for testing without real email credentials
   */
  enableMockMode: async (_req: Request, res: Response) => {
    try {
      emailService.enableMockMode();
      res.status(200).json({ message: 'Email service mock mode enabled' });
    } catch (error) {
      console.error('Failed to enable mock mode:', error);
      res.status(500).json({ error: 'Failed to enable mock mode' });
    }
  },
  
  /**
   * Add a custom mock email for testing
   */
  addMockEmail: async (req: Request, res: Response) => {
    try {
      const { subject, content, type } = req.body;
      
      if (!subject || !content) {
        return res.status(400).json({ error: 'Subject and content are required' });
      }
      
      // Validate the email type if provided
      if (type && !['HIRE', 'OFFHIRE', 'DELIVERY'].includes(type.toUpperCase())) {
        return res.status(400).json({ 
          error: 'Invalid email type. Must be one of: HIRE, OFFHIRE, DELIVERY' 
        });
      }
      
      // Format the subject based on the type if provided
      let formattedSubject = subject;
      if (type) {
        const typePrefix = type.toUpperCase() + ': ';
        if (!formattedSubject.toUpperCase().startsWith(type.toUpperCase())) {
          formattedSubject = typePrefix + formattedSubject;
        }
      }
      
      // Add the custom mock email
      const addedEmail = emailService.addMockEmail(formattedSubject, content);
      
      res.status(200).json({
        message: 'Mock email added successfully',
        email: addedEmail
      });
    } catch (error) {
      console.error('Failed to add mock email:', error);
      res.status(500).json({ error: 'Failed to add mock email' });
    }
  },
  
  /**
   * Test connection to the email server
   */
  testConnection: async (_req: Request, res: Response) => {
    try {
      await emailService.connect();
      await emailService.disconnect();
      
      res.status(200).json({ message: 'Connection test successful' });
    } catch (error) {
      console.error('Connection test failed:', error);
      res.status(500).json({ error: 'Connection test failed' });
    }
  },
  
  /**
   * Fetch and process new emails
   */
  processEmails: async (_req: Request, res: Response) => {
    try {
      const result = await emailService.processEmails();
      
      res.status(200).json({
        message: 'Emails processed successfully',
        processedCount: result.processedCount,
        processedEmails: result.processedEmails
      });
    } catch (error) {
      console.error('Failed to process emails:', error);
      res.status(500).json({ error: 'Failed to process emails' });
    }
  },
};