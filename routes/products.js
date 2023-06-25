const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const { productsValidationRules, validate } = require('../middleware/validator');
const permissionChecker = require('../middleware/permission-checker');
const productsController = require('../controllers/products');

router.use(checkAuth);

router.get('/brands', productsController.getBrands);

router.get('/categories', productsController.getCategories);

router.get('/suppliers', productsController.getSuppliers);

router.get('/tags', productsController.getTags);

router.post('/create', 
  productsValidationRules.create, 
  validate,
  permissionChecker('Products', 'Create'),
  productsController.createProduct
);

router.get('/',
  permissionChecker('Products', 'Read'),
  productsController.getProducts
);

router.post('/update/:id', 
  productsValidationRules.update, 
  validate, 
  permissionChecker('Products', 'Update'),
  productsController.updateProduct
);

router.post('/delete', 
  productsValidationRules.delete, 
  validate,
  permissionChecker('Products', 'Delete'),
  productsController.deleteProduct
);

router.post('/activate',
  productsValidationRules.activate,
  validate,
  permissionChecker('Products', 'Activate'),
  productsController.activateProduct
);

router.post('/deactivate',
  productsValidationRules.deactivate,
  validate,
  permissionChecker('Products', 'Deactivate'),
  productsController.deactivateProduct
);

router.post('/add-stocks',
  permissionChecker('Products', 'Add Stocks'),
  productsController.manageStocks
);

router.post('/decrease-stocks',
  permissionChecker('Products', 'Decrease Stocks'),
  productsController.manageStocks
);

router.get('/stocks-report', productsController.getStocksReport);

module.exports = router;
