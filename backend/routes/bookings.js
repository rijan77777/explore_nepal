const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const adminAuth = require('../middleware/adminAuth');

// GET all bookings (admin dashboard only)
router.get('/', adminAuth, async (req, res) => {
  const data = await Booking.find().sort({ createdAt: -1 });
  res.json(data);
});

// POST new booking (public — user submits a booking)
router.post('/', async (req, res) => {
  const booking = new Booking(req.body);
  await booking.save();
  res.json({ message: 'Booking saved ✅', booking });
});

// GET bookings by email (public — kept exactly as before, unchanged behavior)
router.get('/:email', async (req, res) => {
  const data = await Booking.find({ email: req.params.email });
  res.json(data);
});

// PATCH booking status (admin only) — e.g. { "status": "confirmed" }
router.patch('/:id/status', adminAuth, async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json({ message: 'Status updated ✅', booking });
});

// DELETE booking (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  await Booking.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted ✅' });
});

module.exports = router;
