const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const { customersValidationRules, validate, } = require('../middleware/validator');
const customerController = require('../controllers/customer');
const permissionChecker = require('../middleware/permission-checker');

router.post('/register', 
  customersValidationRules.register, 
  validate, 
  customerController.register
);

router.post('/login', 
  customersValidationRules.login, 
  validate, customerController.login
);

router.post('/forgot-password', 
  customersValidationRules.forgotPassword, 
  validate, 
  customerController.forgotPassword
);

router.post('/reset-password/:token', 
  customersValidationRules.resetPassword, 
  validate, 
  customerController.resetPassword
);

router.post('/verify-email/:token', customerController.verifyEmail);

router.get('/categories', customerController.getCategories);

router.get('/tags', customerController.getTags);

router.get('/brands', customerController.getBrands);

router.post('/home-products', customerController.getHomeProducts);

router.post('/collections', customerController.getCollections);

router.post('/view-product', customerController.getViewProduct);

router.use(checkAuth);

router.get('/',
  permissionChecker('Customers', 'Read'),
  customerController.getCustomers,
);

router.post('/activate',
  permissionChecker('Customers', 'Activate'),
  customerController.activateCustomers
);

router.post('/deactivate',
  permissionChecker('Customers', 'Deactivate'),
  customerController.deactivateCustomers
);

router.post('/delete',
  permissionChecker('Customers', 'Delete'),
  customerController.deleteCustomer
);

router.post('/add-to-cart', customerController.addToCart);

router.get('/cart-products/:customerId', customerController.getCartProducts);

router.get('/cart-count/:customerId', customerController.cartCount);

router.post('/update-cart-quantity/:id', customerController.updateCartQuantity);

router.get('/wishlists/:customerId', customerController.getWishLists);

router.post('/remove-to-cart', customerController.removeToCart);

router.post('/add-to-wishlist', customerController.addToWishList);

router.post('/remove-to-wishlist', customerController.removeToWishList);

router.post('/cash-on-delivery-payment', customerController.cashOnDeliveryPayment);

router.post('/gcash-payment', customerController.gcashPayment);

router.post('/check-to-pay-transactions', customerController.checkToPayTransactions);

router.get('/transactions/:customerId', customerController.getTransactions);

router.post('/cancel-return-order', customerController.cancelReturnOrder);

router.post('/rate-order', customerController.rateOrder);

router.post('/update-profile/:id',
  customersValidationRules.updateProfile, 
  validate, 
  customerController.updateProfile
);

router.post('/update-address/:id',
  customersValidationRules.updateAddress, 
  validate, 
  customerController.updateAddress
);

router.post('/change-password/:id',
  customersValidationRules.changePassword, 
  validate, 
  customerController.changePassword
);

module.exports = router;
