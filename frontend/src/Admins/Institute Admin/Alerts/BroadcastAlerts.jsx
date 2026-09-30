import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  Info,
  TriangleAlert,
  CircleAlert,
  FileText,
  Send,
  CheckCircle,
  Clock,
  Megaphone,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/Badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert as AlertBox, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import DataPagination from "@/components/shared/DataPagination";
import PageLoader from "@/components/shared/PageLoader";
import {
  fetchCampuses,
  selectInstituteCampuses,
} from "@/store/Slices/campusesSlice";
import axiosInstance from "@/api/axiosInstance";
import {
  audienceOptions,
  severities,
  validateBroadcast,
} from "./broadcastData";
import "./BroadcastAlerts.css";

const PAGE_SIZE = 10;
const severityIcons = { Info, Warning: TriangleAlert, Critical: CircleAlert };

export default function BroadcastAlerts() {
  const dispatch = useDispatch();
  const campuses = useSelector(selectInstituteCampuses);
  const [alertsList, setAlertsList] = useState([]);
  const [audience, setAudience] = useState("all");
  const [severity, setSeverity] = useState("Info");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const options = audienceOptions(campuses, [], []);

  const loadAlerts = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/institute-admin/alerts");
      setAlertsList(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch broadcast alerts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    dispatch(fetchCampuses());
    axiosInstance
      .get("/institute-admin/alerts")
      .then((res) => {
        if (!active) return;
        setAlertsList(res.data?.data || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to fetch broadcast alerts:", err);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!feedback || feedback.error) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  async function submit(event) {
    event.preventDefault();
    const error = validateBroadcast({ audience, severity, message }, options);
    if (error) {
      setFeedback({ error: true, text: error });
      toast.error(error);
      return;
    }
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/institute-admin/alerts", {
        audience,
        severity,
        message: message.trim(),
        campusId: audience.startsWith("campus:")
          ? audience.replace("campus:", "")
          : null,
      });
      setMessage("");
      setAudience("all");
      setSeverity("Info");
      setFeedback({
        error: false,
        text: "Broadcast notice published and delivered successfully.",
      });
      toast.success("Broadcast notice published successfully.");
      setLoading(true);
      await loadAlerts();
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to dispatch broadcast alert.";
      setFeedback({ error: true, text: msg });
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  const totalRecords = alertsList.length;
  const pageCount = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const activePage = Math.min(Math.max(1, page), pageCount);

  const startIndex = (activePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedAlerts = alertsList.slice(startIndex, endIndex);

  function getAudienceLabel(alert) {
    if (alert.campusId?.name)
      return `${alert.campusId.name} (Staff & Students)`;
    if (alert.audience === "all") return "All Campuses (Staff & Students)";
    if (alert.audience === "staff") return "All Staff";
    if (alert.audience === "students") return "All Students";
    return alert.audience || "All Campuses";
  }

  function formatDate(dateStr) {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Just now";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <section className="institute-broadcast" aria-label="Broadcast Alerts">
      <Card className="iba-card">
        <form onSubmit={submit} noValidate>
          <div className="iba-field">
            <Label htmlFor="broadcast-audience">Target Audience</Label>
            <Select
              value={audience}
              onValueChange={(value) => {
                setAudience(value);
                setFeedback(null);
              }}
            >
              <SelectTrigger
                id="broadcast-audience"
                className="iba-select"
                aria-required="true"
              >
                <Users className="size-4 mr-2 text-slate-500" aria-hidden="true" />
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <fieldset className="iba-field">
            <legend>Alert Severity</legend>
            <div className="iba-severities">
              {severities.map((value) => {
                const Icon = severityIcons[value];
                const isSelected = severity === value;
                return (
                  <label
                    key={value}
                    className={`iba-severity iba-${value.toLowerCase()} ${
                      isSelected ? "is-selected" : ""
                    }`}
                  >
                    <Icon className="severity-icon" aria-hidden="true" />
                    <span className="severity-label">{value}</span>
                    <input
                      type="radio"
                      name="severity"
                      value={value}
                      checked={isSelected}
                      onChange={() => {
                        setSeverity(value);
                        setFeedback(null);
                      }}
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="iba-field">
            <Label htmlFor="broadcast-message">Message Content</Label>
            <div className="iba-message-wrapper">
              <FileText className="iba-message-icon" aria-hidden="true" />
              <Textarea
                id="broadcast-message"
                placeholder="Type your alert announcement here..."
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setFeedback(null);
                }}
                aria-required="true"
                aria-invalid={feedback?.error || undefined}
                aria-describedby={feedback ? "broadcast-feedback" : undefined}
              />
            </div>
          </div>

          {feedback && (
            <AlertBox
              id="broadcast-feedback"
              className={feedback.error ? "border-red-200" : "iba-success-box"}
              role={feedback.error ? "alert" : "status"}
              variant={feedback.error ? "destructive" : "default"}
            >
              {feedback.error ? (
                <CircleAlert className="size-4 mr-2 text-red-600" aria-hidden="true" />
              ) : (
                <CheckCircle className="size-4 mr-2 text-emerald-600" aria-hidden="true" />
              )}
              <AlertDescription>{feedback.text}</AlertDescription>
            </AlertBox>
          )}

          <div className="iba-actions">
            <Button type="submit" disabled={isSubmitting}>
              <Send className="size-4 mr-2" aria-hidden="true" />
              {isSubmitting ? "Broadcasting..." : "Broadcast Now"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="iba-recent-card">
        <div className="iba-recent-header">
          <Clock size={18} className="text-slate-700" />
          <h2>Recent Broadcasts</h2>
        </div>

        <div className="iba-table-container">
          <Table aria-label="Recent broadcast notices">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px]">Severity</TableHead>
                <TableHead className="min-w-[280px]">Message</TableHead>
                <TableHead className="w-[200px]">Audience</TableHead>
                <TableHead className="w-[130px] text-right">Published</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    <PageLoader
                      message="Loading recent broadcasts..."
                      className="min-h-[120px] py-4"
                    />
                  </TableCell>
                </TableRow>
              ) : paginatedAlerts.length > 0 ? (
                paginatedAlerts.map((alert) => (
                  <TableRow key={alert._id || alert.id}>
                    <TableCell className="align-top py-3">
                      <Badge
                        variant="secondary"
                        className={`iba-severity-badge iba-badge-${alert.severity?.toLowerCase()}`}
                      >
                        <span aria-hidden="true" />
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="iba-message-cell align-top py-3">
                      {alert.message}
                    </TableCell>
                    <TableCell className="iba-audience-cell align-top py-3">
                      {getAudienceLabel(alert)}
                    </TableCell>
                    <TableCell className="iba-published-cell align-top py-3 text-right">
                      {formatDate(alert.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="iba-empty-cell">
                    <div className="iba-empty-state">
                      <div className="iba-empty-icon">
                        <Megaphone size={24} />
                      </div>
                      <h3>No broadcasts yet</h3>
                      <p>
                        Announcements sent from this page will appear here.
                      </p>
                    </div>
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
            itemLabel="broadcasts"
          />
        )}
      </Card>
    </section>
  );
}
