import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Header } from "../../components";
import { parseSheetOptions } from "../../utils/helpers";

export default function AdminSettings() {
  const { adminKey, setAdminKey, selectedSheet, setSelectedSheet } = useAuth();
  const [newAdminKey, setNewAdminKey] = useState(adminKey);
  const [saved, setSaved] = useState(false);

  const sheetOptions = useMemo(
    () => parseSheetOptions(import.meta.env.VITE_SHEET_OPTIONS ?? ""),
    [],
  );

  const handleSaveKey = () => {
    setAdminKey(newAdminKey);
    sessionStorage.setItem("admin_key", newAdminKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-page">
      <Header title="Settings" userName="Administrator" userEmail="" />

      <div className="page-content">
        <div className="settings-container">
          {/* General Settings */}
          <div className="settings-section">
            <h3>General Settings</h3>

            <div className="setting-item">
              <div className="setting-info">
                <strong>Default Event / Sheet</strong>
                <p>Select the default sheet to load on login</p>
              </div>
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
              >
                {sheetOptions.map((sheet) => (
                  <option key={sheet} value={sheet}>
                    {sheet}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Security Settings */}
          <div className="settings-section">
            <h3>Security</h3>

            <div className="setting-item vertical">
              <div className="setting-info">
                <strong>Admin Key</strong>
                <p>Update your Google Apps Script admin key</p>
              </div>
              <div className="input-group">
                <input
                  type="password"
                  value={newAdminKey}
                  onChange={(e) => setNewAdminKey(e.target.value)}
                  placeholder="Enter admin key"
                />
                <button className="btn btn-primary" onClick={handleSaveKey}>
                  {saved ? "Saved!" : "Update Key"}
                </button>
              </div>
            </div>
          </div>

          {/* Data Settings */}
          <div className="settings-section">
            <h3>Data Export</h3>

            <div className="setting-item">
              <div className="setting-info">
                <strong>Export All Data</strong>
                <p>Download all tickets as CSV</p>
              </div>
              <button className="btn btn-secondary">Export CSV</button>
            </div>
          </div>

          {/* API Information */}
          <div className="settings-section">
            <h3>API Information</h3>

            <div className="info-box">
              <p>
                <strong>Google Script URL:</strong>{" "}
                {import.meta.env.VITE_GOOGLE_SCRIPT_URL
                  ? "Configured"
                  : "Not configured"}
              </p>
              <p>
                <strong>Available Sheets:</strong> {sheetOptions.join(", ")}
              </p>
            </div>
          </div>

          {/* About */}
          <div className="settings-section">
            <h3>About</h3>
            <div className="info-box">
              <p>
                <strong>Prem Industries Ticket Management System</strong>
              </p>
              <p>Version 2.0.0</p>
              <p>
                A Jira-like CMS application using Google Sheets as the database.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
