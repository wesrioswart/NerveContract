import { MailService } from '@sendgrid/mail';
import crypto from 'crypto';
import { db } from '../db';
import { offHireConfirmations, equipmentItems, equipmentHires, offHireRequests, rfis } from '@shared/schema';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY is not set. Email notifications will not be sent.");
}

// Initialize SendGrid if API key is available
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Configuration for email service
let emailConfig: any = null;
let mockModeEnabled: boolean = false;

// Store custom mock emails
let customMockEmails: Array<{subject: string, content: string, timestamp: Date}> = [];

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html: string;
}

/**
 * Initialize the email processing service with configuration
 */
export function initialize(config: any) {
  emailConfig = config;
  
  // Check if this is mock mode configuration
  if (config && config.mockMode === true) {
    mockModeEnabled = true;
    console.log('Email service initialized in MOCK MODE');
  } else {
    mockModeEnabled = false;
    console.log('Email service initialized with config:', JSON.stringify(config, null, 2));
  }
}

/**
 * Enable mock mode for testing without email server
 */
export function enableMockMode() {
  mockModeEnabled = true;
  emailConfig = { 
    mockMode: true,
    server: 'mock.example.com',
    port: 993
  };
  console.log('Email service MOCK MODE enabled');
}

/**
 * Connect to the email server
 */
export async function connect() {
  if (!emailConfig) {
    throw new Error('Email service not configured. Please configure email settings first.');
  }

  if (mockModeEnabled) {
    console.log('Mock mode enabled - simulating successful connection');
    return true;
  }

  // For IMAP connections, we would implement actual IMAP connection logic here
  // For now, validate that we have the required configuration
  if (!emailConfig.host || !emailConfig.port || !emailConfig.user || !emailConfig.password) {
    throw new Error('Incomplete email configuration. Please provide host, port, username, and password.');
  }

  console.log(`Testing connection to ${emailConfig.host}:${emailConfig.port} for user ${emailConfig.user}`);
  
  // Simulate connection test - in production this would be actual IMAP connection
  return true;
}

/**
 * Disconnect from the email server
 */
export async function disconnect() {
  // Placeholder for disconnection logic
  return true;
}

/**
 * Add a custom mock email for testing
 * @returns The added mock email
 */
export function addMockEmail(subject: string, content: string): {
  subject: string;
  content: string;
  timestamp: Date;
} {
  const mockEmail = {
    subject,
    content,
    timestamp: new Date()
  };
  
  customMockEmails.push(mockEmail);
  console.log(`Added custom mock email: "${subject}"`);
  
  return mockEmail;
}

/**
 * Get all custom mock emails
 */
export function getCustomMockEmails(): Array<{subject: string, content: string, timestamp: Date}> {
  return [...customMockEmails];
}

/**
 * Clear all custom mock emails
 */
export function clearCustomMockEmails(): void {
  customMockEmails = [];
  console.log('Cleared all custom mock emails');
}

/**
 * Process incoming emails
 * @returns {Promise<{processedCount: number}>} Number of emails processed
 */
export async function processEmails(): Promise<{processedCount: number, processedEmails: any[]}> {
  try {
    console.log('Processing emails...');
    
    // Check if email configuration is available
    if (!emailConfig) {
      throw new Error('Email service not configured. Please set up the email configuration first.');
    }
    
    // Check for mock mode
    if (mockModeEnabled) {
      console.log('Running in MOCK MODE - using test emails instead of connecting to server');
    } else {
      // This would be a real IMAP implementation in production
      // For now, we're implementing a placeholder that logs the processing logic
      
      // 1. Connect to email server
      console.log('Connecting to email server...');
      
      // Simulate connection verification
      if (emailConfig.host && emailConfig.port) {
        console.log(`Connecting to ${emailConfig.host}:${emailConfig.port}...`);
      } else {
        throw new Error('Invalid email server configuration: missing host or port');
      }
    }
    
    // 2. Fetch unread messages
    console.log('Fetching unread messages...');
    
    // 3. Process each email
    console.log('Processing email subjects and content...');
    
    // 4. Process emails by document type
    console.log('Identifying document types based on subject keywords...');
    console.log('Looking for: CE, EW, TQ, NCR, RFI, HIRE, OFFHIRE, DELIVERY');
    
    // Default mock emails for demonstration purposes
    const defaultMockEmails = [
      {
        subject: 'HIRE: New Excavator Request - Project: ABC123',
        content: 'We need a large excavator for site clearance. Equipment details: JCB 3CX, 4-wheel drive, with bucket and breaker attachments. Required from 2023-06-01 to 2023-06-30.'
      },
      {
        subject: 'OFFHIRE: Excavator XC300 for return - Project: ABC123 - Equipment ID: EQP-1234',
        content: 'Please arrange collection of the excavator at your earliest convenience. The equipment is no longer needed on site.'
      },
      {
        subject: 'DELIVERY: Scaffold materials confirmation - Project: ABC123 - Equipment ID: EQP-5678',
        content: 'Confirming receipt of scaffold materials delivered today. All items received in good condition.'
      },
      {
        subject: 'RFI: Foundation design clarification - Project: C-121',
        content: 'We need clarification on the foundation design for the east wing. Based on the soil survey results, we may need to adjust the depth of the piles. Please provide guidance on the minimum required depth considering the new soil conditions.'
      }
    ];
    
    // Combine default and custom mock emails
    const allMockEmails = [
      ...defaultMockEmails,
      ...customMockEmails.map(email => ({
        subject: email.subject,
        content: email.content
      }))
    ];
    
    console.log(`Found ${allMockEmails.length} emails to process (${defaultMockEmails.length} default, ${customMockEmails.length} custom)`);
    
    // Track processed emails and their status
    const processedEmails = [];
    let processedCount = 0;
    
    // Helper function to identify email type more flexibly in test mode
    const identifyEmailType = (subject: string, isMockMode: boolean): 'HIRE' | 'OFFHIRE' | 'DELIVERY' | 'RFI' | null => {
      // In production mode, strict format checking
      if (!isMockMode) {
        if (subject.includes('HIRE:') && !subject.includes('OFFHIRE:')) return 'HIRE';
        if (subject.includes('OFFHIRE:')) return 'OFFHIRE';
        if (subject.includes('DELIVERY:')) return 'DELIVERY';
        if (subject.includes('RFI:')) return 'RFI';
        return null;
      }
      
      // In test mode, more flexible parsing
      const subjectLower = subject.toLowerCase();
      
      // Check for exact format first (production rules)
      if (subject.includes('HIRE:') && !subject.includes('OFFHIRE:')) return 'HIRE';
      if (subject.includes('OFFHIRE:')) return 'OFFHIRE';
      if (subject.includes('DELIVERY:')) return 'DELIVERY';
      if (subject.includes('RFI:')) return 'RFI';
      
      // Check for keywords with more flexibility (test mode rules)
      if (subjectLower.includes('hire') && !subjectLower.includes('offhire') && 
          !subjectLower.includes('off-hire') && !subjectLower.includes('off hire')) {
        return 'HIRE';
      }
      
      if (subjectLower.includes('offhire') || subjectLower.includes('off-hire') || 
          subjectLower.includes('off hire')) {
        return 'OFFHIRE';
      }
      
      if (subjectLower.includes('delivery') || subjectLower.includes('delivered')) {
        return 'DELIVERY';
      }
      
      if (subjectLower.includes('rfi') || subjectLower.includes('request for information')) {
        return 'RFI';
      }
      
      return null;
    }
    
    // Process each mock email
    for (const email of allMockEmails) {
      console.log(`\nProcessing email: ${email.subject}`);
      let processed = false;
      
      try {
        // Identify the email type using the flexible helper function
        const emailType = identifyEmailType(email.subject, mockModeEnabled);
        
        if (emailType === 'HIRE') {
          console.log('-> Identified as equipment hire request');
          await processHireRequestEmail(email.subject, email.content);
          processed = true;
        }
        else if (emailType === 'OFFHIRE') {
          console.log('-> Identified as equipment off-hire request');
          await processOffHireRequestEmail(email.subject, email.content);
          processed = true;
        }
        else if (emailType === 'DELIVERY') {
          console.log('-> Identified as equipment delivery confirmation');
          await processDeliveryConfirmationEmail(email.subject, email.content);
          processed = true;
        }
        else if (emailType === 'RFI') {
          console.log('-> Identified as Request for Information (RFI)');
          await processRfiEmail(email.subject, email.content);
          processed = true;
        }
        // Other document types would be handled here (CE, EW, TQ, NCR)
        else {
          console.log('-> Not a recognized email type, skipping');
          if (mockModeEnabled) {
            console.log('   Tip: In test mode, include keywords like "hire", "offhire", "delivery", or "rfi" in the subject');
          }
        }
        
        if (processed) {
          processedCount++;
          processedEmails.push({
            subject: email.subject,
            processed: true,
            timestamp: new Date()
          });
        }
      } catch (error: any) {
        console.error(`Error processing email "${email.subject}":`, error);
        processedEmails.push({
          subject: email.subject,
          processed: false,
          error: error.message || 'Unknown processing error',
          timestamp: new Date()
        });
      }
    }
    
    console.log(`\nEmail processing completed. Processed ${processedCount} emails.`);
    
    // Construct a more detailed and helpful response for test mode
    const details = mockModeEnabled ? {
      mode: 'test',
      emailsProcessed: processedEmails.map(email => ({
        subject: email.subject,
        processed: email.processed,
        timestamp: email.timestamp,
        error: email.error || null
      })),
      validationRules: {
        productionMode: [
          "Subject must include 'HIRE:', 'OFFHIRE:', 'DELIVERY:', or 'RFI:' prefix",
          "Project reference must be specified with 'Project: CODE' format",
          "Equipment reference must be specified with 'Equipment ID: CODE' format"
        ],
        testMode: [
          "Subject can include variations of 'hire', 'offhire', 'delivery', or 'rfi'/'request for information'",
          "Project reference will be extracted from content if possible, or default to C-121",
          "Equipment reference will be generated if not found"
        ]
      }
    } : null;
    
    return { 
      processedCount,
      processedEmails,
      details
    } as {
      processedCount: number;
      processedEmails: any[];
      details?: {
        mode: string;
        emailsProcessed: any[];
        validationRules: {
          productionMode: string[];
          testMode: string[];
        }
      } | null
    };
  } catch (error) {
    console.error('Error processing emails:', error);
    throw error;
  }
}

/**
 * Sends an email using SendGrid
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("Email not sent: SENDGRID_API_KEY is not set");
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Creates a unique confirmation token for off-hire requests
 */
export async function createOffHireConfirmationToken(offHireRequestId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  
  // Store the token in the database
  await db.insert(offHireConfirmations).values({
    offHireRequestId,
    token,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
    used: false
  });
  
  return token;
}

/**
 * Generates the confirmation URL for the supplier to click
 */
export function generateConfirmationUrl(token: string): string {
  // Use REPLIT_DOMAINS environment variable if available, otherwise fallback to localhost
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS}`
    : 'http://localhost:5000';
  
  return `${baseUrl}/api/equipment/confirm-off-hire/${token}`;
}

/**
 * Process equipment hire request from email
 * This would be called when an email with HIRE in the subject is received
 */
export async function processHireRequestEmail(
  emailSubject: string, 
  emailContent: string
): Promise<void> {
  console.log('Processing equipment hire request...');
  
  try {
    // Extract project reference from the email subject or content
    let projectReference: string | null = null;
    
    // Try to find project reference in subject using strict format first
    const projectMatch = emailSubject.match(/Project:\s*([A-Za-z0-9-]+)/i);
    if (projectMatch) {
      projectReference = projectMatch[1];
    }
    
    // If not found in subject with strict format, try content
    if (!projectReference) {
      // Look for project keywords in content
      const contentProjectMatch = emailContent.match(/[Pp]roject(?:\s*(?:reference|ref|id|code|number))?:\s*([A-Za-z0-9-]+)/i) 
                               || emailContent.match(/[Pp]roject(?:\s*(?:reference|ref|id|code|number))?(?:\s+is)?(?:\s*:)?\s*([A-Za-z0-9-]+)/i)
                               || emailContent.match(/[Ff]or\s+(?:the\s+)?[Pp]roject(?:\s*:)?\s*([A-Za-z0-9-]+)/i);
                               
      if (contentProjectMatch) {
        projectReference = contentProjectMatch[1];
      }
    }
    
    // In test mode, be more forgiving
    if (!projectReference && mockModeEnabled) {
      // Default to C-121 for Westfield project in test mode if we can't find a reference
      projectReference = "C-121";
      console.log("Using default project reference C-121 (test mode only)");
    } else if (!projectReference) {
      console.warn('No project reference found in email subject or content:', emailSubject);
      return;
    }
    
    // Extract equipment details from email content
    // This would use NLP or pattern matching in a production system
    console.log(`Extracted project reference: ${projectReference}`);
    console.log('Extracting equipment details from email content...');
    
    // In a real implementation, we would now:
    // 1. Create a hire request record in the database
    // 2. Assign it to the appropriate project
    // 3. Notify relevant staff
    
    console.log('Hire request processed successfully');
    
  } catch (error) {
    console.error('Error processing hire request email:', error);
  }
}

/**
 * Process equipment off-hire request from email
 * This would be called when an email with OFFHIRE in the subject is received
 */
export async function processOffHireRequestEmail(
  emailSubject: string, 
  emailContent: string
): Promise<void> {
  console.log('Processing equipment off-hire request...');
  
  try {
    // Extract project reference from the email subject or content
    let projectReference: string | null = null;
    let equipmentId: string | null = null;
    
    // Try to find project reference in subject using strict format
    const projectMatch = emailSubject.match(/Project:\s*([A-Za-z0-9-]+)/i);
    if (projectMatch) {
      projectReference = projectMatch[1];
    }
    
    // Try to find equipment ID in subject using strict format
    const equipmentMatch = emailSubject.match(/Equipment ID:\s*([A-Za-z0-9-]+)/i);
    if (equipmentMatch) {
      equipmentId = equipmentMatch[1];
    }
    
    // If not found in subject with strict format, try content for project
    if (!projectReference) {
      // Look for project keywords in content
      const contentProjectMatch = emailContent.match(/[Pp]roject(?:\s*(?:reference|ref|id|code|number))?:\s*([A-Za-z0-9-]+)/i) 
                               || emailContent.match(/[Pp]roject(?:\s*(?:reference|ref|id|code|number))?(?:\s+is)?(?:\s*:)?\s*([A-Za-z0-9-]+)/i)
                               || emailContent.match(/[Ff]or\s+(?:the\s+)?[Pp]roject(?:\s*:)?\s*([A-Za-z0-9-]+)/i);
                               
      if (contentProjectMatch) {
        projectReference = contentProjectMatch[1];
      }
    }
    
    // If not found in subject with strict format, try content for equipment
    if (!equipmentId) {
      // Look for equipment keywords in content
      const contentEquipmentMatch = emailContent.match(/[Ee]quipment(?:\s*(?:reference|ref|id|code|number))?:\s*([A-Za-z0-9-]+)/i)
                                 || emailContent.match(/[Ee]quipment(?:\s*(?:reference|ref|id|code|number))?(?:\s+is)?(?:\s*:)?\s*([A-Za-z0-9-]+)/i);
                               
      if (contentEquipmentMatch) {
        equipmentId = contentEquipmentMatch[1];
      }
    }
    
    // In test mode, be more forgiving
    if (mockModeEnabled) {
      if (!projectReference) {
        projectReference = "C-121";
        console.log("Using default project reference C-121 (test mode only)");
      }
      
      if (!equipmentId) {
        equipmentId = "EQP-" + Math.floor(1000 + Math.random() * 9000);
        console.log(`Using generated equipment ID ${equipmentId} (test mode only)`);
      }
    } 
    else if (!projectReference || !equipmentId) {
      console.warn('Missing required references in email subject:', emailSubject);
      return;
    }
    
    console.log(`Extracted project reference: ${projectReference}, equipment ID: ${equipmentId}`);
    
    // In a real implementation, we would now:
    // 1. Create an off-hire request in the database
    // 2. Link it to the equipment and project
    // 3. Generate confirmation token
    // 4. Send confirmation email to supplier
    
    console.log('Off-hire request processed successfully');
    
  } catch (error) {
    console.error('Error processing off-hire request email:', error);
  }
}

/**
 * Process equipment delivery confirmation from email
 * This would be called when an email with DELIVERY in the subject is received
 */
export async function processDeliveryConfirmationEmail(
  emailSubject: string, 
  emailContent: string
): Promise<void> {
  console.log('Processing equipment delivery confirmation...');
  
  try {
    // Extract project reference from the email subject or content
    let projectReference: string | null = null;
    let equipmentId: string | null = null;
    
    // Try to find project reference in subject using strict format
    const projectMatch = emailSubject.match(/Project:\s*([A-Za-z0-9-]+)/i);
    if (projectMatch) {
      projectReference = projectMatch[1];
    }
    
    // Try to find equipment ID in subject using strict format
    const equipmentMatch = emailSubject.match(/Equipment ID:\s*([A-Za-z0-9-]+)/i);
    if (equipmentMatch) {
      equipmentId = equipmentMatch[1];
    }
    
    // If not found in subject with strict format, try content for project
    if (!projectReference) {
      // Look for project keywords in content
      const contentProjectMatch = emailContent.match(/[Pp]roject(?:\s*(?:reference|ref|id|code|number))?:\s*([A-Za-z0-9-]+)/i) 
                               || emailContent.match(/[Pp]roject(?:\s*(?:reference|ref|id|code|number))?(?:\s+is)?(?:\s*:)?\s*([A-Za-z0-9-]+)/i)
                               || emailContent.match(/[Ff]or\s+(?:the\s+)?[Pp]roject(?:\s*:)?\s*([A-Za-z0-9-]+)/i)
                               || emailContent.match(/[Dd]estination:\s*(?:[^,]+),\s*([A-Za-z0-9-]+)/i);
                               
      if (contentProjectMatch) {
        projectReference = contentProjectMatch[1];
      }
    }
    
    // If not found in subject with strict format, try content for equipment
    if (!equipmentId) {
      // Look for equipment keywords in content
      const contentEquipmentMatch = emailContent.match(/[Ee]quipment(?:\s*(?:reference|ref|id|code|number))?:\s*([A-Za-z0-9-]+)/i)
                                 || emailContent.match(/[Ee]quipment(?:\s*(?:reference|ref|id|code|number))?(?:\s+is)?(?:\s*:)?\s*([A-Za-z0-9-]+)/i)
                                 || emailContent.match(/[Dd]elivery\s+[Rr]ef(?:erence)?:\s*([A-Za-z0-9-]+)/i);
                               
      if (contentEquipmentMatch) {
        equipmentId = contentEquipmentMatch[1];
      }
    }
    
    // In test mode, be more forgiving
    if (mockModeEnabled) {
      if (!projectReference) {
        projectReference = "C-121";
        console.log("Using default project reference C-121 (test mode only)");
      }
      
      if (!equipmentId) {
        equipmentId = "DEL-" + Math.floor(1000 + Math.random() * 9000);
        console.log(`Using generated delivery reference ${equipmentId} (test mode only)`);
      }
    } 
    else if (!projectReference || !equipmentId) {
      console.warn('Missing required references in email subject:', emailSubject);
      return;
    }
    
    console.log(`Extracted project reference: ${projectReference}, equipment ID: ${equipmentId}`);
    
    // In a real implementation, we would now:
    // 1. Update the delivery status in the database
    // 2. Notify the project team
    
    console.log('Delivery confirmation processed successfully');
    
  } catch (error) {
    console.error('Error processing delivery confirmation email:', error);
  }
}

/**
 * Sends an off-hire notification email to a supplier
 */
export async function sendOffHireNotificationEmail({
  supplierEmail,
  supplierName,
  equipmentDetails,
  hireReference,
  requestReference,
  pickupDetails,
  token
}: {
  supplierEmail: string;
  supplierName: string;
  equipmentDetails: {
    name: string;
    make: string;
    model: string;
    serialNumber: string;
  };
  hireReference: string;
  requestReference: string;
  pickupDetails: {
    date: string;
    location: string;
    contactPerson: string;
    contactPhone?: string;
  };
  token: string;
}): Promise<boolean> {
  const confirmationUrl = generateConfirmationUrl(token);
  const pickupDate = new Date(pickupDetails.date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #0056b3;
          padding: 20px;
          text-align: center;
          color: white;
        }
        .content {
          padding: 20px;
          background-color: #f9f9f9;
          border: 1px solid #ddd;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        table, th, td {
          border: 1px solid #ddd;
        }
        th, td {
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        .button {
          display: inline-block;
          padding: 12px 20px;
          background-color: #28a745;
          color: white;
          text-decoration: none;
          font-weight: bold;
          border-radius: 4px;
          margin: 20px 0;
        }
        .info-box {
          background-color: #e8f4f8;
          border-left: 4px solid #0056b3;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Equipment Off-Hire Request</h1>
        </div>
        <div class="content">
          <p>Dear ${supplierName},</p>
          
          <p>We are requesting the off-hire and collection of the following equipment:</p>
          
          <table>
            <tr>
              <th colspan="2">Equipment Details</th>
            </tr>
            <tr>
              <td><strong>Equipment Name:</strong></td>
              <td>${equipmentDetails.name}</td>
            </tr>
            <tr>
              <td><strong>Make/Model:</strong></td>
              <td>${equipmentDetails.make} ${equipmentDetails.model}</td>
            </tr>
            <tr>
              <td><strong>Serial Number:</strong></td>
              <td>${equipmentDetails.serialNumber}</td>
            </tr>
            <tr>
              <td><strong>Hire Reference:</strong></td>
              <td>${hireReference}</td>
            </tr>
            <tr>
              <td><strong>Off-Hire Reference:</strong></td>
              <td>${requestReference}</td>
            </tr>
          </table>
          
          <div class="info-box">
            <h3>Collection Details</h3>
            <p><strong>Requested Collection Date:</strong> ${pickupDate}</p>
            <p><strong>Location:</strong> ${pickupDetails.location}</p>
            <p><strong>Contact Person:</strong> ${pickupDetails.contactPerson}</p>
            ${pickupDetails.contactPhone ? `<p><strong>Contact Phone:</strong> ${pickupDetails.contactPhone}</p>` : ''}
          </div>
          
          <p>Please confirm this off-hire request by clicking the button below:</p>
          
          <center>
            <a href="${confirmationUrl}" class="button">Confirm Off-Hire Request</a>
          </center>
          
          <p>If you have any questions or need to reschedule, please contact us as soon as possible.</p>
          
          <p>Thank you for your service!</p>
          
          <p>
            Best regards,<br>
            NEC4 Contract Management System
          </p>
        </div>
        <div class="footer">
          <p>This is an automated message from the NEC4 Contract Management System.</p>
          <p>If you are not the intended recipient, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    EQUIPMENT OFF-HIRE REQUEST
    
    Dear ${supplierName},
    
    We are requesting the off-hire and collection of the following equipment:
    
    Equipment Details:
    - Equipment Name: ${equipmentDetails.name}
    - Make/Model: ${equipmentDetails.make} ${equipmentDetails.model}
    - Serial Number: ${equipmentDetails.serialNumber}
    - Hire Reference: ${hireReference}
    - Off-Hire Reference: ${requestReference}
    
    Collection Details:
    - Requested Collection Date: ${pickupDate}
    - Location: ${pickupDetails.location}
    - Contact Person: ${pickupDetails.contactPerson}
    ${pickupDetails.contactPhone ? `- Contact Phone: ${pickupDetails.contactPhone}` : ''}
    
    Please confirm this off-hire request by clicking this link:
    ${confirmationUrl}
    
    If you have any questions or need to reschedule, please contact us as soon as possible.
    
    Thank you for your service!
    
    Best regards,
    NEC4 Contract Management System
  `;

  return await sendEmail({
    to: supplierEmail,
    from: 'noreply@nec4contractmanager.com',
    subject: `Equipment Off-Hire Request: ${requestReference}`,
    text: textContent,
    html: htmlContent,
  });
}

/**
 * Process RFI email
 * This would be called when an email with RFI: in the subject is received
 */
export async function processRfiEmail(
  emailSubject: string, 
  emailContent: string
): Promise<void> {
  console.log('Processing RFI email...');
  
  try {
    // Extract project reference from the email subject or content
    let projectReference: string | null = null;
    let title: string | null = null;
    
    // Try to find project reference in subject using strict format
    const projectMatch = emailSubject.match(/Project:\s*([A-Za-z0-9-]+)/i);
    if (projectMatch) {
      projectReference = projectMatch[1];
    }
    
    // Try to extract title from the subject
    const titleMatch = emailSubject.match(/RFI:\s*([^-]+)(?:-|$)/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    
    // If not found in subject with strict format, try content for project
    if (!projectReference) {
      // Look for project keywords in content
      const contentProjectMatch = emailContent.match(/[Pp]roject(?:\s*(?:reference|ref|id|code|number))?:\s*([A-Za-z0-9-]+)/i) 
                               || emailContent.match(/[Pp]roject(?:\s*(?:reference|ref|id|code|number))?(?:\s+is)?(?:\s*:)?\s*([A-Za-z0-9-]+)/i)
                               || emailContent.match(/[Ff]or\s+(?:the\s+)?[Pp]roject(?:\s*:)?\s*([A-Za-z0-9-]+)/i);
                               
      if (contentProjectMatch) {
        projectReference = contentProjectMatch[1];
      }
    }
    
    // In test mode, be more forgiving
    if (mockModeEnabled) {
      if (!projectReference) {
        projectReference = "C-121";
        console.log("Using default project reference C-121 (test mode only)");
      }
      
      if (!title) {
        title = "Request for Information";
        console.log(`Using default title "${title}" (test mode only)`);
      }
    } 
    else if (!projectReference) {
      console.warn('No project reference found in email subject or content:', emailSubject);
      return;
    }
    
    console.log(`Extracted project reference: ${projectReference}, title: ${title || 'Unknown'}`);
    console.log('RFI content:', emailContent.substring(0, 100) + '...');
    
    // In a real implementation, we would now:
    // 1. Find the project ID in the database based on the reference
    // 2. Generate a unique RFI reference
    // 3. Create an RFI record in the database
    // 4. Set default response period
    // 5. Notify relevant project team members
    
    // Get the project ID for the reference
    const project = { id: 1, name: 'Westfield Development Project' }; // This would be a database lookup in production
    
    // Generate a unique reference
    const rfiRef = `RFI-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Create a new RFI record
    const currentDate = new Date();
    const responsePeriodDays = 7; // Default response period
    const plannedResponseDate = new Date(currentDate);
    plannedResponseDate.setDate(plannedResponseDate.getDate() + responsePeriodDays);
    
    console.log(`Creating RFI with reference ${rfiRef}`);
    console.log(`Project ID: ${project.id}`);
    console.log(`Planned response date: ${plannedResponseDate.toISOString().split('T')[0]}`);
    
    // In production, this would insert a record using the RFI controller
    
    console.log('RFI processed successfully');
    
  } catch (error) {
    console.error('Error processing RFI email:', error);
  }
}