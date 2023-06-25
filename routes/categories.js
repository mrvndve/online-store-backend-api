const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const { categoriesValidationRules, validate } = require('../middleware/validator');
const permissionChecker = require('../middleware/permission-checker');
const categoriesController = require('../controllers/categories');

router.use(checkAuth);

router.post('/create', 
  categoriesValidationRules.create, 
  validate,
  permissionChecker('Categories', 'Create'),
  categoriesController.createCategory
);

router.get('/',
  permissionChecker('Categories', 'Read'),
  categoriesController.getCategories
);

router.post('/update/:id', 
  categoriesValidationRules.update, 
  validate,
  permissionChecker('Categories', 'Update'),
  categoriesController.updateCategory
);

router.post('/delete', 
  categoriesValidationRules.delete, 
  validate,
  permissionChecker('Categories', 'Delete'),
  categoriesController.deleteCategory,
);

router.post('/activate',
  categoriesValidationRules.activate,
  validate,
  permissionChecker('Categories', 'Activate'),
  categoriesController.activateCategory
);

router.post('/deactivate',
  categoriesValidationRules.deactivate,
  validate,
  permissionChecker('Categories', 'Deactivate'),
  categoriesController.deactivateCategory
);

module.exports = router;