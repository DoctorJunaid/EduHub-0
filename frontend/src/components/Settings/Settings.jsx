import React, { useState } from "react";
import GeneralSettingsTab from "./GeneralSettingsTab";
import SalaryPolicyTab from "./SalaryPolicyTab";
import { Users, Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General Settings", icon: <SettingsIcon className="w-5 h-5 mr-2" /> },
    { id: "salary", label: "Salary Policy", icon: <Users className="w-5 h-5 mr-2" /> },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex space-x-4 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "general" && <GeneralSettingsTab />}
      {activeTab === "salary" && <SalaryPolicyTab />}
    </div>
  );
};

export default Settings;
