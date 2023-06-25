const CategoriesModel = require('../models/categories');
const ProductsModel = require('../models/products');
const messages = require('../helpers/messages');
const HttpError = require('../helpers/http-error');
const Audit = require('../helpers/audit');
const mongoose = require('mongoose');

const getCategories = async (req, res, next) => {
  let categories;
  try {
    categories = await CategoriesModel.find({}).sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  res.status(200).json({ data: categories.map(category => category.toObject({ getters: true })) });
};

const createCategory = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  const newCategories = new CategoriesModel({
    name: req.body.name,
    description: req.body.description,
    isActive: req.body.isActive,
  });

  try {
    await newCategories.save();
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Category ${messages.CREATE_SUCCESS}`;
  Audit(userId, branchId, 'Categories', 'Create', message, newCategories);
  res.status(200).json({ message });
};

const updateCategory = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  const {
    id: categoryId,
  } = req.params;

  let category;
  try {
    category = await CategoriesModel.findById(categoryId);
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  category.name = req.body.name;
  category.description = req.body.description;
  category.isActive = req.body.isActive;

  try {
    await category.save();
  } catch  (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Category ${messages.UPDATE_SUCCESS}`;
  Audit(userId, branchId, 'Categories', 'Update', message, category);
  res.status(200).json({ 
    message, 
    data: category.toObject({ getters: true }),
  });
};

const deleteCategory = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    await ProductsModel.updateMany({}, { $pull: { categories: { id: { $in: req.body.ids } } } });

    await CategoriesModel.deleteMany({ _id: { $in: req.body.ids }});

    await session.commitTransaction();
    session.endSession();

    const message = `Category/s ${messages.DELETE_SUCCESS}`;
    Audit(userId, branchId, 'Categories', 'Delete', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const activateCategory = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await CategoriesModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: true }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Category/s ${messages.ACTIVATED_SUCCESS}`;
  Audit(userId, branchId, 'Categories', 'Activate', message);
  res.status(200).json({ message });
};

const deactivateCategory = async (req, res, next) => {
  const session = await mongoose.startSession();

  try { 
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    await ProductsModel.updateMany({}, { $pull: { categories: { id: { $in: req.body.ids } } } });

    await CategoriesModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: false }});

    await session.commitTransaction();
    session.endSession();

    const message = `Category/s ${messages.DEACTIVATED_SUCCESS}`;
    Audit(userId, branchId, 'Categories', 'Deactivate', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  activateCategory,
  deactivateCategory,
};