const express = require('express');
const router = express.Router();
const { upload, uploadTrack, listTracks } = require('../controllers/trackController');

router.post('/upload', upload.single('file'), uploadTrack);
router.get('/', listTracks);

module.exports = router;
