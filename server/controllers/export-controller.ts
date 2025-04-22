import { Request, Response } from 'express';

// Define allowed export formats and their content types
type ExportFormat = 'pdf' | 'csv';

interface FormatConfig {
  contentType: string;
  fileExtension: string;
  fileName: string;
}

// Format configurations
const EXPORT_FORMATS: Record<ExportFormat, FormatConfig> = {
  pdf: {
    contentType: 'application/pdf',
    fileExtension: 'pdf',
    fileName: 'procurement_report'
  },
  csv: {
    contentType: 'text/csv',
    fileExtension: 'csv',
    fileName: 'procurement_report'
  }
};

/**
 * Generate and send a report directly to the client
 * @param req Express request object
 * @param res Express response object
 */
export async function exportProcurementReport(req: Request, res: Response): Promise<void> {
  try {
    const { format, reportType, dateRange } = req.body;
    
    // Validate format
    if (!format || !EXPORT_FORMATS[format as ExportFormat]) {
      res.status(400).json({ 
        error: "Invalid format. Use 'pdf' or 'csv'.", 
        success: false 
      });
      return;
    }
    
    const formatConfig = EXPORT_FORMATS[format as ExportFormat];
    
    // Set appropriate headers for file download
    res.setHeader('Content-Type', formatConfig.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${formatConfig.fileName}.${formatConfig.fileExtension}"`);
    
    // Log the export attempt
    console.log(`Generating ${format} report - Type: ${reportType || 'General'}, Date Range: ${dateRange || 'All time'}`);
    
    if (format === 'pdf') {
      await generatePDFReport(res, { reportType, dateRange });
    } else if (format === 'csv') {
      await generateCSVReport(res, { reportType, dateRange });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to generate report', 
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } else {
      // Otherwise end the response
      res.end();
    }
  }
}

/**
 * Generate a PDF report using PDFKit
 */
async function generatePDFReport(res: Response, options: { reportType?: string, dateRange?: string }): Promise<void> {
  // Import PDFDocument dynamically
  const PDFDocument = await import('pdfkit').then(mod => mod.default);
  
  // Create a PDF document piped directly to the response
  const doc = new PDFDocument();
  
  // Handle stream errors
  doc.on('error', (err: Error) => {
    console.error('Error generating PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to generate PDF report', 
        success: false 
      });
    } else {
      res.end();
    }
  });
  
  // Pipe the PDF document directly to the response
  doc.pipe(res);
  
  // Add content to PDF
  doc.fontSize(25).text('Procurement Report', 100, 80);
  
  // Add report details if provided
  if (options.reportType || options.dateRange) {
    const reportDetails = [];
    if (options.reportType) reportDetails.push(`Report Type: ${options.reportType}`);
    if (options.dateRange) reportDetails.push(`Date Range: ${options.dateRange}`);
    
    doc.fontSize(12).text(reportDetails.join(' | '), 100, 115);
  }
  
  doc.fontSize(15).text('NEC4 Contract Manager', 100, 140);
  doc.moveDown();
  doc.moveDown();
  
  // Add some table data
  doc.fontSize(12);
  
  // Table header in bold 
  doc.font('Helvetica-Bold');
  doc.text('Project', 100, 180);
  doc.text('Value', 300, 180);
  doc.font('Helvetica'); // Reset to regular font
  
  // Table rows
  const tableData = [
    { project: 'Project 1', value: '£12,000' },
    { project: 'Project 2', value: '£18,000' },
    { project: 'Project 3', value: '£15,000' }
  ];
  
  let y = 200;
  tableData.forEach(row => {
    doc.text(row.project, 100, y);
    doc.text(row.value, 300, y);
    y += 20;
  });
  
  // Add totals
  doc.moveDown(2);
  doc.font('Helvetica-Bold');
  doc.text('Total Value:', 100, y + 20);
  doc.text('£45,000', 300, y + 20);
  
  // Add footer with timestamp
  const now = new Date();
  doc.fontSize(10).text(
    `Generated: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`,
    100, 700
  );
  
  // Finalize the PDF
  doc.end();
}

/**
 * Generate a CSV report
 */
async function generateCSVReport(res: Response, options: { reportType?: string, dateRange?: string }): Promise<void> {
  // In a real implementation, we might use a CSV library and real data here
  let csvContent = 'Project,Value\n';
  
  // Generate CSV content
  const rowData = [
    { project: 'Project 1', value: '£12000' },
    { project: 'Project 2', value: '£18000' },
    { project: 'Project 3', value: '£15000' }
  ];
  
  rowData.forEach(row => {
    csvContent += `${row.project},${row.value}\n`;
  });
  
  // Add a total row
  csvContent += 'Total,£45000\n';
  
  // Send the CSV data
  res.send(csvContent);
}

/**
 * Legacy download endpoint (kept for backward compatibility)
 */
export async function downloadReport(req: Request, res: Response): Promise<void> {
  try {
    const { format } = req.params;
    
    if (format === 'pdf' || format === 'csv') {
      // Create a modified request body with the format included
      const modifiedBody = { ...req.body, format };
      
      // Call the main export function with the modified body
      req.body = modifiedBody;
      await exportProcurementReport(req, res);
    } else {
      res.status(400).json({ 
        error: "Invalid format. Use 'pdf' or 'csv'.",
        success: false
      });
    }
  } catch (error) {
    console.error('Error downloading report:', error);
    if (!res.headersSent) {
      res.status(500).send('Failed to download report. Please try again.');
    } else {
      res.end();
    }
  }
}