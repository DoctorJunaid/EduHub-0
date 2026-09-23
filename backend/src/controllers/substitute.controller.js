import * as substituteService from "../services/substitute.service.js";

export const listSubstitutes = async (req, res) => {
  try {
    const campusId = req.user.campusId || req.query.campusId;
    if (!campusId) {
      return res.status(400).json({ success: false, message: "campusId is required" });
    }

    const data = await substituteService.listSubstitutes(campusId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch substitute assignments",
    });
  }
};

export const suggestSubstitutes = async (req, res) => {
  try {
    const campusId = req.user.campusId || req.query.campusId;
    if (!campusId) {
      return res.status(400).json({ success: false, message: "campusId is required" });
    }

    const { date, period } = req.query;
    if (!date || !period) {
      return res.status(400).json({
        success: false,
        message: "date and period parameters are required",
      });
    }

    const data = await substituteService.suggestSubstitutes(campusId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to find available substitutes",
    });
  }
};

export const assignSubstitute = async (req, res) => {
  try {
    const campusId = req.user.campusId || req.body.campusId;
    if (!campusId) {
      return res.status(400).json({ success: false, message: "campusId is required" });
    }

    const { doc, warning } = await substituteService.assignSubstitute(
      campusId,
      req.user._id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Substitute assigned successfully",
      data: doc,
      warning: warning || undefined,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A substitute is already assigned for this class and period on this date",
      });
    }

    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to assign substitute",
      code: error.code || undefined,
    });
  }
};

export const updateSubstitute = async (req, res) => {
  try {
    const campusId = req.user.campusId || req.body.campusId;
    if (!campusId) {
      return res.status(400).json({ success: false, message: "campusId is required" });
    }

    const data = await substituteService.updateSubstitute(
      req.params.id,
      campusId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Substitute assignment updated successfully",
      data,
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to update substitute assignment",
    });
  }
};

export const deleteSubstitute = async (req, res) => {
  try {
    const campusId = req.user.campusId || req.query.campusId;
    if (!campusId) {
      return res.status(400).json({ success: false, message: "campusId is required" });
    }

    const result = await substituteService.deleteSubstitute(req.params.id, campusId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Failed to cancel substitute assignment",
    });
  }
};
