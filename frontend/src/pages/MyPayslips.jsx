import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import PayslipDialog from "../components/Payroll/PayslipDialog";
import { toast } from "react-hot-toast";

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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Payslips</h1>
          <p className="text-gray-400 mt-1">View your approved and paid salary records.</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white"
        />
      </div>
      <div className="overflow-x-auto glass-panel p-4 rounded-xl">
        {loading ? <div className="text-center text-gray-400 py-8">Loading payslips...</div> : (
          <table className="min-w-full text-left text-white">
            <thead className="border-b border-gray-700">
              <tr><th className="px-4 py-3">Month</th><th className="px-4 py-3">Gross</th><th className="px-4 py-3">Net</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr>
            </thead>
            <tbody>
              {payslips.map((payslip) => (
                <tr key={payslip._id} className="border-b border-gray-800/50">
                  <td className="px-4 py-3">{payslip.month}</td>
                  <td className="px-4 py-3">PKR {payslip.grossSalary?.toLocaleString("en-PK")}</td>
                  <td className="px-4 py-3 font-semibold text-blue-400">PKR {payslip.netSalary?.toLocaleString("en-PK")}</td>
                  <td className="px-4 py-3">{payslip.status}</td>
                  <td className="px-4 py-3"><button onClick={() => setSelectedPayslip(payslip)} className="text-blue-400 hover:text-blue-300">View payslip</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && payslips.length === 0 && <div className="text-center text-gray-400 py-8">No payslips found.</div>}
      </div>
      {selectedPayslip && <PayslipDialog payslip={selectedPayslip} onClose={() => setSelectedPayslip(null)} />}
    </div>
  );
}