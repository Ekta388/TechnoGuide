const express = require('express');
const clientController = require('../controllers/clientController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Client routes
router.get('/', clientController.getAllClients);
router.get('/stats', clientController.getClientStats);
router.get('/:id', clientController.getClientById);
router.get('/:id/packages', clientController.getClientPackages);
router.post('/', uploadSingle('logo'), clientController.addClient);
router.put('/:id', uploadSingle('logo'), clientController.updateClient);
router.delete('/:id', clientController.deleteClient);
router.patch('/:id/status', clientController.updateClientStatus);

module.exports = router;
