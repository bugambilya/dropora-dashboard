import { useState } from "react";
import {
  MailCheck,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

function VerifyEmail() {

  const navigate = useNavigate();
  const location = useLocation();

  const email =
    location.state?.email ||
    "your email";

  const [code, setCode] = useState("");

  const handleVerify = (e) => {
    e.preventDefault();

    if (code.length !== 6) {
      alert(
        "Please enter the 6-digit verification code."
      );
      return;
    }

    // Temporary verification
    navigate("/dashboard");
  };

  return (
    <div className="auth-page">

      <button
        className="auth-back-button"
        onClick={() => navigate("/signup")}
      >
        <ChevronLeft size={18} />
        Back to Sign Up
      </button>

      <div className="auth-container">

        <div className="auth-logo">
          DROPORA
        </div>

        <div className="auth-card">

          <div className="auth-header">

            <div className="auth-icon">
              <MailCheck size={25} />
            </div>

            <h1>Verify Your Email</h1>

            <p>
              We sent a verification code to
            </p>

            <strong className="verification-email">
              {email}
            </strong>

          </div>

          <form onSubmit={handleVerify}>

            <div className="form-group">

              <label>
                Verification Code
              </label>

              <input
                className="verification-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
              />

            </div>

            <button
              type="submit"
              className="auth-primary-button"
            >
              Verify Email
              <ArrowRight size={18} />
            </button>

          </form>

          <p className="resend-text">
            Didn't receive the code?
          </p>

          <button className="resend-button">
            Resend Code
          </button>

          <p className="auth-switch">
            <Link to="/login">
              Back to Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;