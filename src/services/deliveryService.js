
import { apiRequest } from "./api";

// ======================================
// GET DELIVERY HISTORY
// ======================================
export const getDeliveries = () => {
  return apiRequest("/delivery", {
    method: "GET",
  });
};

// ======================================
// REGISTER NEW DELIVERY
// ======================================
export const registerDelivery = ({
  courier_type,
  parcel_id,
}) => {
  const supportedCouriers = [
    "FLASH",
    "SPX",
    "J&T",
  ];

  if (!supportedCouriers.includes(courier_type)) {
    throw new Error("Unsupported courier type.");
  }

  const parcelId = String(parcel_id || "").trim();

  if (!parcelId) {
    throw new Error("Parcel ID is required.");
  }

  if (!/^\d+$/.test(parcelId)) {
    throw new Error(
      "Parcel ID must contain numbers only."
    );
  }

  return apiRequest("/delivery", {
    method: "POST",
    body: JSON.stringify({
      courier_type,
      parcel_id: parcelId,
    }),
  });
};

// ======================================
// UPDATE DELIVERY STATUS
// ======================================
export const updateDeliveryStatus = (
  deliveryId,
  status
) => {
  if (!deliveryId) {
    throw new Error("Delivery ID is required.");
  }

  const allowedStatuses = [
    "received",
    "cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid delivery status.");
  }

  return apiRequest(
    `/delivery/${encodeURIComponent(
      deliveryId
    )}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    }
  );
};
