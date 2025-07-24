const APP_URL = import.meta.env.VITE_APP_URL;

// Load budget allocations from API
export const loadBudgetAllocations = async (tripId) => {
  if (!tripId) {
    throw new Error("Trip ID is required");
  }

  try {
    const response = await fetch(
      `${APP_URL}/trips/${tripId}/budget-allocations`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load budget allocations");
    }

    const data = await response.json();
    return data.allocations;
  } catch (error) {
    console.error("Error loading budget allocations:", error);
    throw error;
  }
};

// Save budget allocations to API
export const saveBudgetAllocations = async (tripId, newAllocations) => {
  if (!tripId) {
    throw new Error("Trip ID is required");
  }

  try {
    const response = await fetch(
      `${APP_URL}/trips/${tripId}/budget-allocations`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          allocations: newAllocations,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to save budget allocations");
    }

    const data = await response.json();
    return data.allocations;
  } catch (error) {
    console.error("Error saving budget allocations:", error);
    throw error;
  }
};

// Reset budget allocations to default
export const resetBudgetAllocations = async (tripId) => {
  if (!tripId) {
    throw new Error("Trip ID is required");
  }

  try {
    const response = await fetch(
      `${APP_URL}/trips/${tripId}/budget-allocations`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to reset budget allocations");
    }

    const data = await response.json();
    return data.allocations;
  } catch (error) {
    console.error("Error resetting budget allocations:", error);
    throw error;
  }
};
