const TransactionsModel = require('../models/transactions');
const ProductsModel = require('../models/products');
const UsersModel = require('../models/users');
const messages = require('../helpers/messages');
const HttpError = require('../helpers/http-error');
const Audit = require('../helpers/audit');
const mongoose = require('mongoose');
const { orderStatus } = require('../utils');
const { isEmpty } = require('lodash');

const getTransactions = async (req, res, next) => {
  let transactions;

  const { branchId } = req.userData;

  try {
    transactions = await TransactionsModel.find({ branch: branchId, }).sort({ createdAt: 'desc' })
      .populate('product')
      .populate('customer');
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  res.status(200).json({ data: transactions.map(trans => trans.toObject({ getters: true })) });
};

const getDeliveries = async (req, res, next) => {
  let transactions;
  let user;

  const { branchId, userId } = req.userData;

  try {
    transactions = await TransactionsModel.find({ branch: branchId, status: orderStatus.FOR_DELIVERY }).sort({ createdAt: 'desc' })
      .populate('product')
      .populate('customer')
      .populate('driver');
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  try {
    user = await UsersModel.findOne({ branch: branchId, _id: userId }).populate('role');
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
  
  let filtered;
  if (user.role.id === '64498c98927896f135035429') {
    filtered = transactions.map(trans => trans.toObject({ getters: true })).filter(trans => {
      if (trans.driver) {
        return trans.driver.id === userId;
      }
    });
  } else {
    filtered = transactions.map(trans => trans.toObject({ getters: true }));
  }

  res.status(200).json({ data: filtered });
};

const getReturnedItems = async (req, res, next) => {
  let transactions;

  const { branchId } = req.userData;
  
  try {
    transactions = await TransactionsModel.find({ branch: branchId, status: orderStatus.PENDING_RETURN }).sort({ createdAt: 'desc' })
      .populate('product')
      .populate('customer');
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  res.status(200).json({ data: transactions.map(trans => trans.toObject({ getters: true })) });
};

const setCompleteDeliveries = async (req, res, next) => {
  const session = await mongoose.startSession();

  try { 
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;
    
    await TransactionsModel.updateMany({ _id: req.body.ids }, { $set: { status: orderStatus.COMPLETED, deliveryDate: new Date() } });

    await session.commitTransaction();
    session.endSession();

    const message = 'Deliveries has been Completed.';
    Audit(userId, branchId, 'Deliveries', 'Complete', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const setCancelDeliveries = async (req, res, next) => {
  const session = await mongoose.startSession();

  try { 
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;
    
    await TransactionsModel.updateMany({ _id: { $in: req.body.ids } }, { $set: { status: orderStatus.CANCELLED } });

    const trans = await TransactionsModel.find({ _id: { $in: req.body.ids } });

    for (let x = 0; x < trans.length; x++) {
      const product = await ProductsModel.findOne({ _id: trans[x].product });
      
      if (trans[x].variant) {
        const findIndex = product.variations.findIndex(i => i.id === trans[x].variant.id);

        product.variations[findIndex] = {
          id: product.variations[findIndex].id,
          name: product.variations[findIndex].name,
          addOnsPrice: product.variations[findIndex].addOnsPrice,
          stocks: product.variations[findIndex].stocks + trans[x].quantity,
        };
      }

      product.stocksBefore = product.stocks;
      product.stocks += trans[x].quantity;
      product.stocksAfter += trans[x].quantity;

      product.save();
    }

    await session.commitTransaction();
    session.endSession();

    const message = 'Deliveries has been cancelled.';
    Audit(userId, branchId, 'Deliveries', 'Cancel', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const setApproveReturnedItems = async (req, res, next) => {
  const session = await mongoose.startSession();

  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try { 
    session.startTransaction();
    
    await TransactionsModel.updateMany({ _id: { $in: req.body.ids } }, { $set: { status: orderStatus.RETURNED } });

    // const trans = await TransactionsModel.find({ _id: { $in: req.body.ids } });

    // for (let x = 0; x < trans.length; x++) {
    //   const product = await ProductsModel.findOne({ _id: trans[x].product });
      
    //   if (trans[x].variant) {
    //     const findIndex = product.variations.findIndex(i => i.id === trans[x].variant.id);

    //     product.variations[findIndex] = {
    //       id: product.variations[findIndex].id,
    //       name: product.variations[findIndex].name,
    //       addOnsPrice: product.variations[findIndex].addOnsPrice,
    //       stocks: product.variations[findIndex].stocks + trans[x].quantity,
    //     };
    //   }

    //   product.stocksBefore = product.stocks;
    //   product.stocks += trans[x].quantity;
    //   product.stocksAfter += trans[x].quantity;

    //   product.save();
    // }

    await session.commitTransaction();
    session.endSession();

    const message = 'Pending Returned Items has been Approved.';
    Audit(userId, branchId, 'Returned Items', 'Approve', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const getDeliveryRiders = async (req, res, next) => {
  let riders;

  const { branchId } = req.userData;

  try {
    riders = await UsersModel
      .find({ branch: branchId })
      .sort({ createdAt: 'desc' })
      .populate('role');
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const filtered = riders.map(i => i.toObject({ getters: true })).filter(i => i.role.id === '64498c98927896f135035429');

  res.status(200).json({ data: filtered });
};

const setDeliveriesDriver = async (req, res, next) => {
  const session = await mongoose.startSession();

  try { 
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;
    
    await TransactionsModel.updateMany({ _id: req.body.transId }, { $set: { driver: req.body.driverId } });

    await session.commitTransaction();
    session.endSession();

    const message = 'Driver has been Assigned.';
    Audit(userId, branchId, 'Deliveries', 'Assign Driver', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const processOnsiteTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();

  try { 
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;
    
    
    const newTransaction = new TransactionsModel({
      ...{ 
        branch: branchId
      }, 
      ...req.body
    });
    newTransaction.save();

    const product = await ProductsModel.findOne({ _id: newTransaction.product });

    if (req.body.variant) {
      const findIndex = product.variations.findIndex(i => i.id === req.body.variant.id);

      product.variations[findIndex] = {
        id: product.variations[findIndex].id,
        name: product.variations[findIndex].name,
        addOnsPrice: product.variations[findIndex].addOnsPrice,
        stocks: product.variations[findIndex].stocks - req.body.quantity,
      };
    }

    product.stocksBefore = product.stocks;
    product.stocks -= req.body.quantity;
    product.stocksAfter -= req.body.quantity;
    await product.save();

    await session.commitTransaction();
    session.endSession();

    const message = 'Transaction has been processed.';
    Audit(userId, branchId, 'Transactions', 'Process', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

module.exports = {
  getTransactions,
  getDeliveries,
  getReturnedItems,
  setCompleteDeliveries,
  setCancelDeliveries,
  setApproveReturnedItems,
  getDeliveryRiders,
  setDeliveriesDriver,
  processOnsiteTransaction,
};