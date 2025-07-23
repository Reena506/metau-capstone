import moment from "moment";
const APP_URL = import.meta.env.VITE_APP_URL;

const eventsPerDayMap = {
  //set number of activities per day
  relaxed: 3,
  moderate: 5,
  busy: 7,
};

const activityNames = {
  //name for each type of activity, might change later
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
const activityTimeSlots = {
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
const budgetActivityFilters = {
  budget: {
    preferred: ["afternoon_rest", "outdoor_activity", "morning_activity"],
    avoid: ["shopping", "evening_entertainment", "nightlife"],
    maxDailyCost: 100
  },
  mid: {
    preferred: ["cultural_site", "morning_activity", "afternoon_activity"],
    avoid: [],
    maxDailyCost: 250
  },
  luxury: {
    preferred: ["evening_entertainment", "cultural_site", "shopping", "nightlife"],
    avoid: ["afternoon_rest"],
    maxDailyCost: 500
  }
};

// Weather-based activity filtering
const weatherActivityRules = {
  outdoor_activity: {
    avoid: ['rain', 'thunderstorm', 'snow'],
    preferredTemp: { min: 59, max: 95 }, 
    maxWindSpeed: 12 
  },
  morning_activity: {
    avoid: ['thunderstorm', 'heavy_rain'],
    preferredTemp: { min: 50, max: 100 }
  },
  cultural_site: {
    avoid: ['severe_thunderstorm'],
    backup: true // Good fallback for bad weather
  },
  shopping: {
    avoid: ['severe_thunderstorm'],
    backup: true
  },
  evening_entertainment: {
    avoid: ['severe_thunderstorm'],
    preferredTemp: { min: 40, max: 100 }
  },
  afternoon_rest: {
    backup: true // for any weather
  }
};

// Fetch weather forecast for the destination
async function fetchWeatherForecast(destination, startDate, endDate) {
  try {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(destination)}&appid=${apiKey}&units=imperial`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const forecastData = await response.json();
    
    // Process forecast data 
    return processForecastData(forecastData, startDate, endDate);
    
  } catch (error) {
    console.error('Weather API error:', error);
    return null; 
  }
}

// Process raw weather data into usable daily summaries
function processForecastData(forecastData, startDate, endDate) {
  const dailyWeather = {};
  const start = moment(startDate);
  const end = moment(endDate);
  
  forecastData.list.forEach(item => {
    const date = moment(item.dt * 1000).format('YYYY-MM-DD');
    const itemDate = moment(date);
    
    // Only include dates within trip range
    if (itemDate.isBetween(start, end, 'day', '[]')) {
      if (!dailyWeather[date]) {
        dailyWeather[date] = {
          conditions: [],
          temps: [],
          windSpeeds: [],
          precipitation: 0
        };
      }
      
      dailyWeather[date].conditions.push(item.weather[0].main.toLowerCase());
      dailyWeather[date].temps.push(item.main.temp);
      dailyWeather[date].windSpeeds.push(item.wind?.speed || 0);
      
      if (item.rain) dailyWeather[date].precipitation += item.rain['3h'] || 0;
      if (item.snow) dailyWeather[date].precipitation += item.snow['3h'] || 0;
    }
  });
  
  // Create daily summaries
  const processedWeather = {};
  Object.keys(dailyWeather).forEach(date => {
    const day = dailyWeather[date];
    processedWeather[date] = {
      condition: getMostFrequentCondition(day.conditions),
      avgTemp: day.temps.reduce((a, b) => a + b) / day.temps.length,
      maxTemp: Math.max(...day.temps),
      minTemp: Math.min(...day.temps),
      avgWindSpeed: day.windSpeeds.reduce((a, b) => a + b) / day.windSpeeds.length,
      precipitation: day.precipitation,
      isGoodWeather: isGoodWeatherDay(day)
    };
  });
  
  return processedWeather;
}

function getMostFrequentCondition(conditions) {
  const counts = {};
  conditions.forEach(condition => {
    counts[condition] = (counts[condition] || 0) + 1;
  });
  
  return Object.keys(counts).reduce((a, b) => 
    counts[a] > counts[b] ? a : b
  );
}

function isGoodWeatherDay(dayData) {
  const avgTemp = dayData.temps.reduce((a, b) => a + b) / dayData.temps.length;
  const hasStorm = dayData.conditions.some(c => c.includes('thunderstorm'));
  const heavyRain = dayData.precipitation > 0.4; // inches
  
  return !hasStorm && !heavyRain && avgTemp > 41 && avgTemp < 104;
}

// activity filtering with weather
function filterActivitiesByWeatherAndBudget(activities, goal, budgetConfig, weatherData, currentDate) {
  
  let filtered = filterActivitiesByGoalAndBudget(activities, goal, budgetConfig);
  
  // If no weather data available, return original filtering
  if (!weatherData) return filtered;
  
  const dateStr = moment(currentDate).format('YYYY-MM-DD');
  const dayWeather = weatherData[dateStr];
  
  if (!dayWeather) return filtered;
  
  // Filter based on weather conditions
  filtered = filtered.filter(activity => {
    const rules = weatherActivityRules[activity.type];
    if (!rules) return true; // No rules = always allowed
    
    // Check if weather conditions should avoid this activity
    const shouldAvoid = rules.avoid?.some(condition => {
      if (condition === 'rain' && dayWeather.precipitation > 0.08) return true; // > 0.08 inches
      if (condition === 'heavy_rain' && dayWeather.precipitation > 0.4) return true; // > 0.4 inches
      if (condition === 'thunderstorm' && dayWeather.condition.includes('thunderstorm')) return true;
      if (condition === 'severe_thunderstorm' && dayWeather.condition.includes('thunderstorm') && dayWeather.avgWindSpeed > 18) return true;
      if (condition === 'snow' && dayWeather.condition.includes('snow')) return true;
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
    const backupActivities = activities.filter(activity => 
      weatherActivityRules[activity.type]?.backup
    );
    filtered = [...filtered, ...backupActivities.slice(0, 3)];
  }
  
  return filtered;
}

//  explain why an activity was chosen based on weather
function getActivityWeatherReason(activityType, weatherInfo) {
  if (!weatherInfo) return null;
  
  const temp = weatherInfo.temperature;
  const condition = weatherInfo.condition;
  
  if (condition.includes('rain') || condition.includes('storm')) {
    if (['cultural_site', 'shopping', 'afternoon_rest'].includes(activityType)) {
      return "Indoor activity recommended due to rain";
    }
  }
  
  if (temp > 86) {
    if (['cultural_site', 'shopping'].includes(activityType)) {
      return "Indoor activity recommended due to high temperature";
    }
  }
  
  if (temp < 41) {
    if (['cultural_site', 'shopping', 'evening_entertainment'].includes(activityType)) {
      return "Indoor activity recommended due to cold weather";
    }
  }
  
  if (condition === 'clear' && temp > 59 && temp < 82) {
    if (['outdoor_activity', 'morning_activity'].includes(activityType)) {
      return "Perfect weather for outdoor activities!";
    }
  }
  
  return null;
}

export function getWeatherSummary(weatherData, date) {
  const dateStr = moment(date).format('YYYY-MM-DD');
  const dayWeather = weatherData?.[dateStr];
  
  if (!dayWeather) return null;
  
  return {
    condition: dayWeather.condition,
    temperature: Math.round(dayWeather.avgTemp),
    precipitation: dayWeather.precipitation,
    recommendation: dayWeather.isGoodWeather ? 
      "Great weather for outdoor activities!" : 
      "Consider indoor alternatives"
  };
}

// Fetch places from Google Places API
async function fetchPlacesForItinerary(destination, budget, goal) {
  try {
    const response = await fetch(
      `${APP_URL}/suggestions/itinerary-places?city=${encodeURIComponent(destination)}&budget=${budget}&goal=${goal}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch places');
    }
    
    const placesData = await response.json();
    return placesData;
  } catch (error) {
    console.error('Error fetching places:', error);
    return getFallbackActivityPool(budget);
  }
}

// Fallback to hardcoded data if API fails
function getFallbackActivityPool(budget) {
  const fallbackCosts = {
    budget: { breakfast: 10, lunch: 15, dinner: 20, cultural_site: 20, morning_activity: 15, afternoon_activity: 20, outdoor_activity: 10, shopping: 25, evening_entertainment: 15, nightlife: 20 },
    mid: { breakfast: 25, lunch: 35, dinner: 50, cultural_site: 40, morning_activity: 35, afternoon_activity: 45, outdoor_activity: 30, shopping: 75, evening_entertainment: 40, nightlife: 45 },
    luxury: { breakfast: 50, lunch: 70, dinner: 120, cultural_site: 80, morning_activity: 75, afternoon_activity: 90, outdoor_activity: 60, shopping: 200, evening_entertainment: 100, nightlife: 80 }
  };

  return {
    breakfast: [{ name: "Local Breakfast Spot", estimated_cost: fallbackCosts[budget].breakfast, category: "breakfast" }],
    lunch: [{ name: "Local Restaurant", estimated_cost: fallbackCosts[budget].lunch, category: "lunch" }],
    dinner: [{ name: "Dinner Restaurant", estimated_cost: fallbackCosts[budget].dinner, category: "dinner" }],
    cultural_site: [{ name: "Cultural Attraction", estimated_cost: fallbackCosts[budget].cultural_site, category: "cultural_site" }],
    morning_activity: [{ name: "Morning Sightseeing", estimated_cost: fallbackCosts[budget].morning_activity, category: "morning_activity" }],
    afternoon_activity: [{ name: "Afternoon Activity", estimated_cost: fallbackCosts[budget].afternoon_activity, category: "afternoon_activity" }],
    outdoor_activity: [{ name: "Outdoor Activity", estimated_cost: fallbackCosts[budget].outdoor_activity, category: "outdoor_activity" }],
    shopping: [{ name: "Shopping Area", estimated_cost: fallbackCosts[budget].shopping, category: "shopping" }],
    evening_entertainment: [{ name: "Evening Entertainment", estimated_cost: fallbackCosts[budget].evening_entertainment, category: "evening_entertainment" }],
    nightlife: [{ name: "Nightlife Venue", estimated_cost: fallbackCosts[budget].nightlife, category: "nightlife" }]
  };
}

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

function filterActivitiesByGoalAndBudget(activities, goal, budgetConfig) {
  let filtered = [...activities];

  // Apply goal filtering
  if (goal === "relax") {
    filtered = filtered.filter((a) =>
      ["breakfast", "lunch", "dinner", "afternoon_rest", "shopping", "morning_activity", "outdoor_activity"].includes(a.type)
    );
  } else if (goal === "explore") {
    filtered = filtered.filter((a) =>
      ["breakfast", "lunch", "dinner", "morning_activity", "outdoor_activity", "cultural_site", "afternoon_activity"].includes(a.type)
    );
  } else if (goal === "food") {
    filtered = filtered.filter((a) =>
      ["breakfast", "lunch", "dinner", "morning_activity", "shopping", "cultural_site"].includes(a.type)
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

function adjustOverlappingEvents(events) {
  const adjusted = [];

  for (let i = 0; i < events.length; i++) {
    const evt = { ...events[i] };
    const start = moment(evt.start_time);
    const end = moment(evt.end_time);

    if (adjusted.length > 0) {
      const prevEnd = moment(adjusted[adjusted.length - 1].end_time);
      
      // If there's an overlap, move the event to start 30 minutes after previous ends
      if (start.isBefore(prevEnd)) {
        const newStart = moment(prevEnd).add(30, "minutes"); // Increased buffer
        const duration = end.diff(start, "minutes");
        evt.start_time = newStart.toISOString();
        evt.end_time = newStart.add(duration, "minutes").toISOString();
      }
    }

    adjusted.push(evt);
  }

  return adjusted;
}

function shuffleArray(array) {
  //makes sure each day has different event orders
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
