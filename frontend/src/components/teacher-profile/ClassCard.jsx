import React from "react";
import { BookOpen, Users, Clock, ArrowRight, Trash2, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ClassCard({
  item,
  onViewTimetable,
  onUnassign,
}) {
  const {
    className = "Class 1-A",
    subject = "Mathematics",
    periodsPerWeek = 6,
    isClassTeacher = false,
    studentCount = 20,
    assignmentId,
  } = item;

  return (
    <div className="teacher-class-card">
      {/* Header row: Class name + Class Teacher Badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#09090b", margin: 0 }}>
          {className}
        </h3>
        {isClassTeacher && (
          <span className="campus-status-pill status-active" style={{ fontSize: "10px" }}>
            <Award size={10} style={{ marginRight: "3px" }} />
            Class Incharge
          </span>
        )}
      </div>

      {/* Subject info */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", color: "#09090b" }}>
        <BookOpen size={14} style={{ color: "#71717a" }} />
        <span>{subject}</span>
      </div>

      {/* Details row: Periods + Students */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "8px 10px", background: "#fafafa", borderRadius: "6px", border: "1px solid #e4e4e7", fontSize: "11px", color: "#71717a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Clock size={12} />
          <span>{periodsPerWeek} per/wk</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Users size={12} />
          <span>{studentCount} Students</span>
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #f4f4f5", marginTop: "auto" }}>
        <button
          type="button"
          onClick={() => onViewTimetable && onViewTimetable(item)}
          className="toolbar-btn toolbar-btn-outline"
          style={{ height: "26px", minHeight: "26px", padding: "0 8px", fontSize: "11px" }}
        >
          <span>View Timetable</span>
          <ArrowRight size={11} />
        </button>

        <button
          type="button"
          onClick={() => onUnassign && onUnassign(item)}
          className="table-icon-btn delete"
          title="Unassign Class"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
