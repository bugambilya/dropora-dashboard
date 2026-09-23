import { useState } from "react";
import {
  Mail,
  ArrowRight,
  ChevronLeft,
  CheckCircle,
} from "lucide-react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

function ForgotPassword() {

  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [sent, setSent] =
    useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Temporary reset flow
    setSent(true);
  };

  return (
    <div className="auth-page">

      <button
        className="auth-back-button"
        onClick={() => navigate("/login")}
      >
        <ChevronLeft size={18} />
        Back to Login
      </button>

      <div className="auth-container">

        <div className="auth-logo">
          DROPORA
        </div>

        <div className="auth-card">

          {!sent ? (

            <>
              <div className="auth-header">

                <div className="auth-icon">
                  <Mail size={25} />
                </div>

                <h1>Forgot Password?</h1>

                <p>
                  Enter your email address and
                  we'll send you a password reset
                  link.
                </p>

              </div>

              <form onSubmit={handleSubmit}>

                <div className="form-group">

                  <label>
                    Email / Gmail
                  </label>

                  <div className="input-wrapper">

                    <Mail size={18} />

                    <input
                      type="email"
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
                      required
                    />

                  </div>

                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                >
                  Send Reset Link
                  <ArrowRight size={18} />
                </button>

              </form>

              <p className="auth-switch">
                Remember your password?{" "}
                <Link to="/login">
                  Login
                </Link>
              </p>
            </>

          ) : (

            <div className="success-state">

              <div className="success-icon">
                <CheckCircle size={45} />
              </div>

              <h1>
                Check Your Email
              </h1>

              <p>
                We've sent a password reset
                link to:
              </p>

              <strong>
                {email}
              </strong>

              <button
                className="auth-primary-button"
                onClick={() =>
                  navigate("/login")
                }
              >
                Back to Login
              </button>

            </div>

          )}

        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;