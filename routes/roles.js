const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const { rolesValidationRules, validate } = require('../middleware/validator');
const permissionChecker = require('../middleware/permission-checker');
const rolesController = require('../controllers/roles');

router.use(checkAuth);

router.post('/create', 
  rolesValidationRules.create, 
  validate,
  permissionChecker('Roles', 'Create'),
  rolesController.createRole
);

router.get('/',
  permissionChecker('Roles', 'Read'),
  rolesController.getRoles
);

router.post('/update/:id', 
  rolesValidationRules.update, 
  validate,
  permissionChecker('Roles', 'Update'),
  rolesController.updateRole
);

router.post('/delete', 
  rolesValidationRules.delete, 
  validate, 
  permissionChecker('Roles', 'Delete'),
  rolesController.deleteRole
);

router.post('/activate', 
  rolesValidationRules.activate, 
  validate, 
  permissionChecker('Roles', 'Activate'),
  rolesController.activateRole
);

router.post('/deactivate', 
  rolesValidationRules.deactivate, 
  validate, 
  permissionChecker('Roles', 'Deactivate'),
  rolesController.deactivateRole
);

router.get('/default-permissions', rolesController.getDefaultPermissions);

module.exports = router;
