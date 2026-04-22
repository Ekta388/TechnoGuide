const express = require('express');
const assignmentController = require('../controllers/assignmentController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', assignmentController.getAllAssignments);
router.post('/', assignmentController.createAssignment);
router.patch('/:id/delivery', assignmentController.updateDelivery);
router.get('/client/:clientId/active', assignmentController.getActiveAssignmentByClient);

module.exports = router;
