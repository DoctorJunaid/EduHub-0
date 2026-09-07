import { FileText, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { percentage } from './resultsData.js';
export default function ResultsTable({ rows, onTranscript, onEdit }) {
  return <Table aria-label="Exam results"><TableHeader><TableRow>{['Student Name & Roll No.', 'Course / Subject', 'Semester', 'Score & %', 'Grade', 'GPA', 'Academic Remarks', 'Actions'].map((label) => <TableHead scope="col" key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>
    {rows.map((row) => <TableRow key={row.id}><TableCell><div className="results-person"><Avatar><AvatarFallback>{row.student.initials || row.student.name[0]}</AvatarFallback></Avatar><div><strong>{row.student.name}</strong><small>{row.student.roll}</small></div></div></TableCell><TableCell>{row.exam.subject}<small>{row.courseCode || '—'}</small></TableCell><TableCell>{row.semester}<small>{row.academicYear}</small></TableCell><TableCell className="results-score">{row.score} / {row.totalMarks} <small>({percentage(row)?.toFixed(1) ?? '—'}%)</small></TableCell><TableCell><Badge variant="secondary" className="results-grade">{row.grade || '—'}</Badge></TableCell><TableCell>{row.gpa?.toFixed(2) ?? '—'}</TableCell><TableCell className="results-remarks">{row.remarks || '—'}</TableCell><TableCell><div className="results-actions"><Button variant="outline" onClick={() => onTranscript(row.studentId)} aria-label={`View transcript for ${row.student.name}`}><FileText size={12} />View Transcript</Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" aria-label={`Result actions for ${row.student.name}, ${row.exam.subject}`}><MoreVertical size={13} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onEdit(row.id)}>Edit result</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></TableCell></TableRow>)}
    {!rows.length && <TableRow><TableCell colSpan={8} className="tt-empty">No results match the selected filters. Record a result to get started.</TableCell></TableRow>}
  </TableBody></Table>;
}
