
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PackageCheck,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  LoaderCircle,
  Copy,
} from "lucide-react";

import { generatePairingCode } from "../services/locker";

function PairLocker() {
  const navigate = useNavigate();

  const [pairCode, setPairCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // GENERATE PAIRING CODE
  const handleGenerateCode = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);
    setPairCode("");
    setExpiresAt("");
    setCopied(false);

    try {
      const data = await generatePairingCode();

      if (!data.pair_code) {
        throw new Error(
          "The server did not return a pairing code."
        );
      }

      setPairCode(String(data.pair_code));
      setExpiresAt(data.expires_at || "");
      setSuccess(true);
    } catch (err) {
      console.error("Generate pairing code error:", err);

      setError(
        err.message || "Unable to generate pairing code."
      );
    } finally {
      setLoading(false);
    }
  };

  // COPY PAIRING CODE
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pairCode);

      setCopied(true);
      setError("");

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Copy code error:", err);

      setError("Unable to copy pairing code.");
    }
  };

  return (
    <div className="pair-locker-page">
      <div className="pair-locker-container">
        <div className="pair-locker-card">

          {/* ICON */}
          <div className="pair-locker-icon">
            {success ? (
              <CheckCircle size={38} />
            ) : (
              <PackageCheck size={38} />
            )}
          </div>

          {/* SUCCESS CONTENT */}
          {success ? (
            <div className="pair-success-content">

              <h2>Pairing Code Generated!</h2>

              <p>
                Enter this code on your DROPORA smart locker
                to connect it to your account.
              </p>

              {/* PAIRING CODE */}
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

              {/* ERROR MESSAGE */}
              {error && (
                <div
                  className="pair-error-message"
                  role="alert"
                >
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* EXPIRATION */}
              {expiresAt && (
                <p className="pair-expiry-text">
                  Code expires:{" "}
                  {new Date(expiresAt).toLocaleString()}
                </p>
              )}

              {/* VIEW LOCKERS */}
              <button
                type="button"
                className="pair-primary-button"
                onClick={() => navigate("/lockers")}
              >
                View My Lockers
              </button>

              {/* GENERATE ANOTHER CODE */}
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

            /* GENERATE CODE CONTENT */
            <>
              <h2>Pair Your Locker</h2>

              <p className="pair-description">
                Generate a secure 4-digit pairing code to connect
                your DROPORA smart locker to your account.
              </p>

              {/* ERROR MESSAGE */}
              {error && (
                <div
                  className="pair-error-message"
                  role="alert"
                >
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* GENERATE BUTTON */}
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

              {/* SECURITY NOTE */}
              <div className="pair-security-note">
                <ShieldCheck size={16} />
                Secure locker pairing
              </div>

              <p className="pair-help-text">
                Enter the generated code on your physical
                locker before it expires.
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default PairLocker;
