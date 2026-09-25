import React, { useState } from "react";
import GeneralSettingsTab from "./GeneralSettingsTab";
import SalaryPolicyTab from "./SalaryPolicyTab";
import TeachingCreditTab from "./TeachingCreditTab";
import { Users, Settings as SettingsIcon, Award } from "lucide-react";
import "./Settings.css";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General Settings", icon: <SettingsIcon size={15} /> },
    { id: "salary", label: "Salary Policy", icon: <Users size={15} /> },
    { id: "teachingCredit", label: "Teaching Credits & Substitution Rules", icon: <Award size={15} /> },
  ];

  return (
    <div className="settings-container campus-tab-page">
      <div className="settings-heading">
        <div><span>Administration / configuration</span><h1>Settings</h1><p>Manage campus operations, scheduling, substitution rules, and payroll policy.</p></div>
      </div>
      <div className="settings-tabbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? "is-active" : ""}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="settings-content">
        {activeTab === "general" && <GeneralSettingsTab />}
        {activeTab === "salary" && <SalaryPolicyTab />}
        {activeTab === "teachingCredit" && <TeachingCreditTab />}
      </div>
    </div>
  );
};

export default Settings;
