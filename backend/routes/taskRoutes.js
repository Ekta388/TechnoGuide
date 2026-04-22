const express = require('express');
const taskController = require('../controllers/taskController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { taskUploadArray } = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Task routes
router.get('/', taskController.getAllTasks);
router.get('/stats', taskController.getTaskStats);
router.get('/history', taskController.getTaskHistory);
router.get('/client-report/:clientId', taskController.getClientReport);
router.get('/:id', taskController.getTaskById);
router.get('/member/:teamMemberId', taskController.getTasksByTeamMember);
router.get('/status/:status', taskController.getTasksByStatus);
router.get('/priority/:priority', taskController.getTasksByPriority);
router.post('/', taskUploadArray('referenceFiles', 10), taskController.createTask);
router.put('/:id', taskUploadArray('referenceFiles', 10), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.patch('/:id/status', taskController.updateTaskStatus);
router.post('/bulk-assign', taskController.bulkAssignTasks);

module.exports = router;
