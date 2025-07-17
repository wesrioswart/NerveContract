#!/usr/bin/env node

/**
 * Test Script: MS Project/Primavera P6 Programme Automation
 * 
 * This script tests the comprehensive programme automation system
 * for automated MS Project and Primavera P6 programme changes.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000';
const PROJECT_ID = 1; // Northern Gateway Project

async function testProgrammeAutomation() {
  console.log('🔄 Testing MS Project/Primavera P6 Programme Automation System');
  console.log('='.repeat(70));

  try {
    // Test 1: Check programme automation routes are available
    console.log('\n1. Testing Programme Automation API Routes...');
    
    const exportFormatsResponse = await fetch(`${BASE_URL}/api/programme-automation/export-formats`);
    if (exportFormatsResponse.ok) {
      const formatsData = await exportFormatsResponse.json();
      console.log('✅ Export formats available:', formatsData.data.formats.map(f => f.name).join(', '));
    } else {
      console.log('❌ Export formats endpoint failed');
    }

    // Test 2: Validate programme for automation
    console.log('\n2. Validating Programme for Automation...');
    
    const validateResponse = await fetch(`${BASE_URL}/api/programme-automation/validate/${PROJECT_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (validateResponse.ok) {
      const validation = await validateResponse.json();
      console.log('✅ Programme validation:', validation.data.isValid ? 'VALID' : 'INVALID');
      if (validation.data.issues.length > 0) {
        console.log('⚠️  Issues found:', validation.data.issues);
      }
      if (validation.data.recommendations.length > 0) {
        console.log('💡 Recommendations:', validation.data.recommendations);
      }
    } else {
      console.log('❌ Programme validation failed');
    }

    // Test 3: Trigger automated programme changes
    console.log('\n3. Triggering Automated Programme Changes...');
    
    const automationTriggers = {
      compensationEvents: [
        {
          id: 1,
          reference: 'CE-001',
          title: 'Ground Conditions Different from Contract',
          description: 'Unforeseen ground conditions requiring additional excavation',
          clauseReference: '60.1(12)',
          estimatedValue: 75000,
          status: 'submitted'
        }
      ],
      earlyWarnings: [
        {
          id: 1,
          reference: 'EW-001',
          description: 'Potential delay due to weather conditions affecting concrete work',
          severity: 'medium',
          status: 'open'
        }
      ],
      externalDelays: [
        {
          reason: 'Adverse weather conditions',
          delayDays: 5,
          keywords: ['concrete', 'foundation', 'weather'],
          workAreas: ['foundation', 'concrete']
        }
      ]
    };

    const automationResponse = await fetch(`${BASE_URL}/api/programme-automation/trigger-automation/${PROJECT_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triggers: automationTriggers })
    });

    if (automationResponse.ok) {
      const automationResult = await automationResponse.json();
      console.log('✅ Programme automation completed successfully');
      console.log(`📊 Summary: ${automationResult.data.summary.totalChanges} changes made`);
      console.log(`🔥 Critical path impact: ${automationResult.data.summary.criticalPathImpact} activities`);
      console.log(`🔧 Resource changes: ${automationResult.data.summary.resourceChanges} changes`);
      
      // Display specific changes
      if (automationResult.data.changes && automationResult.data.changes.length > 0) {
        console.log('\n📋 Programme Changes Applied:');
        automationResult.data.changes.forEach((change, index) => {
          console.log(`  ${index + 1}. ${change.activityId}: ${change.changeType} - ${change.reason}`);
          console.log(`     Impact: ${change.impactDays} days, Critical: ${change.affectsCriticalPath}`);
        });
      }
    } else {
      const errorData = await automationResponse.text();
      console.log('❌ Programme automation failed:', errorData);
    }

    // Test 4: Test export functionality
    console.log('\n4. Testing Programme Export...');
    
    const exportResponse = await fetch(`${BASE_URL}/api/programme-automation/export/${PROJECT_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'xml' })
    });

    if (exportResponse.ok) {
      const exportResult = await exportResponse.json();
      console.log('✅ MS Project XML export successful');
      console.log(`📄 Export path: ${exportResult.data.exportPath}`);
    } else {
      console.log('❌ Programme export failed');
    }

    // Test 5: Check change history
    console.log('\n5. Checking Programme Change History...');
    
    const historyResponse = await fetch(`${BASE_URL}/api/programme-automation/change-history/${PROJECT_ID}`);
    
    if (historyResponse.ok) {
      const history = await historyResponse.json();
      console.log(`✅ Change history retrieved: ${history.data.totalChanges} total changes`);
      
      if (history.data.changeHistory.length > 0) {
        console.log('\n📈 Recent Changes:');
        history.data.changeHistory.slice(0, 5).forEach((change, index) => {
          console.log(`  ${index + 1}. ${change.activityName}: ${change.modificationReason}`);
          console.log(`     Last modified: ${new Date(change.lastModified).toLocaleString()}`);
        });
      }
    } else {
      console.log('❌ Change history retrieval failed');
    }

    // Test 6: Test Operational Agent integration
    console.log('\n6. Testing Operational Agent Integration...');
    
    const agentResponse = await fetch(`${BASE_URL}/api/workflows/operational/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: PROJECT_ID })
    });

    if (agentResponse.ok) {
      const agentResult = await agentResponse.json();
      console.log('✅ Operational Agent integration successful');
      console.log(`🤖 Agent status: ${agentResult.status || 'Running'}`);
    } else {
      console.log('❌ Operational Agent integration failed');
    }

    // Test 7: File format compatibility
    console.log('\n7. Testing File Format Compatibility...');
    
    const formats = ['xml', 'mpp', 'xer'];
    const compatibilityResults = [];
    
    for (const format of formats) {
      try {
        const formatResponse = await fetch(`${BASE_URL}/api/programme-automation/export/${PROJECT_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format })
        });
        
        if (formatResponse.ok) {
          compatibilityResults.push(`${format.toUpperCase()}: ✅ Supported`);
        } else {
          compatibilityResults.push(`${format.toUpperCase()}: ❌ Not supported`);
        }
      } catch (error) {
        compatibilityResults.push(`${format.toUpperCase()}: ❌ Error`);
      }
    }
    
    console.log('📊 Format Compatibility:');
    compatibilityResults.forEach(result => console.log(`  ${result}`));

    console.log('\n' + '='.repeat(70));
    console.log('🎯 MS Project/Primavera P6 Programme Automation Test Complete');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Programme automation test failed:', error);
    process.exit(1);
  }
}

// Run the test
testProgrammeAutomation().catch(console.error);

// Additional test for real-time programme monitoring
async function testRealTimeProgrammeMonitoring() {
  console.log('\n🔄 Testing Real-Time Programme Monitoring...');
  
  try {
    // Monitor programme changes over time
    const monitoringInterval = setInterval(async () => {
      const response = await fetch(`${BASE_URL}/api/programme-automation/change-history/${PROJECT_ID}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Current programme status: ${data.data.totalChanges} total changes`);
      }
    }, 10000); // Check every 10 seconds

    // Stop monitoring after 30 seconds
    setTimeout(() => {
      clearInterval(monitoringInterval);
      console.log('✅ Real-time monitoring test completed');
    }, 30000);
    
  } catch (error) {
    console.error('❌ Real-time monitoring test failed:', error);
  }
}

// Export test functions for use in other scripts
export {
  testProgrammeAutomation,
  testRealTimeProgrammeMonitoring
};