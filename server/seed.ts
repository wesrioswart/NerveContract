import { db } from "./db";
import {
  users,
  projects,
  compensationEvents,
  earlyWarnings,
  nonConformanceReports,
  programmeMilestones,
  paymentCertificates
} from "@shared/schema";

async function seedDatabase() {
  console.log("Seeding database...");

  // Check if any users exist already
  const existingUsers = await db.select({ count: { value: users.id } }).from(users);
  if (existingUsers.length > 0 && existingUsers[0].count.value > 0) {
    console.log("Database already has data, skipping seeding");
    return;
  }

  try {
    // Insert a demo user
    const [user] = await db.insert(users).values({
      username: "jane.cooper",
      password: "password123",
      fullName: "Jane Cooper",
      role: "Principal Contractor",
      email: "jane.cooper@example.com",
      avatarInitials: "JC"
    }).returning();

    // Insert a demo project
    const [project] = await db.insert(projects).values({
      name: "Westfield Development Project",
      contractReference: "NEC4-2020-1234",
      clientName: "Westfield Corp",
      startDate: new Date("2023-04-10"),
      endDate: new Date("2023-12-15")
    }).returning();

    // Insert demo compensation events
    await db.insert(compensationEvents).values([
      {
        projectId: project.id,
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
        projectId: project.id,
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
        projectId: project.id,
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
      }
    ]);

    // Insert demo early warnings
    await db.insert(earlyWarnings).values([
      {
        projectId: project.id,
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
        projectId: project.id,
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
        projectId: project.id,
        reference: "EW-016",
        description: "Potential utility clash at southwest corner",
        ownerId: user.id,
        status: "Open",
        raisedBy: user.id,
        raisedAt: new Date("2023-05-15"),
        mitigationPlan: "Survey underground utilities and revise foundation plan",
        meetingDate: new Date("2023-05-22"),
        attachments: null
      }
    ]);

    // Insert demo non-conformance reports
    await db.insert(nonConformanceReports).values({
      projectId: project.id,
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
        projectId: project.id,
        name: "Project Start",
        plannedDate: new Date("2023-04-10"),
        actualDate: new Date("2023-04-10"),
        status: "Completed",
        delayReason: null,
        delayDays: null
      },
      {
        projectId: project.id,
        name: "Foundations",
        plannedDate: new Date("2023-05-15"),
        actualDate: new Date("2023-05-15"),
        status: "Completed",
        delayReason: null,
        delayDays: null
      },
      {
        projectId: project.id,
        name: "Structure",
        plannedDate: new Date("2023-07-20"),
        actualDate: null,
        status: "In Progress",
        delayReason: null,
        delayDays: null
      },
      {
        projectId: project.id,
        name: "Services",
        plannedDate: new Date("2023-09-05"),
        actualDate: null,
        status: "Not Started",
        delayReason: "CE Delay",
        delayDays: 14
      },
      {
        projectId: project.id,
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
      projectId: project.id,
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

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// This is now an ES module, so we don't need the direct execution check

export { seedDatabase };