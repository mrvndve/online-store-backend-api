const PromotionsModel = require('../models/promotions');
const ProductsModel = require('../models/products');
const messages = require('../helpers/messages');
const HttpError = require('../helpers/http-error');
const Audit = require('../helpers/audit');
const mongoose = require('mongoose');
const { isEmpty } = require('lodash');

const getPromotions = async (req, res, next) => {
  const {
    userData: {
      branchId,
    },
  } = req;

  let promotions;
  try {
    promotions = await PromotionsModel.find({ branch: branchId }).sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  res.status(200).json({ data: promotions.map(promo => promo.toObject({ getters: true })) });
};

const getProducts = async (req, res, next) => {
  const {
    userData: {
      branchId,
    },
  } = req;

  let products;
  try {
    products = await ProductsModel.find({ branch: branchId, isActive: true, }).sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  res.status(200).json({ data: products.map(product => product.toObject({ getters: true })) });
};

const createPromotion = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    const newPromotion = new PromotionsModel({
      branch: branchId,
      name: req.body.name,
      description: req.body.description,
      discountPercent: req.body.discountPercent,
      products: req.body.products,
      isActive: req.body.isActive,
    });

    await newPromotion.save();

    let productIds = [];
    if (!isEmpty(req.body.products)) {
      req.body.products.map(i => productIds.push(i.id));
    }

    if (!isEmpty(productIds)) {
      await ProductsModel.updateMany({ _id: { $in: productIds } }, { $set: { promotion: {
        id: newPromotion.id,
        name: req.body.name, 
        description: req.body.description,
        discountPercent: req.body.discountPercent,
        isActive: req.body.isActive,
      }}});
    }

    await session.commitTransaction();
    session.endSession();

    const message = `Promotion ${messages.CREATE_SUCCESS}`;
    Audit(userId, branchId, 'Promotions', 'Create', message, newPromotion);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const updatePromotion = async (req, res, next) => {
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
      id: promotionId,
    } = req.params;

    let promotion = await PromotionsModel.findById(promotionId);

    if (promotion.products && !isEmpty(promotion.products)) {
      let newPromotionProducts = req.body.products.map(i => { return i.id; });

      let prevPromotionProdIds = promotion.products.map(i => {
        if (!newPromotionProducts.includes(i.id)) {
          return i.id;
        }
      });

      if (!isEmpty(prevPromotionProdIds)) {
        await ProductsModel.updateMany({ _id: { $in: prevPromotionProdIds }}, { $set: { promotion: {} } });
      }
    }

    if (req.body.products && !isEmpty(req.body.products)) {
      let productIds = [];
      req.body.products.map(i => productIds.push(i.id));
      await ProductsModel.updateMany({ _id: { $in: productIds } }, { $set: { promotion: {
        id: promotion.id,
        name: req.body.name, 
        description: req.body.description,
        discountPercent: req.body.discountPercent,
        isActive: req.body.isActive,
      }}})
    }

    promotion.name = req.body.name;
    promotion.description = req.body.description;
    promotion.discountPercent = req.body.discountPercent;
    promotion.products = req.body.products;
    promotion.isActive = req.body.isActive;
    
    await promotion.save();

    await session.commitTransaction();
    session.endSession();

    const message = `Promotion ${messages.UPDATE_SUCCESS}`;
    Audit(userId, branchId, 'Promotions', 'Update', message, promotion);
    res.status(200).json({ 
      message, 
      data: promotion.toObject({ getters: true }),
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const deletePromotion = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    let promotions = await PromotionsModel.find({ _id: { $in: req.body.ids }});

    let productIdsToUpdate = [];
    promotions.map(promo => {
      if (promo.products && !isEmpty(promo.products)) {
        promo.products.map(product => productIdsToUpdate.push(product.id));
      }
    });
    
    if (!isEmpty(productIdsToUpdate)) {
      await ProductsModel.updateMany({ _id: { $in: productIdsToUpdate }}, { $set: { promotion: {} } });
    }

    await PromotionsModel.deleteMany({ _id: { $in: req.body.ids }});

    session.commitTransaction();
    session.endSession();

    const message = `Promotion/s ${messages.DELETE_SUCCESS}`;
    Audit(userId, branchId, 'Promotions', 'Delete', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const activatePromotion = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    let promotions = await PromotionsModel.find({ _id: { $in: req.body.ids }});

    await Promise.all(promotions.map(promo => {
      if (promo.products && !isEmpty(promo.products)) {
        promo.products.map(async (product) => {
          await ProductsModel.updateMany({ _id: { $in: product.id }}, { $set: { promotion: { 
            id: promo.id,
            name: promo.name,
            description: promo.description,
            discountPercent: promo.discountPercent,
            isActive: false 
          }}})
        });
      }
    }));

    await PromotionsModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: true }});

    session.commitTransaction();
    session.endSession();

    const message = `Promotion/s ${messages.ACTIVATED_SUCCESS}`;
    Audit(userId, branchId, 'Promotions', 'Activate', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const deactivatePromotion = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    let promotions = await PromotionsModel.find({ _id: { $in: req.body.ids }});

    await Promise.all(promotions.map(promo => {
      if (promo.products && !isEmpty(promo.products)) {
        promo.products.map(async (product) => {
          await ProductsModel.updateMany({ _id: { $in: product.id }}, { $set: { promotion: { 
            id: promo.id,
            name: promo.name,
            description: promo.description,
            discountPercent: promo.discountPercent,
            isActive: false 
          }}})
        });
      }
    }));

    await PromotionsModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: false }} );

    session.commitTransaction();
    session.endSession();

    const message = `Promotion/s ${messages.DEACTIVATED_SUCCESS}`;
    Audit(userId, branchId, 'Promotions', 'Deactivate', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

module.exports = {
  getPromotions,
  getProducts,
  createPromotion,
  updatePromotion,
  deletePromotion,
  activatePromotion,
  deactivatePromotion,
};