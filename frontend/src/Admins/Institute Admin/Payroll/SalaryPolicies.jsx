import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCampuses, selectInstituteCampuses } from "@/store/Slices/campusesSlice";
import axiosInstance from "@/api/axiosInstance";
import { Plus, Trash2, Save, AlertCircle, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [searchQuery, setSearchQuery] = useState("");
  
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

  const loadPolicy = useCallback(async () => {
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
  }, [selectedCampusId]);

  useEffect(() => {
    if (selectedCampusId) {
      void loadPolicy();
    }
  }, [selectedCampusId, loadPolicy]);

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

  const renderRuleTable = (rules, setRules, title, description) => {
    const query = searchQuery.trim().toLowerCase();
    const isFiltered = query.length > 0;

    const visibleRules = isFiltered
      ? rules.filter((rule) => {
          const typeMatch = rule.type.toLowerCase().includes(query);
          const minMatch = String(rule.min).includes(query);
          const maxMatch = rule.max !== null && String(rule.max).includes(query);
          const amountMatch = String(rule.amount).includes(query);
          const titleMatch = title.toLowerCase().includes(query);
          return typeMatch || minMatch || maxMatch || amountMatch || titleMatch;
        })
      : rules;

    return (
      <section className="rules-section">
        <div className="rules-section-heading">
          <h3 className="rules-section-title">{title}</h3>
          <p className="rules-section-description">{description}</p>
        </div>

        {rules.length > 0 ? (
          visibleRules.length > 0 ? (
            <>
              <div className="rule-table-scroll">
                <table className="rule-table">
                  <thead>
                    <tr>
                      <th>Min (Count)</th>
                      <th>Max (Leave empty for infinity)</th>
                      <th>Calculation Type</th>
                      <th>Amount / %</th>
                      <th className="rule-actions-column"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRules.map((rule, idx) => {
                      const realIndex = rules.indexOf(rule);
                      return (
                        <tr key={idx}>
                          <td>
                            <Input
                              type="number"
                              className="rule-input"
                              aria-label={`${title} minimum count`}
                              value={rule.min}
                              onChange={(e) => {
                                const newRules = [...rules];
                                newRules[realIndex].min = e.target.value;
                                setRules(newRules);
                              }}
                              min="0"
                            />
                          </td>
                          <td>
                            <Input
                              type="number"
                              className="rule-input"
                              aria-label={`${title} maximum count`}
                              placeholder="Infinity"
                              value={rule.max === null ? "" : rule.max}
                              onChange={(e) => {
                                const newRules = [...rules];
                                newRules[realIndex].max = e.target.value === "" ? null : e.target.value;
                                setRules(newRules);
                              }}
                            />
                          </td>
                          <td>
                            <select
                              className="rule-select"
                              aria-label={`${title} calculation type`}
                              value={rule.type}
                              onChange={(e) => {
                                const newRules = [...rules];
                                newRules[realIndex].type = e.target.value;
                                setRules(newRules);
                              }}
                            >
                              {ruleTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td>
                            <Input
                              type="number"
                              className="rule-input"
                              aria-label={`${title} amount or percentage`}
                              value={rule.amount}
                              onChange={(e) => {
                                const newRules = [...rules];
                                newRules[realIndex].amount = e.target.value;
                                setRules(newRules);
                              }}
                              disabled={rule.type === "None"}
                              min="0"
                            />
                          </td>
                          <td>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="btn-remove-rule"
                              title="Remove rule"
                              aria-label={`Remove ${title} rule ${idx + 1}`}
                              onClick={() => {
                                const newRules = [...rules];
                                newRules.splice(realIndex, 1);
                                setRules(newRules);
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="rules-add-row">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="btn-add-rule"
                  onClick={() => setRules([...rules, { ...defaultRule }])}
                >
                  <Plus size={15} /> Add Rule
                </Button>
              </div>
            </>
          ) : (
            <div className="rules-empty-state">
              <div className="rules-empty-copy">
                <strong>No matching rules found</strong>
                <span>Try clearing or modifying your search filter.</span>
              </div>
            </div>
          )
        ) : (
          <div className="rules-empty-state">
            <div className="rules-empty-copy">
              <strong>No custom rules configured</strong>
              <span>Fallback defaults are currently being used.</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="btn-add-rule"
              onClick={() => setRules([...rules, { ...defaultRule }])}
            >
              <Plus size={15} /> Add Rule
            </Button>
          </div>
        )}
      </section>
    );
  };

  return (
    <main className="salary-policies-container" aria-labelledby="salary-policies-title">
      <h1 id="salary-policies-title" className="sr-only">Salary Policy Configuration</h1>

      <div className="salary-policies-toolbar">
        <div className="salary-policy-search">
          <Search size={15} className="salary-policy-search-icon" aria-hidden="true" />
          <Input
            type="text"
            placeholder="Search policy rules or settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="salary-policy-search-input"
            aria-label="Search policy rules or settings"
          />
        </div>

        <div className="campus-selector-wrapper">
          <label htmlFor="salary-policy-campus">Target Campus</label>
          <Select
            value={selectedCampusId || undefined}
            onValueChange={setSelectedCampusId}
            disabled={!campuses.length}
          >
            <SelectTrigger id="salary-policy-campus" className="campus-select">
              <SelectValue placeholder="Select a campus" />
            </SelectTrigger>
            <SelectContent>
              {campuses.map((campus) => (
                <SelectItem key={campus._id} value={campus._id}>
                  {campus.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <Card className="policy-card loading-state">
          <RefreshCw className="salary-policy-spinner" size={26} />
          <p>Loading policy configuration...</p>
        </Card>
      ) : (
        <div className="salary-policies-stack">
          <Card className="policy-card">
            <CardHeader className="policy-card-header">
              <CardTitle className="policy-card-title">
                <span>Dynamic Deductions</span>
                {policy?.versions?.length > 0 && (
                  <span className="version-info">
                    v{policy.versions.length} - Effective {new Date(policy.versions[policy.versions.length-1].effectiveDate).toLocaleDateString()}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="policy-card-content">
              {renderRuleTable(
                missedClassRules,
                setMissedClassRules,
                "Missed Classes Deduction (No Substitute)",
                "Deduction rules applied when a teacher misses an assigned class and NO substitute is provided."
              )}
              <div className="policy-rule-divider" />
              {renderRuleTable(
                absentDayRules,
                setAbsentDayRules,
                "Absent Days Deduction (Full Day)",
                "Rules applied based on the total number of days a teacher is marked completely 'Absent' in a month."
              )}
            </CardContent>
          </Card>

          <Card className="policy-card">
            <CardHeader className="policy-card-header">
              <CardTitle className="policy-card-title">Dynamic Compensation</CardTitle>
            </CardHeader>
            <CardContent className="policy-card-content">
              {renderRuleTable(
                substituteRules,
                setSubstituteRules,
                "Substitute Teaching Bonus",
                "Compensation rules applied when a teacher completes a substitute assignment (based on existing substitute records)."
              )}
            </CardContent>
          </Card>

          <Card className="policy-card">
            <CardHeader className="policy-card-header">
              <CardTitle className="policy-card-title">Base Settings &amp; Fallbacks</CardTitle>
            </CardHeader>
            <CardContent className="policy-card-content">
              <div className="base-settings-grid">
                <div className="setting-group">
                  <label htmlFor="working-days-per-month">Working Days Per Month</label>
                  <Input
                    id="working-days-per-month"
                    type="number"
                    className="rule-input"
                    value={baseSettings.workingDaysPerMonth}
                    onChange={e => setBaseSettings({...baseSettings, workingDaysPerMonth: Number(e.target.value)})}
                  />
                </div>
                <div className="setting-group">
                  <label htmlFor="late-count-half-day">Late Count for Half-Day Penalty</label>
                  <Input
                    id="late-count-half-day"
                    type="number"
                    className="rule-input"
                    value={baseSettings.lateCountForHalfDay}
                    onChange={e => setBaseSettings({...baseSettings, lateCountForHalfDay: Number(e.target.value)})}
                  />
                </div>
                <div className="setting-group">
                  <label htmlFor="late-half-day-penalty">Late Half-Day Penalty Multiplier</label>
                  <Input
                    id="late-half-day-penalty"
                    type="number"
                    className="rule-input"
                    step="0.1"
                    value={baseSettings.lateHalfDayPenalty}
                    onChange={e => setBaseSettings({...baseSettings, lateHalfDayPenalty: Number(e.target.value)})}
                  />
                </div>
                <div className="setting-group">
                  <label htmlFor="perfect-attendance-bonus">Perfect Attendance Bonus (Fixed)</label>
                  <Input
                    id="perfect-attendance-bonus"
                    type="number"
                    className="rule-input"
                    value={baseSettings.perfectAttendanceBonus}
                    onChange={e => setBaseSettings({...baseSettings, perfectAttendanceBonus: Number(e.target.value)})}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="policy-actions">
              <div className="policy-save-note">
                <AlertCircle size={16} />
                <span>Saving creates a new policy version. Historical payroll remains unaffected.</span>
              </div>
              <Button
                type="button"
                className="btn-save"
                onClick={handleSavePolicy}
                disabled={saving || !selectedCampusId}
              >
                {saving ? (
                  <><RefreshCw className="salary-policy-spinner" size={16} /> Saving Version...</>
                ) : (
                  <><Save size={16} /> Save &amp; Apply Policy</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </main>
  );
}
