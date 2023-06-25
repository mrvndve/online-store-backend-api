const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const { branchesValidationRules, validate, } = require('../middleware/validator');
const permissionChecker = require('../middleware/permission-checker');
const branchesController = require('../controllers/branches');

router.use(checkAuth);

router.post('/create', 
  branchesValidationRules.create, 
  validate,
  permissionChecker('Branches', 'Create'),
  branchesController.createBranch
);

router.get('/',
  permissionChecker('Branches', 'Read'),
  branchesController.getBranches
);

router.post('/update/:id',  
  branchesValidationRules.update, 
  validate, 
  permissionChecker('Branches', 'Update'),
  branchesController.updateBranch
);

router.post('/update-delivery-fee/:id',  
  branchesValidationRules.updateDeliveryFee, 
  validate, 
  permissionChecker('Delivery Fee', 'Update'),
  branchesController.updateDeliveryFee
);

router.post('/delete',  
  branchesValidationRules.delete, 
  validate,
  permissionChecker('Branches', 'Delete'),
  branchesController.deleteBranch
);

router.post('/activate',  
  branchesValidationRules.activate, 
  validate,
  permissionChecker('Branches', 'Activate'),
  branchesController.activateBranch
);

router.post('/deactivate',  
  branchesValidationRules.deactivate, 
  validate,
  permissionChecker('Branches', 'Deactivate'),
  branchesController.deactivateBranch
);

module.exports = router;
