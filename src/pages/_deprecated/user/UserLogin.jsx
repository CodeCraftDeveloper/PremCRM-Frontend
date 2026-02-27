import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks";
import { isValidEmail } from "../../utils/helpers";

export default function UserLogin() {
  const navigate = useNavigate();
  const { userLogin } = useAuth();
  const [formData, setFormData] = useState({ email: "", name: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!formData.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setIsLoading(true);
    try {
      userLogin(formData.email.trim(), formData.name.trim());
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon large">PI</span>
          </div>
          <h1>Welcome to Prem Industries</h1>
          <p>Enter your details to view and create tickets</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Continue"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Admin access? <a href="/admin/login">Go to Admin Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}
