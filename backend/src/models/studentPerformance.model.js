import mongoose from "mongoose";
import { Performance } from "./profile.model.js";

/**
 * Re-export Performance as StudentPerformance model for direct import convenience.
 */
export const StudentPerformance = Performance;
export default Performance;
