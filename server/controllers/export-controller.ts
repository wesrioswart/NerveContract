import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// Simplest possible export function that creates a file temporarily and sends it
export async function exportProcurementReport(req: Request, res: Response) {
  try {
    const { format } = req.body;
    
    // Create a temporary directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'tmp', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    if (format === 'pdf') {
      // For PDF, we'll create a small file and send it directly
      const { default: PDFDocument } = await import('pdfkit');
      const filename = 'procurement_report.pdf';
      const filepath = path.join(exportDir, filename);
      
      // Create a writable stream
      const writeStream = fs.createWriteStream(filepath);
      
      // Create a PDF document
      const doc = new PDFDocument();
      doc.pipe(writeStream);
      
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
      
      // Finalize the PDF
      doc.end();
      
      // Wait for the file to be fully written
      await new Promise<void>((resolve) => {
        writeStream.on('finish', resolve);
      });
      
      // Now send the file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Stream the file to the response
      fs.createReadStream(filepath).pipe(res);
      
      // Clean up the file after sending (optional - can be done with a timeout)
      setTimeout(() => {
        try {
          fs.unlinkSync(filepath);
        } catch (err) {
          console.error('Error removing temporary file:', err);
        }
      }, 5000);
      
    } else if (format === 'csv') {
      // For CSV, we can just send the content directly
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="procurement_report.csv"');
      
      const csvData = 'Project,Value\nProject 1,£12000\nProject 2,£18000\nProject 3,£15000';
      res.send(csvData);
      
    } else {
      res.status(400).json({ error: "Invalid format. Use 'pdf' or 'csv'." });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
}