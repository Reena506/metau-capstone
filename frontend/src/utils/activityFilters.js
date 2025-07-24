import moment from "moment";
import { weatherActivityRules } from "./itineraryConstants.js";

// Activity filtering with weather
export function filterActivitiesByWeatherAndBudget(
  activities,
  goal,
  budgetConfig,
  weatherData,
  currentDate
) {
  let filtered = filterActivitiesByGoalAndBudget(
    activities,
    goal,
    budgetConfig
  );

  // If no weather data available, return original filtering
  if (!weatherData) return filtered;

  const dateStr = moment(currentDate).format("YYYY-MM-DD");
  const dayWeather = weatherData[dateStr];

  if (!dayWeather) return filtered;

  // Filter based on weather conditions
  filtered = filtered.filter((activity) => {
    const rules = weatherActivityRules[activity.type];
    if (!rules) return true; // No rules = always allowed

    // Check if weather conditions should avoid this activity
    const shouldAvoid = rules.avoid?.some((condition) => {
      if (condition === "rain" && dayWeather.precipitation > 0.08) return true; // > 0.08 inches
      if (condition === "heavy_rain" && dayWeather.precipitation > 0.4)
        return true; // > 0.4 inches
      if (
        condition === "thunderstorm" &&
        dayWeather.condition.includes("thunderstorm")
      )
        return true;
      if (
        condition === "severe_thunderstorm" &&
        dayWeather.condition.includes("thunderstorm") &&
        dayWeather.avgWindSpeed > 18
      )
        return true;
      if (condition === "snow" && dayWeather.condition.includes("snow"))
        return true;
      return false;
    });

    if (shouldAvoid) return false;

    // Check temperature preferences
    if (rules.preferredTemp) {
      const { min, max } = rules.preferredTemp;
      if (dayWeather.avgTemp < min || dayWeather.avgTemp > max) {
        return false;
      }
    }

    // Check wind speed
    if (rules.maxWindSpeed && dayWeather.avgWindSpeed > rules.maxWindSpeed) {
      return false;
    }

    return true;
  });

  // If bad weather eliminated too many options, add backup activities
  if (!dayWeather.isGoodWeather && filtered.length < 3) {
    const backupActivities = activities.filter(
      (activity) => weatherActivityRules[activity.type]?.backup
    );
    filtered = [...filtered, ...backupActivities.slice(0, 3)];
  }

  return filtered;
}

export function filterActivitiesByGoalAndBudget(
  activities,
  goal,
  budgetConfig
) {
  let filtered = [...activities];

  // Apply goal filtering
  if (goal === "relax") {
    filtered = filtered.filter((a) =>
      [
        "breakfast",
        "lunch",
        "dinner",
        "afternoon_rest",
        "shopping",
        "morning_activity",
        "outdoor_activity",
      ].includes(a.type)
    );
  } else if (goal === "explore") {
    filtered = filtered.filter((a) =>
      [
        "breakfast",
        "lunch",
        "dinner",
        "morning_activity",
        "outdoor_activity",
        "cultural_site",
        "afternoon_activity",
      ].includes(a.type)
    );
  } else if (goal === "food") {
    filtered = filtered.filter((a) =>
      [
        "breakfast",
        "lunch",
        "dinner",
        "morning_activity",
        "shopping",
        "cultural_site",
      ].includes(a.type)
    );
  }

  // Sort by budget preference
  filtered.sort((a, b) => {
    const aPreferred = budgetConfig.preferred.includes(a.type);
    const bPreferred = budgetConfig.preferred.includes(b.type);
    const aAvoided = budgetConfig.avoid.includes(a.type);
    const bAvoided = budgetConfig.avoid.includes(b.type);

    if (aPreferred && !bPreferred) return -1;
    if (!aPreferred && bPreferred) return 1;
    if (aAvoided && !bAvoided) return 1;
    if (!aAvoided && bAvoided) return -1;

    // Sort by cost within the same preference level
    return (a.estimated_cost || 0) - (b.estimated_cost || 0);
  });

  return filtered;
}
