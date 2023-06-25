const BrandsModel = require('../models/brands');
const messages = require('../helpers/messages');
const HttpError = require('../helpers/http-error');
const Audit = require('../helpers/audit');

const getBrand = async (req, res, next) => {
  let brands;
  try {
    brands = await BrandsModel.find({}).sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  res.status(200).json({ data: brands.map(brands => brands.toObject({ getters: true })) });
};

const createBrand = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  const newBrand = new BrandsModel({
    name: req.body.name,
    description: req.body.description,
    isActive: req.body.isActive,
  });

  try {
    await newBrand.save();
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Brand ${messages.CREATE_SUCCESS}`;
  Audit(userId, branchId, 'Brands', 'Create', message, newBrand);
  res.status(200).json({ message });
};

const updateBrand = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  const {
    id: brandId,
  } = req.params;

  let brand;
  try {
    brand = await BrandsModel.findById(brandId);
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  brand.name = req.body.name;
  brand.description = req.body.description;
  brand.isActive = req.body.isActive;

  try {
    await brand.save();
  } catch  (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Brand ${messages.UPDATE_SUCCESS}`;
  Audit(userId, branchId, 'Brands', 'Update', message, brand);
  res.status(200).json({ 
    message, 
    data: brand.toObject({ getters: true }),
  });
};

const deleteBrand = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await BrandsModel.deleteMany({ _id: { $in: req.body.ids }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Brand/s ${messages.DELETE_SUCCESS}`;
  Audit(userId, branchId, 'Brands', 'Delete', message);
  res.status(200).json({ message });
};

const activateBrand = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await BrandsModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: true }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Brand/s ${messages.ACTIVATED_SUCCESS}`;
  Audit(userId, branchId, 'Brands', 'Activate', message);
  res.status(200).json({ message });
};

const deactivateBrand = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await BrandsModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: false }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Brand/s ${messages.DEACTIVATED_SUCCESS}`;
  Audit(userId, branchId, 'Brands', 'Deactivate', message);
  res.status(200).json({ message });
};

module.exports = {
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  activateBrand,
  deactivateBrand,
};