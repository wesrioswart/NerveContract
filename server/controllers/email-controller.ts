import { Request, Response } from 'express';
import { emailService } from '../services/email-service';
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
      await emailService.processEmails();
      
      res.status(200).json({ message: 'Emails processed successfully' });
    } catch (error) {
      console.error('Failed to process emails:', error);
      res.status(500).json({ error: 'Failed to process emails' });
    }
  },
};