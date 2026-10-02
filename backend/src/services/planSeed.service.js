/**
 * Plan Seed Service
 * Automatically ensures default tiers (Free, Pro, Enterprise) exist in the database
 * and that any legacy institutions are linked to their corresponding plan.
 */
import Plan, { DEFAULT_PLANS } from "../models/plan.model.js";
import Institute from "../models/institute.model.js";

export const seedDefaultPlans = async () => {
  try {
    const existingCount = await Plan.countDocuments();
    if (existingCount === 0) {
      console.log("[PlanSeed] No subscription plans found. Seeding default tiers...");
      await Plan.insertMany(DEFAULT_PLANS);
      console.log("[PlanSeed] Default plans seeded successfully.");
    } else {
      // Migrate any existing USD or legacy-priced plans to PKR
      const usdPlans = await Plan.find({ $or: [{ currency: "USD" }, { currency: { $exists: false } }] });
      for (const p of usdPlans) {
        p.currency = "PKR";
        if (p.tier === "free") {
          p.priceMonthly = 0;
          p.priceYearly = 0;
        } else if (p.tier === "pro" && (p.priceMonthly === 99 || p.priceMonthly < 1000)) {
          p.priceMonthly = 15000;
          p.priceYearly = 150000;
        } else if (p.tier === "enterprise" && (p.priceMonthly === 299 || p.priceMonthly < 5000)) {
          p.priceMonthly = 45000;
          p.priceYearly = 450000;
        }
        await p.save();
      }
      if (usdPlans.length > 0) {
        console.log(`[PlanSeed] Migrated ${usdPlans.length} subscription plan(s) to PKR currency.`);
      }
    }

    // Ensure all existing institutes have a valid planId
    const freePlan = await Plan.findOne({ tier: "free" });
    if (freePlan) {
      const institutesWithoutPlan = await Institute.find({
        $or: [{ planId: null }, { planId: { $exists: false } }],
      });

      if (institutesWithoutPlan.length > 0) {
        for (const inst of institutesWithoutPlan) {
          inst.planId = freePlan._id;
          inst.planTier = inst.planTier || "free";
          inst.subscriptionStatus = inst.subscriptionStatus || "Active";
          if (!inst.subscriptionStartDate) inst.subscriptionStartDate = new Date();
          if (!inst.subscriptionEndDate) {
            inst.subscriptionEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          }
          await inst.save();
        }
        console.log(`[PlanSeed] Linked ${institutesWithoutPlan.length} institution(s) to default plan.`);
      }
    }
  } catch (error) {
    console.error("[PlanSeed] Error initializing default plans:", error.message);
  }
};

export default seedDefaultPlans;
