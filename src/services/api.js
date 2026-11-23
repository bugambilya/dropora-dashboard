
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export const getToken = () => {
  return localStorage.getItem("accessToken");
};

export const saveSession = (session) => {
  if (session?.access_token) {
    localStorage.setItem(
      "accessToken",
      session.access_token
    );
  }

  if (session?.refresh_token) {
    localStorage.setItem(
      "refreshToken",
      session.refresh_token
    );
  }
};

export const clearSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE}/api${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || "Something went wrong."
    );
  }

  return data;
};
