
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";

import { registerUser } from "../services/api";

function SignUp() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();

    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setError("Please complete all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        email: trimmedEmail,
        password,
        username: trimmedName,
      });

      // Registration successful: go directly to Login
      navigate("/login", {
        state: {
          email: trimmedEmail,
        },
      });

    } catch (err) {
      console.error("Signup error:", err);

      setError(
        err.message || "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* BACK BUTTON */}
      <button
        className="auth-back-button"
        type="button"
        onClick={() => navigate("/")}
      >
        <ChevronLeft size={18} />
        Back to Home
      </button>

      <div className="auth-container">

        {/* LOGO */}
        <div className="auth-logo">
          DROPORA
        </div>

        <div className="auth-card">

          {/* HEADER */}
          <div className="auth-header">

            <div className="auth-icon">
              <User size={25} />
            </div>

            <h1>Create Account</h1>

            <p>
              Create your Dropora account.
            </p>

          </div>

          {/* SIGNUP FORM */}
          <form onSubmit={handleSignUp}>

            {/* FULL NAME */}
            <div className="form-group">

              <label htmlFor="signup-name">
                Full Name
              </label>

              <div className="input-wrapper">

                <User size={18} />

                <input
                  id="signup-name"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />

              </div>
            </div>

            {/* EMAIL */}
            <div className="form-group">

              <label htmlFor="signup-email">
                Email / Gmail
              </label>

              <div className="input-wrapper">

                <Mail size={18} />

                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />

              </div>
            </div>

            {/* PASSWORD */}
            <div className="form-group">

              <label htmlFor="signup-password">
                Password
              </label>

              <div className="input-wrapper">

                <Lock size={18} />

                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="form-group">

              <label htmlFor="signup-confirm-password">
                Confirm Password
              </label>

              <div className="input-wrapper">

                <Lock size={18} />

                <input
                  id="signup-confirm-password"
                  type={
                    showConfirmPassword ? "text" : "password"
                  }
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            {/* CREATE ACCOUNT BUTTON */}
            <button
              type="submit"
              className="auth-primary-button"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}

              {!loading && <ArrowRight size={18} />}
            </button>

          </form>

          {/* LOGIN LINK */}
          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">
              Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default SignUp;
