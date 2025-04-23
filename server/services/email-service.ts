import { MailService } from '@sendgrid/mail';
import crypto from 'crypto';
import { db } from '../db';
import { offHireConfirmations } from '@shared/schema';

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
  console.log('Email service initialized with config:', JSON.stringify(config, null, 2));
}

/**
 * Connect to the email server
 */
export async function connect() {
  // This is a placeholder - for SendGrid we don't need to actively connect
  // If we were using IMAP or another protocol that needs connection, we would do it here
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured');
  }
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
 * Process incoming emails
 */
export async function processEmails() {
  // Placeholder for email processing logic
  // For a real implementation, this would fetch emails and process them
  console.log('Processing emails...');
  return true;
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