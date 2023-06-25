const UserModel = require('../models/users');

const permissionChecker = (moduleName, access) => {
  return async (req, res, next) => {
    let user = await UserModel.findById(req.userData.userId).populate('role');
    if (user) {
      if (user.role.permissions.some(i => i.name.includes(moduleName) && i.permissions.includes(access))) {
        return next();
      }

      return res.status(401).json({ message: 'Permission denied.' });
    }

    return res.status(401).json({ message: 'Permission denied.' });
  }
};

module.exports = permissionChecker;