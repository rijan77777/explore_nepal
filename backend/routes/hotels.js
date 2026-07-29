const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');
const adminAuth = require('../middleware/adminAuth');

// GET all hotels (public)
router.get('/', async (req, res) => {
  const data = await Hotel.find();
  res.json(data);
});

// POST new hotel (admin only)
router.post('/', adminAuth, async (req, res) => {
  const hotel = new Hotel(req.body);
  await hotel.save();
  res.json({ message: 'Added ✅', hotel });
});

// PUT update hotel (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ message: 'Updated ✅', hotel });
});

// DELETE hotel (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  await Hotel.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted ✅' });
});

module.exports = router;
