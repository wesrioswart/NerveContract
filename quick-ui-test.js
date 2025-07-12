/**
 * Quick UI Test to identify missing implementations
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 QUICK UI FUNCTIONALITY TEST');
console.log('═════════════════════════════════════════════════════════');

function testComponent(filePath, componentName) {
  console.log(`\n📄 Testing ${componentName}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Look for buttons without onClick handlers (excluding those in trigger/form components)
  const buttonMatches = content.match(/<Button[^>]*>/g) || [];
  for (const button of buttonMatches) {
    if (!button.includes('onClick=') && !button.includes('type="submit"') && !button.includes('asChild')) {
      // Check if this button is within a trigger component context
      const buttonIndex = content.indexOf(button);
      const precedingText = content.substring(Math.max(0, buttonIndex - 100), buttonIndex);
      const followingText = content.substring(buttonIndex, Math.min(content.length, buttonIndex + 100));
      
      // Skip if button is within trigger components
      if (precedingText.includes('Trigger asChild') || 
          precedingText.includes('DialogTrigger') || 
          precedingText.includes('PopoverTrigger') ||
          followingText.includes('</DialogTrigger>') ||
          followingText.includes('</PopoverTrigger>')) {
        continue;
      }
      
      const buttonText = button.match(/(?:>([^<]+)<|aria-label="([^"]+)")/)?.[1] || 'Unknown button';
      issues.push(`Missing onClick handler: ${buttonText}`);
    }
  }
  
  // Look for placeholder functions
  const placeholderPatterns = [
    /onClick={\(\) => \{\}}/g,
    /onClick={undefined}/g,
    /console\.log\([^)]*\)/g,
    /TODO:/g,
    /FIXME:/g
  ];
  
  for (const pattern of placeholderPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      issues.push(`Placeholder implementations found: ${matches.length} instances`);
    }
  }
  
  // Look for non-functional dialogs/modals (more specific check)
  const dialogMatches = content.match(/<Dialog[^>]*>/g) || [];
  for (const dialog of dialogMatches) {
    // Check if Dialog has both open and onOpenChange props
    if (!dialog.includes('open=') && !dialog.includes('onOpenChange=')) {
      issues.push('Dialog without proper state management');
    }
  }
  
  if (issues.length === 0) {
    console.log('✅ No obvious issues found');
  } else {
    console.log(`⚠️  Found ${issues.length} issues:`);
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  return issues;
}

// Test critical components
const components = [
  ['client/src/pages/compensation-events.tsx', 'Compensation Events'],
  ['client/src/pages/early-warnings.tsx', 'Early Warnings'],
  ['client/src/pages/procurement.tsx', 'Procurement'],
  ['client/src/pages/suppliers.tsx', 'Suppliers'],
  ['client/src/pages/equipment-hire.tsx', 'Equipment Hire'],
  ['client/src/pages/rfis.tsx', 'RFIs'],
  ['client/src/pages/ai-reports.tsx', 'AI Reports']
];

let totalIssues = 0;

for (const [filePath, componentName] of components) {
  const issues = testComponent(filePath, componentName);
  totalIssues += issues.length;
}

console.log(`\n📊 SUMMARY: Found ${totalIssues} total issues across all components`);
console.log('═════════════════════════════════════════════════════════');