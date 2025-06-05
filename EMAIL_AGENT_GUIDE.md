# Email Agent Processing Guide

## Overview
The NEC4 platform automatically processes incoming emails to create contract documents, equipment requests, and project communications. Your Outlook account (ai.nec4.test.1234@hotmail.com) is now connected and ready to process emails.

## How It Works
The system monitors your inbox and automatically identifies different types of project emails based on subject lines and content, then creates the appropriate records in your contract management system.

## Supported Email Types

### 1. Equipment Hire Requests
**Subject Format:** `HIRE: [Equipment Type] - Project: [Project Reference] - Equipment ID: [Equipment ID]`
**Example:** `HIRE: Excavator XC300 - Project: WDP-2024 - Equipment ID: EQP-1234`

**Email Content Should Include:**
- Equipment specification
- Hire period (start/end dates)
- Site delivery address
- Contact information

**What Happens:** System creates equipment hire record, generates confirmation, updates project equipment inventory.

### 2. Equipment Off-Hire Requests
**Subject Format:** `OFFHIRE: [Equipment Type] for return - Project: [Project Reference] - Equipment ID: [Equipment ID]`
**Example:** `OFFHIRE: Excavator XC300 for return - Project: WDP-2024 - Equipment ID: EQP-1234`

**Email Content Should Include:**
- Return date
- Equipment condition
- Final meter readings
- Collection arrangements

**What Happens:** System processes return, calculates final costs, generates off-hire confirmation.

### 3. Request for Information (RFI)
**Subject Format:** `RFI: [Query Description] - Project: [Project Reference]`
**Example:** `RFI: Foundation detail clarification - Project: WDP-2024`

**Email Content Should Include:**
- Specific technical question
- Drawing/specification references
- Required response date
- Impact on programme if applicable

**What Happens:** System creates RFI record, assigns reference number, notifies relevant team members.

### 4. Compensation Events
**Subject Format:** `CE: [Event Description] - Project: [Project Reference]`
**Example:** `CE: Archaeological findings delay - Project: WDP-2024`

**Email Content Should Include:**
- Event description
- NEC4 clause reference
- Time/cost impact
- Supporting documentation

**What Happens:** System creates CE record, triggers notification workflow, initiates response process.

### 5. Early Warnings
**Subject Format:** `EW: [Warning Description] - Project: [Project Reference]`
**Example:** `EW: Weather delay risk - Project: WDP-2024`

**Email Content Should Include:**
- Risk description
- Potential impact
- Mitigation measures
- Timeline for resolution

**What Happens:** System creates EW record, schedules review meeting, notifies project team.

## Processing Instructions

### Manual Processing
1. Go to Email Processor page in the platform
2. Click "Process New Emails" button
3. System checks your Outlook inbox for new emails
4. Processes recognized formats automatically
5. Creates appropriate records in the system

### Automatic Processing
- Set up regular processing (recommended every 30 minutes during working hours)
- System runs in background
- Immediate notifications for urgent items
- Daily summary reports

## Email Templates for Testing

### Test Equipment Hire Email
```
To: ai.nec4.test.1234@hotmail.com
Subject: HIRE: Mini Excavator - Project: WDP-2024 - Equipment ID: EQP-5678

We request hire of:
- 1x Mini Excavator (3-ton)
- Hire period: 15/01/2025 to 30/01/2025
- Delivery to: Westfield Site, W12 7GF
- Operator required: Yes
- Contact: Site Manager on 07123 456789

Please confirm availability and daily rate.
```

### Test RFI Email
```
To: ai.nec4.test.1234@hotmail.com
Subject: RFI: Concrete specification query - Project: WDP-2024

Reference: Drawing WDP-STR-001 Rev C

Query: The drawing shows C35/45 concrete for ground beams, but specification clause 3.2.1 references C30/37. Please clarify which grade is required.

Response required by: 20/01/2025
Programme impact: 2-day delay if not resolved by above date

Please provide written confirmation of correct concrete grade.
```

### Test Compensation Event Email
```
To: ai.nec4.test.1234@hotmail.com
Subject: CE: Unforeseen ground conditions - Project: WDP-2024

Compensation Event Notification
Reference: CE-042
NEC4 Clause: 60.1(12)

Event: Contaminated soil discovered in foundation area B requiring specialist removal and disposal.

Impact:
- Time: 5 working days delay
- Cost: £15,000 additional for specialist contractor
- Programme: Affects critical path activities

Supporting evidence attached. Request Project Manager assessment.
```

## System Response

After processing, the system will:
1. Create appropriate records in the contract management system
2. Generate automatic acknowledgment emails
3. Assign reference numbers
4. Notify relevant team members
5. Update project dashboards
6. Trigger any required workflows

## Troubleshooting

### Email Not Processed
- Check subject line format matches examples above
- Ensure sender is authorized contact
- Verify email contains required information
- Check system processing logs

### Missing Information
- System will flag incomplete submissions
- Request additional information automatically
- Hold records in draft status until complete

## Best Practices

1. **Consistent Format:** Always use the specified subject line formats
2. **Clear Content:** Include all required information in email body
3. **Attachments:** Add supporting documents where relevant
4. **Timing:** Send emails during business hours for faster processing
5. **Follow-up:** Check system dashboard for processing confirmation

## Security Note
The system only processes emails from authorized senders. Your Outlook account is configured as an authorized source for this project.