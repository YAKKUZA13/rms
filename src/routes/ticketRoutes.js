const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

router.post('/tickets', ticketController.createTicket);

router.put('/tickets/cancel-all-in-progress', ticketController.cancelAllInProgressTickets);

router.put('/tickets/:id/take', ticketController.takeTicket);

router.put('/tickets/:id/complete', ticketController.completeTicket);

router.put('/tickets/:id/cancel', ticketController.cancelTicket);

router.get('/tickets', ticketController.getTickets);

module.exports = router; 