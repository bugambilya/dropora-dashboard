import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronLeft,
} from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    // Temporary login
    // We will connect this to Firebase later.
    if (email && password) {
      navigate("/dashboard");
    }
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
              <Lock size={25} />
            </div>

            <h1>Welcome Back</h1>

            <p>
              Log in to manage your Dropora locker.
            </p>
          </div>

          <form onSubmit={handleLogin}>

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

            <div className="form-group">

              <div className="form-label-row">
                <label>Password</label>

                <Link to="/forgot-password">
                  Forgot Password?
                </Link>
              </div>

              <div className="input-wrapper">
                <Lock size={18} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
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

            <button
              type="submit"
              className="auth-primary-button"
            >
              Login
              <ArrowRight size={18} />
            </button>

          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/signup">
              Sign Up
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Login;