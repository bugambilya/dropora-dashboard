
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PackageCheck,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  LoaderCircle,
  Copy,
} from "lucide-react";

import "../App.css";

function PairLocker() {
  const navigate = useNavigate();

  const [pairCode, setPairCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const API_BASE =
    import.meta.env.VITE_API_URL ||
    "http://localhost:3000/api";

  // Generate a pairing code
  const handleGenerateCode = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);
    setPairCode("");
    setExpiresAt("");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        `${API_BASE}/locker/pairing-code`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "Unable to generate pairing code."
        );
      }

      setPairCode(data.pair_code);
      setExpiresAt(data.expires_at);
      setSuccess(true);

    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Copy pairing code
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pairCode);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch {
      setError("Unable to copy pairing code.");
    }
  };

  return (
    <div className="pair-locker-page">
      <div className="pair-locker-container">

        <div className="pair-locker-card">

          {/* Icon */}
          <div className="pair-locker-icon">
            {success ? (
              <CheckCircle size={38} />
            ) : (
              <PackageCheck size={38} />
            )}
          </div>

          {/* Pairing Code Generated */}
          {success ? (
            <div className="pair-success-content">

              <h2>Pairing Code Generated!</h2>

              <p>
                Enter this code on your DROPORA smart locker
                to connect it to your account.
              </p>

              <div className="pair-code-display">
                <div className="pair-code">
                  {pairCode}
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="pair-copy-button"
                >
                  <Copy size={16} />
                  {copied ? "Copied!" : "Copy Code"}
                </button>
              </div>

              {expiresAt && (
                <p className="pair-expiry-text">
                  Code expires:{" "}
                  {new Date(expiresAt).toLocaleString()}
                </p>
              )}

              <button
                type="button"
                className="pair-primary-button"
                onClick={() => navigate("/lockers")}
              >
                View My Lockers
              </button>

              <button
                type="button"
                className="pair-secondary-button"
                onClick={handleGenerateCode}
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate New Code"}
              </button>

            </div>
          ) : (

            /* Generate Pairing Code */
            <>
              <h2>Pair Your Locker</h2>

              <p className="pair-description">
                Generate a secure 4-digit pairing code to connect
                your DROPORA smart locker to your account.
              </p>

              {error && (
                <div className="pair-error-message" role="alert">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button
                type="button"
                className="pair-primary-button"
                onClick={handleGenerateCode}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      className="pair-spinner"
                      size={18}
                    />
                    Generating Code...
                  </>
                ) : (
                  <>
                    <PackageCheck size={18} />
                    Generate Pairing Code
                  </>
                )}
              </button>

              <div className="pair-security-note">
                <ShieldCheck size={16} />
                Secure locker pairing
              </div>

              <p className="pair-help-text">
                Your pairing code is valid for 5 minutes.
                Enter it on your physical locker before it expires.
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default PairLocker;
