const mongoose = require('mongoose');
const ProductsModel = require('../models/products');
const BrandsModel = require('../models/brands');
const CategoriesModel = require('../models/categories');
const SuppliersModel = require('../models/suppliers');
const StocksReportModel = require('../models/stocks-report');
const TagsModel = require('../models/tags');
const PromotionsModel = require('../models/promotions');
const WishListsModel = require('../models/wish-lists');
const RatingsModel = require('../models/ratings');
const CartsModel = require('../models/carts');
const TransactionsModel = require('../models/transactions');
const messages = require('../helpers/messages');
const HttpError = require('../helpers/http-error');
const Audit = require('../helpers/audit');
const { isEmpty } = require('lodash');
const { uploadFile, removeFile } = require('../helpers/file-handler');

const getProducts = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  let products;
  try {
    products = await ProductsModel.find({ branch: branchId }).populate('brand').sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  res.status(200).json({ data: products.map(product => product.toObject({ getters: true })) });
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
    tags = await TagsModel.find({ isActive: true, }).sort({ createdAt: 'desc' });
  } catch (err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  res.status(200).json({ data: tags.map(tag => tag.toObject({ getters: true })) });
};

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

const createProduct = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    let imagesToInsert = [];
    if (req.body.images && !isEmpty(req.body.images)) {
      req.body.images.map(({ base64, fileName, ext, size, type }) => {
        imagesToInsert.push({ fileName, ext, size, type, });
        uploadFile(base64, fileName);
      })
    }

    const newProduct = new ProductsModel({
      branch: branchId,
      skuCode: req.body.skuCode,
      name: req.body.name,
      subName: req.body.subName,
      description: req.body.description,
      images: imagesToInsert,
      categories: req.body.categories,
      tags: req.body.tags,
      specifications: req.body.specifications,
      brand: req.body.brand,
      price: req.body.price,
      sellerPrice: req.body.sellerPrice,
      variations: req.body.variations,
      stocks: 0,
      stocksBefore: 0,
      stocksAfter: 0,
      rating: 0,
      daysOfWarranty: req.body.daysOfWarranty,
      isActive: req.body.isActive
    });

    await newProduct.save();

    await session.commitTransaction();
    session.endSession();

    const message = `Product ${messages.CREATE_SUCCESS}`;
    Audit(userId, branchId, 'Products', 'Create', message, newProduct);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const updateProduct = async (req, res, next) => {
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
      id: productId,
    } = req.params;
 
    let product = await ProductsModel.findById(productId);

    if (product.images && !isEmpty(product.images)) {
      let newImages = req.body.images.map(i => { return i.fileName; });
      let imagesToRemove = product.images.filter(i => !newImages.includes(i.fileName));
      imagesToRemove.map(i => removeFile(i.fileName));
    }

    let updatedImages = [];
    if (req.body.images && !isEmpty(req.body.images)) {
      req.body.images.map(({ base64, fileName, ext, size, type }) => {
        updatedImages.push({ fileName, ext, size, type });

        if (base64) {
          uploadFile(base64, fileName);
        }
      })
    }

    product.skuCode = req.body.skuCode;
    product.name = req.body.name;
    product.subName = req.body.subName;
    product.description = req.body.description;
    product.images = updatedImages;
    product.categories = req.body.categories;
    product.tags = req.body.tags;
    product.specifications = req.body.specifications;
    product.brand = req.body.brand;
    product.price = req.body.price;
    product.sellerPrice = req.body.sellerPrice;
    product.variations = req.body.variations;
    product.isActive = req.body.isActive;

    await product.save();

    await session.commitTransaction();
    session.endSession();

    const message = `Product ${messages.UPDATE_SUCCESS}`;
    Audit(userId, branchId, 'Products', 'Update', message, product);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const deleteProduct = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    let products = await ProductsModel.find({ _id: { $in: req.body.ids }});
    products.map(data => {
      if (data.images && !isEmpty(data.images)) {
        data.images.map(image => removeFile(image.fileName));
      }
    })

    await StocksReportModel.deleteMany({ product: { $in: req.body.ids }});

    await WishListsModel.deleteMany({ product: { $in: req.body.ids } });

    await CartsModel.deleteMany({ product: { $in: req.body.ids } });

    await RatingsModel.deleteMany({ product: { $in: req.body.ids } });

    await TransactionsModel.deleteMany({ product: { $in: req.body.ids }});

    await ProductsModel.deleteMany({ _id: { $in: req.body.ids }});

    await PromotionsModel.updateMany({ branch: branchId }, { $pull: { products: { id: { $in: req.body.ids } } } });

    await session.commitTransaction();
    session.endSession();

    const message = `Product/s ${messages.DELETE_SUCCESS}`;
    Audit(userId, branchId, 'Products', 'Delete', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const manageStocks = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    let product = await ProductsModel.findById(req.body.productId);
    product.stocks = req.body.stocks;
    product.stocksBefore = req.body.stocksBefore;
    product.stocksAfter = req.body.stocksAfter;
    product.variations = req.body.variations;
    await product.save();

    let newStockReport = new StocksReportModel({
      branch: branchId,
      product: req.body.productId,
      supplier: req.body.supplier,
      receiptNo: req.body.receiptNo,
      decreaseReason: req.body.decreaseReason,
      status: req.body.status,
    })
    await newStockReport.save();

    await session.commitTransaction();
    session.endSession();

    const message = `Product Stocks ${messages.UPDATE_SUCCESS}`;
    Audit(userId, branchId, 'Products', 'Update Stocks', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const activateProduct = async (req, res, next) => {
  const {
    userData: {
      userId,
      branchId,
    },
  } = req;

  try {
    await ProductsModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: true }});
  } catch(err) {
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }

  const message = `Product/s ${messages.ACTIVATED_SUCCESS}`;
  Audit(userId, branchId, 'Products', 'Activate', message);
  res.status(200).json({ message });
};

const deactivateProduct = async (req, res, next) => {
  const session = await mongoose.startSession();

  try { 
    session.startTransaction();

    const {
      userData: {
        userId,
        branchId,
      },
    } = req;

    await PromotionsModel.updateMany({ branch: branchId }, { $pull: { products: { id: { $in: req.body.ids } } } });

    await ProductsModel.updateMany({ _id: { $in: req.body.ids }}, { $set: { isActive: false }});

    await session.commitTransaction();
    session.endSession();

    const message = `Product/s ${messages.DEACTIVATED_SUCCESS}`;
    Audit(userId, branchId, 'Products', 'Deactivate', message);
    res.status(200).json({ message });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

const getStocksReport = async (req, res, next) => {
  const session = await mongoose.startSession();

  try { 
    session.startTransaction();

    const { branchId } = req.userData;

    const stocksReport = await StocksReportModel.find({ branch: branchId })
      .populate({ path: 'product', select: 'name' })
      .populate({ path: 'supplier', select: 'name' });

    res.status(200).json({ data: stocksReport.map(stock => stock.toObject({ getters: true })) });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500));
  }
};

module.exports = {
  getProducts,
  getBrands,
  getCategories,
  getSuppliers,
  getTags,
  createProduct,
  updateProduct,
  deleteProduct,
  manageStocks,
  activateProduct,
  deactivateProduct,
  getStocksReport,
};