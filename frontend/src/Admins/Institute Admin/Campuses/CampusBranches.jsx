import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Plus, Search, Pencil, Trash2, User, UserPlus, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  fetchCampuses,
  createCampus,
  updateCampus,
  deleteCampus,
  selectInstituteCampuses,
} from "@/store/Slices/campusesSlice";

import ManageCampusModal from "./ManageCampusModal";
import { filterCampuses } from "./campusData";
import "./CampusBranches.css";

export default function CampusBranches() {
  const dispatch = useDispatch();
  const campuses = useSelector(selectInstituteCampuses);
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [manageCampus, setManageCampus] = useState(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const selected = campuses.find((campus) => campus.id === modal?.id);
  const visible = filterCampuses(campuses, search);

  useEffect(() => {
    dispatch(fetchCampuses());
  }, [dispatch]);

  const close = () => {
    setModal(null);
  };

  return (
    <section className="campus-branches" aria-labelledby="campuses-title">
      <header className="campuses-heading">
        <div>
          <h1 id="campuses-title">Campus Branches</h1>
          <p>Manage your physical locations, facilities, and campus manager credentials.</p>
        </div>
        <Button onClick={() => navigate("/institute-admin/campuses/new")}>
          <Plus size={20} />
          Add Campus
        </Button>
      </header>
      <Card className="campuses-card">
        <label className="campuses-search">
          <Search size={20} aria-hidden="true" />
          <Input
            type="search"
            aria-label="Search campuses"
            placeholder="Search campuses..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <Table aria-label="Campus branches">
          <TableHeader>
            <TableRow>
              {["Campus Name", "Address", "Campus Manager", "Status", "Actions"].map((label) => (
                <TableHead key={label}>{label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((campus) => {
              const manager = campus.managerId;
              const hasManager = !!manager && typeof manager === "object";

              return (
                <TableRow key={campus.id}>
                  <TableCell>
                    <div className="campus-name">
                      <span className="campus-building">
                        <Building2 size={26} />
                      </span>
                      <div>
                        <strong>{campus.name}</strong>
                        <small>ID: {campus.id}</small>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {typeof campus.address === "object"
                      ? campus.address?.street || campus.address?.city || "—"
                      : campus.address || "—"}
                  </TableCell>
                  <TableCell>
                    {hasManager ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <strong style={{ fontSize: "13px", color: "#09090b" }}>{manager.name}</strong>
                          <Badge
                            variant="secondary"
                            style={{
                              fontSize: "10px",
                              padding: "1px 6px",
                              fontWeight: 700,
                              background: manager.status === "Active" ? "#ecfdf5" : "#fef3c7",
                              color: manager.status === "Active" ? "#065f46" : "#92400e",
                              border: `1px solid ${manager.status === "Active" ? "#a7f3d0" : "#fde68a"}`,
                            }}
                          >
                            {manager.status === "Active" ? "Active" : "Pending Setup"}
                          </Badge>
                        </div>
                        <small style={{ color: "#71717a", fontSize: "12px" }}>{manager.email}</small>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#a1a1aa", fontStyle: "italic" }}>
                          Unassigned
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          style={{ height: "24px", padding: "0 8px", fontSize: "11px", fontWeight: 600 }}
                          onClick={() => setManageCampus(campus)}
                        >
                          <UserPlus size={12} style={{ marginRight: "3px" }} />
                          Assign
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="campus-active">
                      <span aria-hidden="true" />
                      {campus.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="campus-actions">
                      <Button
                        variant="outline"
                        className="campus-manage"
                        style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        onClick={() => setManageCampus(campus)}
                        title="Manage campus and manager credentials"
                      >
                        <Settings2 size={15} />
                        Manage
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Edit ${campus.name}`}
                        onClick={() => navigate(`/institute-admin/campuses/${campus.id}`)}
                      >
                        <Pencil size={19} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="campus-delete"
                        aria-label={`Delete ${campus.name}`}
                        onClick={() =>
                          setModal({ type: "delete", id: campus.id })
                        }
                      >
                        <Trash2 size={19} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!visible.length && (
              <TableRow>
                <TableCell colSpan={5} className="campuses-empty">
                  {campuses.length
                    ? "No campuses match your search."
                    : "No campuses found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <span role="status" className="sr-only">
          {notice}
        </span>
      </Card>

      {/* Comprehensive Manage Campus & Manager Modal */}
      <ManageCampusModal
        campus={manageCampus}
        open={!!manageCampus}
        onClose={() => setManageCampus(null)}
        onCampusUpdated={() => dispatch(fetchCampuses())}
      />

      <ConfirmDialog
        open={modal?.type === "delete" && !!selected}
        title="Delete Campus?"
        description={`Are you sure you want to delete ${selected?.name ?? "this campus"}? This action cannot be undone.`}
        confirmText="Delete Campus"
        onCancel={close}
        onConfirm={async () => {
          if (selected) {
            try {
              await dispatch(deleteCampus(selected.id)).unwrap();
              setNotice("Campus deleted successfully.");
            } catch (err) {
              setNotice(typeof err === "string" ? err : "Failed to delete campus.");
            }
          }
          close();
        }}
      />
    </section>
  );
}
