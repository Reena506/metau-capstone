const express = require("express");
const router = express.Router();

require("dotenv").config();

router.get("/attractions", async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({ error: "City is required" });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=tourist+attractions+in+${encodeURIComponent(
    city
  )}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    // expected format:
    //   {
    //       formatted_address: '2800 Post Oak Blvd, Houston, TX 77056, United States',
    //       name: 'Gerald D. Hines Waterwall Park',
    //       opening_hours: {
    //          "open_now": false
    //        }
    //       rating: 4.7,
    //       user_ratings_total: 9123
    //       }

    if (data.status === "OK") {
      res.json(data);
    } else {
      res.status(500).json({ error: data.error_message || "Google API error" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch attractions" });
  }
});

router.get("/itinerary-places", async (req, res) => {
  const { city, budget = 'mid', goal = 'none' } = req.query;
  
  if (!city) {
    return res.status(400).json({ error: "City is required" });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  
  try {
    // Define search queries based on activity types and goals
    const searchQueries = getSearchQueries(city, budget, goal);
    
    // Fetch places for each category
    const placesByCategory = {};
    
    for (const [category, query] of Object.entries(searchQueries)) {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === "OK") {
        placesByCategory[category] = data.results.slice(0, 10).map(place => ({
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address,
          rating: place.rating,
          price_level: place.price_level,
          types: place.types,
          estimated_cost: estimateCost(place.price_level, category, budget),
          duration: getEstimatedDuration(category),
          category: category
        }));
      } else {
        console.warn(`Failed to fetch ${category} places:`, data.error_message);
        placesByCategory[category] = [];
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    res.json(placesByCategory);
    
  } catch (err) {
    console.error("Error fetching itinerary places:", err);
    res.status(500).json({ error: "Failed to fetch places for itinerary" });
  }
});

//generate search queries based on preferences
function getSearchQueries(city, budget, goal) {
  const baseQueries = {
    breakfast: `breakfast restaurants in ${city}`,
    lunch: `lunch restaurants in ${city}`,
    dinner: `dinner restaurants in ${city}`,
    cultural_site: `museums cultural sites in ${city}`,
    morning_activity: `morning activities sightseeing in ${city}`,
    afternoon_activity: `afternoon activities in ${city}`,
    outdoor_activity: `parks outdoor activities in ${city}`,
    shopping: `shopping areas markets in ${city}`,
    evening_entertainment: `entertainment venues in ${city}`,
    nightlife: `bars nightlife in ${city}`
  };

  // Modify queries based on budget
  if (budget === 'budget') {
    baseQueries.breakfast = `cheap budget breakfast in ${city}`;
    baseQueries.lunch = `affordable lunch restaurants in ${city}`;
    baseQueries.dinner = `budget friendly dinner in ${city}`;
    baseQueries.shopping = `local markets cheap shopping in ${city}`;
    baseQueries.evening_entertainment = `free entertainment activities in ${city}`;
  } else if (budget === 'luxury') {
    baseQueries.breakfast = `luxury breakfast fine dining in ${city}`;
    baseQueries.lunch = `upscale lunch restaurants in ${city}`;
    baseQueries.dinner = `fine dining restaurants in ${city}`;
    baseQueries.shopping = `luxury shopping high end stores in ${city}`;
    baseQueries.evening_entertainment = `premium entertainment venues in ${city}`;
  }

  // Modify queries based on goal
  if (goal === 'food') {
    baseQueries.cultural_site = `food markets culinary experiences in ${city}`;
    baseQueries.morning_activity = `food tours cooking classes in ${city}`;
    baseQueries.afternoon_activity = `wine tasting food experiences in ${city}`;
  } else if (goal === 'explore') {
    baseQueries.morning_activity = `historical sites landmarks in ${city}`;
    baseQueries.afternoon_activity = `hidden gems local attractions in ${city}`;
    baseQueries.cultural_site = `museums galleries historical sites in ${city}`;
  } else if (goal === 'relax') {
    baseQueries.morning_activity = `peaceful gardens relaxing spots in ${city}`;
    baseQueries.afternoon_activity = `spas wellness centers in ${city}`;
    baseQueries.outdoor_activity = `peaceful parks gardens in ${city}`;
  }

  return baseQueries;
}
//estimate costs based on price level and category
function estimateCost(priceLevel, category, budget) {
  const baseCosts = {
    budget: {
      breakfast: 8, lunch: 12, dinner: 18,
      cultural_site: 15, morning_activity: 10, afternoon_activity: 15,
      outdoor_activity: 5, shopping: 20, evening_entertainment: 12, nightlife: 15
    },
    mid: {
      breakfast: 20, lunch: 30, dinner: 45,
      cultural_site: 25, morning_activity: 30, afternoon_activity: 40,
      outdoor_activity: 20, shopping: 60, evening_entertainment: 35, nightlife: 40
    },
    luxury: {
      breakfast: 50, lunch: 80, dinner: 150,
      cultural_site: 60, morning_activity: 80, afternoon_activity: 120,
      outdoor_activity: 50, shopping: 200, evening_entertainment: 100, nightlife: 80
    }
  };

  let baseCost = baseCosts[budget][category] || 25;
  
  // Adjust based on Google's price level (0-4 scale)
  if (priceLevel !== undefined) {
    const multipliers = [0.5, 0.7, 1.0, 1.5, 2.0];
    baseCost *= multipliers[priceLevel] || 1.0;
  }
  
  return Math.round(baseCost);
}

//estimated duration for different activity types
function getEstimatedDuration(category) {
  const durations = {
    breakfast: 60,
    lunch: 90,
    dinner: 90,
    cultural_site: 120,
    morning_activity: 150,
    afternoon_activity: 120,
    outdoor_activity: 180,
    shopping: 90,
    evening_entertainment: 120,
    nightlife: 90
  };
  
  return durations[category] || 120;
}





module.exports = router;
