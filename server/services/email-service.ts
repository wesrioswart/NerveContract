import * as Imap from 'node-imap';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { storage } from '../storage';
import async from 'async';

// Email configuration interface
interface EmailConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  tlsOptions?: {
    rejectUnauthorized: boolean;
  };
  markSeen?: boolean;
}

// Email attachment interface
interface EmailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

// Parsed email interface
interface ParsedEmail {
  id: string;
  date: Date;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  text?: string;
  html?: string;
  attachments: EmailAttachment[];
  projectReference?: string;
}

class EmailService {
  private config: EmailConfig | null = null;
  private imap: Imap | null = null;
  private docTypes = new Map<string, string>([
    ['ce', 'compensation-event'],
    ['ew', 'early-warning'],
    ['ncr', 'non-conformance-report'],
    ['tq', 'technical-query'],
    ['pmi', 'project-manager-instruction'],
    ['pc', 'payment-certificate'],
  ]);

  /**
   * Initialize the email service with configuration
   */
  initialize(config: EmailConfig) {
    this.config = config;
    this.imap = new Imap({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: config.tlsOptions || { rejectUnauthorized: false },
    });

    // Set up event handlers
    this.imap.on('error', (err: Error) => {
      console.error('IMAP error:', err);
    });

    console.log('Email service initialized');
  }

  /**
   * Connect to the email server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not initialized. Call initialize() first.'));
      }

      this.imap.once('ready', () => {
        console.log('Connected to email server');
        resolve();
      });

      this.imap.once('error', (err: Error) => {
        reject(err);
      });

      this.imap.connect();
    });
  }

  /**
   * Disconnect from the email server
   */
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.imap && this.imap.state !== 'disconnected') {
        this.imap.end();
        this.imap.once('end', () => {
          console.log('Disconnected from email server');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Fetch new emails from the inbox
   */
  async fetchNewEmails(since: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)): Promise<ParsedEmail[]> {
    if (!this.imap) {
      throw new Error('IMAP not initialized. Call initialize() first.');
    }

    try {
      await this.openMailbox('INBOX');
      const messages = await this.searchMessages(since);
      const parsedEmails = await this.fetchMessages(messages);
      return parsedEmails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  /**
   * Open a mailbox (folder)
   */
  private openMailbox(mailbox: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not initialized'));
      }

      this.imap.openBox(mailbox, false, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Search for messages since a specified date
   */
  private searchMessages(since: Date): Promise<number[]> {
    return new Promise((resolve, reject) => {
      if (!this.imap) {
        return reject(new Error('IMAP not initialized'));
      }

      // Format the date for IMAP search
      const searchCriteria = [
        'UNSEEN',
        ['SINCE', since.toISOString().split('T')[0]],
      ];

      this.imap.search(searchCriteria, (err, results) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Found ${results.length} new messages`);
          resolve(results);
        }
      });
    });
  }

  /**
   * Fetch and parse messages
   */
  private fetchMessages(messageIds: number[]): Promise<ParsedEmail[]> {
    return new Promise((resolve, reject) => {
      if (!this.imap || messageIds.length === 0) {
        return resolve([]);
      }

      const parsedEmails: ParsedEmail[] = [];
      const markSeen = this.config?.markSeen !== false;

      // Create a fetch query for the messages
      const fetch = this.imap.fetch(messageIds, {
        bodies: '',
        markSeen,
      });

      fetch.on('message', (msg, seqno) => {
        console.log(`Processing message #${seqno}`);
        
        // Process each message
        msg.on('body', (stream) => {
          this.parseMessage(stream, seqno.toString())
            .then((email) => {
              if (email) {
                parsedEmails.push(email);
              }
            })
            .catch((err) => {
              console.error(`Error parsing message #${seqno}:`, err);
            });
        });
      });

      fetch.on('error', (err) => {
        console.error('Fetch error:', err);
        reject(err);
      });

      fetch.on('end', () => {
        console.log('Done fetching messages');
        resolve(parsedEmails);
      });
    });
  }

  /**
   * Parse an email message
   */
  private async parseMessage(stream: NodeJS.ReadableStream, id: string): Promise<ParsedEmail | null> {
    try {
      const parsed = await simpleParser(stream);
      
      const attachments: EmailAttachment[] = [];
      
      // Process attachments
      if (parsed.attachments && parsed.attachments.length > 0) {
        for (const attachment of parsed.attachments) {
          attachments.push({
            filename: attachment.filename || `attachment-${Date.now()}`,
            contentType: attachment.contentType,
            content: attachment.content,
          });
        }
      }

      // Extract potential project reference from subject
      let projectReference: string | undefined;
      if (parsed.subject) {
        // Look for patterns like "Project: ABC123" or "Ref: ABC123" in subject
        const refMatch = parsed.subject.match(/(?:Project|Ref|Reference):\s*([A-Z0-9-]+)/i);
        if (refMatch && refMatch[1]) {
          projectReference = refMatch[1];
        }
      }
      
      return {
        id,
        date: parsed.date || new Date(),
        subject: parsed.subject || 'No Subject',
        from: parsed.from?.text || 'Unknown',
        to: parsed.to?.text?.split(',') || [],
        cc: parsed.cc?.text?.split(',') || [],
        text: parsed.text,
        html: parsed.html,
        attachments,
        projectReference,
      };
    } catch (error) {
      console.error('Error parsing message:', error);
      return null;
    }
  }

  /**
   * Process emails and their attachments
   */
  async processEmails(): Promise<void> {
    try {
      await this.connect();
      const emails = await this.fetchNewEmails();
      
      for (const email of emails) {
        await this.processEmail(email);
      }
      
      await this.disconnect();
    } catch (error) {
      console.error('Error processing emails:', error);
      await this.disconnect();
    }
  }

  /**
   * Process a single email
   */
  private async processEmail(email: ParsedEmail): Promise<void> {
    console.log(`Processing email: ${email.subject}`);
    
    // Determine document type from subject or email content
    const documentType = this.determineDocumentType(email);
    if (!documentType) {
      console.log('Could not determine document type');
      return;
    }
    
    // Save attachments
    if (email.attachments.length > 0) {
      await this.processAttachments(email, documentType);
    }
    
    // Process email body content
    await this.processEmailContent(email, documentType);
  }

  /**
   * Determine the document type from email metadata
   */
  private determineDocumentType(email: ParsedEmail): string | null {
    // Check the subject for document type indicators
    const subject = email.subject.toLowerCase();
    
    for (const [prefix, docType] of this.docTypes.entries()) {
      if (
        subject.includes(`${prefix}:`) || 
        subject.includes(`${prefix}-`) || 
        subject.includes(docType)
      ) {
        return docType;
      }
    }
    
    // Check email content for document type indicators
    if (email.text) {
      const content = email.text.toLowerCase();
      
      for (const [prefix, docType] of this.docTypes.entries()) {
        if (
          content.includes(`${prefix}:`) || 
          content.includes(`${prefix}-`) || 
          content.includes(docType)
        ) {
          return docType;
        }
      }
    }
    
    // Default to general document if no specific type found
    return null;
  }

  /**
   * Process email attachments
   */
  private async processAttachments(email: ParsedEmail, documentType: string): Promise<void> {
    const uploadPath = path.resolve('uploads', documentType);
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    // Process each attachment
    for (const attachment of email.attachments) {
      const safeName = this.sanitizeFilename(attachment.filename);
      const filePath = path.join(uploadPath, safeName);
      
      // Save the attachment to disk
      fs.writeFileSync(filePath, attachment.content);
      console.log(`Saved attachment: ${filePath}`);
      
      // Process based on file type
      if (attachment.contentType.includes('pdf')) {
        // Handle PDF document
        this.processPdfAttachment(filePath, documentType, email);
      } else if (
        attachment.contentType.includes('word') || 
        attachment.filename.endsWith('.docx') || 
        attachment.filename.endsWith('.doc')
      ) {
        // Handle Word document
        this.processWordAttachment(filePath, documentType, email);
      } else if (
        attachment.contentType.includes('sheet') || 
        attachment.filename.endsWith('.xlsx') || 
        attachment.filename.endsWith('.xls')
      ) {
        // Handle Excel document
        this.processExcelAttachment(filePath, documentType, email);
      } else if (
        attachment.contentType.includes('xml') || 
        attachment.filename.endsWith('.xml')
      ) {
        // For XML documents (Project schedules)
        this.processXmlAttachment(filePath, documentType, email);
      } else if (
        attachment.filename.endsWith('.mpp')
      ) {
        // For MS Project documents
        this.processMppAttachment(filePath, documentType, email);
      }
    }
  }

  /**
   * Process the email content for potential data extraction
   */
  private async processEmailContent(email: ParsedEmail, documentType: string): Promise<void> {
    // Extract potential information from email body
    const textContent = email.text || '';
    
    // Look for key-value pairs in email content
    const keyValuePairs = this.extractKeyValuePairs(textContent);
    
    console.log(`Extracted data from email:`, keyValuePairs);
    
    // TODO: Based on documentType, store the extracted data in the appropriate database table
  }

  /**
   * Extract key-value pairs from text content
   */
  private extractKeyValuePairs(text: string): Record<string, string> {
    const result: Record<string, string> = {};
    
    // Look for patterns like "Key: Value" or "Key - Value"
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Try different separator patterns
      const match = line.match(/([A-Za-z\s]+)(?:\s*[:|-]\s*)(.+)/);
      if (match && match.length >= 3) {
        const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
        const value = match[2].trim();
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Sanitize a filename to prevent path traversal and invalid characters
   */
  private sanitizeFilename(filename: string): string {
    // Remove path traversal characters and invalid filename characters
    return filename
      .replace(/[\/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, '_');
  }

  /**
   * Process a PDF attachment for text extraction
   */
  private processPdfAttachment(filePath: string, documentType: string, email: ParsedEmail): void {
    console.log(`Processing PDF: ${filePath}`);
    // The actual PDF processing would be implemented here
    // For now, we'll just log that we would process it
  }

  /**
   * Process a Word document attachment
   */
  private processWordAttachment(filePath: string, documentType: string, email: ParsedEmail): void {
    console.log(`Processing Word document: ${filePath}`);
    // The actual Word document processing would be implemented here
    // For now, we'll just log that we would process it
  }

  /**
   * Process an Excel document attachment
   */
  private processExcelAttachment(filePath: string, documentType: string, email: ParsedEmail): void {
    console.log(`Processing Excel document: ${filePath}`);
    // The actual Excel document processing would be implemented here
    // For now, we'll just log that we would process it
  }

  /**
   * Process an XML attachment (like project schedule)
   */
  private processXmlAttachment(filePath: string, documentType: string, email: ParsedEmail): void {
    console.log(`Processing XML file: ${filePath}`);
    // The actual XML processing would be implemented here
    // For now, we'll just log that we would process it
  }

  /**
   * Process an MPP (MS Project) attachment
   */
  private processMppAttachment(filePath: string, documentType: string, email: ParsedEmail): void {
    console.log(`Processing MS Project file: ${filePath}`);
    // The actual MPP processing would be implemented here
    // For now, we'll just log that we would process it
  }
}

// Create and export a singleton instance
export const emailService = new EmailService();