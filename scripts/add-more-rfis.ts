import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function addMoreRFIs() {
  // Get project ID and period IDs
  const projectResult = await db.execute(sql`
    SELECT id FROM "projects" LIMIT 1
  `);
  
  if (!projectResult.rows.length) {
    console.error('No projects found in the database');
    return;
  }
  
  const projectId = projectResult.rows[0].id;
  
  // Get period IDs
  const periodResult = await db.execute(sql`
    SELECT id, name FROM "project_period" ORDER BY "start_date"
  `);
  
  if (!periodResult.rows.length) {
    console.error('No project periods found in the database');
    return;
  }
  
  const periods = periodResult.rows;
  
  // Get a user ID
  const userResult = await db.execute(sql`
    SELECT id FROM "users" LIMIT 1
  `);
  
  const userId = userResult.rows.length ? userResult.rows[0].id : null;
  
  // Create today and various relative dates
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
  
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);
  const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
  
  const fourDaysAgo = new Date(today);
  fourDaysAgo.setDate(today.getDate() - 4);
  const fourDaysAgoStr = fourDaysAgo.toISOString().split('T')[0];
  
  const fiveDaysAgo = new Date(today);
  fiveDaysAgo.setDate(today.getDate() - 5);
  const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];
  
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
  
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];
  
  const oneDayFromNow = new Date(today);
  oneDayFromNow.setDate(today.getDate() + 1);
  const oneDayFromNowStr = oneDayFromNow.toISOString().split('T')[0];
  
  const twoDaysFromNow = new Date(today);
  twoDaysFromNow.setDate(today.getDate() + 2);
  const twoDaysFromNowStr = twoDaysFromNow.toISOString().split('T')[0];
  
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);
  const threeDaysFromNowStr = threeDaysFromNow.toISOString().split('T')[0];
  
  const oneWeekFromNow = new Date(today);
  oneWeekFromNow.setDate(today.getDate() + 7);
  const oneWeekFromNowStr = oneWeekFromNow.toISOString().split('T')[0];
  
  console.log('Adding more RFIs...');
  
  // Delete existing RFIs first
  await db.execute(sql`DELETE FROM "rfi"`);
  
  // Add RFIs with different statuses
  // Open RFIs - some overdue, some due soon, some with plenty of time
  await db.execute(sql`
    INSERT INTO "rfi" 
    ("project_id", "reference", "title", "description", "transmittal_method", 
     "submission_date", "contractual_reply_period", "planned_response_date", 
     "response_date", "response", "status", "ce_status", "ce_reference", "period_id", "created_by")
    VALUES
    (
      ${projectId}, 'RFI-001', 'Structural Steel Connection Detail', 
      'Please clarify connection detail for main truss to column interface as shown on drawing S-201.',
      'Email', ${oneWeekAgoStr}, 5, ${twoDaysAgoStr}, 
      null, null, 'Open', 'Under Review', null, ${periods[5].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-002', 'Fire-rated Partition Thickness', 
      'The specification calls for 2-hour fire-rated partitions between Units A and B, but the drawing shows standard partitions. Please confirm the requirement.',
      'Email', ${oneWeekAgoStr}, 5, ${yesterdayStr}, 
      null, null, 'Open', 'Under Review', null, ${periods[5].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-003', 'Mechanical Ductwork Clearance', 
      'There appears to be insufficient clearance between the HVAC ductwork and the sprinkler pipes in Corridor C. Please advise on resolution.',
      'Email', ${fiveDaysAgoStr}, 7, ${todayStr}, 
      null, null, 'Open', 'Potential CE', null, ${periods[5].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-004', 'Glazing Type Clarification', 
      'Please confirm the glazing type for the west-facing curtain wall as there is a discrepancy between the specification and the window schedule.',
      'Email', ${fourDaysAgoStr}, 7, ${threeDaysFromNowStr}, 
      null, null, 'Open', 'Not a CE', null, ${periods[5].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-005', 'Foundation Detail Revision', 
      'Recent soil tests indicate potential issues with the specified foundation design for Block B. Please provide revised details.',
      'Email', ${threeDaysAgoStr}, 10, ${oneWeekFromNowStr}, 
      null, null, 'Open', 'Raise a CE', null, ${periods[5].id}, ${userId}
    )
  `);
  
  // In Progress RFIs
  await db.execute(sql`
    INSERT INTO "rfi" 
    ("project_id", "reference", "title", "description", "transmittal_method", 
     "submission_date", "contractual_reply_period", "planned_response_date", 
     "response_date", "response", "status", "ce_status", "ce_reference", "period_id", "created_by")
    VALUES
    (
      ${projectId}, 'RFI-006', 'Roof Drainage Calculation', 
      'Please verify the roof drainage calculations for Area C as the specified number of drains seems insufficient for the catchment area.',
      'Email', ${twoWeeksAgoStr}, 7, ${oneWeekAgoStr}, 
      null, null, 'In Progress', 'Under Review', null, ${periods[5].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-007', 'Electrical Panel Location', 
      'The location of electrical panel EP-3 conflicts with the fire exit path. Please advise on alternate location.',
      'Email', ${twoWeeksAgoStr}, 5, ${oneWeekAgoStr}, 
      null, null, 'In Progress', 'PMI Pending', 'PMI-012', ${periods[5].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-008', 'Exterior Cladding Joints', 
      'Please provide detail for exterior cladding expansion joints at the building corners as this detail is missing from the documentation.',
      'Email', ${oneWeekAgoStr}, 7, ${todayStr}, 
      null, null, 'In Progress', 'CE Raised', 'CE-024', ${periods[5].id}, ${userId}
    )
  `);
  
  // Responded RFIs
  await db.execute(sql`
    INSERT INTO "rfi" 
    ("project_id", "reference", "title", "description", "transmittal_method", 
     "submission_date", "contractual_reply_period", "planned_response_date", 
     "response_date", "response", "status", "ce_status", "ce_reference", "period_id", "created_by")
    VALUES
    (
      ${projectId}, 'RFI-009', 'Door Hardware Specification', 
      'Please confirm if the hardware specification for fire-rated doors applies to all doors or just those in fire-rated partitions.',
      'Email', ${twoWeeksAgoStr}, 5, ${oneWeekAgoStr}, 
      ${threeDaysAgoStr}, 'Hardware specification H-5.2 applies only to doors in fire-rated partitions. All other doors should follow hardware specification H-2.1 as per the door schedule.', 
      'Responded', 'Not a CE', null, ${periods[5].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-010', 'Column Base Plate Detail', 
      'Please provide a revised base plate detail for columns supporting the mezzanine level as the current detail lacks sufficient information.',
      'Email', ${twoWeeksAgoStr}, 7, ${oneWeekAgoStr}, 
      ${fiveDaysAgoStr}, 'Revised column base plate detail is shown on drawing S-502, Revision C. The key changes include increased anchor bolt diameter and additional stiffening plates.', 
      'Responded', 'PMI Issued', 'PMI-015', ${periods[5].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-011', 'Wall Finish in Wet Areas', 
      'The finish schedule does not specify the wall finish for wet areas in the cafeteria. Please advise on the appropriate finish.',
      'Email', ${oneWeekAgoStr}, 5, ${twoDaysAgoStr}, 
      ${yesterdayStr}, 'All wet areas in the cafeteria should receive finish type WT-3 (ceramic tile) to a height of 1200mm above finished floor, with finish type WP-2 (washable paint) above.', 
      'Responded', 'Not a CE', null, ${periods[5].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-012', 'Ceiling Height Conflict', 
      'Mechanical drawings show ductwork at a height that conflicts with the specified ceiling height in Area D. Please resolve this discrepancy.',
      'Email', ${oneWeekAgoStr}, 7, ${twoDaysFromNowStr}, 
      ${todayStr}, 'The ceiling height in Area D must be lowered to 2.7m to accommodate the mechanical services. This has been coordinated with the architect and will be reflected in the next drawing issue.', 
      'Responded', 'NCE Raised', 'CE-025', ${periods[5].id}, ${userId}
    )
  `);
  
  // Closed RFIs
  await db.execute(sql`
    INSERT INTO "rfi" 
    ("project_id", "reference", "title", "description", "transmittal_method", 
     "submission_date", "contractual_reply_period", "planned_response_date", 
     "response_date", "response", "status", "ce_status", "ce_reference", "period_id", "created_by")
    VALUES
    (
      ${projectId}, 'RFI-013', 'Floor Finish Transition', 
      'Please provide detail for the transition between carpet and vinyl flooring in the lobby area.',
      'Email', '2024-01-15', 5, '2024-01-20', 
      '2024-01-18', 'Use transition strip type TS-1 as detailed on drawing A-501. The transition should align with the door centerline as shown.', 
      'Closed', 'Closed', null, ${periods[4].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-014', 'Sprinkler Head Type', 
      'Please confirm the type of sprinkler heads to be used in the suspended ceiling areas of the office spaces.',
      'Email', '2024-02-10', 7, '2024-02-17', 
      '2024-02-15', 'Use pendant concealed type sprinkler heads with white cover plates in all office areas with suspended ceilings. Refer to specification section 21 13 16, paragraph 2.3.B for model numbers.', 
      'Closed', 'Closed', null, ${periods[4].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-015', 'Structural Support for Roof-mounted Equipment', 
      'The mechanical equipment schedule shows several units on the roof, but the structural drawings do not show adequate support. Please provide details.',
      'Email', '2024-02-20', 10, '2024-03-01', 
      '2024-02-28', 'Additional structural support for roof-mounted equipment is shown on new drawing S-205, revision A. This includes added steel beams and reinforced decking at all equipment locations.', 
      'Closed', 'CE Approved', 'CE-018', ${periods[4].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-016', 'Security Camera Locations', 
      'The security layout does not show camera coverage for the loading dock area. Please advise if additional cameras are required.',
      'Email', '2023-11-05', 7, '2023-11-12', 
      '2023-11-10', 'Two additional security cameras should be added to cover the loading dock area. Locations are marked on drawing E-302, revision B. These cameras should be connected to the main security system as detailed in specification section 28 23 00.', 
      'Closed', 'CE Rejected', 'CE-015', ${periods[3].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-017', 'Foundation Waterproofing', 
      'The specification calls for foundation waterproofing but does not specify the product or application method. Please provide details.',
      'Email', '2023-10-15', 5, '2023-10-20', 
      '2023-10-18', 'Use fluid-applied waterproofing membrane system WP-1 as specified in section 07 14 16. Apply in strict accordance with manufacturer instructions with a minimum of two coats to achieve 60 mil dry film thickness.', 
      'Closed', 'Closed', null, ${periods[3].id}, ${userId}
    )
  `);
  
  // Add a few RFIs to earlier periods
  await db.execute(sql`
    INSERT INTO "rfi" 
    ("project_id", "reference", "title", "description", "transmittal_method", 
     "submission_date", "contractual_reply_period", "planned_response_date", 
     "response_date", "response", "status", "ce_status", "ce_reference", "period_id", "created_by")
    VALUES
    (
      ${projectId}, 'RFI-018', 'Beam Penetration Detail', 
      'Mechanical drawings show duct penetrations through structural beams. Please provide structural details for these penetrations.',
      'Email', '2023-06-10', 7, '2023-06-17', 
      '2023-06-15', 'Structural details for beam penetrations are shown on drawing S-310, details 5, 6, and 7. Note that penetrations must not exceed 40% of beam depth and must be located within the middle third of the span.', 
      'Closed', 'CE Approved', 'CE-008', ${periods[1].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-019', 'Fire Alarm Device Locations', 
      'The fire alarm drawing does not show devices in the storage mezzanine areas. Please confirm if devices are required in these spaces.',
      'Email', '2023-05-05', 5, '2023-05-10', 
      '2023-05-08', 'Fire alarm devices are required in all storage mezzanine areas. Add smoke detectors and notification devices as per code requirements. Updated drawings will be issued showing these additions.', 
      'Closed', 'NCE Rejected', 'CE-007', ${periods[1].id}, ${userId}
    ),
    (
      ${projectId}, 'RFI-020', 'Concrete Mix Design', 
      'Please confirm the concrete mix design for the exterior walkways given the freeze-thaw conditions in this location.',
      'Email', '2023-02-15', 7, '2023-02-22', 
      '2023-02-20', 'For exterior walkways, use concrete mix design CM-4 as specified in section 03 30 00, paragraph 2.5.D. This mix includes air entrainment and is designed for freeze-thaw conditions.', 
      'Closed', 'Closed', null, ${periods[0].id}, ${userId}
    )
  `);
  
  console.log('Successfully added more comprehensive RFI data');
}

async function main() {
  try {
    await addMoreRFIs();
    console.log('Successfully completed adding RFI data');
    process.exit(0);
  } catch (error) {
    console.error('Error adding RFI data:', error);
    process.exit(1);
  }
}

main();