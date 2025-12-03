const express = require('express');
const router = express.Router();
const { createPlaylist, getPlaylist } = require('../controllers/playlistController');

router.post('/generate', createPlaylist);
router.get('/:id', getPlaylist);

module.exports = router;
