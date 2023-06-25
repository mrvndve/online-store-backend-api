const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const { tagsValidationRules, validate } = require('../middleware/validator');
const permissionChecker = require('../middleware/permission-checker');
const tagsController = require('../controllers/tags');

router.use(checkAuth);

router.post('/create', 
  tagsValidationRules.create, 
  validate,
  permissionChecker('Tags', 'Create'),
  tagsController.createTag
);

router.get('/',
  permissionChecker('Tags', 'Read'),
  tagsController.getTags
);

router.post('/update/:id', 
  tagsValidationRules.update, 
  validate,
  permissionChecker('Tags', 'Update'),
  tagsController.updateTag
);

router.post('/delete', 
  tagsValidationRules.delete, 
  validate,
  permissionChecker('Tags', 'Delete'),
  tagsController.deleteTag,
);

router.post('/activate',
  tagsValidationRules.activate,
  validate,
  permissionChecker('Tags', 'Activate'),
  tagsController.activateTag
);

router.post('/deactivate',
  tagsValidationRules.deactivate,
  validate,
  permissionChecker('Tags', 'Deactivate'),
  tagsController.deactivateTag
);

module.exports = router;