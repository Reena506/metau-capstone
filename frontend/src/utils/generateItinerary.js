import moment from "moment";
import { eventsPerDayMap, budgetActivityFilters, activityTimeSlots } from './itineraryConstants.js';
import { fetchWeatherForecast, getWeatherSummary, getActivityWeatherReason } from './weatherService.js';
import { fetchPlacesForItinerary } from './placesService.js';
import { filterActivitiesByWeatherAndBudget } from './activityFilters.js';
import { shuffleArray, adjustOverlappingEvents } from './itineraryHelpers.js';

export async function generateItinerary(formData) {
  const {
    startDate,
    endDate,
    scheduleStyle,
    dailyStart,
    specificPlaces,
    destination,
    goal,
    budget = 'mid'
  } = formData;

  const start = moment(startDate);
  const end = moment(endDate);
  const totalDays = end.diff(start, "days") + 1;
  const eventsPerDay = eventsPerDayMap[scheduleStyle];

  // Fetch weather forecast and places data simultaneously using the existing destination input
  const [placesData, weatherData] = await Promise.all([
    fetchPlacesForItinerary(destination, budget, goal),
    fetchWeatherForecast(destination, startDate, endDate)
  ]);

  const generatedEvents = [];
  const weatherSummary = {};

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const currentDate = moment(start).add(dayIndex, "days");
    const dateStr = currentDate.format('YYYY-MM-DD');
    
    // Store weather summary for each day
    weatherSummary[dateStr] = getWeatherSummary(weatherData, currentDate);
    
    const dayEvents = generateDayEvents(
      currentDate,
      eventsPerDay,
      dailyStart,
      specificPlaces,
      destination,
      goal,
      budget,
      placesData,
      weatherData
    );
    generatedEvents.push(...dayEvents);
  }

  // Return both events and weather data for the frontend
  return {
    events: generatedEvents,
    weatherSummary,
    destination,
    totalDays
  };
}

function generateDayEvents(
  currentDate,
  eventsPerDay,
  dailyStart,
  specificPlaces,
  destination,
  goal,
  budget,
  placesData,
  weatherData
) {
  const events = [];
  const budgetConfig = budgetActivityFilters[budget];

  const specificForDay = specificPlaces.filter(
    (place) =>
      place.place && place.day && moment(place.day).isSame(currentDate, "day") //filters for specific places user wants on that day
  );

  // Add user-specific events first
  specificForDay.forEach((specificPlace) => {
    const startTime = moment(
      `${currentDate.format("YYYY-MM-DD")} ${specificPlace.time || "10:00"}`
    );
    const endTime = moment(startTime).add(
      specificPlace.duration || 120,
      "minutes"
    );

    events.push({
      event: specificPlace.place,
      date: currentDate.toISOString(),
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      location: `${specificPlace.place}, ${destination}`,
      isSpecified: true,
      estimatedCost: specificPlace.cost || 0
    });
  });

  // Calculate how many more events we need to add
  const remainingSlots = Math.max(0, eventsPerDay - specificForDay.length);
  
  // If we already have enough events from user specifications, just return sorted events
  if (remainingSlots <= 0) {
    events.sort((a, b) => moment(a.start_time).diff(moment(b.start_time)));
    return adjustOverlappingEvents(events);
  }

  // Build activity pool from Google Places data
  let availableActivities = [];
  
  Object.entries(placesData).forEach(([category, places]) => {
    if (!places || places.length === 0) return;
    
    places.forEach(place => {
      availableActivities.push({
        ...place,
        type: category,
        duration: place.duration || 120
      });
    });
  });

  // Apply weather filtering 
  availableActivities = filterActivitiesByWeatherAndBudget(
    availableActivities, 
    goal, 
    budgetConfig, 
    weatherData, 
    currentDate
  );

  const shuffled = shuffleArray(availableActivities);
  let selected = [];
  let dailyCost = 0;

  // Only add activities up to the remaining slots
  for (let i = 0; i < shuffled.length && selected.length < remainingSlots; i++) {
    const activity = shuffled[i];
    const activityCost = activity.estimated_cost || 0;
    
    // Check if adding this activity would exceed daily budget
    if (dailyCost + activityCost > budgetConfig.maxDailyCost) {
      continue;
    }

    const timeSlot = activityTimeSlots[activity.type];
    if (!timeSlot) continue;

    const timeKey = dailyStart === "early" ? "early" : "late";
    const startTime = moment(
      `${currentDate.format("YYYY-MM-DD")} ${timeSlot[timeKey]}`
    );
    const endTime = moment(startTime).add(activity.duration, "minutes");

    // Check for conflicts with ALL existing events (including user-specific ones)
    const hasConflict = events.some((evt) => {
      const evtStart = moment(evt.start_time);
      const evtEnd = moment(evt.end_time);
      
      // More robust overlap detection with buffer time
      return (
        startTime.isBefore(evtEnd.add(15, "minutes")) &&
        endTime.isAfter(evtStart.subtract(15, "minutes"))
      );
    });

    if (!hasConflict) {
      // Add weather context to the event
      const weatherInfo = getWeatherSummary(weatherData, currentDate);
      
      events.push({
        event: activity.name,
        date: currentDate.toISOString(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location: activity.formatted_address || `${destination}`,
        isSpecified: false,
        estimatedCost: activityCost,
        place_id: activity.place_id,
        rating: activity.rating,
        category: activity.category,
        weatherOptimized: !!weatherInfo, // Flag to show this was weather-optimized
        weatherReason: weatherInfo ? getActivityWeatherReason(activity.type, weatherInfo) : null
      });
      selected.push(activity);
      dailyCost += activityCost;
    }
  }

  events.sort((a, b) => moment(a.start_time).diff(moment(b.start_time))); //sorts all events
  return adjustOverlappingEvents(events);
}

