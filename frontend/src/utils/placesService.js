import { fallbackCosts } from "./itineraryConstants.js";

const APP_URL = import.meta.env.VITE_APP_URL;

// Fetch places from Google Places API
export async function fetchPlacesForItinerary(destination, budget, goal) {
  try {
    const response = await fetch(
      `${APP_URL}/suggestions/itinerary-places?city=${encodeURIComponent(
        destination
      )}&budget=${budget}&goal=${goal}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch places");
    }

    const placesData = await response.json();
    return placesData;
  } catch (error) {
    console.error("Error fetching places:", error);
    return getFallbackActivityPool(budget);
  }
}

// Fallback to hardcoded data if API fails
export function getFallbackActivityPool(budget) {
  return {
    breakfast: [
      {
        name: "Local Breakfast Spot",
        estimated_cost: fallbackCosts[budget].breakfast,
        category: "breakfast",
      },
    ],
    lunch: [
      {
        name: "Local Restaurant",
        estimated_cost: fallbackCosts[budget].lunch,
        category: "lunch",
      },
    ],
    dinner: [
      {
        name: "Dinner Restaurant",
        estimated_cost: fallbackCosts[budget].dinner,
        category: "dinner",
      },
    ],
    cultural_site: [
      {
        name: "Cultural Attraction",
        estimated_cost: fallbackCosts[budget].cultural_site,
        category: "cultural_site",
      },
    ],
    morning_activity: [
      {
        name: "Morning Sightseeing",
        estimated_cost: fallbackCosts[budget].morning_activity,
        category: "morning_activity",
      },
    ],
    afternoon_activity: [
      {
        name: "Afternoon Activity",
        estimated_cost: fallbackCosts[budget].afternoon_activity,
        category: "afternoon_activity",
      },
    ],
    outdoor_activity: [
      {
        name: "Outdoor Activity",
        estimated_cost: fallbackCosts[budget].outdoor_activity,
        category: "outdoor_activity",
      },
    ],
    shopping: [
      {
        name: "Shopping Area",
        estimated_cost: fallbackCosts[budget].shopping,
        category: "shopping",
      },
    ],
    evening_entertainment: [
      {
        name: "Evening Entertainment",
        estimated_cost: fallbackCosts[budget].evening_entertainment,
        category: "evening_entertainment",
      },
    ],
    nightlife: [
      {
        name: "Nightlife Venue",
        estimated_cost: fallbackCosts[budget].nightlife,
        category: "nightlife",
      },
    ],
  };
}
