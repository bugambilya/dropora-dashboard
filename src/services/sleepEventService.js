
import { apiRequest } from "./api";

export const getSleepEvents = async (
  deviceUuid,
  offset = 0,
  limit = 10
) => {
  if (!deviceUuid) {
    throw new Error("Device UUID is required.");
  }

  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("Access token missing. Please log in again.");
  }

  return await apiRequest(
    `/telemetry/${encodeURIComponent(deviceUuid)}/sleep-events?offset=${offset}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
