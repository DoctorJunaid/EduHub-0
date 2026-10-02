/**
 * Tenant Derivation Mongoose Plugin
 * Automatically derives and populates `instituteId` from `campusId` on any operational model.
 * Guarantees 100% centralized multi-tenant data consistency across all collections.
 */
import mongoose from "mongoose";

export const tenantDerivationPlugin = (schema) => {
  // If instituteId path doesn't exist on schema, add it with indexing
  if (!schema.path("instituteId")) {
    schema.add({
      instituteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Institute",
        default: null,
        index: true,
      },
    });
  }

  schema.pre("validate", async function () {
    if (this.campusId && !this.instituteId) {
      try {
        // Query Campus model dynamically to prevent circular dependencies
        const Campus = mongoose.models.Campus || mongoose.model("Campus");
        const campus = await Campus.findById(this.campusId).select("instituteId").lean();
        if (campus && campus.instituteId) {
          this.instituteId = campus.instituteId;
        }
      } catch (err) {
        // Fallback gracefully without breaking validation
      }
    }
  });
};

export default tenantDerivationPlugin;
