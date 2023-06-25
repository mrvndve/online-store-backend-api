const CustomersModel = require('../models/customers');
const CategoriesModel = require('../models/categories');
const TagsModel = require('../models/tags');
const BrandsModel = require('../models/brands');
const ProductsModel = require('../models/products');
const WishListsModel = require('../models/wish-lists');
const CartsModel = require('../models/carts');
const TransactionsModel = require('../models/transactions');
const RatingsModel = require('../models/ratings');
const XendItPaymentsModel = require('../models/xendit-payments');
const messages = require('../helpers/messages');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodeMailer = require('../helpers/node-mailer');
const HttpError = require('../helpers/http-error');
const { isEmpty } = require('lodash');
const { orderStatus } = require('../utils');
const uniqid = require('uniqid');
const Xendit = require('xendit-node');
const Audit = require('../helpers/audit');

const getCustomers = async (req, res, next) => {
  let customers;
  try {
    customers = await CustomersModel.find({}).sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
  res.status(200).json({ data: customers.map(customer => customer.toObject({ getters: true })) });
};

const activateCustomers = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await CustomersModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: true }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Customer/s ${messages.ACTIVATED_SUCCESS}`;
  Audit(userId, branchId, 'Customers', 'Activate', message);
  res.status(200).json({ message });
};

const deactivateCustomers = async (req, res, next) => {
  const session = await mongoose.startSession();

  try { 
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    await CustomersModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: false }});

    await session.commitTransaction();
    session.endSession();

    const message = `Customer/s ${messages.DEACTIVATED_SUCCESS}`;
    Audit(userId, branchId, 'Customers', 'Deactivate', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const deleteCustomer = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    await CustomersModel.deleteMany({ _id: { $in: req.body.ids }});

    await session.commitTransaction();
    session.endSession();

    const message = `Customer/s ${messages.DELETE_SUCCESS}`;
    Audit(userId, branchId, 'Customers', 'Delete', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const register = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const firstName = req.body.firstName;
    const middleName = req.body.middleName;
    const lastName = req.body.lastName;
    const fullName = !isEmpty(middleName) ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;

    const newCustomer = new CustomersModel({
      userName: req.body.userName,
      password: hashedPassword,
      email: req.body.email,
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      fullName: fullName,
      region: req.body.region,
      province: req.body.province,
      city: req.body.city,
      barangay: req.body.barangay,
      postalCode: req.body.postalCode,
      street: req.body.street,
      address: req.body.address,
      contact: req.body.contact,
      emailVerified: false,
    });

    await newCustomer.save();

    let token;
    token = jwt.sign(
      { userId: newCustomer.id, userName: newCustomer.userName },
      process.env.SECRET_KEY,
      { expiresIn: '1h' },
    );

    nodeMailer.sendEmail(
      newCustomer.email, 
      'Email Verification',
      `Please click this link for your email's verification. ${process.env.FRONTEND_DOMAIN}/verify-email/${token}`,
    );

    await session.commitTransaction();
    session.endSession();

    const message = `Account has been registered.`;
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const verifyEmail = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { token } = req.params;

    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

    const { userId } = decodedToken;

    await CustomersModel.findByIdAndUpdate(userId, { $set: { emailVerified: true } });

    await session.commitTransaction();
    session.endSession();

    const message = `Email Verified.`;
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const login = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const customer = await CustomersModel.findOne({ $or: [
      { userName: req.body.userNameOrEmail },
      { email: req.body.userNameOrEmail },
    ]});
    
    if (!customer) {
      return next(new HttpError('Username or email is incorrect, please try again.', 422));
    }

    const isValidPassword = await bcrypt.compare(req.body.password, customer.password);
    if (!isValidPassword) {
      return next(new HttpError('Password is incorrect, please try again.', 422));
    }

    const token = jwt.sign(
      { customerId: customer.id, userName: customer.userName }, 
      process.env.SECRET_KEY,
    );

    await session.commitTransaction();
    session.endSession();

    const message = 'Logged In Successful.';
    res.status(200).json({ 
      message,
      user: customer.toObject({ getters: true }),
      token,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const forgotPassword = async (req, res, next) => {
  let customer;
  try {
    customer = await CustomersModel.findOne({ email: req.body.email });
  } catch (err) {
    return next(new HttpError(err, 500));
  }

  let token;
  token = jwt.sign(
    { userId: customer.id, userName: customer.userName },
    process.env.SECRET_KEY,
    { expiresIn: '1h' },
  );

  nodeMailer.sendEmail(
    customer.email, 
    'Password Recovery',
    `We're sending you this email because you requested a password reset. Click on this link to create a new password. ${process.env.FRONTEND_DOMAIN}/reset-password/${token}`,
  );

  res.status(200).json({ message: `A message has been sent to ${req.body.email} with instructions to reset your password.` });
};

const resetPassword = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { token } = req.params;

    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

    const { userId } = decodedToken;

    const user = await CustomersModel.findById(userId);

    const hashedPassword = await bcrypt.hash(req.body.newPassword, 12);

    user.password = hashedPassword;
    user.save();
    
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Your password has been changed.' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const getCategories = async (req, res, next) => {
  let categories;
  try {
    categories = await CategoriesModel.find({ isActive: true }).sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
  res.status(200).json({ data: categories.map(category => category.toObject({ getters: true })) });
};

const getTags = async (req, res, next) => {
  let tags;
  try {
    tags = await TagsModel.find({ isActive: true }).sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
  res.status(200).json({ data: tags.map(tag => tag.toObject({ getters: true })) });
};

const getBrands = async (req, res, next) => {
  let brands;
  try {
    brands = await BrandsModel.find({ isActive: true }).sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
  res.status(200).json({ data: brands.map(brand => brand.toObject({ getters: true })) });
};

const getHomeProducts = async (req, res, next) => {
  let products;
  let wishLists = [];

  const { 
    category, 
    customer,
  } = req.body;

  try {
    products = await ProductsModel
      .find({ 'categories.name': { $in: [category] }, isActive: true })
      .populate('branch')
      .sort({ createdAt: 'desc' });

    if (customer) {
      wishLists = await WishListsModel.find({ customer }).populate('product');
    }
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
  
  products = products.filter(product => product.branch.isActive === true);

  products = products.map(product => product.toObject({ getters: true }));

  if (customer) {
    products.map(product => product.isAddedToWishLists = 
      isEmpty(wishLists.find(wishlist => wishlist.product.id === product.id)) ? false : true);
  }

  res.status(200).json({ data: products });
};

const addToCart = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const filterExistingCart = !isEmpty(req.body.variant)
     ? { 
      product: req.body.product,
      customer: req.body.customer,
      'variant.id': req.body.variant.id,
    } : {
      product: req.body.product,
      customer: req.body.customer,
    };

    let newCart;
    let existingCart;

    existingCart = await CartsModel.findOne(filterExistingCart);

    if (existingCart) {
      await CartsModel.findByIdAndUpdate(existingCart.id, { $set: {
        quantity: parseFloat(existingCart.quantity) + parseFloat(req.body.quantity) 
      }});
    } else {
      newCart = CartsModel({
        product: req.body.product,
        customer: req.body.customer,
        quantity: req.body.quantity,
        variant: req.body.variant,
      });
  
      await newCart.save();
    }

    await session.commitTransaction();
    session.endSession();

    const message = messages.ADD_CART_SUCCESS;
    res.status(200).json({ data: existingCart ? existingCart.toObject({ getters: true }) : newCart.toObject({ getters: true }), message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.ADD_CART_FAILED, 500));
  }
};

const cartCount = async (req, res, next ) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const cartCount = await CartsModel.count({ customer: req.params.customerId });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      data: cartCount,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.ADD_CART_FAILED, 500));
  }
};

const getCartProducts = async (req, res, next) => {
  let cartProducts;

  try {
    cartProducts = await CartsModel
      .find({ customer: req.params.customerId })
      .populate({
        path: 'product',
        populate: {
          path: 'branch',
        },
      })
      .sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  cartProducts = cartProducts.map(cartProd => cartProd.toObject({ getters: true }));

  cartProducts = cartProducts.filter(cart => cart.product.isActive === true && cart.product.branch.isActive === true);

  res.status(200).json({ data: cartProducts });
};

const updateCartQuantity = async (req, res, next ) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await CartsModel.updateOne({ _id: req.params.id }, { $set: { quantity: req.body.quantity } });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Cart Updated.' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : 'Update cart failed.', 500));
  }
}

const addToWishList = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const isWishlistExists = await WishListsModel.findOne({ 
      product: req.body.product,
      customer: req.body.customer,
    });

    if (!isWishlistExists) {
      const newWishList = WishListsModel({
        product: req.body.product,
        customer: req.body.customer,
      });
  
      await newWishList.save();
    }

    await session.commitTransaction();
    session.endSession();

    const message = !isWishlistExists ? messages.ADD_WISHLIST_SUCCESS : 'Product is already in your wishlists.';
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.ADD_WISHLIST_FAILED, 500));
  }
};

const removeToCart = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await CartsModel.deleteMany({ _id: { $in: req.body.ids } });

    await session.commitTransaction();
    session.endSession();

    const message = messages.REMOVE_CART_SUCCESS;
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.REMOVE_CART_FAILED, 500));
  }
};

const removeToWishList = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await WishListsModel.deleteOne({ _id: req.body.id });

    await session.commitTransaction();
    session.endSession();

    const message = messages.REMOVE_WISHLIST_SUCCESS;
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.REMOVE_WISHLIST_FAILED, 500));
  }
};

const updateProfile = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;

    const customer = await CustomersModel.findById(id);
  
    const firstName = req.body.firstName;
    const middleName = req.body.middleName;
    const lastName = req.body.lastName;
    const fullName = !isEmpty(middleName) ? `${firstName} ${middleName} ${lastName}` : `${firstName} ${lastName}`;
  
    customer.userName = req.body.userName;
    customer.email = req.body.email;
    customer.firstName = firstName;
    customer.middleName = middleName;
    customer.lastName = lastName;
    customer.fullName = fullName;
  
    await customer.save();

    await session.commitTransaction();
    session.endSession();

    const message = 'Update profile successful.';
    res.status(200).json({ data: customer.toObject({ getters: true }), message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};
  
const updateAddress = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;

    const customer = await CustomersModel.findById(id);
  
    customer.region = req.body.region;
    customer.province = req.body.province;
    customer.city = req.body.city;
    customer.barangay = req.body.barangay;
    customer.postalCode = req.body.postalCode;
    customer.street = req.body.street;
    customer.address = req.body.address;
    customer.contact = req.body.contact;
  
    await customer.save();

    await session.commitTransaction();
    session.endSession();

    const message = 'Update address successful.';
    res.status(200).json({ data: customer.toObject({ getters: true }), message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const changePassword = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { id } = req.params;

    const customer = await CustomersModel.findById(id);
  
    const hashedPassword = await bcrypt.hash(req.body.newPassword, 12);

    customer.password = hashedPassword;
  
    await customer.save();

    await session.commitTransaction();
    session.endSession();

    const message = 'Change password successful.';
    res.status(200).json({ data: customer.toObject({ getters: true }), message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const getCollections = async (req, res, next) => {
  let products;
  let productsCount;
  let wishLists;
  const pageLimit = 10;

  const { 
    filters,
    sortBy,
    search,
    currentPage,
    customer,
  } = req.body;

  let filterProduct = {};
  let sortProduct = {};

  const isFiltersEmpty = isEmpty(filters.categories) && isEmpty(filters.tags) && isEmpty(filters.brands)
    && isEmpty(filters.prices) && isEmpty(filters.ratings) && isEmpty(filters.availability);

  if (!isFiltersEmpty) {
    filterProduct = {
      $and: [
        !isEmpty(search) && {
          name: { $regex: search, },
        },
        !isEmpty(filters.categories) && {
          'categories.name': { $in: filters.categories },
        },
        !isEmpty(filters.tags) && {
          'tags.name': { $in: filters.tags },
        },
        !isEmpty(filters.brands) && {
          'brand': { $in: filters.brands },
        },
        !isEmpty(filters.prices) && {
          $or: [
            filters.prices.includes('₱50 - ₱1000') && { 
              sellerPrice: { $gte: 50, $lte: 1000 },
            },
            filters.prices.includes('₱1000 - ₱10000') && { 
              sellerPrice: { $gte: 1000, $lte: 10000 },
            },
            filters.prices.includes('₱10000 - ₱20000') && { 
              sellerPrice: { $gte: 10000, $lte: 20000 },
            },
            filters.prices.includes('₱20000 - ₱50000') && { 
              sellerPrice: { $gte: 20000, $lte: 50000 },
            },
          ].filter(Boolean),
        },
        !isEmpty(filters.ratings) && {
          $or: [
            filters.ratings.includes('1 Star') && { 
              rating: 1,
            },
            filters.ratings.includes('2 Star') && { 
              rating: 2,
            },
            filters.ratings.includes('3 Star') && { 
              rating: 3,
            },
            filters.ratings.includes('4 Star') && { 
              rating: 4,
            },
            filters.ratings.includes('5 Star') && { 
              rating: 5,
            },
          ].filter(Boolean),
        },
        (!isEmpty(filters.availability) 
          && (filters.availability.includes('In Stocks') && !filters.availability.includes('Out Of Stocks'))) && {
          stocks: { $gt: 0 },
        },
        (!isEmpty(filters.availability) 
          && (filters.availability.includes('Out Of Stocks') && !filters.availability.includes('In Stocks'))) && {
          stocks: { $eq: 0 },
        },
        (!isEmpty(filters.availability) 
          && (filters.availability.includes('Out Of Stocks') && filters.availability.includes('In Stocks'))) && {
          $or: [  
            { stocks: { $gt: 0 } },
            { stocks: { $eq: 0 } },
          ],
        },
      ].filter(Boolean)
    };
  } else {
    if (!isEmpty(search)) {
      filterProduct = {
        name: { $regex: search, }
      }
    }
  }

  if (!isEmpty(sortBy)) {
    if (sortBy === 'Ascending') {
      sortProduct['_id'] = 'asc';
    }

    if (sortBy === 'Descending') {
      sortProduct['_id'] = 'desc';
    }

    if (sortBy === 'Latest') {
      sortProduct['createdAt'] = 'desc';
    }

    if (sortBy === 'Reviews Low To High') {
      sortProduct['rating'] = 1;
    }

    if (sortBy === 'Reviews High To Low') {
      sortProduct['rating'] = -1;
    }

    if (sortBy === 'Price Low To High') {
      sortProduct['sellerPrice'] = 1;
    }

    if (sortBy === 'Price High To Low') {
      sortProduct['sellerPrice'] = -1;
    }
  }

  try {
    products = await ProductsModel
      .find({...filterProduct, ...{ isActive: true }})
      .populate('branch')
      .sort(sortProduct)
      .skip((pageLimit * currentPage) - pageLimit)
      .limit(pageLimit);

    productsCount = await ProductsModel.count({...filterProduct, ...{ isActive: true }});

    if (customer) {
      wishLists = await WishListsModel.find({ customer }).populate('product');
    }
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  products = products.filter(product => product.branch.isActive === true);

  products = products.map(product => product.toObject({ getters: true }));

  if (customer) {
    products.map(product => product.isAddedToWishLists = 
      isEmpty(wishLists.find(wishlist => wishlist.product.id === product.id)) ? false : true);
  }

  res.status(200).json({ 
    data: products,
    totalPages: Math.ceil(productsCount / pageLimit),
  });
};

const getViewProduct = async (req, res, next) => {
  let product;
  let wishLists = [];

  const {
    customer,
    productName,
  } = req.body;

  try {
    product = await ProductsModel
      .findOne({ isActive: true, name: productName })
      .populate('brand')
      .populate('branch');

    if (customer) {
      wishLists = await WishListsModel.find({ customer }).populate('product');
    }
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  product = product.toObject({ getters: true });

  if (customer) {
    product.isAddedToWishLists = isEmpty(wishLists.find(wishlist => wishlist.product.id === product.id)) ? false : true;
  }

  res.status(200).json({ data: product.branch.isActive ? product : {} });
};

const getWishLists = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const wishLists = await WishListsModel.find({ customer: req.params.customerId })
      .populate('product');

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      data: wishLists.map(wishlist => wishlist.toObject({ getters: true })),
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.ADD_CART_FAILED, 500));
  }
};

const cashOnDeliveryPayment = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    
    const {
      orders,
      cartIds,
    } = req.body;

    for (let x = 0; x < orders.length; x++) {
      const newTransaction = new TransactionsModel({
        branch: orders[x].branch,
        customer: orders[x].customer,
        driver: null,
        address: orders[x].address,
        contact: orders[x].contact,
        product: orders[x].product,
        unitPrice: orders[x].unitPrice,
        discount: orders[x].discount,
        variant: orders[x].variant,
        quantity: orders[x].quantity,
        total: orders[x].total,
        paymentMethod: orders[x].paymentMethod,
        status: orders[x].status,
        cancelReason: '',
        returnReason: '',
      });

      await newTransaction.save();

      const product = await ProductsModel.findOne({ _id: orders[x].product });
      
      if (orders[x].variant) {
        const findIndex = product.variations.findIndex(i => i.id === orders[x].variant.id);

        product.variations[findIndex] = {
          id: product.variations[findIndex].id,
          name: product.variations[findIndex].name,
          addOnsPrice: product.variations[findIndex].addOnsPrice,
          stocks: product.variations[findIndex].stocks - orders[x].quantity,
        };
      }

      product.stocksBefore = product.stocks;
      product.stocks -= orders[x].quantity;
      product.stocksAfter -= orders[x].quantity;
      await product.save();
    }

    await CartsModel.deleteMany({ _id: { $in: cartIds }});

    await session.commitTransaction();
    session.endSession();

    const message = 'Your Order/s has been placed.';
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : 'Your Order/s has been failed.', 500));
  }
};

const gcashPayment = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      orders,
      cartIds,
      customer,
      successRedirectURL,
      failureRedirectURL,
      totalAmount,
    } = req.body;

    let transactionIds = [];

    for (let x = 0; x < orders.length; x++) {
      const newTransaction = new TransactionsModel({
        branch: orders[x].branch,
        customer: orders[x].customer,
        driver: null,
        contact: orders[x].contact,
        address: orders[x].address,
        product: orders[x].product,
        unitPrice: orders[x].unitPrice,
        discount: orders[x].discount,
        variant: orders[x].variant,
        quantity: orders[x].quantity,
        total: orders[x].total,
        paymentMethod: orders[x].paymentMethod,
        status: orders[x].status,
        cancelReason: '',
        returnReason: '',
      });

      await newTransaction.save();

      transactionIds.push(newTransaction.id);

      const product = await ProductsModel.findOne({ _id: orders[x].product });
      
      if (orders[x].variant) {
        const findIndex = product.variations.findIndex(i => i.id === orders[x].variant.id);

        product.variations[findIndex] = {
          id: product.variations[findIndex].id,
          name: product.variations[findIndex].name,
          addOnsPrice: product.variations[findIndex].addOnsPrice,
          stocks: product.variations[findIndex].stocks - orders[x].quantity,
        };
      }

      product.stocksBefore = product.stocks;
      product.stocks -= orders[x].quantity;
      product.stocksAfter -= orders[x].quantity;
      await product.save();
    }

    const newXendIt = new Xendit({
      secretKey: process.env.XENDIT_API_KEY,
    });
    const { Invoice } = newXendIt;
    const invoiceSpecificOptions = {};
    const newInvoice = new Invoice(invoiceSpecificOptions);

    const newInvoicePayload = {
      externalID: `umal-marketing-${uniqid()}`,
      amount: totalAmount,
      invoiceDuration: 86400,
      customer,
      customerNotificationPreference: {
        invoiceCreated: [
          'email',
        ],
        invoiceReminder: [
          'email',
        ],
        invoicePaid: [
          'email',
        ],
        invoiceExpired: [
          'email',
        ]
      },
      successRedirectURL,
      failureRedirectURL,
      currency: 'PHP',
      paymentMethods: ['GCASH'],
    };
    
    let invoiceRes = await newInvoice.createInvoice(newInvoicePayload).then(result => result);

    const {
      id: invoiceId,
      invoice_url: invoiceUrl,
    } = invoiceRes;

    for (let x = 0; x < transactionIds.length; x++) {
      const newXendItPayments = new XendItPaymentsModel({
        transaction: transactionIds[x],
        xenditInvoiceId: invoiceId,
      })
      
      await newXendItPayments.save();
    }

    await CartsModel.deleteMany({ _id: { $in: cartIds }});
    
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ data: { invoiceUrl } });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : 'Your Order/s has been failed.', 500));
  }
};

const checkToPayTransactions = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const transactions = await TransactionsModel.find({ customer: req.body.customer, status: orderStatus.TO_PAY });
    
    for (var x = 0; x < transactions.length; x++) {
      const xenditPayments = await XendItPaymentsModel.findOne({ transaction: transactions[x].id });

      const newXendIt = new Xendit({
        secretKey: process.env.XENDIT_API_KEY,
      });
      const { Invoice } = newXendIt;
      const invoiceSpecificOptions = {};
      const getInvoice = new Invoice(invoiceSpecificOptions);

      let invoiceRes = await getInvoice.getInvoice({ invoiceID: xenditPayments.xenditInvoiceId }).then(result => result);

      if (invoiceRes.status === 'PAID' || invoiceRes.status === 'SETTLED') {
        const transactionToUpdate = await TransactionsModel.findOne({ _id: xenditPayments.transaction });
        transactionToUpdate.status = orderStatus.FOR_DELIVERY;
        transactionToUpdate.save();

        const product = await ProductsModel.findOne({ _id: transactionToUpdate.product });
      
        if (transactionToUpdate.variant) {
          const findIndex = product.variations.findIndex(i => i.id === transactionToUpdate.variant.id);
  
          product.variations[findIndex] = {
            id: product.variations[findIndex].id,
            name: product.variations[findIndex].name,
            addOnsPrice: product.variations[findIndex].addOnsPrice,
            stocks: product.variations[findIndex].stocks - transactionToUpdate.quantity,
          };
        }
  
        product.stocksBefore = product.stocks;
        product.stocks -= transactionToUpdate.quantity;
        product.stocksAfter -= transactionToUpdate.quantity;
        await product.save();
      } else if (invoiceRes.status === 'EXPIRED') {
        const transactionToUpdate = await TransactionsModel.findOne({ _id: xenditPayments.transaction });
        transactionToUpdate.status = orderStatus.CANCELLED;
        transactionToUpdate.save();

        const product = await ProductsModel.findOne({ _id: transactionToUpdate.product });
      
        if (transactionToUpdate.variant) {
          const findIndex = product.variations.findIndex(i => i.id === transactionToUpdate.variant.id);
  
          product.variations[findIndex] = {
            id: product.variations[findIndex].id,
            name: product.variations[findIndex].name,
            addOnsPrice: product.variations[findIndex].addOnsPrice,
            stocks: product.variations[findIndex].stocks + transactionToUpdate.quantity,
          };
        }
  
        product.stocksBefore = product.stocks;
        product.stocks += transactionToUpdate.quantity;
        product.stocksAfter += transactionToUpdate.quantity;
        await product.save();
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'To Pay Payments Updated.' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : 'Your Order/s has been failed.', 500));
  }
};

const getTransactions = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const transactions = await TransactionsModel.find({ customer: req.params.customerId }).populate('product');

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ data: transactions.map(trans => trans.toObject({ getters: true })) });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : err.FAILED, 500));
  }
};

const cancelReturnOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const transaction = await TransactionsModel.findOne({ _id: req.body.id});

    transaction.status = req.body.status;

    if (req.body.status === orderStatus.CANCELLED) {
      transaction.cancelReason = req.body.cancelReason;
    } else if (req.body.status === orderStatus.PENDING_RETURN) {
      transaction.returnReason = req.body.returnReason;
    }

    transaction.save();

    if (req.body.status === orderStatus.CANCELLED) {
      const product = await ProductsModel.findOne({ _id: transaction.product });

      if (transaction.variant) { 
        const index = product.variations.findIndex(i => i.id === transaction.variant.id);
  
        product.variations[index] = {
          id: product.variations[index].id,
          name: product.variations[index].name,
          addOnsPrice: product.variations[index].addOnsPrice,
          stocks: product.variations[index].stocks + transaction.quantity,
        };
      }
  
      product.stocksBefore = product.stocks;
      product.stocks += transaction.quantity;
      product.stocksAfter += transaction.quantity;
  
      await product.save();
    }

    await session.commitTransaction();
    session.endSession();

    let message = '';

    if (req.body.status === orderStatus.CANCELLED) {
      message = 'Your order has been cancelled.';
    } else if (req.body.status === orderStatus.PENDING_RETURN) {
      message = 'Your returned order is being processed.'
    }

    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : err.FAILED, 500));
  }
}

const rateOrder = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const transaction = await TransactionsModel.findOne({ _id: req.body.transId});

    const existingRating = await RatingsModel.findOne({ customer: req.body.customer, product: transaction.product });

    if (existingRating) {
      existingRating.comment = req.body.comment;
      existingRating.rating = req.body.rating;
      await existingRating.save();
    } else {
      const newRating = new RatingsModel({
        product: transaction.product,
        customer: req.body.customer,
        rating: req.body.rating,
        comment: req.body.comment,
      });
      await newRating.save();
    }

    const ratings = await RatingsModel.find({ product: transaction.product });

    const rating1Votes = ratings.filter(i => i.rating === 1).length;
    const rating2Votes = ratings.filter(i => i.rating === 2).length;
    const rating3Votes = ratings.filter(i => i.rating === 3).length;
    const rating4Votes = ratings.filter(i => i.rating === 4).length;
    const rating5Votes = ratings.filter(i => i.rating === 5).length;

    const rating1 = 1 * rating1Votes;
    const rating2 = 2 * rating2Votes;
    const rating3 = 3 * rating3Votes;
    const rating4 = 4 * rating4Votes;
    const rating5 = 5 * rating5Votes;

    const average = (rating1 + rating2 + rating3 + rating4 + rating5) / (rating1Votes + rating2Votes + rating3Votes + rating4Votes + rating5Votes);

    const product = await ProductsModel.findOne({ _id: transaction.product });
    product.rating = average;
    await product.save();

    await session.commitTransaction();
    session.endSession();

    let message = 'Order has been rated.';

    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : err.FAILED, 500));
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getCategories,
  getTags,
  getBrands,
  getHomeProducts,
  addToCart,
  removeToCart,
  cartCount,
  updateCartQuantity,
  addToWishList,
  removeToWishList,
  updateProfile,
  updateAddress,
  changePassword,
  getCollections,
  getWishLists,
  getViewProduct,
  getCartProducts,
  cashOnDeliveryPayment,
  gcashPayment,
  getTransactions,
  cancelReturnOrder,
  rateOrder,
  checkToPayTransactions,
  verifyEmail,
  getCustomers,
  activateCustomers,
  deactivateCustomers,
  deleteCustomer,
};