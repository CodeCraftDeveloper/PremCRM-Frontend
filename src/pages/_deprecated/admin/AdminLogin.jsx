import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
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

    if (!formData.password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate("/admin");
      } else {
        setError(result.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page admin-auth">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon large admin">PI</span>
          </div>
          <h1>Admin Portal</h1>
          <p>Enter your credentials to access the admin panel</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-button admin"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Access Admin Panel"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Not an admin? <a href="/login">Go to User Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}
