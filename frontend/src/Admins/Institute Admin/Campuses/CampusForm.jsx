import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { validateCampus, campusStatuses } from "./campusData";

export default function CampusForm({ campus, onSave, onClose }) {
  const [values, setValues] = useState({
    name: campus?.name ?? "",
    address: campus?.address ?? "",
    status: campus?.status ?? "Active",
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
        address: values.address.trim(),
        ...(campus ? { id: campus.id } : {}),
      });
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="campus-form-dialog">
        <DialogHeader>
          <DialogTitle>{campus ? "Edit Campus" : "Add Campus"}</DialogTitle>
          <DialogDescription>
            Enter the campus name and physical address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="campus-form" noValidate aria-describedby={error ? 'campus-form-error' : undefined}>
          <div className="campus-form-field">
          <Label htmlFor="campus-name">Campus Name</Label>
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
          <div className="campus-form-field">
          <Label htmlFor="campus-address">Address</Label>
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
          <div className="campus-form-field">
          <Label htmlFor="campus-status">Status</Label>
          <Select value={values.status} onValueChange={(status) => { setValues({ ...values, status }); setError(''); }}>
            <SelectTrigger id="campus-status" aria-required="true"><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>{campusStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
          </Select>
          </div>
          {error && (
            <p id="campus-form-error" className="campus-error" role="alert">
              {error}
            </p>
          )}
          <div className="campus-form-actions">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {campus ? "Save Changes" : "Add Campus"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
