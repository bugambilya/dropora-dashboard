import { apiRequest } from "./api";

// GET ALL DELIVERIES
export const getDeliveries = async () => {
  try {
    return await apiRequest("/delivery");
  } catch (error) {
    console.error("Get deliveries error:", error);
    throw error;
  }
};

// REGISTER A DELIVERY
export const registerDelivery = async (deliveryData) => {
  try {
    return await apiRequest("/delivery", {
      method: "POST",
      body: JSON.stringify(deliveryData),
    });
  } catch (error) {
    console.error("Register delivery error:", error);
    throw error;
  }
};

// UPDATE DELIVERY STATUS
export const updateDeliveryStatus = async (id, status) => {
  try {
    return await apiRequest(`/delivery/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    console.error("Update delivery status error:", error);
    throw error;
  }
};

// DELETE A DELIVERY
export const deleteDelivery = async (id) => {
  try {
    return await apiRequest(`/delivery/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Delete delivery error:", error);
    throw error;
  }
};
