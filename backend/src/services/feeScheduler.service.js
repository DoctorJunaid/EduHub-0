import feeService from "./fee.service.js";
import Campus from "../models/campus.model.js";

class FeeSchedulerService {
  constructor() {
    this.intervalHandle = null;
    this.isRunning = false;
  }

  /**
   * Initializes the scheduler. Checks on server startup and every 6 hours thereafter.
   */
  start() {
    console.log("[FeeScheduler] Background Fee Automation Service initialized.");
    
    // Initial check 10 seconds after server startup
    setTimeout(() => {
      this.runPeriodicCheck().catch((err) => {
        console.warn("[FeeScheduler] Initial run encountered warning:", err.message);
      });
    }, 10000);

    // Run every 6 hours
    this.intervalHandle = setInterval(() => {
      this.runPeriodicCheck().catch((err) => {
        console.warn("[FeeScheduler] Periodic check encountered warning:", err.message);
      });
    }, 6 * 60 * 60 * 1000);
  }

  stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * Runs the automated generation check for all active campuses.
   * Completely safe and idempotent.
   */
  async runPeriodicCheck() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const activeCampuses = await Campus.find({ status: { $in: ["Active", "active"] } }).lean();

      for (const campus of activeCampuses) {
        try {
          const res = await feeService.generateMonthlyFees(
            campus._id,
            campus.instituteId,
            {
              month: currentMonth,
              feeCategory: "Monthly Tuition Fee",
            },
            null
          );

          if (res.generatedCount > 0) {
            console.log(
              `[FeeScheduler] Auto-generated ${res.generatedCount} monthly vouchers for campus "${campus.name}" (${currentMonth}).`
            );
          }
        } catch (campusErr) {
          console.warn(`[FeeScheduler] Campus ${campus.name} fee generation check:`, campusErr.message);
        }
      }
    } catch (error) {
      console.warn("[FeeScheduler] Periodic execution error:", error.message);
    } finally {
      this.isRunning = false;
    }
  }
}

const feeSchedulerService = new FeeSchedulerService();
export default feeSchedulerService;
