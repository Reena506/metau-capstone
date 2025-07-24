import moment from "moment";

// Fetch weather forecast for the destination
export async function fetchWeatherForecast(destination, startDate, endDate) {
  try {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        destination
      )}&appid=${apiKey}&units=imperial`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const forecastData = await response.json();

    // Process forecast data
    return processForecastData(forecastData, startDate, endDate);
  } catch (error) {
    console.error("Weather API error:", error);
    return null;
  }
}

// Process raw weather data into usable daily summaries
function processForecastData(forecastData, startDate, endDate) {
  const dailyWeather = {};
  const start = moment(startDate);
  const end = moment(endDate);

  forecastData.list.forEach((item) => {
    const date = moment(item.dt * 1000).format("YYYY-MM-DD");
    const itemDate = moment(date);

    // Only include dates within trip range
    if (itemDate.isBetween(start, end, "day", "[]")) {
      if (!dailyWeather[date]) {
        dailyWeather[date] = {
          conditions: [],
          temps: [],
          windSpeeds: [],
          precipitation: 0,
        };
      }

      dailyWeather[date].conditions.push(item.weather[0].main.toLowerCase());
      dailyWeather[date].temps.push(item.main.temp);
      dailyWeather[date].windSpeeds.push(item.wind?.speed || 0);

      if (item.rain) dailyWeather[date].precipitation += item.rain["3h"] || 0;
      if (item.snow) dailyWeather[date].precipitation += item.snow["3h"] || 0;
    }
  });

  // Create daily summaries
  const processedWeather = {};
  Object.keys(dailyWeather).forEach((date) => {
    const day = dailyWeather[date];
    processedWeather[date] = {
      condition: getMostFrequentCondition(day.conditions),
      avgTemp: day.temps.reduce((a, b) => a + b) / day.temps.length,
      maxTemp: Math.max(...day.temps),
      minTemp: Math.min(...day.temps),
      avgWindSpeed:
        day.windSpeeds.reduce((a, b) => a + b) / day.windSpeeds.length,
      precipitation: day.precipitation,
      isGoodWeather: isGoodWeatherDay(day),
    };
  });

  return processedWeather;
}

function getMostFrequentCondition(conditions) {
  const counts = {};
  conditions.forEach((condition) => {
    counts[condition] = (counts[condition] || 0) + 1;
  });

  return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
}

function isGoodWeatherDay(dayData) {
  const avgTemp = dayData.temps.reduce((a, b) => a + b) / dayData.temps.length;
  const hasStorm = dayData.conditions.some((c) => c.includes("thunderstorm"));
  const heavyRain = dayData.precipitation > 0.4; // inches

  return !hasStorm && !heavyRain && avgTemp > 41 && avgTemp < 104;
}

// Explain why an activity was chosen based on weather
export function getActivityWeatherReason(activityType, weatherInfo) {
  if (!weatherInfo) return null;

  const temp = weatherInfo.temperature;
  const condition = weatherInfo.condition;

  if (condition.includes("rain") || condition.includes("storm")) {
    if (
      ["cultural_site", "shopping", "afternoon_rest"].includes(activityType)
    ) {
      return "Indoor activity recommended due to rain";
    }
  }

  if (temp > 86) {
    if (["cultural_site", "shopping"].includes(activityType)) {
      return "Indoor activity recommended due to high temperature";
    }
  }

  if (temp < 41) {
    if (
      ["cultural_site", "shopping", "evening_entertainment"].includes(
        activityType
      )
    ) {
      return "Indoor activity recommended due to cold weather";
    }
  }

  if (condition === "clear" && temp > 59 && temp < 82) {
    if (["outdoor_activity", "morning_activity"].includes(activityType)) {
      return "Perfect weather for outdoor activities!";
    }
  }

  return null;
}

export function getWeatherSummary(weatherData, date) {
  const dateStr = moment(date).format("YYYY-MM-DD");
  const dayWeather = weatherData?.[dateStr];

  if (!dayWeather) return null;

  return {
    condition: dayWeather.condition,
    temperature: Math.round(dayWeather.avgTemp),
    precipitation: dayWeather.precipitation,
    recommendation: dayWeather.isGoodWeather
      ? "Great weather for outdoor activities!"
      : "Consider indoor alternatives",
  };
}
