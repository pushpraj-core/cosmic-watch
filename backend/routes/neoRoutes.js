const express = require('express');
const neoController = require('../controllers/neoController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/fetch', neoController.fetchNEOsFromNASA);
router.get('/list', neoController.getNEOs);
router.get('/upcoming', neoController.getUpcomingApproaches);
router.get('/:neoId', neoController.getNEOById);

// Protected routes
router.post('/watch', authMiddleware, neoController.watchAsteroid);
router.get('/watched/all', authMiddleware, neoController.getWatchedAsteroids);
router.delete('/watch/:neoId', authMiddleware, neoController.unwatchAsteroid);

module.exports = router;
