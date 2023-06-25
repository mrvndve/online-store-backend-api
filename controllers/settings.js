const UsersModel = require('../models/users');
const messages = require('../helpers/messages');
const HttpError = require('../helpers/http-error');
const Audit = require('../helpers/audit');
const { isEmpty } = require('lodash');
const bcrypt = require('bcryptjs');
// const backup = require('mongodb-backup');

const updateProfile = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  let user;
  try {
    user = await UsersModel.findById(userId).populate('role').populate('branch');
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const firstName = req.body.firstName;
  const middleName = req.body.middleName;
  const lastName = req.body.lastName;
  const fullName = !isEmpty(middleName) ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`

  user.userName = req.body.userName;
  user.email = req.body.email;
  user.firstName = firstName;
  user.middleName = middleName;
  user.lastName = lastName;
  user.fullName = fullName;
  user.contact = req.body.contact;

  try {
    await user.save();
  } catch  (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Profile ${messages.UPDATE_SUCCESS}`;
  Audit(userId, branchId, 'Settings', 'Update Profile', message, user);
  res.status(200).json({ 
    message, 
    data: user.toObject({ getters: true }),
  });
};

const changePassword = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  let user;
  try {
    user = await UsersModel.findById(userId);
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(req.body.newPassword, 12);
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  user.password = hashedPassword;

  try {
    await user.save();
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = 'Your password has been changed.';
  Audit(userId, branchId, 'Settings', 'Change Password', message);
  res.status(200).json({ message });
};

module.exports = {
  updateProfile,
  changePassword,
};