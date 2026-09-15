import { useState, useRef } from "react";
import { Input } from "@/components/ui/Input";
import "./InstituteForm.css";

const selectStyle = {
  height: '36px',
  width: '100%',
  borderRadius: '6px',
  border: '1px solid #e4e4e7',
  background: '#fff',
  color: '#09090b',
  fontSize: '14px',
  fontWeight: 500,
  padding: '0 12px',
  outline: 'none',
  cursor: 'pointer',
  boxSizing: 'border-box',
};

const optionStyle = { fontSize: '14px', color: '#09090b', fontWeight: 500 };

export default function InstituteForm({ onSave, onCancel }) {
  const [values, setValues] = useState({
    name: "",
    type: "University",
    board: "",
    status: "Active",
    email: "",
    phone: "",
    adminFullName: "",
    adminEmail: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("type", values.type);
      formData.append("board", values.board);
      formData.append("status", values.status);
      formData.append("email", values.email);
      formData.append("phone", values.phone);

      const adminData = {
        name: values.adminFullName,
        email: values.adminEmail
      };
      formData.append("admin", JSON.stringify(adminData));

      if (imageFile) {
        formData.append("image", imageFile);
      }

      await onSave(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="institute-form" onSubmit={handleSubmit}>
      <h3 className="form-section-title">Institute Details</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Institute Name</label>
          <Input required name="name" value={values.name} onChange={handleChange} placeholder="e.g. Aga Khan University" />
        </div>
        <div className="form-group">
          <label>Type</label>
          <select name="type" required value={values.type} onChange={handleChange} style={selectStyle}>
            <option style={optionStyle}>University</option>
            <option style={optionStyle}>College</option>
            <option style={optionStyle}>School</option>
          </select>
        </div>
        <div className="form-group">
          <label>Board / Affiliation</label>
          <Input required name="board" value={values.board} onChange={handleChange} placeholder="e.g. Federal Board" />
        </div>
        <div className="form-group">
          <label>Institute Email</label>
          <Input required type="email" name="email" value={values.email} onChange={handleChange} placeholder="contact@institute.edu" />
        </div>
        <div className="form-group">
          <label>Institute Phone</label>
          <Input required name="phone" value={values.phone} onChange={handleChange} placeholder="+92 123 4567890" />
        </div>
        <div className="form-group">
          <label>Institute Logo</label>
          <div
            style={{ display: 'flex', height: '36px', width: '100%', alignItems: 'center', borderRadius: '6px', border: '1px solid #e4e4e7', background: 'transparent', paddingLeft: '12px', paddingRight: '12px', fontSize: '14px', cursor: 'pointer', boxSizing: 'border-box' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <span style={{ background: '#111', color: '#fff', padding: '3px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, marginRight: '10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Browse...
            </span>
            <span style={{ color: '#a1a1aa', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {imageFile ? imageFile.name : 'No file selected.'}
            </span>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} style={{ display: 'none' }} />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select name="status" value={values.status} onChange={handleChange} style={selectStyle}>
            <option style={optionStyle}>Active</option>
            <option style={optionStyle}>Pending</option>
            <option style={optionStyle}>Suspended</option>
          </select>
        </div>
      </div>

      <h3 className="form-section-title">Institute Admin Credentials</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Admin Full Name</label>
          <Input required name="adminFullName" value={values.adminFullName} onChange={handleChange} placeholder="Admin Name" />
        </div>
        <div className="form-group">
          <label>Admin Email</label>
          <Input type="email" required name="adminEmail" value={values.adminEmail} onChange={handleChange} placeholder="admin@institute.com" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px', paddingBottom: '4px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ height: '36px', padding: '0 20px', borderRadius: '6px', border: '1px solid #e4e4e7', background: '#fff', color: '#09090b', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{ height: '36px', padding: '0 20px', borderRadius: '6px', border: 'none', background: '#09090b', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Saving...' : 'Create Institute'}
        </button>
      </div>
    </form>
  );
}
