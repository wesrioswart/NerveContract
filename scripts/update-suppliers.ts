import { db } from "../server/db";
import { suppliers } from "@shared/schema";
import { eq } from "drizzle-orm";

async function updateSuppliers() {
  try {
    console.log("Updating supplier records with account numbers and GPSMACS flags...");

    // Get all existing suppliers
    const existingSuppliers = await db.select().from(suppliers);
    
    if (existingSuppliers.length === 0) {
      console.log("No suppliers found to update");
      return;
    }

    // Update BuildMaster Supplies Ltd
    await db.update(suppliers)
      .set({ 
        accountNumber: "BMS-001",
        isGpsmacs: true
      })
      .where(eq(suppliers.name, "BuildMaster Supplies Ltd"));
    
    // Update SafetyFirst PPE Solutions
    await db.update(suppliers)
      .set({ 
        accountNumber: "SF-002",
        isGpsmacs: true 
      })
      .where(eq(suppliers.name, "SafetyFirst PPE Solutions"));
    
    // Update HeavyLift Plant Hire
    await db.update(suppliers)
      .set({ 
        accountNumber: "HLP-003",
        isGpsmacs: false 
      })
      .where(eq(suppliers.name, "HeavyLift Plant Hire"));
    
    // Update ElectroPro Services
    await db.update(suppliers)
      .set({ 
        accountNumber: "EPS-004",
        isGpsmacs: false 
      })
      .where(eq(suppliers.name, "ElectroPro Services"));
    
    // Update TimberTech Solutions
    await db.update(suppliers)
      .set({ 
        accountNumber: "TTS-005",
        isGpsmacs: true 
      })
      .where(eq(suppliers.name, "TimberTech Solutions"));
    
    // Update ConcreteWorks UK
    await db.update(suppliers)
      .set({ 
        accountNumber: "CWU-006",
        isGpsmacs: false 
      })
      .where(eq(suppliers.name, "ConcreteWorks UK"));
    
    // Update MetalCraft Industries
    await db.update(suppliers)
      .set({ 
        accountNumber: "MCI-007",
        isGpsmacs: true 
      })
      .where(eq(suppliers.name, "MetalCraft Industries"));

    console.log("Successfully updated suppliers");
  } catch (error) {
    console.error("Error updating suppliers:", error);
  }
}

updateSuppliers()
  .then(() => {
    console.log("Supplier update complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error during supplier update:", err);
    process.exit(1);
  });