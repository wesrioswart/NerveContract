import { Request, Response } from "express";
import { db } from "../db.js";
import { rfis, projects, users, projectPeriods } from "../../shared/schema.js";
import { eq, asc } from "drizzle-orm";
import PDFDocument from "pdfkit";

export const generateRfiPdf = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    // Get project information
    const [project] = await db.select().from(projects).where(eq(projects.id, parseInt(projectId)));
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get RFIs for the project with proper field selection
    const projectRfis = await db
      .select({
        id: rfis.id,
        projectId: rfis.projectId,
        reference: rfis.reference,
        title: rfis.title,
        description: rfis.description,
        transmittalMethod: rfis.transmittalMethod,
        submissionDate: rfis.submissionDate,
        contractualReplyPeriod: rfis.contractualReplyPeriod,
        plannedResponseDate: rfis.plannedResponseDate,
        responseDate: rfis.responseDate,
        status: rfis.status,
        ceStatus: rfis.ceStatus,
        createdAt: rfis.createdAt,
        createdBy: rfis.createdBy,
        periodId: rfis.periodId,
        createdByName: users.fullName,
        periodName: projectPeriods.name,
      })
      .from(rfis)
      .leftJoin(users, eq(rfis.createdBy, users.id))
      .leftJoin(projectPeriods, eq(rfis.periodId, projectPeriods.id))
      .where(eq(rfis.projectId, parseInt(projectId)))
      .orderBy(asc(rfis.reference));
    
    // Calculate metrics
    const total = projectRfis.length;
    const responded = projectRfis.filter(r => r.status === 'Responded' || r.status === 'Closed').length;
    const open = projectRfis.filter(r => r.status === 'Open').length;
    const overdue = projectRfis.filter(r => 
      r.status === 'Open' && r.plannedResponseDate && new Date(r.plannedResponseDate) < new Date()
    ).length;
    const ceRelated = projectRfis.filter(r => r.ceStatus && r.ceStatus !== 'Not a CE').length;
    
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
    
    // Project Information
    doc.fontSize(14).font('Helvetica-Bold').text(`Project: ${project.name}`, { align: 'left' });
    doc.fontSize(12).font('Helvetica').text(`Contract: ${project.contractReference || 'N/A'}`, { align: 'left' });
    doc.fontSize(12).font('Helvetica').text(`Client: ${project.clientName || 'N/A'}`, { align: 'left' });
    doc.fontSize(12).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'left' });
    
    doc.moveDown(2);
    
    // RFI Summary
    doc.fontSize(16).font('Helvetica-Bold').text('RFI Summary', { align: 'left' });
    doc.moveDown();
    
    doc.fontSize(12).font('Helvetica').text(`Total RFIs: ${total}`, { align: 'left' });
    doc.fontSize(12).font('Helvetica').text(`Open: ${open}`, { align: 'left' });
    doc.fontSize(12).font('Helvetica').text(`Responded: ${responded}`, { align: 'left' });
    doc.fontSize(12).font('Helvetica').text(`Overdue: ${overdue}`, { align: 'left' });
    doc.fontSize(12).font('Helvetica').text(`CE Related: ${ceRelated}`, { align: 'left' });
    
    doc.moveDown(2);
    
    // RFI List
    doc.fontSize(16).font('Helvetica-Bold').text('RFI List', { align: 'left' });
    doc.moveDown();
    
    // Table headers
    const tableTop = doc.y;
    const tableHeaders = ['Reference', 'Title', 'Status', 'Created', 'Response Due', 'CE Status'];
    const columnWidths = [80, 140, 60, 70, 80, 70];
    let currentY = tableTop + 20;
    
    // Draw table headers
    doc.fontSize(10).font('Helvetica-Bold');
    let currentX = 50;
    tableHeaders.forEach((header, index) => {
      doc.text(header, currentX, tableTop, { width: columnWidths[index], align: 'left' });
      currentX += columnWidths[index];
    });
    
    // Draw a line under headers
    doc.moveTo(50, tableTop + 15).lineTo(doc.page.width - 50, tableTop + 15).stroke();
    
    // Draw RFI data
    doc.fontSize(9).font('Helvetica');
    projectRfis.forEach((rfi, index) => {
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }
      
      currentX = 50;
      const rowData = [
        rfi.reference || 'N/A',
        rfi.title ? (rfi.title.length > 25 ? rfi.title.substring(0, 25) + '...' : rfi.title) : 'N/A',
        rfi.status || 'N/A',
        rfi.createdAt ? new Date(rfi.createdAt).toLocaleDateString() : 'N/A',
        rfi.plannedResponseDate ? new Date(rfi.plannedResponseDate).toLocaleDateString() : 'N/A',
        rfi.ceStatus || 'Not a CE'
      ];
      
      rowData.forEach((data, colIndex) => {
        doc.text(data, currentX, currentY, { width: columnWidths[colIndex], align: 'left' });
        currentX += columnWidths[colIndex];
      });
      
      currentY += 20;
      
      // Draw alternating row backgrounds (commented out for now)
      // if (index % 2 === 0) {
      //   doc.rect(50, currentY - 20, doc.page.width - 100, 20).fillAndStroke('#f8f9fa', '#e9ecef');
      // }
    });
    
    // Footer
    doc.fontSize(10).font('Helvetica');
    doc.text('Generated by NEC4 Contract Management Platform', 50, doc.page.height - 50, { align: 'center' });
    
    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating RFI PDF:', error);
    res.status(500).json({ message: "Error generating PDF", error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getRfiHtmlPreview = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    // Get project information
    const [project] = await db.select().from(projects).where(eq(projects.id, parseInt(projectId)));
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get RFIs for the project with proper field selection
    const projectRfis = await db
      .select({
        id: rfis.id,
        projectId: rfis.projectId,
        reference: rfis.reference,
        title: rfis.title,
        description: rfis.description,
        transmittalMethod: rfis.transmittalMethod,
        submissionDate: rfis.submissionDate,
        contractualReplyPeriod: rfis.contractualReplyPeriod,
        plannedResponseDate: rfis.plannedResponseDate,
        responseDate: rfis.responseDate,
        status: rfis.status,
        ceStatus: rfis.ceStatus,
        createdAt: rfis.createdAt,
        createdBy: rfis.createdBy,
        periodId: rfis.periodId,
        createdByName: users.fullName,
        periodName: projectPeriods.name,
      })
      .from(rfis)
      .leftJoin(users, eq(rfis.createdBy, users.id))
      .leftJoin(projectPeriods, eq(rfis.periodId, projectPeriods.id))
      .where(eq(rfis.projectId, parseInt(projectId)))
      .orderBy(asc(rfis.reference));

    // Calculate metrics
    const total = projectRfis.length;
    const open = projectRfis.filter(r => r.status === 'Open').length;
    const responded = projectRfis.filter(r => r.status === 'Responded').length;
    const overdue = projectRfis.filter(r => 
      r.status === 'Open' && r.plannedResponseDate && new Date(r.plannedResponseDate) < new Date()
    ).length;
    const ceRelated = projectRfis.filter(r => r.ceStatus && r.ceStatus !== 'Not a CE').length;

    const metrics = {
      total,
      open,
      responded,
      overdue,
      ceRelated
    };

    // Format RFIs for template
    const rfisFormatted = projectRfis.map(rfi => ({
      ...rfi,
      createdByName: rfi.createdByName || 'Unknown',
      periodName: rfi.periodName || 'N/A'
    }));

    // Render the EJS template
    res.render('rfi-preview', {
      project,
      rfis: rfisFormatted,
      metrics
    });

  } catch (error) {
    console.error('Error generating RFI HTML preview:', error);
    res.status(500).json({ message: "Error generating preview", error: error instanceof Error ? error.message : 'Unknown error' });
  }
};