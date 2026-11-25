
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// GET ACCESS TOKEN
export const getToken = () => {
  return localStorage.getItem("accessToken");
};

// SAVE SESSION
export const saveSession = (session) => {
  if (session?.access_token) {
    localStorage.setItem("accessToken", session.access_token);
  }

  if (session?.refresh_token) {
    localStorage.setItem("refreshToken", session.refresh_token);
  }
};

// CLEAR SESSION
export const clearSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

// REFRESH SESSION
let refreshPromise = null;

export const refreshSession = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    clearSession();
    throw new Error("Your session has expired. Please log in again.");
  }

  // Prevent multiple simultaneous refresh requests
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      clearSession();

      throw new Error(
        data.error ||
        data.message ||
        "Session expired. Please log in again."
      );
    }

    // Supports either { session: {...} } or a direct session response
    const session = data.session || data;

    if (!session.access_token) {
      clearSession();
      throw new Error("Unable to refresh your session.");
    }

    saveSession(session);

    return session.access_token;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

// INTERNAL REQUEST FUNCTION
const sendRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
  });
};

// REUSABLE API REQUEST
export const apiRequest = async (endpoint, options = {}) => {
  try {
    let response = await sendRequest(endpoint, options);

    // Refresh token if access token is expired
    if (response.status === 401) {
      const newToken = await refreshSession();

      const headers = {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      };

      // Retry original request once
      response = await fetch(`${API_BASE}/api${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      });
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        `Request failed with status ${response.status}.`
      );
    }

    return data;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// REGISTER USER
export const registerUser = async ({
  email,
  password,
  username,
}) => {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
      password,
      username: username.trim(),
    }),
  });
};

// LOGIN USER
export const loginUser = async ({ email, password }) => {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  });

  if (data.session) {
    saveSession(data.session);
  }

  return data;
};

// GET CURRENT USER
export const getCurrentUser = async () => {
  return apiRequest("/auth/me", {
    method: "GET",
  });
};

// LOGOUT USER
export const logoutUser = async () => {
  try {
    await apiRequest("/auth/logout", {
      method: "POST",
    });
  } finally {
    clearSession();
  }
};
