const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/hotels',       require('./routes/hotels'));
app.use('/api/restaurants',  require('./routes/restaurants'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/bookings',     require('./routes/bookings'));
app.use('/api/weather',      require('./routes/weather'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT, () => {
      console.log('🚀 Server running on http://localhost:5000');
    });
  })
  .catch(err => console.error('❌ Error:', err));
