const express = require('express');
const router = express.Router();
const { getTopTracks } = require('../controllers/statsController');

router.get('/top-tracks', getTopTracks);

module.exports = router;
