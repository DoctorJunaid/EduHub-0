import React from "react";
import { FileText, Download, Eye, UploadCloud, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function DocumentsTab({ teacher }) {
  const employeeId = teacher?.employeeId || "EMP-001";
  const teacherName = teacher?.userId?.name || "Teacher";

  const documents = [
    {
      id: "doc-1",
      title: "Employment Contract & Offer Letter",
      type: "PDF Document",
      size: "1.4 MB",
      date: "Aug 15, 2020",
      verified: true,
    },
    {
      id: "doc-2",
      title: "Educational Degree & Transcripts (HEC Verified)",
      type: "PDF Document",
      size: "3.2 MB",
      date: "Aug 12, 2020",
      verified: true,
    },
    {
      id: "doc-3",
      title: "National Identity Card Copy (CNIC)",
      type: "Image Document",
      size: "820 KB",
      date: "Aug 10, 2020",
      verified: true,
    },
    {
      id: "doc-4",
      title: "Teacher Resume / Curriculum Vitae",
      type: "PDF Document",
      size: "650 KB",
      date: "Aug 05, 2020",
      verified: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-zinc-900">
            Faculty Compliance & Credentials
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Institutional verification records, contracts, and degrees for {teacherName}.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => toast.success("Document upload dialog ready")}
          className="bg-black text-white hover:bg-neutral-800 text-xs h-9"
        >
          <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="bg-white border-zinc-200/80 shadow-xs hover:shadow-sm transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-zinc-900 truncate">
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                    <span>{doc.type}</span>
                    <span>&bull;</span>
                    <span>{doc.size}</span>
                    <span>&bull;</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
                  onClick={() => toast.success(`Viewing ${doc.title}`)}
                  title="View Document"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
                  onClick={() => toast.success(`Downloading ${doc.title}`)}
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
