import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import FacultyForm from '../../Campus Admin/Faculty/FacultyForm';
import { filterFaculty, facultyRecords as demoRecords } from '../../Campus Admin/Faculty/facultyData';
import { facultyAdded, facultyUpdated, facultyDeleted } from '@/store/Slices/facultySlice';
import { selectInstituteCampuses } from '@/store/Slices/campusesSlice';
import { demoInstitute } from '../instituteData';
import { selectInstituteFaculty } from './staffData';
import './InstituteStaff.css';

export default function InstituteStaff() {
  const dispatch = useDispatch();
  const records = useSelector(selectInstituteFaculty);
  const campuses = useSelector(selectInstituteCampuses);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');
  const selected = records.find((teacher) => teacher.id === modal?.id);
  // Keep the existing faculty matcher and add email matches without changing other pages.
  const matches = new Set(filterFaculty(records, { search }).map((teacher) => teacher.id));
  const query = search.trim().toLowerCase();
  const visible = records.filter((teacher) => matches.has(teacher.id) || teacher.email?.toLowerCase().includes(query));
  const options = Object.fromEntries(['designation', 'department', 'campus'].map((key) => [
    key, [...new Set([...demoRecords, ...records].map((teacher) => teacher[key]).filter(Boolean))],
  ]));
  options.campus = campuses.map((campus) => campus.name);
  if (selected && !campuses.some((campus) => campus.id === selected.campusId)) options.campus.unshift('');
  const save = (values) => {
    const campus = campuses.find((record) => record.name === values.campus);
    if (!campus) { setNotice('Select an available campus before saving.'); return; }
    const record = { ...values, instituteId: demoInstitute.id, campusId: campus.id };
    if (modal.type === 'edit') {
      if (!selected) return;
      dispatch(facultyUpdated({ ...record, id: selected.id }));
    } else dispatch(facultyAdded(record));
    setSearch('');
    setModal(null);
    setNotice('Teacher saved.');
  };

  return (
    <section className="institute-staff-directory" aria-labelledby="institute-staff-title">
      <div className="ist-heading">
        <div>
          <h1 id="institute-staff-title">Faculty &amp; Staff Directory</h1>
          <p>Manage professors, lecturers, departments, and course assignments.</p>
        </div>
        <Button disabled={!campuses.length} title={!campuses.length ? 'Add a campus before adding a teacher' : undefined} onClick={() => setModal({ type: 'add' })}><Plus aria-hidden="true" />Add New Teacher</Button>
      </div>
      <Card className="ist-card">
        <div className="ist-toolbar">
          <label className="ist-search">
            <Search size={22} aria-hidden="true" />
            <Input type="search" aria-label="Search faculty by name, email, department, or designation"
              placeholder="Search by name, department, designation..." value={search}
              onChange={(event) => setSearch(event.target.value)} />
          </label>
          <span>{records.length} faculty {records.length === 1 ? 'member' : 'members'} registered</span>
        </div>
        <Table aria-label="Faculty and staff directory">
          <TableHeader><TableRow>
            {['Teacher / Faculty', 'Designation & Qualification', 'Department & Subjects', 'Campus Branch', 'Status', 'Actions'].map((label) => (
              <TableHead key={label} scope="col">{label}</TableHead>
            ))}
          </TableRow></TableHeader>
          <TableBody>
            {visible.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell><div className="ist-person">
                  <Avatar><AvatarFallback>{teacher.initials}</AvatarFallback></Avatar>
                  <div><strong>{teacher.name}</strong><small>{teacher.email}</small></div>
                </div></TableCell>
                <TableCell><strong>{teacher.designation}</strong><small className="ist-qualification">{teacher.qualification}</small></TableCell>
                <TableCell className="ist-subjects"><strong>{teacher.department}</strong><small>{teacher.subjects}</small></TableCell>
                <TableCell>{teacher.campus}</TableCell>
                <TableCell><Badge variant="secondary" className={`ist-status ist-status-${teacher.status?.toLowerCase()}`}>
                  <span aria-hidden="true" />{teacher.status}
                </Badge></TableCell>
                <TableCell><div className="ist-actions">
                  <Button variant="outline" size="icon" aria-label={`Edit ${teacher.name}`} onClick={() => setModal({ type: 'edit', id: teacher.id })}><Pencil aria-hidden="true" /></Button>
                  <Button variant="outline" size="icon" className="ist-delete" aria-label={`Delete ${teacher.name}`} onClick={() => setModal({ type: 'delete', id: teacher.id })}><Trash2 aria-hidden="true" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
            {!visible.length && <TableRow><TableCell colSpan={6} className="ist-empty">{records.length ? 'No faculty members match your search.' : 'No faculty members registered.'}</TableCell></TableRow>}
          </TableBody>
        </Table>
        <span role="status" className="sr-only">{notice} {visible.length} faculty members shown.</span>
      </Card>
      {(modal?.type === 'add' || (modal?.type === 'edit' && selected)) && (
        <FacultyForm teacher={selected ? { ...selected, campus: campuses.some((campus) => campus.id === selected.campusId) ? selected.campus : '' } : undefined} options={options} onSave={save} onClose={() => setModal(null)} />
      )}
      <ConfirmDialog open={modal?.type === 'delete' && !!selected} title="Delete Faculty Member?"
        description={`Delete ${selected?.name || 'this faculty member'}? This action cannot be undone.`}
        confirmText="Delete" onCancel={() => setModal(null)} onConfirm={() => {
          if (selected) dispatch(facultyDeleted(selected.id));
          setModal(null);
          setNotice('Teacher deleted.');
        }} />
    </section>
  );
}
