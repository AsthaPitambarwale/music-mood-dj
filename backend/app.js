// app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // loads .env from project root

const tracksRoute = require('./routes/tracks');
const playlistsRoute = require('./routes/playlists');
const statsRoute = require('./routes/stats');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/tracks', tracksRoute);
app.use('/playlists', playlistsRoute);
app.use('/stats', statsRoute);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/music-mood-dj';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

module.exports = app;
