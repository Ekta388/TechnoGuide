const express = require('express');
const teamController = require('../controllers/teamController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Team routes
router.get('/', teamController.getAllTeam);
router.get('/stats', teamController.getTeamStats);
router.get('/:id', teamController.getTeamMemberById);
router.get('/role/:role', teamController.getTeamByRole);
router.get('/department/:department', teamController.getTeamByDepartment);
router.post('/', teamController.addTeamMember);
router.put('/:id', teamController.updateTeamMember);
router.delete('/:id', teamController.deleteTeamMember);
router.patch('/:id/status', teamController.updateTeamMemberStatus);

module.exports = router;
