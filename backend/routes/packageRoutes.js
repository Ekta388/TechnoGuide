const express = require('express');
const packageController = require('../controllers/packageController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Package routes
router.get('/', packageController.getAllPackages);
router.get('/stats', packageController.getPackageStats);
router.get('/:id', packageController.getPackageById);
router.get('/client/:clientId', packageController.getPackagesByClient);
router.post('/', packageController.createPackage);
router.put('/:id', packageController.updatePackage);
router.delete('/:id', packageController.deletePackage);
router.patch('/:id/assign-team', packageController.assignTeamToPackage);
router.patch('/:id/progress', packageController.updatePackageProgress);

module.exports = router;
