import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

function generatePDF() {
  try {
    // Create a document
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      size: 'A4'
    });

    // Pipe the PDF to a file
    doc.pipe(fs.createWriteStream('NEC4-Platform-Overview.pdf'));

    // Add the title
    doc.fontSize(24).font('Helvetica-Bold').text('AI-Powered NEC4 Contract Management Platform', {
      align: 'center'
    });

    doc.moveDown();
    doc.fontSize(14).font('Helvetica').text('Streamlining construction project management with intelligent contract handling, smart notifications, and comprehensive documentation', {
      align: 'center'
    });

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown();

    // Introduction
    doc.fontSize(12).font('Helvetica').text(
      'This document provides an overview of our advanced AI-powered Contract Management Platform specifically designed for NEC4 contracts in construction and project management. The platform integrates cutting-edge artificial intelligence to simplify complex contract processes, provide actionable insights, and ensure compliance.',
      { align: 'left' }
    );

    doc.moveDown(2);
    
    // Platform Highlights
    doc.fontSize(18).font('Helvetica-Bold').text('Platform Highlights', { align: 'left' });
    doc.moveDown();

    const highlights = [
      'AI-Powered Contract Intelligence with direct NEC4 references',
      'Comprehensive Document Management with intelligent categorization',
      'Real-Time Analytics Dashboard for project status and risk factors',
      'Integrated RFI Management with performance tracking',
      'Compensation Event workflow with financial impact analysis',
      'Early Warning notification system with risk mitigation'
    ];

    highlights.forEach(highlight => {
      doc.fontSize(12).font('Helvetica').text(`• ${highlight}`, { align: 'left' });
      doc.moveDown(0.5);
    });

    doc.moveDown();

    // Enhanced RFI Management System
    doc.fontSize(18).font('Helvetica-Bold').text('Enhanced RFI Management System', { align: 'left' });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica').text(
      'Our Request for Information (RFI) management module has been significantly enhanced to streamline communication, track requests, and ensure timely responses. The system now includes:',
      { align: 'left' }
    );

    doc.moveDown();

    const rfiFeatures = [
      'Intuitive Kanban Interface - View RFIs by status (Open, In Progress, Responded, Closed)',
      'Contractual Reply Period Tracking - Calculate and display response periods automatically',
      'GPS MACS Code Integration - Associate RFIs with proper project accounting codes',
      'Comprehensive RFI Details - View all information and history in one place',
      'Performance Metrics - Color-coded indicators for on-time vs. late responses',
      'Compensation Event Integration - Link RFIs to related compensation events',
      'Email Integration - Automatic processing with intelligent classification'
    ];

    rfiFeatures.forEach(feature => {
      doc.fontSize(12).font('Helvetica').text(`✓ ${feature}`, { align: 'left' });
      doc.moveDown(0.5);
    });

    // Add a new page
    doc.addPage();

    // RFI Performance
    doc.fontSize(18).font('Helvetica-Bold').text('RFI Performance Dashboard', { align: 'left' });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica').text(
      'The RFI Management system includes a comprehensive dashboard that provides at-a-glance metrics for project performance, including total RFIs, on-time response rates, average response times, and connections to compensation events.',
      { align: 'left' }
    );

    doc.moveDown(2);

    // Additional Modules
    doc.fontSize(18).font('Helvetica-Bold').text('Additional Platform Modules', { align: 'left' });
    doc.moveDown();

    // Project Dashboard
    doc.fontSize(14).font('Helvetica-Bold').text('Project Dashboard', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(
      'The comprehensive project dashboard provides an overview of all project activities, including project milestone tracking, risk indicators, financial performance metrics, and team activity tracking.',
      { align: 'left' }
    );
    doc.moveDown();

    // Contract Management
    doc.fontSize(14).font('Helvetica-Bold').text('Contract Management', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(
      'Specialized tools for NEC4 contract management including compensation event tracking, early warning notification system, non-conformance report management, and technical query handling.',
      { align: 'left' }
    );
    doc.moveDown();

    // Programme Management
    doc.fontSize(14).font('Helvetica-Bold').text('Programme Management', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(
      'Comprehensive programme management features including MS Project and Primavera P6 integration, NEC4 clause compliance analysis, programme comparison tools, and critical path analysis.',
      { align: 'left' }
    );
    doc.moveDown();

    // AI Assistant
    doc.fontSize(14).font('Helvetica-Bold').text('AI Assistant', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(
      'Our AI Assistant helps with contract interpretation with specific NEC4 clause references, draft response generation for RFIs, programme analysis, and Z-clause impact assessment.',
      { align: 'left' }
    );
    doc.moveDown(2);

    // Business Benefits
    doc.fontSize(18).font('Helvetica-Bold').text('Business Benefits', { align: 'left' });
    doc.moveDown();

    const benefits = [
      'Time Savings - Reduce administrative overhead by up to 40% through automated workflows',
      'Risk Reduction - Minimize contract risks with proactive notifications and compliance checks',
      'Financial Control - Improve outcomes with better tracking of compensation events and payments',
      'Compliance Assurance - Ensure adherence to NEC4 contract requirements automatically'
    ];

    benefits.forEach(benefit => {
      doc.fontSize(12).font('Helvetica').text(`• ${benefit}`, { align: 'left' });
      doc.moveDown(0.5);
    });

    doc.moveDown(2);

    // Implementation
    doc.fontSize(14).font('Helvetica-Bold').text('Implementation and Support', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(
      'Our platform can be deployed quickly, typically within 2-4 weeks. We provide comprehensive onboarding, training, and ongoing support to ensure successful adoption across your organization. The system can be accessed via web browsers and mobile devices, requiring no special hardware.',
      { align: 'left' }
    );

    // Footer
    doc.fontSize(10).font('Helvetica').text(
      '© 2025 AI-Powered NEC4 Contract Management Platform. For more information, please contact your account representative.',
      {
        align: 'center',
        width: doc.page.width - 100
      }
    );

    // Finalize the PDF and end the stream
    doc.end();
    console.log('PDF generated successfully!');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

generatePDF();