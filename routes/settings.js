const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const { settingsValidationRules, validate } = require('../middleware/validator');
const settingsController = require('../controllers/settings');

router.use(checkAuth);

router.post('/update-profile',
  settingsValidationRules.updateProfile,
  validate,
  settingsController.updateProfile
);

router.post('/change-password',
  settingsValidationRules.changePassword,
  validate,
  settingsController.changePassword
);

module.exports = router;