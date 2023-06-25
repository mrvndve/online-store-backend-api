const mongoose = require('mongoose');
const UsersModel = require('../models/users');
const RolesModel = require('../models/roles');
const BranchesModel = require('../models/branches');
const messages = require('../helpers/messages');
const HttpError = require('../helpers/http-error');
const Audit = require('../helpers/audit');
const bcrypt = require('bcryptjs');
const nodeMailer = require('../helpers/node-mailer');
const { isEmpty } = require('lodash');
const jwt = require('jsonwebtoken');

const getUsers = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  let users;
  try {
    users = await UsersModel.find({ _id: { $ne: userId, }, branch: branchId }, '-password')
      .populate('role')
      .populate('branch')
      .sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  res.status(200).json({ data: users.map(user => user.toObject({ getters: true})) });
};

const getRoles = async (req, res, next) => {
  const {
    userData: {
      branchId,
    },
  } = req;

  let roles;
  try {
    roles = await RolesModel.find({ branch: branchId, isActive: true }).sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  res.status(200).json({ data: roles.map(role => role.toObject({ getters: true})) });
}

const createUser = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  const password = Math.random().toString(36).slice(2);
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const firstName = req.body.firstName;
  const middleName = req.body.middleName;
  const lastName = req.body.lastName;
  const fullName = !isEmpty(middleName) ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`

  const newUser = new UsersModel({ 
    branch: branchId,
    role: req.body.role,
    userName: req.body.userName,
    password: hashedPassword,
    email: req.body.email,
    firstName,
    middleName,
    lastName,
    fullName,
    contact: req.body.contact,
    isActive: req.body.isActive,
  });

  try {
    await newUser.save();
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  let branch;
  try {
    branch = await BranchesModel.findOne({ _id: branchId });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const token = jwt.sign(
    { userId: newUser.id, branchId: branchId },
    process.env.SECRET_KEY,
  );

  const message = `User ${messages.CREATE_SUCCESS}`;
  Audit(userId, branchId, 'Users', 'Create', message, newUser);
  nodeMailer.sendEmail(
    newUser.email, 
    'Umal Marketing New User', 
    `Greetings ${newUser.firstName}, Welcome to Umal Marketing ${branch.name} family!, please start by activating account by setting up your password. ${process.env.FRONTEND_DOMAIN}/admin/activate-account/${token}`,
  );
  res.status(200).json({ message })
};

const activateAccount = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let decodedToken
    try {
      decodedToken = jwt.verify(req.params.token, process.env.SECRET_KEY);
    } catch (err) {
      return next(new HttpError(process.env.NODE_ENV === 'development' ? err : 'Access Denied', 401));
    }

    const password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await UsersModel.findById(decodedToken.userId);
    user.password = hashedPassword;
    user.isActive = true;
    await user.save();

    const message = `User Account Activate Successful.`;
    Audit(decodedToken.userId, decodedToken.branchId, 'Users', 'Activate', message);
    res.status(200).json({ message });

    session.commitTransaction();
    session.endSession();
  } catch (err) {
    session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const updateUser = async(req, res, next) => {
  const {
    userData: {
      userId: byUserId,
      branchId,
    },
  } = req;

  const {
    id: userId,
  } = req.params;

  let user;
  try {
    user = await UsersModel.findById(userId);
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const firstName = req.body.firstName;
  const middleName = req.body.middleName;
  const lastName = req.body.lastName;
  const fullName = !isEmpty(middleName) ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`

  user.role = req.body.role;
  user.userName = req.body.userName;
  user.email = req.body.email;
  user.firstName = firstName;
  user.middleName = middleName;
  user.lastName = lastName;
  user.fullName = fullName;
  user.contact = req.body.contact;
  user.isActive = req.body.isActive;

  try {
    await user.save();
  } catch  (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `User ${messages.UPDATE_SUCCESS}`;
  Audit(byUserId, branchId, 'Users', 'Update', message, user);
  res.status(200).json({ 
    message, 
    data: user.toObject({ getters: true }),
  });
}

const deleteUser = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;
  
  try {
    await UsersModel.deleteMany({ _id: { $in: req.body.ids }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `User/s ${messages.DELETE_SUCCESS}`;
  Audit(userId, branchId, 'Users', 'Delete', message);
  res.status(200).json({ message });
};

const activateUser = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await UsersModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: true }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `User/s ${messages.ACTIVATED_SUCCESS}`;
  Audit(userId, branchId, 'Users', 'Activate', message);
  res.status(200).json({ message });
};

const deactivateUser = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await UsersModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: false }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `User/s ${messages.DEACTIVATED_SUCCESS}`;
  Audit(userId, branchId, 'Users', 'Deactivate', message);
  res.status(200).json({ message });
};

const resetPassword = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    const password = Math.random().toString(36).slice(2);
    const hashedPassword = await bcrypt.hash(password, 12);

    await UsersModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { password: hashedPassword }});

    let users = await UsersModel.find({ _id: { $in: req.body.ids }});
    
    users.map(user => (
      nodeMailer.sendEmail(
        user.email, 
        'Reset Password', 
        `Hello ${user.firstName}, here is your new password given by the admin. (password: ${password})`,
      )
    ));

    const message = `User/s ${messages.RESET_PASSWORD_SUCCESS}`;
    Audit(userId, branchId, 'Users', 'Reset Password', message);
    res.status(200).json({ message });

    session.commitTransaction();
    session.endSession();
  } catch (err) {
    session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

module.exports = {
  getUsers,
  getRoles,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  resetPassword,
  activateAccount,
};