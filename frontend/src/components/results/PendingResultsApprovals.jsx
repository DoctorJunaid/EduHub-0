import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  CheckCircle2,
  XCircle,
  Share2,
  Clock,
  Award,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";
import * as resultApi from "@/api/result.api";
import toast from "react-hot-toast";

export default function PendingResultsApprovals({ onApproved }) {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const res = await resultApi.getPendingApprovals();
      setPendingList(res.data || []);
    } catch (err) {
      // Quiet fail
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sub) => {
    setActionLoading(true);
    try {
      const res = await resultApi.approveClassResults({
        classId: sub.classId,
        examName: sub.examName,
        term: sub.term,
      });
      toast.success(res.message || "Class results approved!");
      await fetchPendingApprovals();
      if (onApproved) onApproved();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to approve results");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedSubmission) return;
    setActionLoading(true);
    try {
      const res = await resultApi.rejectClassResults({
        classId: selectedSubmission.classId,
        examName: selectedSubmission.examName,
        term: selectedSubmission.term,
        rejectionReason,
      });
      toast.success(res.message || "Results returned for revision.");
      setRejectDialogOpen(false);
      setRejectionReason("");
      await fetchPendingApprovals();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to reject results");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async (sub) => {
    if (!window.confirm(`Publish report cards for ${sub.className}? Students and parents will be able to view their final results.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await resultApi.publishClassResults(sub.classId, {
        examName: sub.examName,
        term: sub.term,
      });
      toast.success(res.message || "Report cards published successfully!");
      await fetchPendingApprovals();
      if (onApproved) onApproved();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to publish report cards");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
        <Spinner size="sm" /> Checking pending result submissions...
      </div>
    );
  }

  if (pendingList.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 border border-indigo-500/30 text-white rounded-2xl p-6 shadow-xl mb-6">
        <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Award size={22} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                Pending Result Approvals
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                  {pendingList.length} Awaiting Review
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Class Teachers have compiled and submitted results for Campus Admin approval before publishing.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 pt-2 space-y-3">
          {pendingList.map((sub, idx) => (
            <div
              key={idx}
              className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold">
                  <GraduationCap size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    {sub.className} — {sub.examName} ({sub.term})
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>
                      Submitted by: <strong className="text-slate-200">{sub.classTeacher?.name || "Class Teacher"}</strong>
                    </span>
                    <span>•</span>
                    <span>{sub.studentCount} Students</span>
                    <span>•</span>
                    <span>Avg Score: <strong className="text-emerald-400">{sub.avgPercentage}%</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock size={12} /> {new Date(sub.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto self-end md:self-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedSubmission(sub);
                    setRejectDialogOpen(true);
                  }}
                  disabled={actionLoading}
                  className="border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-1"
                >
                  <XCircle size={14} /> Reject
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleApprove(sub)}
                  disabled={actionLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md shadow-indigo-600/20"
                >
                  <CheckCircle2 size={14} /> Approve
                </Button>

                <Button
                  size="sm"
                  onClick={() => handlePublish(sub)}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-600/20"
                >
                  <Share2 size={14} /> Publish Report Cards
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <DialogTitle className="text-lg font-bold text-white">
                Request Result Revision
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              Provide feedback to the Class Teacher on why results cannot be approved yet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-2">
            <Label className="text-xs text-slate-300 font-medium">
              Revision Reason / Instructions:
            </Label>
            <Textarea
              rows={3}
              placeholder="e.g. Mathematics marks entry is incomplete for 3 students. Please verify with Ms. Fatima and resubmit."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="bg-slate-800/80 border-slate-700 text-white text-xs rounded-xl"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-800">
            <Button
              variant="ghost"
              onClick={() => setRejectDialogOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectConfirm}
              disabled={actionLoading || !rejectionReason.trim()}
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs"
            >
              {actionLoading ? <Spinner size="sm" /> : "Send Revision Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
