import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Check, Copy, UserCheck, Calendar, Sparkles, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import "./StudentDiaryEntry.css";

export default function StudentDiaryEntry({ entry, compact = false }) {
  const [copied, setCopied] = useState(false);
  const Heading = compact ? "h3" : "h2";

  const handleCopyHomework = () => {
    if (!entry.homework) return;
    navigator.clipboard.writeText(entry.homework);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={`student-diary-entry${compact ? " sde-compact" : ""}`}>
      <header className="sde-header-row">
        <div className="sde-title-group">
          <div className="sde-badge-strip">
            <span className="sde-subject-pill">{entry.subject || "General"}</span>
            {!compact && entry.section && (
              <Badge variant="outline" className="sde-section-pill">
                Sec {entry.section}
              </Badge>
            )}
          </div>
          <Heading className="sde-main-title">{entry.title}</Heading>
        </div>
        <div className="sde-meta-pill">
          <span className="sde-meta-item">
            <UserCheck className="w-3.5 h-3.5 text-primary" />
            <span>{entry.instructor || entry.teacherName || "Assigned Faculty"}</span>
          </span>
          <span className="sde-meta-divider">•</span>
          <span className="sde-meta-item">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <time dateTime={entry.date}>{entry.date}</time>
          </span>
        </div>
      </header>

      <div className="sde-panels">
        <section className="sde-recap-box">
          <div className="sde-box-header">
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <h4>Lecture Recap &amp; Key Concepts</h4>
          </div>
          <p>{entry.recap?.trim() || "No lecture recap provided for today's session."}</p>
        </section>

        <section className="sde-hw-box">
          <div className="sde-box-header justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <h4>Homework &amp; Practice Tasks</h4>
            </div>
            {entry.homework && (
              <Button
                variant="ghost"
                size="sm"
                className="sde-copy-btn"
                onClick={handleCopyHomework}
                title="Copy homework to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-[11px] text-emerald-600 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </Button>
            )}
          </div>

          {entry.assignment ? (
            <div className="sde-linked-assignment">
              <p className="sde-hw-text">{entry.homework || entry.assignment.title}</p>
              <Link to="/student/assignments" className="sde-assignment-link">
                <span>View &amp; Submit Task: <strong>{entry.assignment.title}</strong></span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          ) : (
            <p className="sde-hw-text">
              {entry.assignmentId
                ? "Linked assignment is pending publication."
                : entry.homework?.trim() || "No homework assigned for this session."}
            </p>
          )}
        </section>
      </div>

      {!compact && entry.resources?.trim() && (
        <div className="sde-resources-bar">
          <span className="sde-res-label">📚 Recommended Book / Reference:</span>
          <span className="sde-res-content">{entry.resources}</span>
        </div>
      )}
    </Card>
  );
}

