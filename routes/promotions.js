const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const { promotionsValidationRules, validate } = require('../middleware/validator');
const permissionChecker = require('../middleware/permission-checker');
const promotionsController = require('../controllers/promotions');

router.use(checkAuth);

router.post('/create', 
  promotionsValidationRules.create, 
  validate,
  permissionChecker('Promotions', 'Create'),
  promotionsController.createPromotion
);

router.get('/',
  permissionChecker('Promotions', 'Read'),
  promotionsController.getPromotions
);

router.get('/products', promotionsController.getProducts);

router.post('/update/:id', 
  promotionsValidationRules.update, 
  validate,
  permissionChecker('Promotions', 'Update'),
  promotionsController.updatePromotion
);

router.post('/delete', 
  promotionsValidationRules.delete, 
  validate,
  permissionChecker('Promotions', 'Delete'),
  promotionsController.deletePromotion,
);

router.post('/activate',
  promotionsValidationRules.activate,
  validate,
  permissionChecker('Promotions', 'Activate'),
  promotionsController.activatePromotion
);

router.post('/deactivate',
  promotionsValidationRules.deactivate,
  validate,
  permissionChecker('Promotions', 'Deactivate'),
  promotionsController.deactivatePromotion
);

module.exports = router;