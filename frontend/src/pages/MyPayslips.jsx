import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import PayslipDialog from "../components/Payroll/PayslipDialog";
import { toast } from "react-hot-toast";
import "./MyPayslips.css";

export default function MyPayslips() {
  const [month, setMonth] = useState("");
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  useEffect(() => {
    const loadPayslips = async () => {
      try {
        setLoading(true);
        const response = await api.get("/campus/salary/payroll/my-payslips", {
          params: month ? { month } : {},
        });
        setPayslips(response.data.data.records || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load payslips");
      } finally {
        setLoading(false);
      }
    };
    loadPayslips();
  }, [month]);

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
          <div className="teacher-payslips-muted text-center py-8">
            Loading payslips...
          </div>
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
