import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// Improved export function to prevent virus detection issues
export async function exportProcurementReport(req: Request, res: Response) {
  try {
    const { format } = req.body;
    
    // Instead of sending the file directly, return a JSON response with success info
    // This is what the frontend expects
    if (format === 'pdf' || format === 'csv') {
      // Return success with a dummy download URL
      // The actual download will happen in a separate request
      const timestamp = Date.now();
      const downloadUrl = `/api/download/${format}/procurement_report_${timestamp}.${format}`;
      
      return res.status(200).json({
        success: true,
        downloadUrl,
        format,
        message: 'Report generated successfully'
      });
    } else {
      res.status(400).json({ error: "Invalid format. Use 'pdf' or 'csv'.", success: false });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      error: 'Failed to generate report', 
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Separate download endpoint for PDF and CSV files
export async function downloadReport(req: Request, res: Response) {
  try {
    const { format } = req.params;
    
    if (format === 'pdf') {
      // For PDF, generate it on the fly
      const { default: PDFDocument } = await import('pdfkit');
      
      // Set appropriate headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="procurement_report.pdf"');
      
      // Create a PDF document piped directly to the response
      const doc = new PDFDocument();
      doc.pipe(res);
      
      // Add content to PDF
      doc.fontSize(25).text('Procurement Report', 100, 80);
      doc.fontSize(15).text('Sample data for testing purposes only', 100, 120);
      
      // Add some table data
      doc.fontSize(12);
      doc.text('Project', 100, 180);
      doc.text('Value', 300, 180);
      
      doc.text('Project 1', 100, 200);
      doc.text('£12,000', 300, 200);
      
      doc.text('Project 2', 100, 220);
      doc.text('£18,000', 300, 220);
      
      doc.text('Project 3', 100, 240);
      doc.text('£15,000', 300, 240);
      
      // Finalize the PDF and end the response
      doc.end();
      
    } else if (format === 'csv') {
      // For CSV, send the content directly
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="procurement_report.csv"');
      
      const csvData = 'Project,Value\nProject 1,£12000\nProject 2,£18000\nProject 3,£15000';
      res.send(csvData);
      
    } else {
      res.status(400).json({ error: "Invalid format. Use 'pdf' or 'csv'." });
    }
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).send('Failed to download report. Please try again.');
  }
}