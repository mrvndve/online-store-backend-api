const SuppliersModel = require('../models/suppliers');
const messages = require('../helpers/messages');
const HttpError = require('../helpers/http-error');
const Audit = require('../helpers/audit');

const getSuppliers = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  let suppliers;
  try {
    suppliers = await SuppliersModel.find({ branch: branchId }).sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  res.status(200).json({ data: suppliers.map(supplier => supplier.toObject({ getters: true })) });
};

const createSupplier = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  const newSupplier = new SuppliersModel({
    branch: branchId,
    name: req.body.name,
    contact: req.body.contact,
    email: req.body.email,
    address: req.body.address,
    isActive: req.body.isActive,
  });

  try {
    await newSupplier.save();
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Supplier ${messages.CREATE_SUCCESS}`;
  Audit(userId, branchId, 'Suppliers', 'Create', message, newSupplier);
  res.status(200).json({ message });
};

const updateSupplier = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  const {
    id: supplierId,
  } = req.params;

  let supplier;
  try {
    supplier = await SuppliersModel.findById(supplierId);
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  supplier.name = req.body.name;
  supplier.contact = req.body.contact;
  supplier.email = req.body.email;
  supplier.address = req.body.address;
  supplier.isActive = req.body.isActive;

  try {
    await supplier.save();
  } catch  (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Supplier ${messages.UPDATE_SUCCESS}`;
  Audit(userId, branchId, 'Suppliers', 'Update', message, supplier);
  res.status(200).json({ 
    message, 
    data: supplier.toObject({ getters: true }),
  });
};

const deleteSupplier = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await SuppliersModel.deleteMany({ _id: { $in: req.body.ids }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Supplier/s ${messages.DELETE_SUCCESS}`;
  Audit(userId, branchId, 'Suppliers', 'Delete', message);
  res.status(200).json({ message });
};

const activateSupplier = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await SuppliersModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: true }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Supplier/s ${messages.ACTIVATED_SUCCESS}`;
  Audit(userId, branchId, 'Suppliers', 'Activate', message);
  res.status(200).json({ message });
};

const deactivateSupplier = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await SuppliersModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: false }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Supplier/s ${messages.DEACTIVATED_SUCCESS}`;
  Audit(userId, branchId, 'Suppliers', 'Deactivate', message);
  res.status(200).json({ message });
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  activateSupplier,
  deactivateSupplier,
};