import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { validateCampus, campusStatuses } from "./campusData";
import { Loader2 } from "lucide-react";

export default function CampusForm({ campus, onSave, onCancel, loading }) {
  const [values, setValues] = useState({
    name: campus?.name ?? "",
    address: (typeof campus?.address === 'object' ? campus.address?.street : campus?.address) ?? "",
    status: campus?.status ?? "Active",
    managerName: "",
    managerEmail: "",
    managerPhone: "",
  });
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const message = validateCampus(values);
    setError(message);
    if (!message)
      onSave({
        ...values,
        name: values.name.trim(),
        address: { street: values.address.trim() },
        ...(campus ? { id: campus.id } : {}),
      });
  };

  return (
    <form onSubmit={submit} className="campus-form-block" noValidate aria-describedby={error ? 'campus-form-error' : undefined} style={{ maxWidth: '600px' }}>
      
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Campus Details</h3>
        <p style={{ fontSize: '14px', color: '#71717a' }}>Enter the campus name and physical address.</p>
      </div>

      <div className="campus-form-field" style={{ marginBottom: '16px' }}>
        <Label htmlFor="campus-name" style={{ display: 'block', marginBottom: '8px' }}>Campus Name</Label>
        <Input
          id="campus-name"
          name="name"
          required
          placeholder="e.g. Main Campus"
          aria-invalid={!!error && !values.name.trim()}
          value={values.name}
          onChange={(event) => {
            setValues({ ...values, name: event.target.value });
            setError("");
          }}
        />
      </div>

      <div className="campus-form-field" style={{ marginBottom: '16px' }}>
        <Label htmlFor="campus-address" style={{ display: 'block', marginBottom: '8px' }}>Address</Label>
        <Input
          id="campus-address"
          name="address"
          required
          placeholder="Street, area, city"
          aria-invalid={!!error && !values.address.trim()}
          value={values.address}
          onChange={(event) => {
            setValues({ ...values, address: event.target.value });
            setError("");
          }}
        />
      </div>

      <div className="campus-form-field" style={{ marginBottom: '24px' }}>
        <Label htmlFor="campus-status" style={{ display: 'block', marginBottom: '8px' }}>Status</Label>
        <Select value={values.status} onValueChange={(status) => { setValues({ ...values, status }); setError(''); }}>
          <SelectTrigger id="campus-status" aria-required="true"><SelectValue placeholder="Select status" /></SelectTrigger>
          <SelectContent>{campusStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {!campus && (
        <div style={{ marginTop: '32px', borderTop: '1px solid #e4e4e7', paddingTop: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Campus Manager Credentials (Optional)</h3>
            <p style={{ fontSize: '14px', color: '#71717a' }}>An account will be created and setup email sent.</p>
          </div>
          <div className="campus-form-field" style={{ marginBottom: '16px' }}>
            <Label htmlFor="manager-name" style={{ display: 'block', marginBottom: '8px' }}>Manager Full Name</Label>
            <Input
              id="manager-name"
              name="managerName"
              placeholder="e.g. Ali Ahmed"
              value={values.managerName}
              onChange={(event) => {
                setValues({ ...values, managerName: event.target.value });
              }}
            />
          </div>
          <div className="campus-form-field" style={{ marginBottom: '16px' }}>
            <Label htmlFor="manager-email" style={{ display: 'block', marginBottom: '8px' }}>Manager Email</Label>
            <Input
              id="manager-email"
              name="managerEmail"
              type="email"
              placeholder="manager@campus.edu"
              value={values.managerEmail}
              onChange={(event) => {
                setValues({ ...values, managerEmail: event.target.value });
              }}
            />
          </div>
          <div className="campus-form-field" style={{ marginBottom: '24px' }}>
            <Label htmlFor="manager-phone" style={{ display: 'block', marginBottom: '8px' }}>Manager Phone</Label>
            <Input
              id="manager-phone"
              name="managerPhone"
              type="tel"
              placeholder="+92 300 0000000"
              value={values.managerPhone}
              onChange={(event) => {
                setValues({ ...values, managerPhone: event.target.value });
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <p id="campus-form-error" className="campus-error" role="alert" style={{ color: 'red', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </p>
      )}

      <div className="campus-form-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '24px' }}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {campus ? "Save Changes" : "Create Campus"}
        </Button>
      </div>
    </form>
  );
}
