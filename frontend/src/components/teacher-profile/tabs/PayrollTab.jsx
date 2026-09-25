import React, { useEffect, useState } from "react";
import {
  Wallet,
  Receipt,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Eye,
  Edit,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/Table";
import { PageLoader } from "@/components/ui/spinner";
import PayslipDialog from "@/components/Payroll/PayslipDialog";
import toast from "react-hot-toast";

const formatPKR = (val) => `PKR ${Number(val || 0).toLocaleString("en-PK")}`;

export default function PayrollTab({
  teacher,
  payrollData,
  loading,
  onLoadPayroll,
}) {
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  useEffect(() => {
    onLoadPayroll();
  }, [onLoadPayroll]);

  if (loading && !payrollData) {
    return <PageLoader text="Loading salary & payroll records..." />;
  }

  const salaryProfile = payrollData?.salaryProfile || {};
  const payrolls = payrollData?.payrolls || [];

  const allowances = Array.isArray(salaryProfile.allowances)
    ? salaryProfile.allowances
    : [{ title: "Medical Allowance", amount: 5000 }];

  const allowancesTotal = allowances.reduce(
    (sum, a) => sum + (Number(a.amount) || 0),
    0
  );
  const baseSalary = Number(salaryProfile.baseSalary) || 65000;
  const grossSalary = baseSalary + allowancesTotal;
  const taxDeduction = Number(salaryProfile.taxDeduction) || 2500;
  const dailyRate = salaryProfile.dailyRate || Math.round(grossSalary / 26);

  return (
    <div className="space-y-6">
      {/* 1. Salary Profile Overview Card */}
      <Card className="bg-white border-zinc-200/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-zinc-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-zinc-600" />
              Contracted Salary Structure & Allowances
            </CardTitle>
            <p className="text-xs text-zinc-500 mt-0.5">
              Current recurring compensation profile configured in Campus Finance.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Redirecting to Salary Profile manager")}
            className="text-xs h-8 border-zinc-200 hover:bg-zinc-50"
          >
            <Edit className="w-3.5 h-3.5 mr-1" />
            Edit Profile
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase">Base Salary</span>
              <p className="text-lg font-bold text-zinc-900 mt-1 font-mono">{formatPKR(baseSalary)}</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase">Allowances</span>
              <p className="text-lg font-bold text-emerald-600 mt-1 font-mono">+{formatPKR(allowancesTotal)}</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase">Tax Deduction</span>
              <p className="text-lg font-bold text-rose-600 mt-1 font-mono">-{formatPKR(taxDeduction)}</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900 text-white">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase">Gross Salary</span>
              <p className="text-lg font-bold text-white mt-1 font-mono">{formatPKR(grossSalary)}</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
            <span>
              Calculated Standard Daily Rate: <strong>{formatPKR(dailyRate)}/day</strong> (Based on 26 monthly working days policy)
            </span>
            <Badge variant="outline" className="bg-white text-zinc-800 border-zinc-200 font-semibold text-[10px]">
              Active Structure
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 2. Monthly Payroll Disbursal History */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-zinc-600" />
            Monthly Payroll Disbursals
          </h3>
          <span className="text-xs text-zinc-500">
            Last {payrolls.length} months records
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500">
                <TableHead className="font-semibold">Month</TableHead>
                <TableHead className="font-semibold">Gross Salary</TableHead>
                <TableHead className="font-semibold">Deductions</TableHead>
                <TableHead className="font-semibold">Bonuses</TableHead>
                <TableHead className="font-semibold">Net Disbursed</TableHead>
                <TableHead className="font-semibold text-center">Status</TableHead>
                <TableHead className="font-semibold text-right">Payslip</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-zinc-500 text-xs">
                    No historical monthly payroll records generated yet.
                  </TableCell>
                </TableRow>
              ) : (
                payrolls.map((p) => (
                  <TableRow key={p._id} className="hover:bg-zinc-50/50 text-xs">
                    <TableCell className="font-bold text-zinc-900 font-mono">
                      {p.month}
                    </TableCell>
                    <TableCell className="font-mono text-zinc-800">
                      {formatPKR(p.grossSalary)}
                    </TableCell>
                    <TableCell className="font-mono text-rose-600">
                      -{formatPKR(p.deductionsTotal)}
                    </TableCell>
                    <TableCell className="font-mono text-emerald-600">
                      +{formatPKR(p.bonusesTotal)}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-zinc-950">
                      {formatPKR(p.netSalary)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          p.status === "Paid"
                            ? "bg-emerald-100 text-emerald-800 font-semibold"
                            : "bg-blue-100 text-blue-800 font-semibold"
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedPayslip({
                            ...p,
                            teacherProfileId: teacher,
                          })
                        }
                        className="h-7 text-xs font-semibold text-zinc-700 hover:text-black gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Payslip Dialog Modal */}
      {selectedPayslip && (
        <PayslipDialog
          payslip={selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
        />
      )}
    </div>
  );
}
