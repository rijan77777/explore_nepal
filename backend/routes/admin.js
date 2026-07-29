const express = require('express');
const router = express.Router();
require('dotenv').config();

const adminAuth = require('../middleware/adminAuth');
const Destination = require('../models/Destination');
const Hotel = require('../models/Hotel');
const Restaurant = require('../models/Restaurant');
const Booking = require('../models/Booking');

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Wrong password' });
  }
});

// GET /api/admin/stats (protected) — dashboard overview numbers
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [destinationCount, hotelCount, restaurantCount, bookingCount, recentBookings] =
      await Promise.all([
        Destination.countDocuments(),
        Hotel.countDocuments(),
        Restaurant.countDocuments(),
        Booking.countDocuments(),
        Booking.find().sort({ createdAt: -1 }).limit(5)
      ]);

    const byProvince = await Destination.aggregate([
      { $group: { _id: '$province', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      destinationCount,
      hotelCount,
      restaurantCount,
      bookingCount,
      recentBookings,
      byProvince
    });
  } catch (err) {
    res.status(500).json({ message: 'Error loading stats', error: err.message });
  }
});

module.exports = router;
