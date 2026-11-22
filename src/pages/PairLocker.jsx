
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import "../App.css";

function PairLocker() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef([]);

  // Handle individual OTP input
  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;

    setOtp(updatedOtp);
    setError("");

    // Automatically focus the next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle pasting a complete OTP
  const handlePaste = (e) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);

    if (!pasted) return;

    const updatedOtp = ["", "", "", ""];

    pasted.split("").forEach((digit, index) => {
      updatedOtp[index] = digit;
    });

    setOtp(updatedOtp);
    setError("");

    inputRefs.current[Math.min(pasted.length, 3)]?.focus();
  };

  // Submit pairing code to backend
  const handlePairLocker = async (e) => {
    e.preventDefault();

    const code = otp.join("");

    if (code.length !== 4) {
      setError("Please enter the complete 4-digit pairing code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

      // Retrieve token using the storage key configured by your login system.
      // Change "accessToken" if your application uses a different key.
      const token = localStorage.getItem("accessToken");

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/api/lockers/pair`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          otp: code,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Unable to pair locker."
        );
      }

      setSuccess(true);
      setOtp(["", "", "", ""]);

    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pair-locker-page">
      <div className="pair-locker-container">

        {/* Back Button */}
        <button
          type="button"
          className="pair-back-button"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="pair-locker-card">

          {/* Icon */}
          <div className="pair-locker-icon">
            {success ? (
              <CheckCircle size={38} />
            ) : (
              <PackageCheck size={38} />
            )}
          </div>

          {/* Success Screen */}
          {success ? (
            <div className="pair-success-content">

              <h2>Locker Paired Successfully!</h2>

              <p>
                Your DROPORA locker has been connected to your
                account. You can now manage your locker from
                your dashboard.
              </p>

              <button
                type="button"
                className="pair-primary-button"
                onClick={() => navigate("/lockers")}
              >
                View My Lockers
              </button>

            </div>
          ) : (

            /* Pairing Form */
            <>
              <h2>Pair Your Locker</h2>

              <p className="pair-description">
                Connect your DROPORA smart locker by entering
                the 4-digit OTP displayed on your locker.
              </p>

              <form onSubmit={handlePairLocker}>

                <label className="pair-otp-label">
                  Enter 4-digit pairing code
                </label>

                {/* OTP Inputs */}
                <div className="pair-otp-inputs">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      aria-label={`Pairing code digit ${index + 1}`}
                      maxLength={1}
                      value={digit}
                      disabled={loading}
                      onChange={(e) =>
                        handleChange(e.target.value, index)
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(e, index)
                      }
                      onPaste={handlePaste}
                    />
                  ))}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="pair-error-message" role="alert">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="pair-primary-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoaderCircle
                        className="pair-spinner"
                        size={18}
                      />
                      Pairing...
                    </>
                  ) : (
                    <>
                      <LockKeyhole size={18} />
                      Pair Locker
                    </>
                  )}
                </button>

              </form>

              {/* Security Note */}
              <div className="pair-security-note">
                <ShieldCheck size={16} />
                Secure locker pairing
              </div>

              <p className="pair-help-text">
                Don't have a pairing code? Check your DROPORA
                locker display or contact your administrator.
              </p>

            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default PairLocker;
