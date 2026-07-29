const express = require('express');
const router = express.Router();
require('dotenv').config();

// GET /api/weather?lat=27.7&lon=85.3
router.get('/', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ message: 'lat and lon query params are required' });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`;
    const response = await fetch(url); // Node 18+ has fetch built in
    const data = await response.json();

    if (data.cod !== 200) {
      return res.status(502).json({ message: 'Weather service error', detail: data.message });
    }

    res.json({
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch weather', error: err.message });
  }
});

module.exports = router;
