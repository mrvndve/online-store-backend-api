const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const { suppliersValdationRules, validate } = require('../middleware/validator');
const permissionChecker = require('../middleware/permission-checker');
const suppliersController = require('../controllers/suppliers');

router.use(checkAuth);

router.post('/create', 
  suppliersValdationRules.create, 
  validate,
  permissionChecker('Suppliers', 'Create'),
  suppliersController.createSupplier
);

router.get('/',
  permissionChecker('Suppliers', 'Read'),
  suppliersController.getSuppliers
);

router.post('/update/:id', 
  suppliersValdationRules.update, 
  validate,
  permissionChecker('Suppliers', 'Update'),
  suppliersController.updateSupplier
);

router.post('/delete', 
  suppliersValdationRules.delete, 
  validate,
  permissionChecker('Suppliers', 'Delete'),
  suppliersController.deleteSupplier,
);

router.post('/activate',
  suppliersValdationRules.activate,
  validate,
  permissionChecker('Suppliers', 'Activate'),
  suppliersController.activateSupplier
);

router.post('/deactivate',
  suppliersValdationRules.deactivate,
  validate,
  permissionChecker('Suppliers', 'Deactivate'),
  suppliersController.deactivateSupplier
);

module.exports = router;