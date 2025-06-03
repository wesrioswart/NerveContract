import { db } from "./db";
import {
  users,
  projects,
  compensationEvents,
  earlyWarnings,
  nonConformanceReports,
  programmeMilestones,
  paymentCertificates,
  nec4Teams,
  nec4TeamMembers,
  chatMessages,
  technicalQueries,
  rfis,
  usersToProjects,
  programmes,
  progressReports,
  purchaseOrders
} from "@shared/schema";

async function seedDatabase() {
  console.log("Seeding database...");

  try {
    // Check if user already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    // Insert a demo user
    const [user] = await db.insert(users).values({
      username: "jane.cooper",
      password: "password123",
      fullName: "Jane Cooper",
      role: "Principal Contractor",
      email: "jane.cooper@example.com",
      avatarInitials: "JC"
    }).returning();

    // Insert demo projects
    const [project1] = await db.insert(projects).values({
      name: "Westfield Development Project",
      contractReference: "NEC4-2020-1234",
      clientName: "Westfield Corp",
      startDate: new Date("2023-04-10"),
      endDate: new Date("2023-12-15")
    }).returning();

    const [project2] = await db.insert(projects).values({
      name: "Northern Gateway Interchange",
      contractReference: "NEC4-2025-002",
      clientName: "National Infrastructure Agency",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2025-08-30")
    }).returning();

    // Insert demo compensation events for Westfield Development Project
    await db.insert(compensationEvents).values([
      {
        projectId: project1.id,
        reference: "CE-042",
        title: "Additional groundworks following site survey",
        description: "Excavation revealed unexpected rock formation requiring additional equipment and time",
        clauseReference: "60.1(12)",
        estimatedValue: 18500,
        actualValue: null,
        status: "Quotation Due",
        raisedBy: user.id,
        raisedAt: new Date("2023-05-31"),
        responseDeadline: new Date("2023-06-14"),
        implementedDate: null,
        attachments: null
      },
      {
        projectId: project1.id,
        reference: "CE-041",
        title: "Design change to east elevation glazing",
        description: "Client requested specification upgrade to high-performance glazing",
        clauseReference: "60.1(1)",
        estimatedValue: 42750,
        actualValue: 42750,
        status: "Implemented",
        raisedBy: user.id,
        raisedAt: new Date("2023-05-15"),
        responseDeadline: new Date("2023-05-29"),
        implementedDate: new Date("2023-06-05"),
        attachments: null
      },
      {
        projectId: project1.id,
        reference: "CE-040",
        title: "Delay due to archaeological findings",
        description: "Historical artifacts discovered during excavation requiring archaeological survey",
        clauseReference: "60.1(19)",
        estimatedValue: 24300,
        actualValue: 24300,
        status: "Accepted",
        raisedBy: user.id,
        raisedAt: new Date("2023-05-01"),
        responseDeadline: new Date("2023-05-15"),
        implementedDate: new Date("2023-05-22"),
        attachments: null
      },
      // Northern Gateway Interchange compensation events
      {
        projectId: project2.id,
        reference: "CE-NGI-003",
        title: "Additional environmental monitoring requirements",
        description: "Environmental agency requested enhanced monitoring during construction near protected wetlands",
        clauseReference: "60.1(7)",
        estimatedValue: 28000,
        actualValue: null,
        status: "Assessment Due",
        raisedBy: user.id,
        raisedAt: new Date("2024-03-15"),
        responseDeadline: new Date("2024-03-29"),
        implementedDate: null,
        attachments: null
      },
      {
        projectId: project2.id,
        reference: "CE-NGI-002",
        title: "Traffic management system upgrade",
        description: "Local authority required enhanced traffic control systems during peak construction",
        clauseReference: "60.1(1)",
        estimatedValue: 85000,
        actualValue: 82500,
        status: "Implemented",
        raisedBy: user.id,
        raisedAt: new Date("2024-02-20"),
        responseDeadline: new Date("2024-03-05"),
        implementedDate: new Date("2024-03-18"),
        attachments: null
      }
    ]);

    // Insert demo early warnings
    await db.insert(earlyWarnings).values([
      // Westfield Development Project EWs
      {
        projectId: project1.id,
        reference: "EW-018",
        description: "Potential delay in steel delivery from supplier",
        ownerId: user.id,
        status: "Open",
        raisedBy: user.id,
        raisedAt: new Date("2023-06-02"),
        mitigationPlan: "Contact alternative suppliers and review project schedule",
        meetingDate: new Date("2023-06-09"),
        attachments: null
      },
      {
        projectId: project1.id,
        reference: "EW-017",
        description: "Weather forecast indicates potential flooding risk",
        ownerId: user.id,
        status: "Mitigated",
        raisedBy: user.id,
        raisedAt: new Date("2023-05-28"),
        mitigationPlan: "Install temporary drainage and secure loose materials",
        meetingDate: new Date("2023-06-01"),
        attachments: null
      },
      {
        projectId: project1.id,
        reference: "EW-016",
        description: "Potential utility clash at southwest corner",
        ownerId: user.id,
        status: "Open",
        raisedBy: user.id,
        raisedAt: new Date("2023-05-15"),
        mitigationPlan: "Survey underground utilities and revise foundation plan",
        meetingDate: new Date("2023-05-22"),
        attachments: null
      },
      // Northern Gateway Interchange EWs - Including unforeseen ground conditions scenario
      {
        projectId: project2.id,
        reference: "EW-NGI-004",
        description: "Unforeseen soft, waterlogged ground conditions encountered during bridge abutment excavation - not indicated in geotechnical reports provided by Client",
        ownerId: user.id,
        status: "Open",
        raisedBy: user.id,
        raisedAt: new Date(),
        mitigationPlan: "Immediate site investigation required. Assess need for alternative excavation methods, dewatering systems, and temporary works redesign. Potential impact on programme and costs to be evaluated.",
        meetingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        attachments: null
      },
      {
        projectId: project2.id,
        reference: "EW-NGI-003",
        description: "Potential access restrictions due to increased traffic volumes during peak construction phase",
        ownerId: user.id,
        status: "Under Review",
        raisedBy: user.id,
        raisedAt: new Date("2024-03-10"),
        mitigationPlan: "Coordinate with local authorities for temporary traffic management measures",
        meetingDate: new Date("2024-03-17"),
        attachments: null
      },
      {
        projectId: project2.id,
        reference: "EW-NGI-002",
        description: "Environmental sensitivity around protected wetland area requires enhanced monitoring protocols",
        ownerId: user.id,
        status: "Mitigated",
        raisedBy: user.id,
        raisedAt: new Date("2024-02-05"),
        mitigationPlan: "Implement daily environmental monitoring and maintain 50m buffer zone during sensitive nesting season",
        meetingDate: new Date("2024-02-12"),
        attachments: null
      }
    ]);

    // Insert demo non-conformance reports
    await db.insert(nonConformanceReports).values({
      projectId: project1.id,
      reference: "NCR-008",
      description: "Concrete mix does not meet specification",
      location: "Block A Foundation",
      raisedBy: user.id,
      raisedAt: new Date("2023-05-25"),
      status: "Open",
      correctiveAction: null,
      assignedTo: user.id,
      closedDate: null,
      attachments: null
    });

    // Insert demo programme milestones
    await db.insert(programmeMilestones).values([
      {
        projectId: project1.id,
        name: "Project Start",
        plannedDate: new Date("2023-04-10"),
        actualDate: new Date("2023-04-10"),
        status: "Completed",
        delayReason: null,
        delayDays: null
      },
      {
        projectId: project1.id,
        name: "Foundations",
        plannedDate: new Date("2023-05-15"),
        actualDate: new Date("2023-05-15"),
        status: "Completed",
        delayReason: null,
        delayDays: null
      },
      {
        projectId: project1.id,
        name: "Structure",
        plannedDate: new Date("2023-07-20"),
        actualDate: null,
        status: "In Progress",
        delayReason: null,
        delayDays: null
      },
      {
        projectId: project1.id,
        name: "Services",
        plannedDate: new Date("2023-09-05"),
        actualDate: null,
        status: "Not Started",
        delayReason: "CE Delay",
        delayDays: 14
      },
      {
        projectId: project1.id,
        name: "Completion",
        plannedDate: new Date("2023-12-15"),
        actualDate: null,
        status: "Not Started",
        delayReason: "CE Delay",
        delayDays: 14
      }
    ]);

    // Insert demo payment certificate
    await db.insert(paymentCertificates).values({
      projectId: project1.id,
      reference: "PC-003",
      amount: 234500,
      dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: "Draft",
      submittedBy: null,
      submittedAt: null,
      certifiedBy: null,
      certifiedAt: null,
      attachments: null
    });

    // Insert scenario-related AI chat messages for Northern Gateway ground conditions
    await db.insert(chatMessages).values([
      {
        projectId: project2.id,
        userId: user.id,
        message: "We've hit unexpected soft ground on the Northern Gateway site that wasn't in the geotech reports. What are my immediate obligations under NEC4 Option E?",
        isAi: false,
        timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        projectId: project2.id,
        userId: user.id,
        message: "Under NEC4 Option E (Cost Reimbursable Contract), when you encounter unforeseen ground conditions not indicated in the provided geotechnical reports, you have several immediate obligations:\n\n**1. Early Warning Notice (Clause 15.1)**: You must notify an early warning as soon as you become aware that the unforeseen ground conditions could increase total costs, delay completion, or impair the performance of the works.\n\n**2. Risk Register Update**: This situation should be added to the Risk Register as it affects the project's risk profile.\n\n**3. Compensation Event Notification**: This likely constitutes a Compensation Event under Clause 60.1(12) - 'Physical conditions within the Site which are not weather conditions and which an experienced contractor would have judged at the Contract Date to have such a small chance of occurring that it would have been unreasonable for him to have allowed for them'.\n\n**Key Actions Required:**\n- Issue Early Warning Notice immediately\n- Document the conditions with photographs and soil samples\n- Assess impact on programme and costs\n- Notify the Project Manager of potential Compensation Event\n- Implement immediate safety measures if required\n\n**Time Critical**: Early Warning notices must be given as soon as you become aware of the matter. Delay in notification could affect your entitlement to compensation.",
        isAi: true,
        timestamp: new Date(Date.now() - 3 * 60 * 1000) // 3 minutes ago
      },
      {
        projectId: project2.id,
        userId: user.id,
        message: "What specific clause reference should I use for the Compensation Event notification?",
        isAi: false,
        timestamp: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      },
      {
        projectId: project2.id,
        userId: user.id,
        message: "For the Compensation Event notification, you should reference **Clause 60.1(12)** - 'Physical conditions within the Site which are not weather conditions and which an experienced contractor would have judged at the Contract Date to have such a small chance of occurring that it would have been unreasonable for him to have allowed for them'.\n\nThis clause specifically covers unforeseen ground conditions that:\n- Were not indicated in the Site Information provided by the Client\n- Could not reasonably have been anticipated by an experienced contractor\n- Have a significant impact on the works\n\nEnsure your notification includes:\n- Clear description of the encountered conditions\n- Difference from the provided geotechnical information\n- Proposed methods to deal with the conditions\n- Estimated time and cost implications\n- Supporting evidence (photos, soil samples, expert reports)",
        isAi: true,
        timestamp: new Date(Date.now() - 1 * 60 * 1000) // 1 minute ago
      }
    ]);

    // Insert related technical query
    await db.insert(technicalQueries).values({
      projectId: project2.id,
      reference: "TQ-NGI-001",
      title: "Geotechnical Investigation Discrepancy - Bridge Abutment Location",
      description: "Encountered soft, waterlogged ground conditions during excavation at bridge abutment location (Grid Reference: NG/425/887) that differ significantly from the geotechnical reports provided in the Site Information. Ground conditions show bearing capacity of <50kN/m² compared to design assumption of 200kN/m². Requires immediate technical review and potential design modification.",
      raisedBy: user.id,
      raisedAt: new Date(),
      status: "Open",
      priority: "High",
      assignedTo: user.id,
      category: "Geotechnical",
      response: null,
      responseDate: null,
      attachments: null
    });

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// This is now an ES module, so we don't need the direct execution check

export { seedDatabase };