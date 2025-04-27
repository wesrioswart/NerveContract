import { Request, Response } from 'express';
import { db } from '../db';
import { rfis, rfiComments, rfiAttachments, users, projects, projectPeriods } from '@shared/schema';
import { eq, and, asc } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

// Function to generate RFI overview PDF for clients
export const generateRfiPdf = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId || isNaN(parseInt(projectId))) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    // Get project details
    const [project] = await db.select().from(projects).where(eq(projects.id, parseInt(projectId)));
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    // Get RFIs for the project
    const projectRfis = await db
      .select({
        rfi: rfis,
        createdByUser: {
          fullName: users.fullName,
        },
        period: {
          name: projectPeriods.name,
        },
      })
      .from(rfis)
      .leftJoin(users, eq(rfis.createdBy, users.id))
      .leftJoin(projectPeriods, eq(rfis.periodId, projectPeriods.id))
      .where(eq(rfis.projectId, parseInt(projectId)))
      .orderBy(asc(rfis.reference));
    
    // Calculate metrics
    const total = projectRfis.length;
    const responded = projectRfis.filter(r => r.rfi.status === 'responded' || r.rfi.status === 'closed').length;
    const pending = projectRfis.filter(r => r.rfi.status === 'open' || r.rfi.status === 'in-progress').length;
    const totalWithDates = projectRfis.filter(r => r.rfi.createdAt && r.rfi.responseDate).length;
    
    // Calculate average response time (days)
    let totalDays = 0;
    projectRfis.forEach(r => {
      const created = r.rfi.createdAt ? new Date(r.rfi.createdAt) : null;
      const responded = r.rfi.responseDate ? new Date(r.rfi.responseDate) : null;
      if (created && responded) {
        const diffTime = responded.getTime() - created.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
      }
    });
    const avgResponseDays = totalWithDates > 0 ? (totalDays / totalWithDates).toFixed(1) : 'N/A';
    
    // Create a new PDF document
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      size: 'A4'
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=RFI-Overview-${project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Add the title
    doc.fontSize(24).font('Helvetica-Bold').text('RFI Management Overview', {
      align: 'center'
    });
    
    doc.moveDown();
    doc.fontSize(16).font('Helvetica-Bold').text(`Project: ${project.name}`, {
      align: 'center'
    });
    
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Generated on: ${format(new Date(), 'dd MMM yyyy')}`, {
      align: 'center'
    });
    
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown();
    
    // Overview Metrics
    doc.fontSize(16).font('Helvetica-Bold').text('RFI Summary', { align: 'left' });
    doc.moveDown();
    
    doc.fontSize(12).font('Helvetica').text(`Total RFIs: ${total}`, { align: 'left' });
    doc.fontSize(12).font('Helvetica').text(`Responded/Closed: ${responded}`, { align: 'left' });
    doc.fontSize(12).font('Helvetica').text(`Pending/In Progress: ${pending}`, { align: 'left' });
    doc.fontSize(12).font('Helvetica').text(`Average Response Time: ${avgResponseDays} days`, { align: 'left' });
    
    doc.moveDown(2);
    
    // RFI List
    doc.fontSize(16).font('Helvetica-Bold').text('RFI List', { align: 'left' });
    doc.moveDown();
    
    // Table headers
    const tableTop = doc.y;
    const tableHeaders = ['Reference', 'Title', 'Status', 'Created', 'Responded', 'Period'];
    const columnWidths = [80, 160, 70, 70, 70, 70];
    let tableY = tableTop + 20;
    
    // Draw table headers
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(tableHeaders[0], 50, tableTop, { width: columnWidths[0], align: 'left' });
    doc.text(tableHeaders[1], 50 + columnWidths[0], tableTop, { width: columnWidths[1], align: 'left' });
    doc.text(tableHeaders[2], 50 + columnWidths[0] + columnWidths[1], tableTop, { width: columnWidths[2], align: 'left' });
    doc.text(tableHeaders[3], 50 + columnWidths[0] + columnWidths[1] + columnWidths[2], tableTop, { width: columnWidths[3], align: 'left' });
    doc.text(tableHeaders[4], 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], tableTop, { width: columnWidths[4], align: 'left' });
    doc.text(tableHeaders[5], 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4], tableTop, { width: columnWidths[5], align: 'left' });
    
    // Draw a line under headers
    doc.moveTo(50, tableTop + 15).lineTo(doc.page.width - 50, tableTop + 15).stroke();
    
    // Draw table rows
    doc.fontSize(9).font('Helvetica');
    for (const item of projectRfis) {
      const r = item.rfi;
      
      // Check if we need a new page
      if (tableY > doc.page.height - 100) {
        doc.addPage();
        tableY = 50;
        // Add headers to new page
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(tableHeaders[0], 50, tableY - 20, { width: columnWidths[0], align: 'left' });
        doc.text(tableHeaders[1], 50 + columnWidths[0], tableY - 20, { width: columnWidths[1], align: 'left' });
        doc.text(tableHeaders[2], 50 + columnWidths[0] + columnWidths[1], tableY - 20, { width: columnWidths[2], align: 'left' });
        doc.text(tableHeaders[3], 50 + columnWidths[0] + columnWidths[1] + columnWidths[2], tableY - 20, { width: columnWidths[3], align: 'left' });
        doc.text(tableHeaders[4], 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], tableY - 20, { width: columnWidths[4], align: 'left' });
        doc.text(tableHeaders[5], 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4], tableY - 20, { width: columnWidths[5], align: 'left' });
        
        // Draw a line under headers
        doc.moveTo(50, tableY - 5).lineTo(doc.page.width - 50, tableY - 5).stroke();
        doc.fontSize(9).font('Helvetica');
      }
      
      // Format dates
      const createdDate = r.createdAt ? format(new Date(r.createdAt), 'dd/MM/yyyy') : 'N/A';
      const respondedDate = r.responseDate ? format(new Date(r.responseDate), 'dd/MM/yyyy') : 'N/A';
      
      // Format status with first letter capitalized
      const status = r.status.charAt(0).toUpperCase() + r.status.slice(1);
      
      // Draw the row
      doc.text(r.reference, 50, tableY, { width: columnWidths[0], align: 'left' });
      doc.text(r.title, 50 + columnWidths[0], tableY, { width: columnWidths[1], align: 'left' });
      doc.text(status, 50 + columnWidths[0] + columnWidths[1], tableY, { width: columnWidths[2], align: 'left' });
      doc.text(createdDate, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2], tableY, { width: columnWidths[3], align: 'left' });
      doc.text(respondedDate, 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], tableY, { width: columnWidths[4], align: 'left' });
      doc.text(item.period?.name || 'N/A', 50 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4], tableY, { width: columnWidths[5], align: 'left' });
      
      // Move to next row
      tableY += 20;
    }
    
    // Footer
    doc.fontSize(10).font('Helvetica').text(
      `© ${new Date().getFullYear()} NEC4 Contract Management Platform`,
      {
        align: 'center',
        bottom: 30,
        width: doc.page.width - 100
      }
    );
    
    // Finalize the PDF and end the stream
    doc.end();
    
  } catch (error) {
    console.error('Error generating RFI PDF:', error);
    return res.status(500).json({ message: 'Error generating RFI PDF' });
  }
};

// Function to get HTML preview for RFIs
export const getRfiHtmlPreview = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId || isNaN(parseInt(projectId))) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    // Get project details
    const [project] = await db.select().from(projects).where(eq(projects.id, parseInt(projectId)));
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    // Get RFIs for the project
    const projectRfis = await db
      .select({
        rfi: rfis,
        createdByUser: {
          fullName: users.fullName,
        },
        period: {
          name: projectPeriods.name,
        },
      })
      .from(rfis)
      .leftJoin(users, eq(rfis.createdBy, users.id))
      .leftJoin(projectPeriods, eq(rfis.periodId, projectPeriods.id))
      .where(eq(rfis.projectId, parseInt(projectId)))
      .orderBy(asc(rfis.reference));
    
    // Calculate metrics
    const total = projectRfis.length;
    const responded = projectRfis.filter(r => r.rfi.status === 'responded' || r.rfi.status === 'closed').length;
    const pending = projectRfis.filter(r => r.rfi.status === 'open' || r.rfi.status === 'in-progress').length;
    const totalWithDates = projectRfis.filter(r => r.rfi.createdAt && r.rfi.responseDate).length;
    
    // Calculate average response time (days)
    let totalDays = 0;
    projectRfis.forEach(r => {
      const created = r.rfi.createdAt ? new Date(r.rfi.createdAt) : null;
      const responded = r.rfi.responseDate ? new Date(r.rfi.responseDate) : null;
      if (created && responded) {
        const diffTime = responded.getTime() - created.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
      }
    });
    const avgResponseDays = totalWithDates > 0 ? (totalDays / totalWithDates).toFixed(1) : 'N/A';
    
    // Prepare data for HTML template - Converting format to match our EJS template
    const rfisFormatted = projectRfis.map(item => ({
      ...item.rfi,
      createdAt: item.rfi.createdAt,
      plannedResponseDate: item.rfi.plannedResponseDate,
      responseDate: item.rfi.responseDate,
      closedDate: item.rfi.closedDate,
      gpsMacsCode: item.rfi.gpsMacsCode || null,
      ceStatus: item.rfi.ceStatus || 'Not a CE'
    }));

    // Calculate numbers for metrics
    const open = rfisFormatted.filter(r => r.status === 'Open').length;
    const overdue = rfisFormatted.filter(r => 
      r.status === 'Open' && new Date(r.plannedResponseDate) < new Date()
    ).length;
    const ceRelated = rfisFormatted.filter(r => 
      r.ceStatus && r.ceStatus !== 'Not a CE'
    ).length;

    const data = {
      project,
      rfis: rfisFormatted,
      metrics: {
        total,
        open,
        responded,
        overdue,
        ceRelated
      }
    };

    // Send the HTML template with RFI data
    res.render('rfi-preview', data);
    
  } catch (error) {
    console.error('Error generating RFI HTML preview:', error);
    return res.status(500).json({ message: 'Error generating RFI HTML preview' });
  }
};