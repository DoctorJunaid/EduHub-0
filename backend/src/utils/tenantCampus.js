import Campus from "../models/campus.model.js";
import mongoose from "mongoose";

/**
 * Resolves and strictly validates that the campusId requested or associated with the request
 * belongs to the authenticated user's institute.
 * 
 * Prevents cross-institute data leakage across all tenant scopes.
 * 
 * @param {import("express").Request} req
 * @returns {Promise<string|null>} Validated campusId string or null if none/invalid.
 */
export async function getTenantCampusId(req) {
  if (!req?.user) return null;

  let candidateId =
    req.headers?.["x-campus-id"] ||
    req.campusId ||
    req.query?.campusId ||
    req.body?.campusId ||
    req.user?.campusId;

  if (candidateId && typeof candidateId === "object") {
    candidateId = candidateId._id || candidateId.id || String(candidateId);
  }
  if (candidateId) candidateId = String(candidateId).trim();

  // Super Admin bypass
  if (req.user.role === "super_admin") {
    if (candidateId && mongoose.isValidObjectId(candidateId)) {
      return candidateId;
    }
    return req.user.campusId ? String(req.user.campusId) : null;
  }

  const userInstituteId = req.user.instituteId?._id || req.user.instituteId;

  // If candidateId was specified, verify it belongs to user's institute
  if (candidateId && mongoose.isValidObjectId(candidateId)) {
    if (userInstituteId) {
      const match = await Campus.findOne({
        _id: candidateId,
        instituteId: userInstituteId,
      }).select("_id").lean();

      if (match?._id) {
        return match._id.toString();
      }
      // Candidate belongs to a different institute - STRICT ISOLATION REJECT
      candidateId = null;
    } else {
      // User has no instituteId, verify campus exists
      const match = await Campus.findById(candidateId).select("_id").lean();
      if (match?._id) return match._id.toString();
      candidateId = null;
    }
  }

  // If no candidateId or candidate was invalid/from another institute:
  // Fall back ONLY within this user's institute
  if (userInstituteId) {
    const defaultCampus =
      (await Campus.findOne({ instituteId: userInstituteId, status: "Active" }).select("_id").lean()) ||
      (await Campus.findOne({ instituteId: userInstituteId }).select("_id").lean());

    if (defaultCampus?._id) {
      return defaultCampus._id.toString();
    }
  }

  // Institute has 0 campuses (e.g. newly registered institute) -> strictly null
  return null;
}

export default getTenantCampusId;

