import { useCallback, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchCampuses, selectInstituteCampuses, selectCampusesStatus } from "@/store/Slices/campusesSlice";
import axiosInstance from "@/api/axiosInstance";
import { Plus, Trash2, Save, AlertCircle, RefreshCw, Search, RotateCcw, Check, Building2, HelpCircle } from "lucide-react";
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

const defaultBaseSettings = {
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
};

export default function SalaryPolicies() {
  const dispatch = useDispatch();
  const campuses = useSelector(selectInstituteCampuses);
  const campusesStatus = useSelector(selectCampusesStatus);
  
  const [selectedCampusId, setSelectedCampusId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form State
  const [missedClassRules, setMissedClassRules] = useState([]);
  const [absentDayRules, setAbsentDayRules] = useState([]);
  const [substituteRules, setSubstituteRules] = useState([]);
  const [baseSettings, setBaseSettings] = useState({ ...defaultBaseSettings });

  // Snapshot for dirty checking & revert
  const [initialSnapshot, setInitialSnapshot] = useState(null);

  useEffect(() => {
    dispatch(fetchCampuses());
  }, [dispatch]);

  // Set initial selected campus once campuses load
  useEffect(() => {
    if (campuses && campuses.length > 0 && !selectedCampusId) {
      const firstId = campuses[0].id || campuses[0]._id;
      if (firstId) {
        setSelectedCampusId(String(firstId));
      }
    }
  }, [campuses, selectedCampusId]);

  const loadPolicy = useCallback(async () => {
    if (!selectedCampusId) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/campus/salary/policy?campusId=${selectedCampusId}`);
      if (response.data?.success) {
        const p = response.data.data;
        setPolicy(p);
        
        // Find active version or use root fields
        let activeVersion = null;
        if (p.versions && p.versions.length > 0) {
          activeVersion =
            p.versions.find((v) => String(v._id || v.id) === String(p.activeVersionId)) ||
            p.versions[p.versions.length - 1];
        }

        const source = activeVersion || p;
        
        const missed = (source.missedClassDeductionRules || []).map(r => ({
          min: r.min ?? 0,
          max: r.max ?? null,
          type: r.type || "Fixed Amount",
          amount: r.amount ?? 0,
        }));

        const absent = (source.absentDayDeductionRules || []).map(r => ({
          min: r.min ?? 0,
          max: r.max ?? null,
          type: r.type || "Fixed Amount",
          amount: r.amount ?? 0,
        }));

        const substitute = (source.substituteBonusRules || []).map(r => ({
          min: r.min ?? 0,
          max: r.max ?? null,
          type: r.type || "Fixed Amount",
          amount: r.amount ?? 0,
        }));

        const base = {
          workingDaysPerMonth: source.workingDaysPerMonth ?? defaultBaseSettings.workingDaysPerMonth,
          unpaidAbsentMultiplier: source.unpaidAbsentMultiplier ?? defaultBaseSettings.unpaidAbsentMultiplier,
          unpaidLeaveMultiplier: source.unpaidLeaveMultiplier ?? defaultBaseSettings.unpaidLeaveMultiplier,
          halfDayMultiplier: source.halfDayMultiplier ?? defaultBaseSettings.halfDayMultiplier,
          lateCountForHalfDay: source.lateCountForHalfDay ?? defaultBaseSettings.lateCountForHalfDay,
          lateHalfDayPenalty: source.lateHalfDayPenalty ?? defaultBaseSettings.lateHalfDayPenalty,
          earlyLeaveMultiplier: source.earlyLeaveMultiplier ?? defaultBaseSettings.earlyLeaveMultiplier,
          perfectAttendanceBonus: source.perfectAttendanceBonus ?? defaultBaseSettings.perfectAttendanceBonus,
          extraClassBonus: source.extraClassBonus ?? defaultBaseSettings.extraClassBonus,
          examDutyBonus: source.examDutyBonus ?? defaultBaseSettings.examDutyBonus,
        };

        setMissedClassRules(missed);
        setAbsentDayRules(absent);
        setSubstituteRules(substitute);
        setBaseSettings(base);

        setInitialSnapshot(JSON.stringify({
          missed,
          absent,
          substitute,
          base,
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load salary policy for this campus");
    } finally {
      setLoading(false);
    }
  }, [selectedCampusId]);

  useEffect(() => {
    if (selectedCampusId) {
      void loadPolicy();
    }
  }, [selectedCampusId, loadPolicy]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    const current = JSON.stringify({
      missed: missedClassRules,
      absent: absentDayRules,
      substitute: substituteRules,
      base: baseSettings,
    });
    return current !== initialSnapshot;
  }, [missedClassRules, absentDayRules, substituteRules, baseSettings, initialSnapshot]);

  const handleRevert = () => {
    if (!initialSnapshot) return;
    try {
      const snap = JSON.parse(initialSnapshot);
      setMissedClassRules(snap.missed || []);
      setAbsentDayRules(snap.absent || []);
      setSubstituteRules(snap.substitute || []);
      setBaseSettings(snap.base || defaultBaseSettings);
      toast.success("Reverted to saved policy configuration");
    } catch (e) {
      console.error(e);
    }
  };

  const validateRules = (rules, name) => {
    if (!rules || rules.length === 0) return null;

    // Check individual rules
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      const minNum = Number(r.min);
      const maxNum = (r.max === "" || r.max === null || r.max === undefined) ? null : Number(r.max);
      const amountNum = Number(r.amount);

      if (isNaN(minNum) || minNum < 0) {
        return `${name}: Row #${i + 1} has an invalid minimum count. Must be a non-negative number.`;
      }
      if (maxNum !== null && isNaN(maxNum)) {
        return `${name}: Row #${i + 1} has an invalid maximum count.`;
      }
      if (maxNum !== null && maxNum < minNum) {
        return `${name}: Row #${i + 1} maximum count (${maxNum}) must be greater than or equal to minimum (${minNum}).`;
      }
      if (r.type !== "None" && (isNaN(amountNum) || amountNum < 0)) {
        return `${name}: Row #${i + 1} amount or percentage must be a non-negative number.`;
      }
    }

    // Check sequences and overlaps (numeric sort)
    const sorted = [...rules].sort((a, b) => Number(a.min) - Number(b.min));
    let lastMax = null;

    for (let i = 0; i < sorted.length; i++) {
      const minNum = Number(sorted[i].min);
      const maxNum = (sorted[i].max === "" || sorted[i].max === null || sorted[i].max === undefined) ? null : Number(sorted[i].max);

      if (i > 0 && lastMax === null) {
        return `${name}: An open-ended tier (with no maximum) must be the last tier.`;
      }

      if (i > 0 && lastMax !== null && minNum <= lastMax) {
        return `${name}: Overlapping threshold detected at minimum count ${minNum}. It must be greater than previous maximum ${lastMax}.`;
      }

      lastMax = maxNum;
    }

    return null;
  };

  const handleAddRule = (rules, setRules) => {
    let nextMin = 0;
    if (rules.length > 0) {
      const lastRule = rules[rules.length - 1];
      const parsedMax = Number(lastRule.max);
      if (lastRule.max !== null && lastRule.max !== "" && !isNaN(parsedMax)) {
        nextMin = parsedMax + 1;
      } else {
        nextMin = (Number(lastRule.min) || 0) + 1;
      }
    }
    setRules([...rules, { min: nextMin, max: null, type: "Fixed Amount", amount: 0 }]);
  };

  const handleSavePolicy = async () => {
    if (!selectedCampusId) {
      toast.error("Please select a target campus first.");
      return;
    }

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

    // Prepare payload with clean numerical data
    const cleanRules = (rules) => rules.map(r => ({
      min: Math.max(0, Number(r.min) || 0),
      max: (r.max === "" || r.max === null || r.max === undefined) ? null : Number(r.max),
      type: r.type || "Fixed Amount",
      amount: Math.max(0, Number(r.amount) || 0)
    }));

    const cleanBaseSettings = {
      workingDaysPerMonth: Math.max(1, Number(baseSettings.workingDaysPerMonth) || 26),
      unpaidAbsentMultiplier: Math.max(0, Number(baseSettings.unpaidAbsentMultiplier) || 0),
      unpaidLeaveMultiplier: Math.max(0, Number(baseSettings.unpaidLeaveMultiplier) || 0),
      halfDayMultiplier: Math.max(0, Number(baseSettings.halfDayMultiplier) || 0),
      lateCountForHalfDay: Math.max(1, Number(baseSettings.lateCountForHalfDay) || 3),
      lateHalfDayPenalty: Math.max(0, Number(baseSettings.lateHalfDayPenalty) || 0),
      earlyLeaveMultiplier: Math.max(0, Number(baseSettings.earlyLeaveMultiplier) || 0),
      perfectAttendanceBonus: Math.max(0, Number(baseSettings.perfectAttendanceBonus) || 0),
      extraClassBonus: Math.max(0, Number(baseSettings.extraClassBonus) || 0),
      examDutyBonus: Math.max(0, Number(baseSettings.examDutyBonus) || 0),
    };

    const payload = {
      campusId: selectedCampusId,
      newVersion: {
        versionName: `Policy Update - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        effectiveDate: new Date().toISOString(),
        missedClassDeductionRules: cleanRules(missedClassRules),
        absentDayDeductionRules: cleanRules(absentDayRules),
        substituteBonusRules: cleanRules(substituteRules),
        ...cleanBaseSettings
      }
    };

    setSaving(true);
    try {
      const response = await axiosInstance.put("/campus/salary/policy", payload);
      if (response.data?.success) {
        toast.success("Salary policy saved and applied successfully!");
        await loadPolicy();
      } else {
        toast.error(response.data?.message || "Failed to update policy");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update salary policy");
    } finally {
      setSaving(false);
    }
  };

  const renderRuleTable = (rules, setRules, title, description) => {
    const query = searchQuery.trim().toLowerCase();
    const isFiltered = query.length > 0;

    const visibleRules = isFiltered
      ? rules.filter((rule) => {
          const typeMatch = (rule.type || "").toLowerCase().includes(query);
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
          <div className="rules-section-header-row">
            <h3 className="rules-section-title">{title}</h3>
            <span className="rules-count-badge">
              {rules.length} {rules.length === 1 ? "rule tier" : "rule tiers"}
            </span>
          </div>
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
                      <th>Max (Leave blank for Unlimited)</th>
                      <th>Calculation Type</th>
                      <th>Amount / Rate</th>
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
                              value={rule.min === null || rule.min === undefined ? "" : rule.min}
                              onChange={(e) => {
                                const newRules = [...rules];
                                newRules[realIndex] = { ...newRules[realIndex], min: e.target.value };
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
                              placeholder="Unlimited (Infinity)"
                              value={rule.max === null || rule.max === undefined ? "" : rule.max}
                              onChange={(e) => {
                                const newRules = [...rules];
                                newRules[realIndex] = {
                                  ...newRules[realIndex],
                                  max: e.target.value === "" ? null : e.target.value,
                                };
                                setRules(newRules);
                              }}
                              min="0"
                            />
                          </td>
                          <td>
                            <select
                              className="rule-select"
                              aria-label={`${title} calculation type`}
                              value={rule.type || "Fixed Amount"}
                              onChange={(e) => {
                                const newRules = [...rules];
                                newRules[realIndex] = { ...newRules[realIndex], type: e.target.value };
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
                              value={rule.amount === null || rule.amount === undefined ? "" : rule.amount}
                              onChange={(e) => {
                                const newRules = [...rules];
                                newRules[realIndex] = { ...newRules[realIndex], amount: e.target.value };
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
                              title="Remove rule tier"
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
                  onClick={() => handleAddRule(rules, setRules)}
                >
                  <Plus size={15} /> Add Tier
                </Button>
              </div>
            </>
          ) : (
            <div className="rules-empty-state">
              <div className="rules-empty-copy">
                <strong>No matching rules found</strong>
                <span>Try clearing or modifying your search filter query.</span>
              </div>
            </div>
          )
        ) : (
          <div className="rules-empty-state">
            <div className="rules-empty-copy">
              <strong>No tiered rules defined</strong>
              <span>Default base multipliers and flat deduction policies are being used.</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="btn-add-rule"
              onClick={() => handleAddRule(rules, setRules)}
            >
              <Plus size={15} /> Add First Rule
            </Button>
          </div>
        )}
      </section>
    );
  };

  const selectedCampusName = campuses.find(
    (c) => String(c.id || c._id) === String(selectedCampusId)
  )?.name || "Select Campus";

  return (
    <main className="salary-policies-container" aria-labelledby="salary-policies-title">
      <div className="salary-policies-header-intro">
        <div>
          <h1 id="salary-policies-title" className="salary-policies-main-title">
            Institute Salary Policy
          </h1>
          <p className="salary-policies-subtitle">
            Configure campus-specific deduction formulas, attendance thresholds, and compensation rates.
          </p>
        </div>

        {/* Top Direct Action Bar */}
        <div className="salary-policies-header-actions">
          {isDirty && (
            <span className="unsaved-badge" title="You have unsaved changes in this policy">
              <span className="unsaved-dot" /> Unsaved Changes
            </span>
          )}
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="btn-revert"
              onClick={handleRevert}
              disabled={saving}
            >
              <RotateCcw size={14} /> Discard
            </Button>
          )}
          <Button
            type="button"
            className={`btn-save-header ${isDirty ? "btn-save-highlight" : ""}`}
            onClick={handleSavePolicy}
            disabled={saving || !selectedCampusId}
            id="save-policy-header-btn"
          >
            {saving ? (
              <><RefreshCw className="salary-policy-spinner" size={15} /> Saving...</>
            ) : (
              <><Save size={15} /> Save Policy</>
            )}
          </Button>
        </div>
      </div>

      {/* Toolbar: Search & Campus Selector */}
      <div className="salary-policies-toolbar">
        <div className="salary-policy-search">
          <Search size={15} className="salary-policy-search-icon" aria-hidden="true" />
          <Input
            type="text"
            placeholder="Search rules, deductions, or settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="salary-policy-search-input"
            aria-label="Search policy rules or settings"
          />
        </div>

        <div className="campus-selector-wrapper">
          <label htmlFor="salary-policy-campus">
            <Building2 size={15} className="campus-label-icon" /> Target Campus:
          </label>
          <Select
            value={selectedCampusId || undefined}
            onValueChange={setSelectedCampusId}
            disabled={!campuses.length}
          >
            <SelectTrigger id="salary-policy-campus" className="campus-select">
              <SelectValue placeholder={campuses.length ? "Select a campus" : "No campuses available"} />
            </SelectTrigger>
            <SelectContent>
              {campuses.map((campus) => {
                const cId = String(campus.id || campus._id);
                return (
                  <SelectItem key={cId} value={cId}>
                    {campus.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {campusesStatus === "loading" && !campuses.length ? (
        <Card className="policy-card loading-state">
          <RefreshCw className="salary-policy-spinner" size={26} />
          <p>Loading institute campuses...</p>
        </Card>
      ) : campuses.length === 0 ? (
        <Card className="policy-card empty-campus-state">
          <Building2 size={44} className="empty-campus-icon" />
          <h2>No Campus Branches Found</h2>
          <p>You need to create at least one campus branch before configuring salary policies.</p>
          <Link to="/institute-admin/campuses">
            <Button className="btn-create-campus">
              <Plus size={16} /> Manage Campuses
            </Button>
          </Link>
        </Card>
      ) : loading ? (
        <Card className="policy-card loading-state">
          <RefreshCw className="salary-policy-spinner" size={26} />
          <p>Loading salary policy for <strong>{selectedCampusName}</strong>...</p>
        </Card>
      ) : (
        <div className="salary-policies-stack">
          {/* Card 1: Dynamic Deductions */}
          <Card className="policy-card">
            <CardHeader className="policy-card-header">
              <CardTitle className="policy-card-title">
                <div className="policy-card-title-left">
                  <span>Dynamic Deductions</span>
                  <span className="campus-tag">{selectedCampusName}</span>
                </div>
                {policy?.versions?.length > 0 && (
                  <span className="version-info" title="Current policy version">
                    <Check size={12} className="version-icon-check" /> Version {policy.versions.length} &bull; Effective {new Date(policy.versions[policy.versions.length - 1].effectiveDate).toLocaleDateString()}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="policy-card-content">
              {renderRuleTable(
                missedClassRules,
                setMissedClassRules,
                "Missed Classes Deduction (No Substitute Assigned)",
                "Deductions applied when a faculty member misses a scheduled class period without a designated substitute."
              )}
              <div className="policy-rule-divider" />
              {renderRuleTable(
                absentDayRules,
                setAbsentDayRules,
                "Absent Days Deduction (Full Day Absences)",
                "Tiered deduction policies based on the cumulative number of full-day absences logged within the calendar month."
              )}
            </CardContent>
          </Card>

          {/* Card 2: Dynamic Compensation */}
          <Card className="policy-card">
            <CardHeader className="policy-card-header">
              <CardTitle className="policy-card-title">
                <div className="policy-card-title-left">
                  <span>Dynamic Compensation &amp; Incentives</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="policy-card-content">
              {renderRuleTable(
                substituteRules,
                setSubstituteRules,
                "Substitute Teaching Compensation",
                "Honorarium / bonus applied to teachers when substituting for another faculty member's classroom sessions."
              )}
            </CardContent>
          </Card>

          {/* Card 3: Base Settings & Multipliers */}
          <Card className="policy-card">
            <CardHeader className="policy-card-header">
              <CardTitle className="policy-card-title">
                <span>Standard Base Multipliers &amp; Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="policy-card-content">
              <div className="base-settings-category">
                <h4 className="base-settings-subheading">1. Standard Workdays &amp; Attendance Bonus</h4>
                <div className="base-settings-grid">
                  <div className="setting-group">
                    <label htmlFor="working-days-per-month">
                      Standard Working Days / Month
                    </label>
                    <Input
                      id="working-days-per-month"
                      type="number"
                      className="rule-input"
                      value={baseSettings.workingDaysPerMonth ?? ""}
                      onChange={(e) => setBaseSettings({
                        ...baseSettings,
                        workingDaysPerMonth: e.target.value === "" ? "" : Number(e.target.value)
                      })}
                      min="1"
                      max="31"
                    />
                    <span className="setting-help-text">Used as denominator for per-day rate calculations (e.g. 26 days).</span>
                  </div>

                  <div className="setting-group">
                    <label htmlFor="perfect-attendance-bonus">
                      Perfect Attendance Bonus (Fixed Rate)
                    </label>
                    <Input
                      id="perfect-attendance-bonus"
                      type="number"
                      className="rule-input"
                      value={baseSettings.perfectAttendanceBonus ?? ""}
                      onChange={(e) => setBaseSettings({
                        ...baseSettings,
                        perfectAttendanceBonus: e.target.value === "" ? "" : Number(e.target.value)
                      })}
                      min="0"
                    />
                    <span className="setting-help-text">Disbursed to staff with 100% presence and zero unexcused lates.</span>
                  </div>
                </div>
              </div>

              <div className="policy-rule-divider" />

              <div className="base-settings-category">
                <h4 className="base-settings-subheading">2. Absence &amp; Leave Salary Deduction Multipliers</h4>
                <div className="base-settings-grid">
                  <div className="setting-group">
                    <label htmlFor="unpaid-absent-multiplier">
                      Unpaid Full-Day Absence Multiplier
                    </label>
                    <Input
                      id="unpaid-absent-multiplier"
                      type="number"
                      step="0.1"
                      className="rule-input"
                      value={baseSettings.unpaidAbsentMultiplier ?? ""}
                      onChange={(e) => setBaseSettings({
                        ...baseSettings,
                        unpaidAbsentMultiplier: e.target.value === "" ? "" : Number(e.target.value)
                      })}
                      min="0"
                    />
                    <span className="setting-help-text">1.0 = deducts 1 full day's wage per absent day.</span>
                  </div>

                  <div className="setting-group">
                    <label htmlFor="unpaid-leave-multiplier">
                      Unpaid Leave Day Multiplier
                    </label>
                    <Input
                      id="unpaid-leave-multiplier"
                      type="number"
                      step="0.1"
                      className="rule-input"
                      value={baseSettings.unpaidLeaveMultiplier ?? ""}
                      onChange={(e) => setBaseSettings({
                        ...baseSettings,
                        unpaidLeaveMultiplier: e.target.value === "" ? "" : Number(e.target.value)
                      })}
                      min="0"
                    />
                    <span className="setting-help-text">Deduction multiplier applied to approved unpaid leave days.</span>
                  </div>

                  <div className="setting-group">
                    <label htmlFor="half-day-multiplier">
                      Half-Day Absence Multiplier
                    </label>
                    <Input
                      id="half-day-multiplier"
                      type="number"
                      step="0.1"
                      className="rule-input"
                      value={baseSettings.halfDayMultiplier ?? ""}
                      onChange={(e) => setBaseSettings({
                        ...baseSettings,
                        halfDayMultiplier: e.target.value === "" ? "" : Number(e.target.value)
                      })}
                      min="0"
                    />
                    <span className="setting-help-text">0.5 = deducts half a day's salary for half-day records.</span>
                  </div>

                  <div className="setting-group">
                    <label htmlFor="early-leave-multiplier">
                      Early Leave Deduction Multiplier
                    </label>
                    <Input
                      id="early-leave-multiplier"
                      type="number"
                      step="0.1"
                      className="rule-input"
                      value={baseSettings.earlyLeaveMultiplier ?? ""}
                      onChange={(e) => setBaseSettings({
                        ...baseSettings,
                        earlyLeaveMultiplier: e.target.value === "" ? "" : Number(e.target.value)
                      })}
                      min="0"
                    />
                    <span className="setting-help-text">Penalty fraction applied when leaving campus before official shift end.</span>
                  </div>
                </div>
              </div>

              <div className="policy-rule-divider" />

              <div className="base-settings-category">
                <h4 className="base-settings-subheading">3. Lateness Thresholds &amp; Deductions</h4>
                <div className="base-settings-grid">
                  <div className="setting-group">
                    <label htmlFor="late-count-half-day">
                      Late Arrival Count per Penalty
                    </label>
                    <Input
                      id="late-count-half-day"
                      type="number"
                      className="rule-input"
                      value={baseSettings.lateCountForHalfDay ?? ""}
                      onChange={(e) => setBaseSettings({
                        ...baseSettings,
                        lateCountForHalfDay: e.target.value === "" ? "" : Number(e.target.value)
                      })}
                      min="1"
                    />
                    <span className="setting-help-text">Number of late arrivals that triggers a deduction penalty (e.g. every 3 lates).</span>
                  </div>

                  <div className="setting-group">
                    <label htmlFor="late-half-day-penalty">
                      Late Penalty Deduction Multiplier
                    </label>
                    <Input
                      id="late-half-day-penalty"
                      type="number"
                      step="0.1"
                      className="rule-input"
                      value={baseSettings.lateHalfDayPenalty ?? ""}
                      onChange={(e) => setBaseSettings({
                        ...baseSettings,
                        lateHalfDayPenalty: e.target.value === "" ? "" : Number(e.target.value)
                      })}
                      min="0"
                    />
                    <span className="setting-help-text">0.5 = deducts half day pay per reached late arrival count threshold.</span>
                  </div>
                </div>
              </div>

              <div className="policy-rule-divider" />

              <div className="base-settings-category">
                <h4 className="base-settings-subheading">4. Extra Duties &amp; Special Allowances</h4>
                <div className="base-settings-grid">
                  <div className="setting-group">
                    <label htmlFor="extra-class-bonus">
                      Extra Class Bonus (Per Period)
                    </label>
                    <Input
                      id="extra-class-bonus"
                      type="number"
                      className="rule-input"
                      value={baseSettings.extraClassBonus ?? ""}
                      onChange={(e) => setBaseSettings({
                        ...baseSettings,
                        extraClassBonus: e.target.value === "" ? "" : Number(e.target.value)
                      })}
                      min="0"
                    />
                    <span className="setting-help-text">Flat compensation credited for conducting additional non-rostered classes.</span>
                  </div>

                  <div className="setting-group">
                    <label htmlFor="exam-duty-bonus">
                      Exam Invigilation Duty Bonus
                    </label>
                    <Input
                      id="exam-duty-bonus"
                      type="number"
                      className="rule-input"
                      value={baseSettings.examDutyBonus ?? ""}
                      onChange={(e) => setBaseSettings({
                        ...baseSettings,
                        examDutyBonus: e.target.value === "" ? "" : Number(e.target.value)
                      })}
                      min="0"
                    />
                    <span className="setting-help-text">Flat allowance rewarded per scheduled examination supervisory session.</span>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="policy-actions">
              <div className="policy-save-note">
                <AlertCircle size={16} />
                <span>
                  Saving creates an active policy version. Historical payroll records remain completely sealed and unaffected.
                </span>
              </div>
              <div className="policy-bottom-buttons">
                {isDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRevert}
                    disabled={saving}
                  >
                    <RotateCcw size={15} /> Discard Changes
                  </Button>
                )}
                <Button
                  type="button"
                  className="btn-save"
                  onClick={handleSavePolicy}
                  disabled={saving || !selectedCampusId}
                  id="save-policy-bottom-btn"
                >
                  {saving ? (
                    <><RefreshCw className="salary-policy-spinner" size={16} /> Saving Version...</>
                  ) : (
                    <><Save size={16} /> Save &amp; Apply Policy</>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </main>
  );
}
