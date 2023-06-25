const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const { usersValidationRules, validate } = require('../middleware/validator');
const permissionChecker = require('../middleware/permission-checker');
const usersController = require('../controllers/users');

router.post('/activate-account/:token', usersController.activateAccount);

router.use(checkAuth);

router.post('/create', 
  usersValidationRules.create, 
  validate, 
  permissionChecker('Users', 'Create'), 
  usersController.createUser
);

router.get('/', 
  permissionChecker('Users', 'Read'),
  usersController.getUsers,
);

router.get('/roles', usersController.getRoles);

router.post('/update/:id', 
  usersValidationRules.update, 
  validate,
  permissionChecker('Users', 'Update'),
  usersController.updateUser
);

router.post('/delete', 
  usersValidationRules.delete, 
  validate,
  permissionChecker('Users', 'Delete'),
  usersController.deleteUser
);

router.post('/activate',
  usersValidationRules.activate,
  validate,
  permissionChecker('Users', 'Activate'),
  usersController.activateUser
);

router.post('/deactivate',
  usersValidationRules.deactivate,
  validate,
  permissionChecker('Users', 'Deactivate'),
  usersController.deactivateUser
);

router.post('/reset-password',
  usersValidationRules.resetPassword,
  validate,
  permissionChecker('Users', 'Reset Password'),
  usersController.resetPassword
);

module.exports = router;
