import { useState } from "react";
import axios from "axios";
import {
  REQUIREMENT_OPTIONS,
  SOURCE_OPTIONS,
  MARKETING_REVIEWERS,
} from "../constants";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  company: "",
  designation: "",
  city: "",
  country: "India",
  source: "Exhibition",
  requirements: [],
  requirementOther: "",
  expectedVolume: "",
  notes: "",
  enteredBy: "",
};

export default function PublicRegistrationForm() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [queryId, setQueryId] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

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

  const validateStep1 = () => {
    if (!formData.enteredBy) {
      setError("Please select your name");
      return false;
    }
    if (!formData.fullName || !formData.phone) {
      setError("Please fill in name and phone from the visiting card");
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    setError("");
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.requirements.length === 0 && !formData.requirementOther) {
      setError("Please select at least one product interest");
      return;
    }

    setError("");
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

      // TODO: Replace with actual API endpoint for creating clients/enquiries
      // Example: POST /api/clients or /api/enquiries
      // For now, generate a mock ID
      const mockQueryId = `ENQ-${Date.now()}`;

      console.log("Public registration data to submit:", {
        ...formData,
        requirements: selectedRequirements,
      });

      setQueryId(mockQueryId);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewSubmission = () => {
    setFormData(INITIAL_FORM);
    setSubmitted(false);
    setQueryId("");
    setError("");
    setStep(1);
  };

  // Success Screen
  if (submitted) {
    return (
      <div className="public-page">
        <div className="public-container">
          <div className="success-card">
            <div className="success-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h1>Lead Captured!</h1>
            <p className="success-message">
              Lead details have been saved successfully. The lead is now
              available in the dashboard for follow-up.
            </p>
            <div className="ticket-reference">
              <span className="label">Lead ID</span>
              <span className="ticket-id">{queryId}</span>
            </div>
            <p className="note">
              Captured by: <strong>{formData.enteredBy}</strong>
            </p>
            <div className="success-actions">
              <button className="btn btn-primary" onClick={handleNewSubmission}>
                Capture Another Lead
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page">
      <div className="public-container">
        {/* Header */}
        <div className="public-header">
          <div className="logo-icon large">PI</div>
          <h1>Prem Industries</h1>
          <p>Marketing Lead Capture</p>
        </div>

        {/* Progress Steps */}
        <div className="form-progress">
          <div
            className={`progress-step ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}
          >
            <div className="step-number">1</div>
            <span>Lead Info</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? "active" : ""}`}>
            <div className="step-number">2</div>
            <span>Interests</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="public-form-card">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Contact Information */}
            {step === 1 && (
              <div className="form-step">
                <div className="step-header">
                  <h2>Lead Information</h2>
                  <p>
                    Enter contact details from the visiting card or conversation
                  </p>
                </div>

                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="enteredBy">
                      Your Name (Marketing Person){" "}
                      <span className="required">*</span>
                    </label>
                    <select
                      id="enteredBy"
                      name="enteredBy"
                      value={formData.enteredBy}
                      onChange={handleChange}
                      autoFocus
                    >
                      <option value="">-- Select Your Name --</option>
                      {MARKETING_REVIEWERS.map((person) => (
                        <option key={person} value={person}>
                          {person}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="fullName">
                      Contact Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Name on visiting card"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="designation">Designation</label>
                    <input
                      type="text"
                      id="designation"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="Designation on card"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="company">Company Name</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Company on card"
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
                      placeholder="Email on card (if available)"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">
                      Phone Number <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone on card"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="source">Lead Source</label>
                    <select
                      id="source"
                      name="source"
                      value={formData.source}
                      onChange={handleChange}
                    >
                      {SOURCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Your city"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Your country"
                    />
                  </div>
                </div>

                {error && <div className="form-message error">{error}</div>}

                <div className="form-navigation">
                  <div></div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={nextStep}
                  >
                    Continue
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Requirements */}
            {step === 2 && (
              <div className="form-step">
                <div className="step-header">
                  <h2>Product Interest</h2>
                  <p>Select products discussed with the contact</p>
                </div>

                <div className="requirements-section">
                  <label className="section-label">
                    Select Products <span className="required">*</span>
                  </label>
                  <div className="requirements-grid modern">
                    {REQUIREMENT_OPTIONS.map((option) => (
                      <label
                        key={option}
                        className={`checkbox-card ${formData.requirements.includes(option) ? "selected" : ""}`}
                      >
                        <input
                          type="checkbox"
                          value={option}
                          checked={formData.requirements.includes(option)}
                          onChange={handleRequirementToggle}
                        />
                        <span className="checkbox-label">{option}</span>
                        <span className="checkbox-icon">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="form-group mt-4">
                    <label htmlFor="requirementOther">
                      Other Products (if not listed above)
                    </label>
                    <input
                      type="text"
                      id="requirementOther"
                      name="requirementOther"
                      value={formData.requirementOther}
                      onChange={handleChange}
                      placeholder="Specify other products discussed"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="expectedVolume">
                    Expected Monthly Volume
                  </label>
                  <input
                    type="text"
                    id="expectedVolume"
                    name="expectedVolume"
                    value={formData.expectedVolume}
                    onChange={handleChange}
                    placeholder="e.g., 10,000 units, 500 kg (if discussed)"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Conversation Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="3"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Brief notes from your conversation with the contact..."
                  />
                </div>

                {error && <div className="form-message error">{error}</div>}

                <div className="form-navigation">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={prevStep}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-large"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-small"></span>
                        Capturing...
                      </>
                    ) : (
                      <>
                        Capture Lead
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="public-footer">
          <p>
            &copy; {new Date().getFullYear()} Prem Industries. All rights
            reserved.
          </p>
          <p className="footer-tagline">Your Trusted Packaging Partner</p>
        </div>
      </div>
    </div>
  );
}
