
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// ======================================
// TOKEN AND SESSION
// ======================================

// GET ACCESS TOKEN
export const getToken = () => {
  return localStorage.getItem("accessToken");
};

// SAVE SESSION
let refreshTimer = null;

export const saveSession = (session) => {
  if (session?.access_token) {
    localStorage.setItem("accessToken", session.access_token);
  }

  if (session?.refresh_token) {
    localStorage.setItem("refreshToken", session.refresh_token);
  }

  // Schedule the next refresh when a session is saved
  if (session?.access_token && session?.refresh_token) {
    scheduleTokenRefresh(session.expires_in);
  }
};

// CLEAR SESSION
export const clearSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userId");

  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

// ======================================
// AUTOMATIC TOKEN REFRESH
// ======================================

let refreshPromise = null;

// Refresh before the access token expires
const scheduleTokenRefresh = (expiresIn = 1800) => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  // Refresh 5 minutes before expiration.
  // Default expires_in is 1800 seconds (30 minutes).
  const refreshDelay = Math.max(
    60 * 1000,
    (Number(expiresIn) || 1800) * 1000 - 5 * 60 * 1000
  );

  refreshTimer = setTimeout(async () => {
    try {
      await refreshSession();
    } catch (error) {
      console.error("Automatic token refresh failed:", error);
    }
  }, refreshDelay);
};

// REFRESH SESSION
export const refreshSession = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    clearSession();

    throw new Error(
      "Your session has expired. Please log in again."
    );
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

    // Backend response contains session object
    const session = data.session || data;

    if (!session.access_token || !session.refresh_token) {
      clearSession();

      throw new Error("Unable to refresh your session.");
    }

    // Save the NEW access and refresh tokens
    saveSession(session);

    return session.access_token;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

// ======================================
// INTERNAL REQUEST FUNCTION
// ======================================

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

// ======================================
// REUSABLE API REQUEST
// ======================================

export const apiRequest = async (endpoint, options = {}) => {
  try {
    let response = await sendRequest(endpoint, options);

    // If access token expired, refresh and retry once
    if (response.status === 401) {
      const newToken = await refreshSession();

      response = await fetch(`${API_BASE}/api${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
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

// ======================================
// REGISTER USER
// ======================================

export const registerUser = async ({
  email,
  password,
  username,
}) => {
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
      password,
      username: username.trim(),
    }),
  });

  // Save session if registration returns one
  if (data.session) {
    saveSession(data.session);
  }

  return data;
};

// ======================================
// LOGIN USER
// ======================================

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

// ======================================
// GET CURRENT USER
// ======================================

export const getCurrentUser = async () => {
  const data = await apiRequest("/auth/me", {
    method: "GET",
  });

  const user = data.user;

  if (user?.id) {
    localStorage.setItem("userId", user.id);
  } else if (user?.profile?.id) {
    localStorage.setItem("userId", user.profile.id);
  }

  return data;
};

// GET SAVED USER ID
export const getUserId = () => {
  return localStorage.getItem("userId");
};

// ======================================
// LOGOUT USER
// ======================================

export const logoutUser = async () => {
  try {
    await apiRequest("/auth/logout", {
      method: "POST",
    });
  } finally {
    clearSession();
  }
};

// ======================================
// DELETE ACCOUNT
// ======================================

export const deleteAccount = async () => {
  try {
    const data = await apiRequest("/auth/delete", {
      method: "DELETE",
    });

    return data;
  } finally {
    clearSession();
  }
};
