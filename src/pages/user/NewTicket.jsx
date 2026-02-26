import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks";
import { Header } from "../../components";
import { REQUIREMENT_OPTIONS, PRIORITY_OPTIONS } from "../../constants";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  website: "",
  ticketType: "General",
  priority: "MEDIUM",
  attendees: "1",
  requirements: [],
  requirementOther: "",
  notes: "",
};

export default function NewTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    ...INITIAL_FORM,
    fullName: user?.name || "",
    email: user?.email || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequirementToggle = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const next = checked
        ? [...prev.requirements, value]
        : prev.requirements.filter((item) => item !== value);
      return { ...prev, requirements: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setIsSubmitting(true);

    try {
      const selectedRequirements = [
        ...formData.requirements,
        formData.requirementOther.trim()
          ? `Other: ${formData.requirementOther.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join(", ");

      // For now, this is a placeholder. Connect to your actual API endpoint
      const ticketData = {
        ...formData,
        requirements: selectedRequirements,
        requirementOther: "",
      };

      // TODO: Replace with actual API endpoint for creating tickets/clients
      console.log("Ticket data to submit:", ticketData);

      setStatus({
        type: "success",
        message: "Ticket/Client information saved successfully!",
      });

      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate("/marketing");
      }, 2000);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="new-ticket-page">
      <Header title="Create New Ticket" />

      <div className="page-content">
        <div className="form-card">
          <div className="form-header">
            <h2>New Ticket Request</h2>
            <p>Fill in the details below to submit your request.</p>
          </div>

          <form className="ticket-form" onSubmit={handleSubmit}>
            {/* Contact Information */}
            <div className="form-section">
              <h3>Contact Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company">Company</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address *</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="form-section">
              <h3>Ticket Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="ticketType">Managed By</label>
                  <select
                    id="ticketType"
                    name="ticketType"
                    value={formData.ticketType}
                    onChange={handleChange}
                  >
                    <option value="General">General</option>
                    <option value="VIP">VIP</option>
                    <option value="Student">Student</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="form-section">
              <h3>Requirements</h3>
              <div className="requirements-grid">
                {REQUIREMENT_OPTIONS.map((option) => (
                  <label key={option} className="checkbox-item">
                    <input
                      type="checkbox"
                      value={option}
                      checked={formData.requirements.includes(option)}
                      onChange={handleRequirementToggle}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              <div className="form-group mt-3">
                <input
                  type="text"
                  name="requirementOther"
                  value={formData.requirementOther}
                  onChange={handleChange}
                  placeholder="Other requirement (specify if not listed above)"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div className="form-section">
              <h3>Additional Notes</h3>
              <div className="form-group">
                <textarea
                  name="notes"
                  rows="4"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information, special requirements, or notes..."
                />
              </div>
            </div>

            {/* Submit */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Create Ticket"}
              </button>
            </div>

            {status.message && (
              <div className={`form-message ${status.type}`}>
                {status.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
