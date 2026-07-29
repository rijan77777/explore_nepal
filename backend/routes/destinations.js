const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');
const adminAuth = require('../middleware/adminAuth');

// GET all destinations (public)
router.get('/', async (req, res) => {
  const data = await Destination.find();
  res.json(data);
});

// POST new destination (admin only)
router.post('/', adminAuth, async (req, res) => {
  const dest = new Destination(req.body);
  await dest.save();
  res.json({ message: 'Added ✅', dest });
});

// PUT update destination (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  const dest = await Destination.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ message: 'Updated ✅', dest });
});

// DELETE destination (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  await Destination.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted ✅' });
});

module.exports = router;
