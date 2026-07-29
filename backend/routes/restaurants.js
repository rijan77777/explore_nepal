const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const adminAuth = require('../middleware/adminAuth');

// GET all restaurants (public)
router.get('/', async (req, res) => {
  const data = await Restaurant.find();
  res.json(data);
});

// POST new restaurant (admin only)
router.post('/', adminAuth, async (req, res) => {
  const resto = new Restaurant(req.body);
  await resto.save();
  res.json({ message: 'Added ✅', resto });
});

// PUT update restaurant (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  const resto = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ message: 'Updated ✅', resto });
});

// DELETE restaurant (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  await Restaurant.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted ✅' });
});

module.exports = router;
