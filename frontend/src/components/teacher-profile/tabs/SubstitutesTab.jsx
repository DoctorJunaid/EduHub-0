import React, { useEffect } from "react";
import { Users, CalendarCheck, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/Table";
import { PageLoader } from "@/components/ui/spinner";

const formatPKR = (val) => `PKR ${Number(val || 0).toLocaleString("en-PK")}`;

export default function SubstitutesTab({
  substitutesData,
  loading,
  onLoadSubstitutes,
}) {
  useEffect(() => {
    onLoadSubstitutes();
  }, [onLoadSubstitutes]);

  if (loading && !substitutesData) {
    return <PageLoader text="Loading substitute records..." />;
  }

  const dutiesCovered = substitutesData?.dutiesCovered || [];
  const dutiesMissed = substitutesData?.dutiesMissed || [];

  return (
    <div className="space-y-6">
      {/* 1. Duties Covered Table (As Substitute) */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              Substitute Duties Covered
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Classes where this teacher covered for an absent colleague (Bonus accrued).
            </p>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-xs">
            {dutiesCovered.length} Covered
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Period</TableHead>
                <TableHead className="font-semibold">Class / Section</TableHead>
                <TableHead className="font-semibold">Subject</TableHead>
                <TableHead className="font-semibold">Original Teacher</TableHead>
                <TableHead className="font-semibold text-right">Substitute Bonus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dutiesCovered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-500 text-xs">
                    No substitute cover duties performed in the current period.
                  </TableCell>
                </TableRow>
              ) : (
                dutiesCovered.map((c) => (
                  <TableRow key={c._id} className="hover:bg-zinc-50/50 text-xs">
                    <TableCell className="font-medium font-mono text-zinc-900">
                      {c.date}
                    </TableCell>
                    <TableCell className="font-medium">Period {c.period}</TableCell>
                    <TableCell className="font-semibold text-zinc-900">{c.class}</TableCell>
                    <TableCell>{c.subject}</TableCell>
                    <TableCell className="text-zinc-600">{c.originalTeacher}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-600">
                      +{formatPKR(c.bonus)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 2. Duties Missed Table (Covered by Others) */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Absences &amp; Duties Covered by Colleagues
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Classes where this teacher was absent and an alternate faculty member conducted the lesson.
            </p>
          </div>
          <Badge variant="outline" className="bg-zinc-100 text-zinc-700 font-semibold text-xs">
            {dutiesMissed.length} Occurrences
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Period</TableHead>
                <TableHead className="font-semibold">Class / Section</TableHead>
                <TableHead className="font-semibold">Subject</TableHead>
                <TableHead className="font-semibold">Covered By</TableHead>
                <TableHead className="font-semibold text-right">Adjustment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dutiesMissed.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-500 text-xs">
                    No substitute transfers recorded for this teacher.
                  </TableCell>
                </TableRow>
              ) : (
                dutiesMissed.map((m) => (
                  <TableRow key={m._id} className="hover:bg-zinc-50/50 text-xs">
                    <TableCell className="font-medium font-mono text-zinc-900">
                      {m.date}
                    </TableCell>
                    <TableCell className="font-medium">Period {m.period}</TableCell>
                    <TableCell className="font-semibold text-zinc-900">{m.class}</TableCell>
                    <TableCell>{m.subject}</TableCell>
                    <TableCell className="text-zinc-600">{m.coveredBy}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-rose-600">
                      {m.deduction > 0 ? `-${formatPKR(m.deduction)}` : "Excused"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
