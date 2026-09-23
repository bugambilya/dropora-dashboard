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

function SignUp() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const handleSignUp = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Temporary verification flow
    navigate("/verify-email", {
      state: {
        email: email,
        name: name,
      },
    });
  };

  return (
    <div className="auth-page">

      <button
        className="auth-back-button"
        onClick={() => navigate("/")}
      >
        <ChevronLeft size={18} />
        Back to Home
      </button>

      <div className="auth-container">

        <div className="auth-logo">
          DROPORA
        </div>

        <div className="auth-card">

          <div className="auth-header">

            <div className="auth-icon">
              <User size={25} />
            </div>

            <h1>Create Account</h1>

            <p>
              Create your Dropora account.
            </p>

          </div>

          <form onSubmit={handleSignUp}>

            {/* NAME */}

            <div className="form-group">

              <label>Full Name</label>

              <div className="input-wrapper">

                <User size={18} />

                <input
                  type="text"
                  placeholder="Juan Dela Cruz"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                />

              </div>
            </div>

            {/* EMAIL */}

            <div className="form-group">

              <label>Email / Gmail</label>

              <div className="input-wrapper">

                <Mail size={18} />

                <input
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />

              </div>
            </div>

            {/* PASSWORD */}

            <div className="form-group">

              <label>Password</label>

              <div className="input-wrapper">

                <Lock size={18} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
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

              <label>Confirm Password</label>

              <div className="input-wrapper">

                <Lock size={18} />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
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

            <button
              type="submit"
              className="auth-primary-button"
            >
              Create Account
              <ArrowRight size={18} />
            </button>

          </form>

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