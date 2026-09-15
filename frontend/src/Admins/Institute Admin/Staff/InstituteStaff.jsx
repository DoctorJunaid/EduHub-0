import { useState, useEffect, useCallback } from 'react';
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
import { fetchCampuses, selectInstituteCampuses } from '@/store/Slices/campusesSlice';
import axiosInstance from '@/api/axiosInstance';
import './InstituteStaff.css';

export default function InstituteStaff() {
  const dispatch = useDispatch();
  const campuses = useSelector(selectInstituteCampuses);
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');

  const loadStaff = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/institute-admin/staff');
      const data = res.data?.data || [];
      setStaffList(
        data.map((member) => ({
          ...member,
          id: member._id || member.id,
          initials: member.name
            ? member.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            : 'FC',
          campus: member.campusId?.name || member.campus || 'Campus branch',
          campusId: member.campusId?._id || member.campusId?.id || member.campusId,
          designation: member.role === 'campus_manager' ? 'Campus Manager' : 'Teacher',
          qualification: member.qualification || 'Faculty Member',
          department: member.department || 'Academic Department',
          subjects: member.subjects || 'Assigned Courses',
          status: member.isActive !== false ? 'Active' : 'Inactive',
        }))
      );
    } catch (err) {
      console.error('Failed to load staff directory:', err);
    }
  }, []);

  useEffect(() => {
    dispatch(fetchCampuses());
    loadStaff();
  }, [dispatch, loadStaff]);

  const selected = staffList.find((teacher) => teacher.id === modal?.id);
  const query = search.trim().toLowerCase();
  const visible = staffList.filter(
    (teacher) =>
      !query ||
      `${teacher.name} ${teacher.email} ${teacher.department} ${teacher.designation} ${teacher.campus}`
        .toLowerCase()
        .includes(query)
  );

  const options = {
    designation: ['Professor', 'Assistant Professor', 'Lecturer', 'Campus Manager'],
    department: ['Computer Science', 'Electrical Engineering', 'Business Administration', 'Mathematics'],
    campus: campuses.map((c) => c.name),
  };

  const save = async (values) => {
    const campus = campuses.find((record) => record.name === values.campus);
    if (!campus) {
      setNotice('Select an available campus before saving.');
      return;
    }
    try {
      await axiosInstance.post('/institute-admin/staff', {
        name: values.name,
        email: values.email,
        password: values.password || 'Staff@123',
        role: values.designation === 'Campus Manager' ? 'campus_manager' : 'teacher',
        campusId: campus._id || campus.id,
        phone: values.phone || '',
      });
      await loadStaff();
      setSearch('');
      setModal(null);
      setNotice('Staff member saved successfully.');
    } catch (err) {
      setNotice(err.response?.data?.message || 'Failed to save staff member.');
    }
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
          <span>{staffList.length} faculty {staffList.length === 1 ? 'member' : 'members'} registered</span>
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
            {!visible.length && <TableRow><TableCell colSpan={6} className="ist-empty">{staffList.length ? 'No faculty members match your search.' : 'No faculty members registered.'}</TableCell></TableRow>}
          </TableBody>
        </Table>
        <span role="status" className="sr-only">{notice} {visible.length} faculty members shown.</span>
      </Card>
      {(modal?.type === 'add' || (modal?.type === 'edit' && selected)) && (
        <FacultyForm teacher={selected ? { ...selected, campus: campuses.some((campus) => campus.id === selected.campusId) ? selected.campus : '' } : undefined} options={options} onSave={save} onClose={() => setModal(null)} />
      )}
      <ConfirmDialog open={modal?.type === 'delete' && !!selected} title="Delete Faculty Member?"
        description={`Delete ${selected?.name || 'this faculty member'}? This action cannot be undone.`}
        confirmText="Delete" onCancel={() => setModal(null)} onConfirm={async () => {
          if (selected) {
            try {
              await axiosInstance.delete(`/institute-admin/staff/${selected.id}`);
              await loadStaff();
              setNotice('Staff member deleted successfully.');
            } catch (err) {
              setNotice(err.response?.data?.message || 'Failed to delete staff member.');
            }
          }
          setModal(null);
        }} />
    </section>
  );
}
