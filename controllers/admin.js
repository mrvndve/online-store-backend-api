const UsersModel = require('../models/users');
const RolesModel = require('../models/roles');
const BranchesModel = require('../models/branches');
const AuditModel = require('../models/audit');
const CategoriesModel = require('../models/categories');
const BrandsModel = require('../models/brands');
const TagsModel = require('../models/tags');
const ProductsModel = require('../models/products');
const TransactionsModel = require('../models/transactions');
const HttpError = require('../helpers/http-error');
const Audit = require('../helpers/audit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodeMailer = require('../helpers/node-mailer');
const messages = require('../helpers/messages');
const { orderStatus } = require('../utils');
const moment = require('moment');
const { groupBy, map, sumBy } = require('lodash');
const { FRONTEND_DOMAIN } = require('../constants');

const login = async (req, res, next) => {
  let user;
  try {
    user = await UsersModel.findOne({ userName: req.body.userName })
      .populate('role')
      .populate('branch');
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  if (!user) {
    return next(new HttpError('Incorrect username or password please try again.', 422));
  }

  if (!user.isActive) {
    return next(new HttpError('Account has beend disabled, please contact your administrator', 422));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(req.body.password, user.password);
  } catch (err) {
    return next(new HttpError(err, 401));
  }

  if (!isValidPassword) {
    return next(new HttpError('Incorrect username or password please try again.', 422));
  }

  let role;
  try {
    role = await RolesModel.findOne({ _id: user.role });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  if (!role || !role.isActive) {
    return next(new HttpError('There is no assigned role to your account, please contact your administrator.', 422));
  }

  let branch;
  try {
    branch = await BranchesModel.findOne({ _id: user.branch });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  if (!branch || !branch.isActive) {
    return next(new HttpError('There is no assigned branch to your account, please contact your administrator.', 422));
  }

  let token;
  token = jwt.sign(
    { userId: user.id, userName: user.userName, branchId: branch.id, roleId: role.id }, 
    process.env.SECRET_KEY,
  );

  const message = 'Login Successful.';
  Audit(user.id, branch.id, 'Users', 'Login', message);
  res.status(200).json({ 
    message,
    user: user.toObject({ getters: true }), 
    token,
  });
};

const forgotPassword = async (req, res, next) => {
  let user;
  try {
    user = await UsersModel.findOne({ email: req.body.email }).populate('branch');
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  let token;
  token = jwt.sign(
    { userId: user.id, userName: user.userName },
    process.env.SECRET_KEY,
    { expiresIn: '1h' },
  );

  nodeMailer.sendEmail(
    user.email, 
    'Password Recovery', 
    `We're sending you this email because you requested a password reset. Click on this link to create a new password. ${FRONTEND_DOMAIN}/admin/reset-password/${token}`,
  );

  res.status(200).json({ message: `A message has been sent to ${req.body.email} with instructions to reset your password.` })
};

const resetPassword = async (req, res, next) => {
  const {
    token,
  } = req.params;

  let decodedToken
  try {
    decodedToken = jwt.verify(token, process.env.SECRET_KEY);
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : 'Access Denied', 401));
  }

  const {
    userId,
  } = decodedToken;

  let user;
  try {
    user = await UsersModel.findById(userId).populate('branch');
  } catch (err) {
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
  Audit(user.id, user.branch.id, 'Users', 'Reset Password', message);
  res.status(200).json({ message, });
}

const getAudit = async (req, res, next) => {
  let auditLogs;
  try {
    auditLogs = await AuditModel
      .find({ branch: req.userData.branchId })
      .populate({ path: 'user', select: 'fullName' })
      .populate({ path: 'branch', select: 'name' });

  } catch (err) {
    return next(new HttpError(err, 500));
  }

  res.status(200).json({ data: auditLogs.map((audit => audit.toObject({ getters: true})))});
};

const getDashboardDatas = async (req, res, next) => {
  let usersCount;
  let productsCount;
  let categoriesCount;
  let brandsCount;
  let tagsCount;

  const { branchId } = req.userData;

  try {
    usersCount =  await UsersModel.count({ branch: branchId });
    productsCount = await ProductsModel.count({ branch: branchId });
    categoriesCount = await CategoriesModel.count();
    brandsCount  = await BrandsModel.count();
    tagsCount  = await TagsModel.count();
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  res.status(200).json({ 
    usersCount,
    productsCount,
    categoriesCount,
    brandsCount,
    tagsCount,
  });
};

const getDailySales = async (req, res, next) => {
  let transactions;

  const { branchId } = req.userData;

  try {
    let today = new Date(req.body.startDate);
    today.setHours(0, 0, 0, 0);

    transactions = await TransactionsModel.find({
      branch: branchId,
      status: orderStatus.COMPLETED,
      createdAt: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    })
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  transactions = transactions.map(i => ({ date: moment(i.createdAt).format('MMM DD, YYYY'), amount: i.total }));

  res.status(200).json({ data: transactions });
};

const getMonthlySales = async (req, res, next) => {
  let transactions;

  const { branchId } = req.userData;

  try {
    transactions = await TransactionsModel.find({
      branch: branchId,
      status: orderStatus.COMPLETED,
      createdAt: {
        $gte: new Date(req.body.startDate),
        $lt: new Date(req.body.endDate),
      },
    })
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  transactions = transactions.map(i => ({ date: moment(i.createdAt).format('MMM DD, YYYY'), amount: i.total }));

  const groupedData = groupBy(transactions, 'date');

  transactions = map(groupedData, (group) => ({
    date: group[0].date,
    amount: sumBy(group, 'amount')
  }));

  res.status(200).json({ data: transactions });
};

const getYearlySales = async (req, res, next) => {
  let transactions;

  const { branchId } = req.userData;

  try {
    transactions = await TransactionsModel.find({
      branch: branchId,
      status: orderStatus.COMPLETED,
      createdAt: {
        $gte: new Date(req.body.startDate),
        $lt: new Date(req.body.endDate),
      },
    })
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  transactions = transactions.map(i => ({ date: moment(i.createdAt).format('MMMM'), amount: i.total }));

  const groupedData = groupBy(transactions, 'date');

  transactions = map(groupedData, (group) => ({
    date: group[0].date,
    amount: sumBy(group, 'amount')
  }));

  res.status(200).json({ data: transactions });
};

module.exports = {
  login,
  getAudit,
  forgotPassword,
  resetPassword,
  getDashboardDatas,
  getDailySales,
  getMonthlySales,
  getYearlySales,
};