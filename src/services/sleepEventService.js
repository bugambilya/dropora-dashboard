
import { apiRequest } from "./api";

// Get sleep history for a paired locker
export const getSleepEvents = (
  deviceUuid,
  offset = 0,
  limit = 10
) => {
  if (!deviceUuid) {
    throw new Error("Device UUID is required.");
  }

  return apiRequest(
    `/telemetry/${encodeURIComponent(
      deviceUuid
    )}/sleep-events?offset=${offset}&limit=${limit}`,
    {
      method: "GET",
    }
  );
};

// Record when the locker enters sleep mode
export const startSleepEvent = (deviceUuid) => {
  if (!deviceUuid) {
    throw new Error("Device UUID is required.");
  }

  return apiRequest(
    `/telemetry/device/${encodeURIComponent(
      deviceUuid
    )}/sleep-events/start`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
};

// Record when the locker wakes up
export const wakeSleepEvent = (
  deviceUuid,
  eventId
) => {
  if (!deviceUuid) {
    throw new Error("Device UUID is required.");
  }

  if (!eventId) {
    throw new Error("Sleep event ID is required.");
  }

  return apiRequest(
    `/telemetry/device/${encodeURIComponent(
      deviceUuid
    )}/sleep-events/wake`,
    {
      method: "POST",
      body: JSON.stringify({
        event_id: eventId,
      }),
    }
  );
};
