const mongoose = require('mongoose');
const BranchesModel = require('../models/branches');
const RolesModel = require('../models/roles');
const UsersModel = require('../models/users');
const AuditModel = require('../models/audit');
const SuppliersModel = require('../models/suppliers');
const PromotionsModel = require('../models/promotions');
const ProductsModel = require('../models/products');

const messages = require('../helpers/messages');
const HttpError = require('../helpers/http-error');
const Audit = require('../helpers/audit');
const bcrypt = require('bcryptjs');
const nodeMailer = require('../helpers/node-mailer');
const { defaultPermissions } = require('../utils');
const { isEmpty } = require('lodash');

const getBranches = async (req, res, next) => {
  const {
    userData: { branchId },
  } = req;

  let branches;
  try {
    branches = await BranchesModel.find({ _id: { $ne: branchId } }).sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  res.status(200).json({ data: branches.map(branch => branch.toObject({ getters: true })) });
};

const createBranch = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction()

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    const userEmailExists = await UsersModel.findOne({ email: req.body.email });
    if (userEmailExists) {
      return next(new HttpError('Email already used on one of the users, please provide another email.', 422));
    }

    const newBranch = new BranchesModel({
      name: req.body.name,
      region: req.body.region,
      province: req.body.province,
      city: req.body.city,
      barangay: req.body.barangay,
      postalCode: req.body.postalCode,
      street: req.body.street,
      address: req.body.address,
      email: req.body.email,
      contact: req.body.contact,
      defaultDeliveryFee: req.body.defaultDeliveryFee,
      outsideCityDeliveryFee: req.body.outsideCityDeliveryFee,
      isActive: req.body.isActive,
    });

    await newBranch.save();

    const newRole = new RolesModel({
      branch: newBranch.id,
      name: `${newBranch.name} Super Admin`,
      remarks: `${newBranch.name} Super Admin`,
      permissions: defaultPermissions,
      isActive: true,
    });

    await newRole.save();

    const password = Math.random().toString(36).slice(2);
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch(err) {
      return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
    }

    const firstName = 'Super Admin';
    const middleName = '';
    const lastName = 'User';
    const fullName = !isEmpty(middleName) ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`

    const newUser = new UsersModel({
      branch: newBranch.id,
      role: newRole.id,
      userName: Math.random().toString(36).slice(2),
      password: hashedPassword,
      email: newBranch.email,
      firstName,
      middleName,
      lastName,
      fullName,
      contact: newBranch.contact,
      isActive: true,
    });

    await newUser.save();

    await session.commitTransaction();
    session.endSession();

    const message = `Branch ${messages.CREATE_SUCCESS}`;
    Audit(userId, branchId, 'Branches', 'Create', message);
    nodeMailer.sendEmail(
      newUser.email, 
      'Umal Marketing New User', 
      `Greetings ${newUser.firstName}, Welcome to Umal Marketing ${newBranch.name} family!, please start by signing your account's username and password. (username: ${newUser.userName} / password: ${password})`,
    );
    res.status(200).json({ message })
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const updateBranch = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId: userBranchId
    },
  } = req;

  const {
    id: branchId,
  } = req.params;

  let branch;
  try {
    branch = await BranchesModel.findById(branchId);
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  branch.name = req.body.name;
  branch.region = req.body.region;
  branch.province = req.body.province;
  branch.city = req.body.city;
  branch.barangay = req.body.barangay;
  branch.postalCode = req.body.postalCode;
  branch.street = req.body.street;
  branch.address = req.body.address;
  branch.email = req.body.email;
  branch.contact = req.body.contact;
  branch.isActive = req.body.isActive;

  try {
    await branch.save();
  } catch  (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Branch ${messages.UPDATE_SUCCESS}`;
  Audit(userId, userBranchId, 'Branches', 'Update', message);
  res.status(200).json({ 
    message, 
    data: branch.toObject({ getters: true }),
  });
};

const updateDeliveryFee = async(req, res, next) => {
  const {
    userData: {
      userId,
      branchId: userBranchId
    },
  } = req;

  const {
    id: branchId,
  } = req.params;

  let branch;
  try {
    branch = await BranchesModel.findById(branchId);
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  branch.defaultDeliveryFee = req.body.defaultDeliveryFee;
  branch.outsideCityDeliveryFee = req.body.outsideCityDeliveryFee;

  try {
    await branch.save();
  } catch  (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Delivery Fee ${messages.UPDATE_SUCCESS}`;
  Audit(userId, userBranchId, 'Delivery Fee', 'Update', message);
  res.status(200).json({ 
    message, 
    data: branch.toObject({ getters: true }),
  });
};

const deleteBranch = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    const {
      ids: branchIds,
    } = req.body;

    await UsersModel.deleteMany({ branch: { $in: branchIds }});
    
    await RolesModel.deleteMany({ branch: { $in: branchIds }});

    await AuditModel.deleteMany({ branch: { $in: branchIds }});

    await SuppliersModel.deleteMany({ branch: { $in: branchIds }});

    await PromotionsModel.deleteMany({ branch: { $in: branchIds }});

    await ProductsModel.deleteMany({ branch: { $in: branchIds }});

    await BranchesModel.deleteMany({ _id: { $in: branchIds }});

    session.commitTransaction();
    session.endSession();

    const message = `Branch/s ${messages.DELETE_SUCCESS}`;
    Audit(userId, branchId, 'Branches', 'Delete', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const activateBranch = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await BranchesModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: true }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Branch/s ${messages.ACTIVATED_SUCCESS}`;
  Audit(userId, branchId, 'Branches', 'Activate', message);
  res.status(200).json({ message });
};

const deactivateBranch = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await BranchesModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: false }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Branch/s ${messages.DEACTIVATED_SUCCESS}`;
  Audit(userId, branchId, 'Branches', 'Deactivate', message);
  res.status(200).json({ message });
};

module.exports = {
  getBranches,
  createBranch,
  updateBranch,
  updateDeliveryFee,
  deleteBranch,
  activateBranch,
  deactivateBranch,
};