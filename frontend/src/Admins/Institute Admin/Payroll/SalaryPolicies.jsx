import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCampuses, selectInstituteCampuses } from "@/store/Slices/campusesSlice";
import axiosInstance from "@/api/axiosInstance";
import { DollarSign, Plus, Trash2, Save, AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import "./SalaryPolicies.css";

const ruleTypes = ["None", "Fixed Amount", "Percentage", "Per Class", "Per Day"];

const defaultRule = {
  min: 0,
  max: null,
  type: "Fixed Amount",
  amount: 0,
};

export default function SalaryPolicies() {
  const dispatch = useDispatch();
  const campuses = useSelector(selectInstituteCampuses);
  
  const [selectedCampusId, setSelectedCampusId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState(null);
  
  // Form State for editing the new version
  const [missedClassRules, setMissedClassRules] = useState([]);
  const [absentDayRules, setAbsentDayRules] = useState([]);
  const [substituteRules, setSubstituteRules] = useState([]);
  const [baseSettings, setBaseSettings] = useState({
    workingDaysPerMonth: 26,
    unpaidAbsentMultiplier: 1.0,
    unpaidLeaveMultiplier: 1.0,
    halfDayMultiplier: 0.5,
    lateCountForHalfDay: 3,
    lateHalfDayPenalty: 0.5,
    earlyLeaveMultiplier: 0.5,
    perfectAttendanceBonus: 2000,
    extraClassBonus: 400,
    examDutyBonus: 300,
  });

  useEffect(() => {
    dispatch(fetchCampuses());
  }, [dispatch]);

  useEffect(() => {
    if (campuses.length > 0 && !selectedCampusId) {
      setSelectedCampusId(campuses[0]._id);
    }
  }, [campuses, selectedCampusId]);

  useEffect(() => {
    if (selectedCampusId) {
      loadPolicy();
    }
  }, [selectedCampusId]);

  const loadPolicy = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/campus/salary/policy?campusId=${selectedCampusId}`);
      if (response.data.success) {
        const p = response.data.data;
        setPolicy(p);
        
        // Find active version or use root fields
        let activeVersion = null;
        if (p.versions && p.versions.length > 0) {
          activeVersion = p.versions.find(v => v._id === p.activeVersionId) || p.versions[p.versions.length - 1];
        }

        const source = activeVersion || p;
        
        setMissedClassRules(source.missedClassDeductionRules || []);
        setAbsentDayRules(source.absentDayDeductionRules || []);
        setSubstituteRules(source.substituteBonusRules || []);
        
        setBaseSettings({
          workingDaysPerMonth: source.workingDaysPerMonth ?? 26,
          unpaidAbsentMultiplier: source.unpaidAbsentMultiplier ?? 1.0,
          unpaidLeaveMultiplier: source.unpaidLeaveMultiplier ?? 1.0,
          halfDayMultiplier: source.halfDayMultiplier ?? 0.5,
          lateCountForHalfDay: source.lateCountForHalfDay ?? 3,
          lateHalfDayPenalty: source.lateHalfDayPenalty ?? 0.5,
          earlyLeaveMultiplier: source.earlyLeaveMultiplier ?? 0.5,
          perfectAttendanceBonus: source.perfectAttendanceBonus ?? 2000,
          extraClassBonus: source.extraClassBonus ?? 400,
          examDutyBonus: source.examDutyBonus ?? 300,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load salary policy");
    } finally {
      setLoading(false);
    }
  };

  const validateRules = (rules, name) => {
    // Simple validation for overlapping thresholds
    let lastMax = -1;
    let sorted = [...rules].sort((a, b) => a.min - b.min);
    
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].min < 0) return `${name}: Minimum threshold cannot be negative.`;
      
      // If the previous rule had no maximum (infinity), any subsequent rule will overlap
      if (i > 0 && lastMax === null) {
        return `${name}: Rule with no maximum overlaps with subsequent rules.`;
      }
      
      if (sorted[i].min <= lastMax && lastMax !== null) {
        return `${name}: Overlapping thresholds detected at ${sorted[i].min}.`;
      }
      if (sorted[i].max !== null && sorted[i].max !== "" && sorted[i].max < sorted[i].min) {
        return `${name}: Max threshold must be greater than or equal to Min.`;
      }
      if (sorted[i].amount < 0) return `${name}: Amount cannot be negative.`;
      
      lastMax = sorted[i].max !== "" && sorted[i].max !== null ? parseFloat(sorted[i].max) : null;
    }
    return null;
  };

  const handleSavePolicy = async () => {
    // Validation
    const errors = [
      validateRules(missedClassRules, "Missed Class Deductions"),
      validateRules(absentDayRules, "Absent Day Deductions"),
      validateRules(substituteRules, "Substitute Compensation")
    ].filter(Boolean);

    if (errors.length > 0) {
      errors.forEach(e => toast.error(e));
      return;
    }

    // Prepare payload
    // Clean up empty strings for max (treat as null)
    const cleanRules = (rules) => rules.map(r => ({
      ...r,
      max: (r.max === "" || r.max === null || r.max === undefined) ? null : Number(r.max),
      min: Number(r.min),
      amount: Number(r.amount)
    }));

    const payload = {
      campusId: selectedCampusId,
      newVersion: {
        versionName: `Policy Update - ${new Date().toLocaleDateString()}`,
        effectiveDate: new Date().toISOString(),
        missedClassDeductionRules: cleanRules(missedClassRules),
        absentDayDeductionRules: cleanRules(absentDayRules),
        substituteBonusRules: cleanRules(substituteRules),
        ...baseSettings
      }
    };

    setSaving(true);
    try {
      const response = await axiosInstance.put("/campus/salary/policy", payload);
      if (response.data.success) {
        toast.success("Salary policy updated successfully");
        loadPolicy(); // reload
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update policy");
    } finally {
      setSaving(false);
    }
  };

  const renderRuleTable = (rules, setRules, title, description) => (
    <div className="rules-section">
      <div className="rules-section-title">
        {title}
      </div>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>{description}</p>
      
      {rules.length > 0 ? (
        <table className="rule-table">
          <thead>
            <tr>
              <th>Min (Count)</th>
              <th>Max (Leave empty for infinity)</th>
              <th>Calculation Type</th>
              <th>Amount / %</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule, idx) => (
              <tr key={idx}>
                <td>
                  <input
                    type="number"
                    className="rule-input"
                    value={rule.min}
                    onChange={(e) => {
                      const newRules = [...rules];
                      newRules[idx].min = e.target.value;
                      setRules(newRules);
                    }}
                    min="0"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="rule-input"
                    placeholder="Infinity"
                    value={rule.max === null ? "" : rule.max}
                    onChange={(e) => {
                      const newRules = [...rules];
                      newRules[idx].max = e.target.value === "" ? null : e.target.value;
                      setRules(newRules);
                    }}
                  />
                </td>
                <td>
                  <select
                    className="rule-select"
                    value={rule.type}
                    onChange={(e) => {
                      const newRules = [...rules];
                      newRules[idx].type = e.target.value;
                      setRules(newRules);
                    }}
                  >
                    {ruleTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    className="rule-input"
                    value={rule.amount}
                    onChange={(e) => {
                      const newRules = [...rules];
                      newRules[idx].amount = e.target.value;
                      setRules(newRules);
                    }}
                    disabled={rule.type === "None"}
                    min="0"
                  />
                </td>
                <td>
                  <button
                    className="btn-remove-rule"
                    title="Remove rule"
                    onClick={() => {
                      const newRules = [...rules];
                      newRules.splice(idx, 1);
                      setRules(newRules);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem', border: '1px dashed #cbd5e1' }}>
          No dynamic rules configured. Using fallback defaults.
        </div>
      )}
      <button 
        className="btn-add-rule" 
        onClick={() => setRules([...rules, { ...defaultRule }])}
      >
        <Plus size={16} /> Add Rule
      </button>
    </div>
  );

  return (
    <div className="salary-policies-container">
      <div className="salary-policies-header">
        <h1>
          <DollarSign size={28} style={{ color: '#3b82f6' }} />
          Salary Policy Configuration
        </h1>
        <div className="campus-selector-wrapper">
          <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>Target Campus:</span>
          <select
            className="campus-select"
            value={selectedCampusId}
            onChange={(e) => setSelectedCampusId(e.target.value)}
          >
            {campuses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <RefreshCw className="empty-state-icon" style={{ animation: 'spin 1s linear infinite' }} size={32} />
          <p>Loading policy configuration...</p>
        </div>
      ) : (
        <>
          <div className="policy-card">
            <div className="policy-card-header">
              <h2>
                Dynamic Deductions
                {policy?.versions?.length > 0 && (
                  <span className="version-info">
                    v{policy.versions.length} (Effective: {new Date(policy.versions[policy.versions.length-1].effectiveDate).toLocaleDateString()})
                  </span>
                )}
              </h2>
            </div>
            <div className="policy-card-content">
              {renderRuleTable(
                missedClassRules, 
                setMissedClassRules, 
                "Missed Classes Deduction (No Substitute)",
                "Deduction rules applied when a teacher misses an assigned class and NO substitute is provided."
              )}
              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '2rem 0' }} />
              {renderRuleTable(
                absentDayRules, 
                setAbsentDayRules, 
                "Absent Days Deduction (Full Day)",
                "Rules applied based on the total number of days a teacher is marked completely 'Absent' in a month."
              )}
            </div>
          </div>

          <div className="policy-card">
            <div className="policy-card-header">
              <h2>Dynamic Compensation</h2>
            </div>
            <div className="policy-card-content">
              {renderRuleTable(
                substituteRules, 
                setSubstituteRules, 
                "Substitute Teaching Bonus",
                "Compensation rules applied when a teacher completes a substitute assignment (based on existing substitute records)."
              )}
            </div>
          </div>

          <div className="policy-card">
            <div className="policy-card-header">
              <h2>Base Settings & Fallbacks</h2>
            </div>
            <div className="policy-card-content">
              <div className="base-settings-grid">
                <div className="setting-group">
                  <label>Working Days Per Month</label>
                  <input 
                    type="number" 
                    className="rule-input" 
                    value={baseSettings.workingDaysPerMonth} 
                    onChange={e => setBaseSettings({...baseSettings, workingDaysPerMonth: Number(e.target.value)})}
                  />
                </div>
                <div className="setting-group">
                  <label>Late Count for Half-Day Penalty</label>
                  <input 
                    type="number" 
                    className="rule-input" 
                    value={baseSettings.lateCountForHalfDay} 
                    onChange={e => setBaseSettings({...baseSettings, lateCountForHalfDay: Number(e.target.value)})}
                  />
                </div>
                <div className="setting-group">
                  <label>Late Half-Day Penalty Multiplier</label>
                  <input 
                    type="number" 
                    className="rule-input" 
                    step="0.1"
                    value={baseSettings.lateHalfDayPenalty} 
                    onChange={e => setBaseSettings({...baseSettings, lateHalfDayPenalty: Number(e.target.value)})}
                  />
                </div>
                <div className="setting-group">
                  <label>Perfect Attendance Bonus (Fixed)</label>
                  <input 
                    type="number" 
                    className="rule-input" 
                    value={baseSettings.perfectAttendanceBonus} 
                    onChange={e => setBaseSettings({...baseSettings, perfectAttendanceBonus: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>
            
            <div className="policy-actions">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem', marginRight: 'auto' }}>
                <AlertCircle size={16} />
                Saving creates a new policy version. Historical payroll remains unaffected.
              </div>
              <button 
                className="btn-save" 
                onClick={handleSavePolicy} 
                disabled={saving}
              >
                {saving ? (
                  <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Saving Version...</>
                ) : (
                  <><Save size={18} /> Save & Apply Policy</>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
