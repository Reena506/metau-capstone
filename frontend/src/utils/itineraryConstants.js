export const eventsPerDayMap = {
  // Set number of activities per day
  relaxed: 3,
  moderate: 5,
  busy: 7,
};

export const activityNames = {
  // Name for each type of activity
  breakfast: "Breakfast",
  morning_activity: "Morning Sightseeing",
  cultural_site: "Cultural Site Visit",
  lunch: "Lunch",
  afternoon_activity: "Afternoon Exploration",
  outdoor_activity: "Outdoor Activity",
  afternoon_rest: "Free Time",
  shopping: "Shopping",
  dinner: "Dinner",
  evening_entertainment: "Evening Entertainment",
  nightlife: "Nightlife",
};

// Time slots for different activity types
export const activityTimeSlots = {
  breakfast: { early: "8:00", late: "9:00" },
  morning_activity: { early: "9:30", late: "10:30" },
  cultural_site: { early: "11:00", late: "12:00" },
  lunch: { early: "13:00", late: "14:00" },
  afternoon_activity: { early: "14:30", late: "15:30" },
  outdoor_activity: { early: "15:00", late: "16:00" },
  afternoon_rest: { early: "16:00", late: "17:00" },
  shopping: { early: "17:30", late: "18:30" },
  dinner: { early: "19:00", late: "20:00" },
  evening_entertainment: { early: "20:30", late: "21:30" },
  nightlife: { early: "22:00", late: "23:00" },
};

// Budget-based activity filtering
export const budgetActivityFilters = {
  budget: {
    preferred: ["afternoon_rest", "outdoor_activity", "morning_activity"],
    avoid: ["shopping", "evening_entertainment", "nightlife"],
    maxDailyCost: 100,
  },
  mid: {
    preferred: ["cultural_site", "morning_activity", "afternoon_activity"],
    avoid: [],
    maxDailyCost: 250,
  },
  luxury: {
    preferred: ["evening_entertainment", "cultural_site", "shopping", "nightlife"],
    avoid: ["afternoon_rest"],
    maxDailyCost: 500,
  },
};

// Weather-based activity filtering
export const weatherActivityRules = {
  outdoor_activity: {
    avoid: ["rain", "thunderstorm", "snow"],
    preferredTemp: { min: 59, max: 95 },
    maxWindSpeed: 12,
  },
  morning_activity: {
    avoid: ["thunderstorm", "heavy_rain"],
    preferredTemp: { min: 50, max: 100 },
  },
  cultural_site: {
    avoid: ["severe_thunderstorm"],
    backup: true, // Good fallback for bad weather
  },
  shopping: {
    avoid: ["severe_thunderstorm"],
    backup: true,
  },
  evening_entertainment: {
    avoid: ["severe_thunderstorm"],
    preferredTemp: { min: 40, max: 100 },
  },
  afternoon_rest: {
    backup: true, // for any weather
  },
};

// Fallback costs for different budget levels
export const fallbackCosts = {
  budget: {
    breakfast: 10,
    lunch: 15,
    dinner: 20,
    cultural_site: 20,
    morning_activity: 15,
    afternoon_activity: 20,
    outdoor_activity: 10,
    shopping: 25,
    evening_entertainment: 15,
    nightlife: 20,
  },
  mid: {
    breakfast: 25,
    lunch: 35,
    dinner: 50,
    cultural_site: 40,
    morning_activity: 35,
    afternoon_activity: 45,
    outdoor_activity: 30,
    shopping: 75,
    evening_entertainment: 40,
    nightlife: 45,
  },
  luxury: {
    breakfast: 50,
    lunch: 70,
    dinner: 120,
    cultural_site: 80,
    morning_activity: 75,
    afternoon_activity: 90,
    outdoor_activity: 60,
    shopping: 200,
    evening_entertainment: 100,
    nightlife: 80,
  },
};
