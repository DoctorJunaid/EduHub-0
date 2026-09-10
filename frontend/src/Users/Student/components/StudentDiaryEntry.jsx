import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import './StudentDiaryEntry.css';

export default function StudentDiaryEntry({ entry, compact = false }) {
  const Heading = compact ? 'h3' : 'h2';
  return <Card className={`student-diary-entry${compact ? ' sde-compact' : ''}`}>
    <header>
      <div className="sde-title"><Heading>{entry.title}</Heading>{!compact && <Badge variant="secondary" className="sde-section">Sec {entry.section}</Badge>}</div>
      <p className="sde-metadata">{entry.subject} &bull; Instructor: {entry.instructor} &bull; Date: <time dateTime={entry.date}>{entry.date}</time></p>
    </header>
    <div className="sde-panels">
      <section><h4>Lecture Recap</h4><p>{entry.recap?.trim() || 'No lecture recap available.'}</p></section>
      <section><h4>Homework &amp; Practice Questions</h4>{entry.assignment ? <Link to="/student/assignments">{entry.assignment.title}<span className="sde-assignment-hint">View assignment</span></Link> : <p>{entry.assignmentId ? 'Linked assignment is not available.' : entry.homework?.trim() || 'No homework provided.'}</p>}</section>
    </div>
    {!compact && entry.resources?.trim() && <p className="sde-resources"><strong>Recommended Resources:</strong> {entry.resources}</p>}
  </Card>;
}
