
import { apiRequest } from "./api";

// Get all paired lockers
export const getPairedLockers = () => {
    return apiRequest("/locker/paired");
};

// Unpair a locker
export const unpairLocker = (deviceUuid) => {
    return apiRequest(
        `/locker/unpair/${encodeURIComponent(deviceUuid)}`,
        {
            method: "DELETE",
        }
    );
};

// ======================================
// LOCKER CONTROL
// ======================================

export const controlLocker = (deviceUuid, locked) => {
    if (!deviceUuid) {
        throw new Error("Locker device UUID is required.");
    }

    return apiRequest(
        `/locker/${encodeURIComponent(deviceUuid)}/control`,
        {
            method: "POST",
            body: JSON.stringify({ locked }),
        }
    );
};

// ======================================
// LOCKER TELEMETRY
// ======================================

// Get telemetry history for a specific locker
export const getLockerTelemetry = (
    deviceUuid,
    offset = 0,
    limit = 10
) => {
    return apiRequest(
        `/telemetry/${encodeURIComponent(deviceUuid)}?offset=${offset}&limit=${limit}`
    );
};
// ======================================
// REMOTE LOCKER CONTROL
// ======================================

export const sendRemoteCommand = ({
    deviceUuid,
    doorLocked,
    powerSaving,
}) => {
    if (!deviceUuid) {
        throw new Error("Locker device UUID is required.");
    }

    return apiRequest("/commands", {
        method: "POST",
        body: JSON.stringify({
            device_uuid: deviceUuid,
            door_locked: doorLocked,
            power_saving: powerSaving,
        }),
    });
};