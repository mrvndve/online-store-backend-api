const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const permissionChecker = require('../middleware/permission-checker');
const transactionsController = require('../controllers/transactions');

router.use(checkAuth);

router.get('/',
  permissionChecker('Transactions', 'Read'),
  transactionsController.getTransactions,
);

router.get('/deliveries',
  permissionChecker('Deliveries', 'Read'),
  transactionsController.getDeliveries,
);

router.get('/returned-items',
  permissionChecker('Returned Items', 'Read'),
  transactionsController.getReturnedItems,
);

router.post('/set-complete-deliveries',
  permissionChecker('Deliveries', 'Completion'),
  transactionsController.setCompleteDeliveries,
);

router.post('/set-cancel-deliveries',
  permissionChecker('Deliveries', 'Cancellation'),
  transactionsController.setCancelDeliveries,
);

router.post('/approve-returned-items',
  permissionChecker('Returned Items', 'Approve'),
  transactionsController.setApproveReturnedItems,
);

router.get('/riders', transactionsController.getDeliveryRiders);

router.post('/assign-driver', 
  permissionChecker('Deliveries', 'Assign Driver'),
  transactionsController.setDeliveriesDriver
);

router.post('/process-onsite-transaction', 
  permissionChecker('Transactions', 'Create'),
  transactionsController.processOnsiteTransaction
);

module.exports = router;