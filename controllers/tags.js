const TagsModel = require('../models/tags');
const ProductsModel = require('../models/products');
const messages = require('../helpers/messages');
const HttpError = require('../helpers/http-error');
const Audit = require('../helpers/audit');
const mongoose = require('mongoose');

const getTags = async (req, res, next) => {
  let tags;
  try {
    tags = await TagsModel.find({}).sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  res.status(200).json({ data: tags.map(tag => tag.toObject({ getters: true })) });
};

const createTag = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  const newTag = new TagsModel({
    name: req.body.name,
    description: req.body.description,
    isActive: req.body.isActive,
  });

  try {
    await newTag.save();
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Tag ${messages.CREATE_SUCCESS}`;
  Audit(userId, branchId, 'Tags', 'Create', message, newTag);
  res.status(200).json({ message });
};

const updateTag = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  const {
    id: tagId,
  } = req.params;

  let tag;
  try {
    tag = await TagsModel.findById(tagId);
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  tag.name = req.body.name;
  tag.description = req.body.description;
  tag.isActive = req.body.isActive;

  try {
    await tag.save();
  } catch  (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Tag ${messages.UPDATE_SUCCESS}`;
  Audit(userId, branchId, 'Tags', 'Update', message, tag);
  res.status(200).json({ 
    message, 
    data: tag.toObject({ getters: true }),
  });
};

const deleteTag = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    await ProductsModel.updateMany({}, { $pull: { tags: { id: { $in: req.body.ids } } } });

    await TagsModel.deleteMany({ _id: { $in: req.body.ids }});

    await session.commitTransaction();
    session.endSession();

    const message = `Tag/s ${messages.DELETE_SUCCESS}`;
    Audit(userId, branchId, 'Tags', 'Delete', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const activateTag = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await TagsModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: true }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Tag/s ${messages.ACTIVATED_SUCCESS}`;
  Audit(userId, branchId, 'Tags', 'Activate', message);
  res.status(200).json({ message });
};

const deactivateTag = async (req, res, next) => {
  const session = await mongoose.startSession();

  try { 
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    await ProductsModel.updateMany({}, { $pull: { tags: { id: { $in: req.body.ids } } } });

    await TagsModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: false }});

    await session.commitTransaction();
    session.endSession();

    const message = `Tag/s ${messages.DEACTIVATED_SUCCESS}`;
    Audit(userId, branchId, 'Tags', 'Deactivate', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

module.exports = {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  activateTag,
  deactivateTag,
};