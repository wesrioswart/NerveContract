import puppeteer from 'puppeteer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

async function generateUiDocumentationPdf() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Base URL for the application
  const baseUrl = 'http://localhost:5000';

  // Pages to capture
  const pages = [
    {
      url: `${baseUrl}/`,
      title: 'Login Page',
      description: 'User authentication interface for secure access to the contract management platform'
    },
    {
      url: `${baseUrl}/projects/1`,
      title: 'Project Dashboard',
      description: 'Main project overview with real-time analytics, compensation events, and early warnings'
    },
    {
      url: `${baseUrl}/projects/1/compensation-events`,
      title: 'Compensation Events',
      description: 'NEC4 compensation event management with automated tracking and compliance monitoring'
    },
    {
      url: `${baseUrl}/projects/1/early-warnings`,
      title: 'Early Warnings',
      description: 'Risk identification and early warning system for proactive project management'
    },
    {
      url: `${baseUrl}/projects/1/programme`,
      title: 'Programme Management',
      description: 'MS Project integration with critical path analysis and milestone tracking'
    },
    {
      url: `${baseUrl}/projects/1/equipment-hire`,
      title: 'Equipment Hire Management',
      description: 'Equipment tracking, hire/off-hire workflow, and supplier performance monitoring'
    },
    {
      url: `${baseUrl}/projects/1/procurement`,
      title: 'Procurement Dashboard',
      description: 'Purchase order management with GPSMACS coding and supplier relationship tracking'
    },
    {
      url: `${baseUrl}/projects/1/rfis`,
      title: 'RFI Management',
      description: 'Request for Information lifecycle management with PDF generation capabilities'
    },
    {
      url: `${baseUrl}/projects/1/documents`,
      title: 'Document Management',
      description: 'AI-powered document analysis and NEC4 compliance checking system'
    },
    {
      url: `${baseUrl}/projects/1/email`,
      title: 'Email Processing',
      description: 'Intelligent email classification and automated workflow integration'
    }
  ];

  // Create PDF document
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    info: {
      Title: 'NEC4 Contract Management Platform - UI Documentation',
      Author: 'AI-Powered Contract Management System',
      Subject: 'User Interface Screenshots and Feature Overview',
      Keywords: 'NEC4, Contract Management, UI, Documentation, Screenshots'
    }
  });

  const outputPath = path.join(process.cwd(), 'nec4-platform-ui-documentation.pdf');
  doc.pipe(fs.createWriteStream(outputPath));

  // Add title page
  doc.fontSize(24).font('Helvetica-Bold').text('NEC4 Contract Management Platform', 50, 100, { align: 'center' });
  doc.fontSize(18).font('Helvetica').text('User Interface Documentation', 50, 150, { align: 'center' });
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, 50, 200, { align: 'center' });
  
  // Add overview
  doc.fontSize(14).font('Helvetica-Bold').text('Platform Overview', 50, 250);
  doc.fontSize(11).font('Helvetica').text(
    'This comprehensive AI-powered contract management platform integrates specialist AI agents to streamline ' +
    'complex procurement processes with enhanced security and intelligent document management. The platform ' +
    'features enterprise-grade API security, modular AI agent architecture, React/TypeScript frontend, ' +
    'Node.js/PostgreSQL backend, and advanced programme management capabilities.',
    50, 270, { width: 500, align: 'justify' }
  );

  // Add feature highlights
  doc.fontSize(14).font('Helvetica-Bold').text('Key Features', 50, 350);
  const features = [
    '• AI-driven contract interpretation and NEC4 compliance checking',
    '• Intelligent email intake and classification system',
    '• Real-time programme management with MS Project integration',
    '• Comprehensive equipment hire and procurement management',
    '• Advanced performance monitoring and compression optimization',
    '• Secure API architecture with rate limiting and input validation'
  ];
  
  let yPosition = 370;
  features.forEach(feature => {
    doc.fontSize(11).font('Helvetica').text(feature, 50, yPosition);
    yPosition += 20;
  });

  doc.addPage();

  // Capture screenshots for each page
  for (const pageInfo of pages) {
    try {
      console.log(`Capturing screenshot for: ${pageInfo.title}`);
      
      // Navigate to page
      await page.goto(pageInfo.url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for content to load
      await page.waitForTimeout(3000);

      // Take screenshot
      const screenshot = await page.screenshot({ 
        fullPage: true,
        type: 'png'
      });

      // Add page to PDF
      doc.fontSize(16).font('Helvetica-Bold').text(pageInfo.title, 50, 50);
      doc.fontSize(10).font('Helvetica').text(pageInfo.description, 50, 75, { width: 500 });

      // Calculate image dimensions to fit on page
      const maxWidth = 500;
      const maxHeight = 650;
      
      // Add screenshot to PDF
      try {
        doc.image(screenshot, 50, 100, { 
          fit: [maxWidth, maxHeight],
          align: 'center'
        });
      } catch (imageError) {
        console.log(`Could not add image for ${pageInfo.title}, adding placeholder`);
        doc.fontSize(12).text(`Screenshot capture in progress for ${pageInfo.title}`, 50, 300);
      }

      // Add new page for next screenshot (except for the last one)
      if (pageInfo !== pages[pages.length - 1]) {
        doc.addPage();
      }

    } catch (error) {
      console.log(`Error capturing ${pageInfo.title}:`, error.message);
      
      // Add error page
      doc.fontSize(16).font('Helvetica-Bold').text(pageInfo.title, 50, 50);
      doc.fontSize(10).font('Helvetica').text(pageInfo.description, 50, 75, { width: 500 });
      doc.fontSize(12).text(`Page loading in progress: ${pageInfo.url}`, 50, 300);
      
      if (pageInfo !== pages[pages.length - 1]) {
        doc.addPage();
      }
    }
  }

  // Add footer page with technical details
  doc.addPage();
  doc.fontSize(16).font('Helvetica-Bold').text('Technical Architecture', 50, 50);
  
  const techDetails = [
    'Frontend: React with TypeScript, shadcn/ui components, Tailwind CSS',
    'Backend: Express.js with TypeScript, Passport.js authentication',
    'Database: Neon PostgreSQL with Drizzle ORM',
    'AI Integration: OpenAI GPT-4o and Anthropic Claude',
    'Performance: Compression middleware, request analytics, memory optimization',
    'Security: Rate limiting, input validation, API key protection',
    'File Processing: MSP XML parsing, PDF generation, multi-format support',
    'Real-time Features: WebSocket connections, event-driven architecture'
  ];

  let techYPosition = 80;
  techDetails.forEach(detail => {
    doc.fontSize(11).font('Helvetica').text(`• ${detail}`, 50, techYPosition, { width: 500 });
    techYPosition += 25;
  });

  // Finalize PDF
  doc.end();

  await browser.close();

  console.log(`UI documentation PDF generated: ${outputPath}`);
  return outputPath;
}

// Run the function
generateUiDocumentationPdf()
  .then(outputPath => {
    console.log('✅ PDF generation completed successfully');
    console.log(`📄 File saved: ${outputPath}`);
  })
  .catch(error => {
    console.error('❌ Error generating PDF:', error);
  });