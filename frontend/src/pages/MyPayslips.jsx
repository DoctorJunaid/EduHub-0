import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import PayslipDialog from "../components/Payroll/PayslipDialog";
import TableSkeleton from "@/components/shared/TableSkeleton";
import { toast } from "react-hot-toast";
import { qk } from "@/lib/queryKeys";
import "./MyPayslips.css";

export default function MyPayslips() {
  const [month, setMonth] = useState("");
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const {
    data: payslips = [],
    isLoading: loading,
  } = useQuery({
    queryKey: qk.myPayslips({ month }),
    queryFn: async () => {
      const response = await api.get("/campus/salary/payroll/my-payslips", {
        params: month ? { month } : {},
      });
      return response.data?.data?.records || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="teacher-payslips p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h1 className="teacher-payslips-title sr-only">My Payslips</h1>
        <input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="teacher-payslips-month rounded-lg px-4 py-2"
        />
      </div>
      <div className="overflow-x-auto glass-panel p-4 rounded-xl">
        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : (
          <table className="teacher-payslips-table min-w-full text-left">
            <thead className="teacher-payslips-thead">
              <tr>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Gross</th>
                <th className="px-4 py-3">Net</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((payslip) => (
                <tr key={payslip._id} className="teacher-payslips-row">
                  <td className="px-4 py-3">{payslip.month}</td>
                  <td className="px-4 py-3">
                    PKR {payslip.grossSalary?.toLocaleString("en-PK")}
                  </td>
                  <td className="teacher-payslips-net px-4 py-3 font-semibold">
                    PKR {payslip.netSalary?.toLocaleString("en-PK")}
                  </td>
                  <td className="px-4 py-3">{payslip.status}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedPayslip(payslip)}
                      className="teacher-payslips-link"
                    >
                      View payslip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && payslips.length === 0 && (
          <div className="teacher-payslips-muted text-center py-8">
            No payslips found.
          </div>
        )}
      </div>
      {selectedPayslip && (
        <PayslipDialog
          payslip={selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
        />
      )}
    </div>
  );
}
