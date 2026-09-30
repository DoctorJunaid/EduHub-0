import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Building2, Plus, Search, Pencil, Trash2, UserPlus, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
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
import DataPagination from "@/components/shared/DataPagination";
import PageLoader from "@/components/shared/PageLoader";
import {
  fetchCampuses,
  deleteCampus,
  selectInstituteCampuses,
} from "@/store/Slices/campusesSlice";

import ManageCampusModal from "./ManageCampusModal";
import "./CampusBranches.css";

const PAGE_SIZE = 10;

export default function CampusBranches() {
  const dispatch = useDispatch();
  const campuses = useSelector(selectInstituteCampuses);
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [manageCampus, setManageCampus] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const selected = campuses.find((campus) => campus.id === modal?.id);

  useEffect(() => {
    dispatch(fetchCampuses())
      .finally(() => setLoading(false));
  }, [dispatch]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const close = () => {
    setModal(null);
  };

  const query = search.trim().toLowerCase();
  const visible = campuses.filter((campus) => {
    if (!query) return true;
    const addressStr =
      typeof campus.address === "object"
        ? `${campus.address?.street || ""} ${campus.address?.city || ""}`
        : campus.address || "";
    const managerStr =
      campus.managerId && typeof campus.managerId === "object"
        ? `${campus.managerId.name || ""} ${campus.managerId.email || ""}`
        : "";
    return `${campus.name || ""} ${addressStr} ${campus.id || ""} ${managerStr}`
      .toLowerCase()
      .includes(query);
  });

  const totalRecords = visible.length;
  const pageCount = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const activePage = Math.min(Math.max(1, page), pageCount);

  const startIndex = (activePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedCampuses = visible.slice(startIndex, endIndex);

  return (
    <section className="campus-branches" aria-labelledby="campuses-title">
      <header className="campuses-heading">
        <div>
          <h1 id="campuses-title">Campus Branches</h1>
          <p>Manage your physical locations, facilities, and campus manager credentials.</p>
        </div>
        <Button onClick={() => navigate("/institute-admin/campuses/new")}>
          <Plus size={18} />
          Add Campus
        </Button>
      </header>

      <Card className="campuses-card">
        <div className="campuses-search-bar">
          <div className="campuses-search-input-wrapper">
            <Search size={16} className="campuses-search-icon" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Search campuses"
              placeholder="Search campuses by name, address, ID or manager..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="campuses-table-container">
          <Table aria-label="Campus branches">
            <TableHeader>
              <TableRow>
                {[
                  "Campus Name",
                  "Address",
                  "Campus Manager",
                  "Status",
                  "Actions",
                ].map((label) => (
                  <TableHead key={label}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="campuses-empty">
                    <PageLoader message="Loading campus branches..." className="min-h-[140px] py-6" />
                  </TableCell>
                </TableRow>
              ) : paginatedCampuses.length > 0 ? (
                paginatedCampuses.map((campus) => {
                  const manager = campus.managerId;
                  const hasManager = !!manager && typeof manager === "object";

                  const addressDisplay =
                    typeof campus.address === "object"
                      ? campus.address?.street || campus.address?.city || "—"
                      : campus.address || "—";

                  return (
                    <TableRow key={campus.id}>
                      <TableCell>
                        <div className="campus-name">
                          <span className="campus-building">
                            <Building2 size={20} />
                          </span>
                          <div>
                            <strong>{campus.name}</strong>
                            <small>ID: {campus.id}</small>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="campus-address">
                        {addressDisplay}
                      </TableCell>
                      <TableCell className="campus-manager-cell">
                        {hasManager ? (
                          <div className="manager-info">
                            <div className="manager-name-row">
                              <strong>{manager.name}</strong>
                              <Badge
                                variant="secondary"
                                className={`manager-status-badge ${
                                  manager.status === "Active"
                                    ? "active"
                                    : "pending"
                                }`}
                              >
                                {manager.status === "Active"
                                  ? "Active"
                                  : "Pending Setup"}
                              </Badge>
                            </div>
                            <span className="manager-email" title={manager.email}>
                              {manager.email}
                            </span>
                          </div>
                        ) : (
                          <div className="manager-unassigned">
                            <span>Unassigned</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="assign-btn"
                              onClick={() => setManageCampus(campus)}
                            >
                              <UserPlus size={12} />
                              Assign
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`campus-status-badge ${
                            campus.status?.toLowerCase() === "active"
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          <span aria-hidden="true" />
                          {campus.status || "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="campus-actions">
                          <Button
                            variant="outline"
                            size="sm"
                            className="campus-manage"
                            onClick={() => setManageCampus(campus)}
                            title="Manage campus and manager credentials"
                          >
                            <Settings2 size={14} />
                            Manage
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Edit ${campus.name}`}
                            onClick={() =>
                              navigate(`/institute-admin/campuses/${campus.id}`)
                            }
                            title="Edit campus details"
                          >
                            <Pencil size={15} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 campus-delete"
                            aria-label={`Delete ${campus.name}`}
                            onClick={() =>
                              setModal({ type: "delete", id: campus.id })
                            }
                            title="Delete campus"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="campuses-empty">
                    {campuses.length
                      ? "No campuses match your search."
                      : "No campus branches found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && totalRecords > PAGE_SIZE && (
          <DataPagination
            page={activePage}
            pageSize={PAGE_SIZE}
            total={totalRecords}
            onPageChange={setPage}
            showPageSize={false}
            itemLabel="campuses"
          />
        )}
      </Card>

      <ManageCampusModal
        campus={manageCampus}
        open={!!manageCampus}
        onClose={() => setManageCampus(null)}
        onCampusUpdated={() => dispatch(fetchCampuses())}
      />

      <ConfirmDialog
        open={modal?.type === "delete" && !!selected}
        title="Delete Campus?"
        description={`Are you sure you want to delete ${
          selected?.name ?? "this campus"
        }? This action cannot be undone.`}
        confirmText="Delete Campus"
        onCancel={close}
        onConfirm={async () => {
          if (selected) {
            try {
              await dispatch(deleteCampus(selected.id)).unwrap();
              toast.success("Campus deleted successfully.");
            } catch (err) {
              toast.error(
                typeof err === "string" ? err : "Failed to delete campus."
              );
            }
          }
          close();
        }}
      />
    </section>
  );
}
