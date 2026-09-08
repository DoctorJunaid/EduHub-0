import { useId, useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { scheduleStatuses } from "./timetableData.js";
import { weekdays } from "../../../lib/schedule.js";

export default function ScheduleClassForm({
  record,
  options,
  onSave,
  onClose,
}) {
  const id = useId();
  const [values, setValues] = useState(() => ({
    subject: record?.subject ?? "",
    program: record?.program ?? options.program[0] ?? "",
    section: record?.section ?? "",
    instructor: record?.instructor ?? options.instructor[0] ?? "",
    room: record?.room ?? options.room[0] ?? "",
    days: record?.days ?? [],
    startTime: record?.startTime ?? "",
    endTime: record?.endTime ?? "",
    status: record?.status ?? "Active",
  }));
  const [error, setError] = useState("");
  const change = (key, value) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setError("");
  };
  const submit = (event) => {
    event.preventDefault();
    if (!values.days.length) return setError("Select at least one weekday.");
    if (values.endTime <= values.startTime)
      return setError("End time must be after start time.");
    onSave(
      Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          typeof value === "string" ? value.trim() : value,
        ]),
      ),
    );
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="tt-dialog"
        overlayClassName="tt-overlay"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <div className="tt-dialog-heading">
          <DialogTitle>
            {record ? "Edit Scheduled Class" : "Schedule New Class"}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" aria-label="Close schedule form">
              <X size={22} />
            </Button>
          </DialogClose>
        </div>
        <form onSubmit={submit}>
          <div className="tt-form-grid">
            {[
              { key: "subject", label: "Subject / Class Name" },
              { key: "program", label: "Program", choices: options.program },
              { key: "section", label: "Section" },
              {
                key: "instructor",
                label: "Instructor",
                choices: options.instructor,
              },
              { key: "room", label: "Room / Lab", choices: options.room },
              { key: "status", label: "Status", choices: scheduleStatuses },
              { key: "startTime", label: "Start Time", type: "time" },
              { key: "endTime", label: "End Time", type: "time" },
            ].map(({ key, label, choices, type }) => (
              <div className="tt-field" key={key}>
                <Label htmlFor={`${id}-${key}`}>{label}</Label>
                {choices ? (
                  <select
                    id={`${id}-${key}`}
                    required
                    value={values[key]}
                    onChange={(event) => change(key, event.target.value)}
                  >
                    {choices.map((choice) => (
                      <option key={choice}>{choice}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={`${id}-${key}`}
                    name={key}
                    type={type || "text"}
                    required
                    value={values[key]}
                    onChange={(event) => {
                      event.target.setCustomValidity(
                        event.target.value.trim()
                          ? ""
                          : `${label} is required.`,
                      );
                      change(key, event.target.value);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <fieldset className="tt-days">
            <legend>Day(s)</legend>
            {weekdays.map((day, index) => (
              <label key={day}>
                <input
                  type="checkbox"
                  checked={values.days.includes(index + 1)}
                  onChange={(event) =>
                    change(
                      "days",
                      event.target.checked
                        ? [...values.days, index + 1].sort()
                        : values.days.filter((value) => value !== index + 1),
                    )
                  }
                />
                {day.slice(0, 3)}
              </label>
            ))}
          </fieldset>
          {error && (
            <p role="alert" className="tt-error">
              {error}
            </p>
          )}
          <div className="tt-dialog-actions">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {record ? "Save Changes" : "Schedule Class"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
