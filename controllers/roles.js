const RolesModel = require('../models/roles');
const messages = require('../helpers/messages');
const HttpError = require('../helpers/http-error');
const Audit = require('../helpers/audit');
const { defaultPermissions } = require('../utils');

const getRoles = async (req, res, next) => {
  const {
    userData: {
      roleId,
      branchId,
    },
  } = req;

  let roles;
  try {
    roles = await RolesModel.find({ _id: { $ne: roleId }, branch: branchId }).sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  res.status(200).json({ data: roles.map(role => role.toObject({ getters: true})) });
}

const createRole = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  const newRole = new RolesModel({
    branch: branchId,
    name: req.body.name,
    remarks: req.body.remarks,
    permissions: req.body.permissions,
    isActive: req.body.isActive,
    isDefault: false,
  });

  try {
    await newRole.save();
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Role ${messages.CREATE_SUCCESS}`;
  Audit(userId, branchId, 'Roles', 'Create', message, newRole);
  res.status(200).json({ message });
}

const updateRole = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  const {
    id: roleId,
  } = req.params;

  let role;
  try {
    role = await RolesModel.findById(roleId);
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  role.name = req.body.name;
  role.remarks = req.body.remarks;
  role.permissions = req.body.permissions;
  role.isActive = req.body.isActive;

  try {
    await role.save();
  } catch  (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Role ${messages.UPDATE_SUCCESS}`;
  Audit(userId, branchId, 'Roles', 'Update', message, role);
  res.status(200).json({ 
    message, 
    data: role.toObject({ getters: true }),
  });
}

const deleteRole = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await RolesModel.deleteMany({ _id: { $in: req.body.ids }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Role/s ${messages.DELETE_SUCCESS}`;
  Audit(userId, branchId, 'Roles', 'Delete', message);
  res.status(200).json({ message });
};

const activateRole = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await RolesModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: true }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Role/s ${messages.ACTIVATED_SUCCESS}`;
  Audit(userId, branchId, 'Roles', 'Activate', message);
  res.status(200).json({ message });
};

const deactivateRole = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await RolesModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: false }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Role/s ${messages.DEACTIVATED_SUCCESS}`;
  Audit(userId, branchId, 'Roles', 'Deactivate', message);
  res.status(200).json({ message });
};

const getDefaultPermissions = async (req, res, next) => {
  res.status(200).json({ data: defaultPermissions });
};

module.exports = {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  activateRole,
  deactivateRole,
  getDefaultPermissions,
}

