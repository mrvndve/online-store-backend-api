const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const { brandsValidationRules, validate } = require('../middleware/validator');
const permissionChecker = require('../middleware/permission-checker');
const brandsController = require('../controllers/brands');

router.use(checkAuth);

router.post('/create', 
  brandsValidationRules.create, 
  validate,
  permissionChecker('Brands', 'Create'),
  brandsController.createBrand
);

router.get('/',
  permissionChecker('Brands', 'Read'),
  brandsController.getBrand
);

router.post('/update/:id', 
  brandsValidationRules.update, 
  validate, 
  permissionChecker('Brands', 'Update'),
  brandsController.updateBrand
);

router.post('/delete', 
  brandsValidationRules.delete, 
  validate,
  permissionChecker('Brands', 'Delete'),
  brandsController.deleteBrand
);

router.post('/activate',
  brandsValidationRules.activate,
  validate,
  permissionChecker('Brands', 'Activate'),
  brandsController.activateBrand
);

router.post('/deactivate',
  brandsValidationRules.deactivate,
  validate,
  permissionChecker('Brands', 'Deactivate'),
  brandsController.deactivateBrand
);

module.exports = router;
