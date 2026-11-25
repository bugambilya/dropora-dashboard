const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

// REGISTER USER
export async function registerUser({ email, password, username }) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
        username: username.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || data.message || "Unable to create your account."
      );
    }

    return data;
  } catch (error) {
    console.error("Registration request failed:", error);
    throw error;
  }
}

// LOGIN USER
export async function loginUser({ email, password }) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || data.message || "Unable to log in."
      );
    }

    // Save authentication tokens
    const session = data.session;

    if (session?.access_token) {
      localStorage.setItem("accessToken", session.access_token);

      if (session.refresh_token) {
        localStorage.setItem("refreshToken", session.refresh_token);
      }
    }

    return data;
  } catch (error) {
    console.error("Login request failed:", error);
    throw error;
  }
}

// LOGOUT USER
export function logoutUser() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("token");
}

// CHECK LOGIN STATUS
export function isLoggedIn() {
  return Boolean(
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token")
  );
}

// GET ACCESS TOKEN
export function getAccessToken() {
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token")
  );
}
