const HttpError = require('../helpers/http-error');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return next(new HttpError('Authentication failed.', 401));
    }

    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    req.userData = { 
      userId: decodedToken.userId,
      roleId: decodedToken.roleId,
      branchId: decodedToken.branchId,
      userName: decodedToken.userName,
    };

    next();
  } catch (err) {
    return next(new HttpError('Authentication failed.', 401));
  }
};