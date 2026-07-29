const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  type:      String,  // 'hotel' or 'restaurant'
  itemId:    String,  // hotel or restaurant id
  itemName:  String,  // hotel or restaurant name
  userName:  String,  // user's name
  email:     String,  // user's email
  date:      String,  // booking date
  guests:    Number,  // number of guests
  message:   String,  // special requests
  status:    { type: String, default: 'pending', enum: ['pending', 'confirmed', 'cancelled'] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
