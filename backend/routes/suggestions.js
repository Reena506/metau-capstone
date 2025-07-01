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
    //       opening_hours: [Object],
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

module.exports = router;
