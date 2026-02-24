import { useAuth } from "../../context/AuthContext";
import { Header } from "../../components";
import { getInitials } from "../../utils/helpers";
import { parseSheetOptions } from "../../utils/helpers";
import { useMemo } from "react";

export default function UserProfile() {
  const { userName, userEmail, selectedSheet, setSelectedSheet } = useAuth();

  const sheetOptions = useMemo(
    () => parseSheetOptions(import.meta.env.VITE_SHEET_OPTIONS ?? ""),
    [],
  );

  return (
    <div className="profile-page">
      <Header title="Profile" userName={userName} userEmail={userEmail} />

      <div className="page-content">
        <div className="profile-container">
          {/* Profile Card */}
          <div className="profile-card">
            <div className="profile-avatar large">{getInitials(userName)}</div>
            <h2>{userName}</h2>
            <p className="profile-email">{userEmail}</p>
          </div>

          {/* Settings */}
          <div className="settings-card">
            <h3>Settings</h3>

            <div className="setting-item">
              <div className="setting-label">
                <strong>Event / Sheet</strong>
                <p>Select which event's data you want to view</p>
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

            <div className="setting-item">
              <div className="setting-label">
                <strong>Email Notifications</strong>
                <p>Receive updates when ticket status changes</p>
              </div>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Info Card */}
          <div className="info-card">
            <h3>About</h3>
            <p>
              This ticket management system is powered by Prem Industries India
              Limited. Your tickets are securely stored in Google Sheets and can
              be accessed anytime using your email address.
            </p>
            <div className="info-links">
              <a
                href="https://www.premindustries.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit Website
              </a>
              <a href="mailto:support@premindustries.com">Contact Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
