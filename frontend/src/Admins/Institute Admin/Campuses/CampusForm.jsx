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
import { validateCampus } from "./campusData";

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
        <form onSubmit={submit} className="campus-form">
          <Label htmlFor="campus-name">Campus Name</Label>
          <Input
            id="campus-name"
            name="name"
            required
            value={values.name}
            onChange={(event) => {
              setValues({ ...values, name: event.target.value });
              setError("");
            }}
          />
          <Label htmlFor="campus-address">Address</Label>
          <Input
            id="campus-address"
            name="address"
            required
            value={values.address}
            onChange={(event) => {
              setValues({ ...values, address: event.target.value });
              setError("");
            }}
          />
          <Label htmlFor="campus-status">Status</Label>
          <Input id="campus-status" value={values.status} readOnly />
          {error && (
            <p className="campus-error" role="alert">
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
