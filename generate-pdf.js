const fs = require('fs');
const path = require('path');
const html2pdf = require('html2pdf.js');
const { JSDOM } = require('jsdom');

async function generatePDF() {
  try {
    // Read the HTML file
    const htmlContent = fs.readFileSync(path.join(__dirname, 'overview-pdf.html'), 'utf8');
    
    // Set up virtual DOM
    const dom = new JSDOM(htmlContent, { runScripts: 'dangerously' });
    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    
    // Generate PDF
    const element = document.querySelector('body');
    const opt = {
      margin: 10,
      filename: 'NEC4-Platform-Overview.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    await html2pdf().from(element).set(opt).save();
    
    console.log('PDF generated successfully!');
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

generatePDF();