import { getInitials } from "../utils/helpers";

export default function Header({ title, userName, userEmail, children }) {
  return (
    <header className="main-header">
      <div className="header-left">
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="header-right">
        {children}
        <div className="user-info">
          <div className="user-avatar">{getInitials(userName)}</div>
          <div className="user-details">
            <span className="user-name">{userName || "User"}</span>
            <span className="user-email">{userEmail || ""}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
