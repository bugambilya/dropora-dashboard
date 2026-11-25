
import { apiRequest } from "./api";

// GET ALL PAIRED LOCKERS
export const getPairedLockers = async () => {
  try {
    return await apiRequest("/locker/paired");
  } catch (error) {
    console.error("Get paired lockers error:", error);
    throw error;
  }
};

// GET LOCKER TELEMETRY WITH PAGINATION
export const getLockerTelemetry = async (
  deviceUuid,
  offset = 0,
  limit = 10
) => {
  try {
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
      throw new Error("Invalid pagination parameters.");
    }

    return await apiRequest(
      `/telemetry/${encodeURIComponent(deviceUuid)}?offset=${offset}&limit=${limit}`
    );
  } catch (error) {
    console.error("Get locker telemetry error:", error);
    throw error;
  }
};

// REFRESH LOCKER TELEMETRY
export const refreshLockerTelemetry = (deviceUuid) => {
  return getLockerTelemetry(deviceUuid, 0, 10);
};
