import { apiRequest } from "./api";

// Get all deliveries
export const getDeliveries = () => {
  return apiRequest("/delivery");
};

// Register a delivery
export const registerDelivery = (deliveryData) => {
  return apiRequest("/delivery", {
    method: "POST",
    body: JSON.stringify(deliveryData),
  });
};

// Update delivery status
export const updateDeliveryStatus = (id, status) => {
  return apiRequest(`/delivery/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
};

// Delete delivery
export const deleteDelivery = (id) => {
  return apiRequest(`/delivery/${id}`, {
    method: "DELETE",
  });
};