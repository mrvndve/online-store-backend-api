const express = require('express');
const router = express.Router();
const { adminValidationRules, validate, } = require('../middleware/validator');
const checkAuth = require('../middleware/check-auth');
const adminController = require('../controllers/admin');
const permissionChecker = require('../middleware/permission-checker');

router.post('/login', adminValidationRules.login, validate, adminController.login);

router.post('/forgot-password', adminValidationRules.forgotPassword, validate, adminController.forgotPassword);

router.post('/reset-password/:token', adminValidationRules.resetPassword, validate, adminController.resetPassword);

router.use(checkAuth);

router.get(
  '/audit', 
  permissionChecker('Audits', 'Read'),
  adminController.getAudit
);

router.get(
  '/dashboard', 
  adminController.getDashboardDatas
);

router.post(
  '/dashboard-daily-sales', 
  adminController.getDailySales
);

router.post(
  '/dashboard-monthly-sales', 
  adminController.getMonthlySales
);

router.post(
  '/dashboard-yearly-sales', 
  adminController.getYearlySales
);

module.exports = router;
