import axiosInstance from "./axiosInstance";

/**
 * Multi-Campus Revenue & Fees Collection API
 */
export const instituteRevenueApi = {
  // Get aggregated revenue analytics and campus comparisons
  getAnalytics: async (params = {}) => {
    const res = await axiosInstance.get("/institute-admin/revenue/analytics", { params });
    return res.data;
  },

  // Get paginated transactions ledger across campuses
  getTransactions: async (params = {}) => {
    const res = await axiosInstance.get("/institute-admin/revenue/transactions", { params });
    return res.data;
  },

  // Get paginated student fee records / invoices
  getFeeRecords: async (params = {}) => {
    const res = await axiosInstance.get("/institute-admin/revenue/records", { params });
    return res.data;
  },

  // Get fee structures configured across all campuses
  getFeeStructures: async (params = {}) => {
    const res = await axiosInstance.get("/institute-admin/revenue/fee-structures", { params });
    return res.data;
  },

  // Export full revenue dataset
  exportData: async (params = {}) => {
    const res = await axiosInstance.get("/institute-admin/revenue/export", { params });
    return res.data;
  },
};

export default instituteRevenueApi;
