
import { apiRequest } from "./api";

// ======================================
// GET ALL PAIRED LOCKERS
// ======================================
export const getPairedLockers = async () => {
  try {
    return await apiRequest("/locker/paired", {
      method: "GET",
    });
  } catch (error) {
    console.error(
      "Get paired lockers error:",
      error
    );

    throw error;
  }
};

// ======================================
// GET LOCKER TELEMETRY WITH PAGINATION
// ======================================
export const getLockerTelemetry = async (
  deviceUuid,
  offset = 0,
  limit = 10
) => {
  if (!deviceUuid) {
    throw new Error("Device UUID is required.");
  }

  if (
    !Number.isInteger(offset) ||
    offset < 0 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new Error(
      "Invalid pagination parameters."
    );
  }

  return apiRequest(
    `/telemetry/${encodeURIComponent(
      deviceUuid
    )}?offset=${offset}&limit=${limit}`,
    {
      method: "GET",
    }
  );
};

// ======================================
// REQUEST LIVE TELEMETRY FROM ESP32
// ======================================
export const requestLockerTelemetry = async (
  deviceUuid
) => {
  if (!deviceUuid) {
    throw new Error("Device UUID is required.");
  }

  return apiRequest(
    `/telemetry/${encodeURIComponent(
      deviceUuid
    )}/request`,
    {
      method: "POST",
    }
  );
};

// ======================================
// REFRESH TELEMETRY
// ======================================
export const refreshLockerTelemetry = async (
  deviceUuid
) => {
  try {
    return await requestLockerTelemetry(
      deviceUuid
    );
  } catch (error) {
    console.error(
      "Refresh locker telemetry error:",
      error
    );

    throw error;
  }
};
