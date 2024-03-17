const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const UsersModel = require('../models/users');
const BranchesModel = require('../models/branches');
const CategoriesModel = require('../models/categories');
const BrandsModel = require('../models/brands');
const RolesModel = require('../models/roles');
const ProductsModel = require('../models/products');
const SuppliersModel = require('../models/suppliers');
const TagsModel = require('../models/tags');
const PromotionsModel = require('../models/promotions');
const CustomersModel = require('../models/customers');

const usersValidationRules = {
  create: [
    body('role')
      .notEmpty()
      .withMessage('Role field is required.'),
    body('userName')
      .notEmpty()
      .withMessage('Username field is required.')
      .isLength({ max: 255 })
      .withMessage('Username field must be 255 characters only.')
      .custom(async value => {
        const userNameExists = await UsersModel.findOne({ userName: value });
        if (userNameExists) {
          return Promise.reject('Username already exists.');
        }
      }),
    body('email')
      .notEmpty()
      .withMessage('Email field is required.')
      .normalizeEmail()
      .isEmail()
      .withMessage('Incorrect email address format.')
      .isLength({ max: 255 })
      .withMessage('Email field must be 255 characters only.')
      .custom(async value => {
        const emailExists = await UsersModel.findOne({ email: value });
        if (emailExists) {
          return Promise.reject('Email already exists.');
        }
      }),
    body('firstName')
      .notEmpty()
      .withMessage('Firstname field is required.')
      .isLength({ max: 255 })
      .withMessage('Firstname field must be 255 characters only.'),
    body('middleName')
      .isLength({ max: 255 })
      .withMessage('Middlename field must be 255 characters only.'),
    body('lastName')
      .notEmpty()
      .withMessage('Lastname field is required.')
      .isLength({ max: 255 })
      .withMessage('Lastname field must be 255 characters only.'),
    body('contact')
      .notEmpty()
      .withMessage('Contact field is required.')
      .isNumeric()
      .withMessage('Contact field must be a number.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  update: [
    body('role')
      .notEmpty()
      .withMessage('Role field is required.'),
    body('userName')
      .notEmpty()
      .withMessage('Username field is required.')
      .isLength({ max: 255 })
      .withMessage('Username field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const user = await UsersModel.findById(req.params.id);
        if (user.userName !== value) {
          const userNameExists = await UsersModel.findOne({ userName: value })
          if (userNameExists) {
            return Promise.reject('Username already exists.');
          }
        }
      }),
    body('email')
      .notEmpty()
      .withMessage('Email field is required.')
      .normalizeEmail()
      .isEmail()
      .withMessage('Incorrect email address format.')
      .custom(async (value, { req }) => {
        const user = await UsersModel.findById(req.params.id);
        if (user.email !== value) {
          const emailExists = await UsersModel.findOne({ email: value })
          if (emailExists) {
            return Promise.reject('Email already exists.');
          }
        }
      }),
    body('firstName')
      .notEmpty()
      .withMessage('Firstname field is required.')
      .isLength({ max: 255 })
      .withMessage('Firstname field must be 255 characters only.'),
    body('middleName')
      .isLength({ max: 255 })
      .withMessage('Middlename field must be 255 characters only.'),
    body('lastName')
      .notEmpty()
      .withMessage('Firstname field is required.')
      .isLength({ max: 255 })
      .withMessage('Firstname field must be 255 characters only.'),
    body('contact')
      .notEmpty()
      .withMessage('Contact field is required.')
      .isNumeric()
      .withMessage('Contact field must be a number.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  delete: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  activate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  deactivate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  resetPassword: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
};

const adminValidationRules = {
  login: [
    body('userName')
      .notEmpty()
      .withMessage('Username field is required.')
      .isLength({ max: 255 })
      .withMessage('Username field must be 255 characters only.'),
    body('password')      
      .notEmpty()
      .withMessage('Password field is required.')
      .isLength({ max: 255 })
      .withMessage('Password field must be 255 characters only.'),
  ],
  forgotPassword: [
    body('email')
      .notEmpty()
      .withMessage('Email field is required.')
      .normalizeEmail()
      .isEmail()
      .withMessage('Incorrect email address format.')
      .isLength({ max: 255 })
      .withMessage('Email field must be 255 characters only.')
      .custom(async value => {
        const emailExists = await UsersModel.findOne({ email: value });
        if (!emailExists) {
          return Promise.reject('No account found with that email address.');
        }
      }),
  ],
  resetPassword: [
    body('newPassword')
      .notEmpty()
      .withMessage('New password field is required.')
      .isLength({ min: 8 })
      .withMessage('Password should be 8 minimum characters.'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password field is required.')
      .custom(async (value, { req }) => {
        if (value !== req.body.newPassword) {
          return Promise.reject('Password confirmation does not match new password.');
        }
      }),
  ],
};

const branchesValidationRules = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const nameExists = await BranchesModel.findOne({ name: value });
        if (nameExists) {
          return Promise.reject('Name already exists.');
        }
      }),
    body('region')
      .notEmpty()
      .withMessage('Region field is required.')
      .isLength({ max: 255 })
      .withMessage('Region field must be 255 characters only.'),
    body('province')
      .notEmpty()
      .withMessage('Province field is required.')
      .isLength({ max: 255 })
      .withMessage('Province field must be 255 characters only.'),
    body('city')
      .notEmpty()
      .withMessage('City field is required.')
      .isLength({ max: 255 })
      .withMessage('City field must be 255 characters only.'),
    body('barangay')
      .notEmpty()
      .withMessage('Barangay field is required.')
      .isLength({ max: 255 })
      .withMessage('Barangay field must be 255 characters only.'),
    body('postalCode')
      .notEmpty()
      .withMessage('Postal code field is required.')
      .isLength({ max: 255 })
      .withMessage('Postal code field must be 255 characters only.'),
    body('street')
      .notEmpty()
      .withMessage('Street code field is required.')
      .isLength({ max: 255 })
      .withMessage('Street code field must be 255 characters only.'),
    body('address')
      .notEmpty()
      .withMessage('Address field is required.')
      .isLength({ max: 255 })
      .withMessage('Address field must be 255 characters only.'),
    body('email')
      .notEmpty()
      .withMessage('Email field is required.')
      .normalizeEmail()
      .isEmail()
      .withMessage('Incorrect email address format.')
      .isLength({ max: 255 })
      .withMessage('Email field must be 255 characters only.')
      .custom(async value => {
        const emailExists = await BranchesModel.findOne({ email: value });
        if (emailExists) {
          return Promise.reject('Email already exists.');
        }
      }),
    body('contact')
      .notEmpty()
      .withMessage('Contact field is required.')
      .isNumeric()
      .withMessage('Contact field must be a boolean.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  update: [
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const branch = await BranchesModel.findById(req.params.id);
        if (branch.name !== value) {
          const nameExists = await BranchesModel.findOne({ name: value });
          if (nameExists) {
            return Promise.reject('Name already exists.');
          }
        }
      }),
    body('region')
      .notEmpty()
      .withMessage('Region field is required.')
      .isLength({ max: 255 })
      .withMessage('Region field must be 255 characters only.'),
    body('province')
      .notEmpty()
      .withMessage('Province field is required.')
      .isLength({ max: 255 })
      .withMessage('Province field must be 255 characters only.'),
    body('city')
      .notEmpty()
      .withMessage('City field is required.')
      .isLength({ max: 255 })
      .withMessage('City field must be 255 characters only.'),
    body('barangay')
      .notEmpty()
      .withMessage('Barangay field is required.')
      .isLength({ max: 255 })
      .withMessage('Barangay field must be 255 characters only.'),
    body('postalCode')
      .notEmpty()
      .withMessage('Postal code field is required.')
      .isLength({ max: 255 })
      .withMessage('Postal code field must be 255 characters only.'),
    body('street')
      .notEmpty()
      .withMessage('Street code field is required.')
      .isLength({ max: 255 })
      .withMessage('Street code field must be 255 characters only.'),
    body('address')
      .notEmpty()
      .withMessage('Address field is required.')
      .isLength({ max: 255 })
      .withMessage('Address field must be 255 characters only.'),
    body('email')
      .notEmpty()
      .withMessage('Email field is required.')
      .normalizeEmail()
      .isEmail()
      .withMessage('Incorrect email address format.')
      .isLength({ max: 255 })
      .withMessage('Email field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const branch = await BranchesModel.findById(req.params.id);
        if (branch.email !== value) {
          const emailExists = await BranchesModel.findOne({ email: value })
          if (emailExists) {
            return Promise.reject('Email already exists.');
          }
        }
      }),
    body('contact')
      .notEmpty()
      .withMessage('Contact field is required.')
      .isNumeric()
      .withMessage('Contact field must be a boolean.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  delete: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required.')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  activate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  deactivate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  updateDeliveryFee: [
    body('defaultDeliveryFee')
      .notEmpty()
      .withMessage('Delivery fee field is required.'),
    body('outsideCityDeliveryFee')
      .notEmpty()
      .withMessage('Outside city delivery fee field is required.')
  ]
};

const categoriesValidationRules = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const nameExists = await CategoriesModel.findOne({ name: value });
        if (nameExists) {
          return Promise.reject('Name already exists.');
        }
      }),
    body('description')
      .notEmpty()
      .withMessage('Description field is required.')
      .isLength({ max: 255 })
      .withMessage('Description field must be 255 characters only.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  update: [
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const branch = await CategoriesModel.findById(req.params.id);
        if (branch.name !== value) {
          const nameExists = await CategoriesModel.findOne({ name: value });
          if (nameExists) {
            return Promise.reject('Name already exists.');
          }
        }
      }),
    body('description')
      .notEmpty()
      .withMessage('Description field is required.')
      .isLength({ max: 255 })
      .withMessage('Description field must be 255 characters only.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  delete: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required.')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  activate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  deactivate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
};

const brandsValidationRules = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const nameExists = await BrandsModel.findOne({ name: value });
        if (nameExists) {
          return Promise.reject('Name already exists.');
        }
      }),
    body('description')
      .notEmpty()
      .withMessage('Description field is required.')
      .isLength({ max: 255 })
      .withMessage('Description field must be 255 characters only.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  update: [
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const branch = await BrandsModel.findById(req.params.id);
        if (branch.name !== value) {
          const nameExists = await BrandsModel.findOne({ name: value });
          if (nameExists) {
            return Promise.reject('Name already exists.');
          }
        }
      }),
    body('description')
      .notEmpty()
      .withMessage('Description field is required.')
      .isLength({ max: 255 })
      .withMessage('Description field must be 255 characters only.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  delete: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required.')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  activate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  deactivate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
};

const rolesValidationRules = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const nameExists = await RolesModel.findOne({ branch: req.userData.branchId, name: value });
        if (nameExists) {
          return Promise.reject('Name already exists.');
        }
      }),
    body('remarks')
      .notEmpty()
      .withMessage('Remarks field is required.')
      .isLength({ max: 255 })
      .withMessage('Remarks field must be 255 characters only.'),
    body('permissions')
      .notEmpty()
      .withMessage('Permission field is required.')
      .isArray()
      .withMessage('Permission field must be an array.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  update: [
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const role = await RolesModel.findById(req.params.id);
        if (role.name !== value) {
          const nameExists = await RolesModel.findOne({ branch: req.userData.branchId, name: value });
          if (nameExists) {
            return Promise.reject('Name already exists.');
          }
        }
      }),
    body('remarks')
      .notEmpty()
      .withMessage('Remarks field is required.')
      .isLength({ max: 255 })
      .withMessage('Remarks field must be 255 characters only.'),
    body('permissions')
      .notEmpty()
      .withMessage('Remarks field is required.')
      .isArray()
      .withMessage('Permission field must be an array.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  delete: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required.')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  activate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  deactivate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
};

const productsValidationRules = {
  create: [
    body('skuCode')
      .notEmpty()
      .withMessage('Sku code field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const skuCodeExists = await ProductsModel.findOne({ 
          branch: req.userData.branchId, 
          skuCode: value 
        });

        if (skuCodeExists) {
          return Promise.reject('Sku code already exists.');
        }
      }),
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.'),
    body('subName')
      .notEmpty()
      .withMessage('Sub name field is required.')
      .isLength({ max: 255 })
      .withMessage('Sub name field must be 255 characters only.'),
    body('description')
      .notEmpty()
      .withMessage('Description field is required.'),
    body('images')
      .isArray()
      .withMessage('Product images must be an array.'),
    body('categories')
      .isArray()
      .withMessage('Categories field must be an array.'),
    body('tags')
      .isArray()
      .withMessage('Tags field must be an array.'),
    body('specifications')
      .isArray()
      .withMessage('Specification field must be an array.'),
    body('brand')
      .notEmpty()
      .withMessage('Brand field is required.'),
    body('price')
      .notEmpty()
      .withMessage('Price field is required.'),
    body('sellerPrice')
      .notEmpty()
      .withMessage('Seller price field is required.')
      .custom(async (value, { req }) => {
        if (parseFloat(req.body.price) > parseFloat(value)) {
          return Promise.reject('Seller price should be greater than price field.');
        }
      }),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  update: [
    body('skuCode')
      .notEmpty()
      .withMessage('Sku code field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const product = await ProductsModel.findById(req.params.id);
        if (product.skuCode !== value) {
          const skuCodeExists = await ProductsModel.findOne({ 
            branch: req.userData.branchId, 
            skuCode: value,
          });

          if (skuCodeExists) {
            return Promise.reject('Name already exists.');
          }
        }
      }),
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.'),
    body('subName')
      .notEmpty()
      .withMessage('Sub name field is required.')
      .isLength({ max: 255 })
      .withMessage('Sub name field must be 255 characters only.'),
    body('description')
      .notEmpty()
      .withMessage('Description field is required.'),
    body('images')
      .isArray()
      .withMessage('Product images must be an array.'),
    body('categories')
      .isArray()
      .withMessage('Categories field must be an array.'),
    body('tags')
      .isArray()
      .withMessage('Tags field must be an array.'),
    body('specifications')
      .isArray()
      .withMessage('Specification field must be an array.'),
    body('brand')
      .notEmpty()
      .withMessage('Brand field is required.'),
    body('price')
      .notEmpty()
      .withMessage('Price field is required.'),
    body('sellerPrice')
      .notEmpty()
      .withMessage('Seller price field is required.')
      .custom(async (value, { req }) => {
        if (parseFloat(req.body.price) > parseFloat(value)) {
          return Promise.reject('Seller price should be greater than price field.');
        }
      }),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  delete: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required.')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  activate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  deactivate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
};

const suppliersValdationRules = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const nameExists = await SuppliersModel.findOne({ branch: req.userData.branchId, name: value });
        if (nameExists) {
          return Promise.reject('Name already exists.');
        }
      }),
    body('contact')
      .notEmpty()
      .withMessage('Contact field is required.')
      .isNumeric()
      .withMessage('Contact field must be a number.'),
    body('email')
      .notEmpty()
      .withMessage('Email field is required.')
      .normalizeEmail()
      .isEmail()
      .withMessage('Incorrect email address format.')
      .isLength({ max: 255 })
      .withMessage('Email field must be 255 characters only.')
      .custom(async value => {
        const emailExists = await SuppliersModel.findOne({ email: value });
        if (emailExists) {
          return Promise.reject('Email already exists.');
        }
      }),
    body('address')
      .notEmpty()
      .withMessage('Address field is required.')
      .isLength({ max: 255 })
      .withMessage('Address field must be 255 characters only.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  update: [
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const branch = await SuppliersModel.findById(req.params.id);
        if (branch.name !== value) {
          const nameExists = await SuppliersModel.findOne({ branch: req.userData.branchId, name: value });
          if (nameExists) {
            return Promise.reject('Name already exists.');
          }
        }
      }),
    body('contact')
      .notEmpty()
      .withMessage('Contact field is required.')
      .isNumeric()
      .withMessage('Contact field must be a number.'),
    body('email')
      .notEmpty()
      .withMessage('Email field is required.')
      .normalizeEmail()
      .isEmail()
      .withMessage('Incorrect email address format.')
      .custom(async (value, { req }) => {
        const user = await SuppliersModel.findById(req.params.id);
        if (user.email !== value) {
          const emailExists = await SuppliersModel.findOne({ email: value })
          if (emailExists) {
            return Promise.reject('Email already exists.');
          }
        }
      }),
    body('address')
      .notEmpty()
      .withMessage('Address field is required.')
      .isLength({ max: 255 })
      .withMessage('Address field must be 255 characters only.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  delete: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required.')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  activate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  deactivate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
};

const settingsValidationRules = {
  updateProfile: [
    body('userName')
      .notEmpty()
      .withMessage('Username field is required.')
      .isLength({ max: 255 })
      .withMessage('Username field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const user = await UsersModel.findById(req.userData.userId);
        if (user.userName !== value) {
          const userNameExists = await UsersModel.findOne({ userName: value })
          if (userNameExists) {
            return Promise.reject('Username already exists.');
          }
        }
      }),
    body('email')
      .notEmpty()
      .withMessage('Email field is required.')
      .normalizeEmail()
      .isEmail()
      .withMessage('Incorrect email address format.')
      .custom(async (value, { req }) => {
        const user = await UsersModel.findById(req.userData.userId);
        if (user.email !== value) {
          const emailExists = await UsersModel.findOne({ email: value })
          if (emailExists) {
            return Promise.reject('Email already exists.');
          }
        }
      }),
    body('firstName')
      .notEmpty()
      .withMessage('Firstname field is required.')
      .isLength({ max: 255 })
      .withMessage('Firstname field must be 255 characters only.'),
    body('middleName')
      .isLength({ max: 255 })
      .withMessage('Middlename field must be 255 characters only.'),
    body('lastName')
      .notEmpty()
      .withMessage('Firstname field is required.')
      .isLength({ max: 255 })
      .withMessage('Firstname field must be 255 characters only.'),
    body('contact')
      .notEmpty()
      .withMessage('Contact field is required.')
      .isNumeric()
      .withMessage('Contact field must be a number.'),
  ],
  changePassword: [
    body('oldPassword')
      .notEmpty()
      .withMessage('Old password field is required.')
      .custom(async (value, { req }) => {
        let user = await UsersModel.findById(req.userData.userId);
        if (user) {
          let isValidPassword = false;
          try {
            isValidPassword = await bcrypt.compare(value, user.password);
          } catch (err) {
            return Promise.reject(err);
          }

          if (!isValidPassword) {
            return Promise.reject('Incorrect old password.');
          }
        }
      }),
    body('newPassword')
      .notEmpty()
      .withMessage('New password field is required.')
      .isLength({ min: 8 })
      .withMessage('Password should be 8 minimum characters.'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password field is required.')
      .custom(async (value, { req }) => {
        if (value !== req.body.newPassword) {
          return Promise.reject('Password confirmation does not match new password.');
        }
      }),
  ]
};

const tagsValidationRules = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const nameExists = await TagsModel.findOne({ name: value });
        if (nameExists) {
          return Promise.reject('Name already exists.');
        }
      }),
    body('description')
      .notEmpty()
      .withMessage('Description field is required.')
      .isLength({ max: 255 })
      .withMessage('Description field must be 255 characters only.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  update: [
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const tag = await TagsModel.findById(req.params.id);
        if (tag.name !== value) {
          const nameExists = await TagsModel.findOne({ name: value });
          if (nameExists) {
            return Promise.reject('Name already exists.');
          }
        }
      }),
    body('description')
      .notEmpty()
      .withMessage('Description field is required.')
      .isLength({ max: 255 })
      .withMessage('Description field must be 255 characters only.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  delete: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required.')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  activate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  deactivate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
};

const promotionsValidationRules = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const nameExists = await PromotionsModel.findOne({ branch: req.userData.branchId, name: value });
        if (nameExists) {
          return Promise.reject('Name already exists.');
        }
      }),
    body('description')
      .notEmpty()
      .withMessage('Description field is required.')
      .isLength({ max: 255 })
      .withMessage('Description field must be 255 characters only.'),
    body('discountPercent')
      .notEmpty()
      .withMessage('Discount price field is required.')
      .isNumeric()
      .withMessage('Discount price field must be a number.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  update: [
    body('name')
      .notEmpty()
      .withMessage('Name field is required.')
      .isLength({ max: 255 })
      .withMessage('Name field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const promotion = await PromotionsModel.findById(req.params.id);
        if (promotion.name !== value) {
          const nameExists = await PromotionsModel.findOne({ branch: req.userData.branchId, name: value });
          if (nameExists) {
            return Promise.reject('Name already exists.');
          }
        }
      }),
    body('description')
      .notEmpty()
      .withMessage('Description field is required.')
      .isLength({ max: 255 })
      .withMessage('Description field must be 255 characters only.'),
    body('discountPercent')
      .notEmpty()
      .withMessage('Discount price field is required.')
      .isNumeric()
      .withMessage('Discount price field must be a number.'),
    body('isActive')
      .notEmpty()
      .withMessage('Active field is required.')
      .isBoolean()
      .withMessage('Active field must be a boolean.'),
  ],
  delete: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required.')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  activate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
  deactivate: [
    body('ids')
      .notEmpty()
      .withMessage('Ids field is required')
      .isArray()
      .withMessage('Ids field must be an array.'),
  ],
};

const customersValidationRules = {
  register: [
    body('userName')
      .notEmpty()
      .withMessage('Username field is required.')
      .isLength({ max: 255 })
      .withMessage('Username field must be 255 characters only.')
      .custom(async value => {
        const userNameExists = await CustomersModel.findOne({ userName: value });
        if (userNameExists) {
          return Promise.reject('Username already exists.');
        }
      }),
    body('email')
      .notEmpty()
      .withMessage('Email field is required.')
      .normalizeEmail()
      .isEmail()
      .withMessage('Incorrect email address format.')
      .isLength({ max: 255 })
      .withMessage('Email field must be 255 characters only.')
      .custom(async value => {
        const emailExists = await CustomersModel.findOne({ email: value });
        if (emailExists) {
          return Promise.reject('Email already exists.');
        }
      }),
    body('password')
      .notEmpty()
      .withMessage('Password field is required.')
      .isLength({ min: 8 })
      .withMessage('Password should be 8 minimum characters.'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password field is required.')
      .custom(async (value, { req }) => {
        if (value !== req.body.password) {
          return Promise.reject('Password confirmation does not match new password.');
        }
      }),
    body('firstName')
      .notEmpty()
      .withMessage('Firstname field is required.')
      .isLength({ max: 255 })
      .withMessage('Firstname field must be 255 characters only.'),
    body('middleName')
      .isLength({ max: 255 })
      .withMessage('Middlename field must be 255 characters only.'),
    body('lastName')
      .notEmpty()
      .withMessage('Lastname field is required.')
      .isLength({ max: 255 })
      .withMessage('Lastname field must be 255 characters only.'),
    body('region')
      .notEmpty()
      .withMessage('Regin field is required.'),
    body('province')
      .notEmpty()
      .withMessage('Province field is required.'),
    body('city')
      .notEmpty()
      .withMessage('City field is required.'),
    body('barangay')
      .notEmpty()
      .withMessage('Barangay field is required.'),
    body('postalCode')
      .notEmpty()
      .withMessage('Postal code field is required.')
      .isLength({ max: 255 })
      .withMessage('Postal code field must be 255 characters only.'),
    body('street')
      .notEmpty()
      .withMessage('Street field is required.')
      .isLength({ max: 255 })
      .withMessage('Street field must be 255 characters only.'),
    body('address')
      .notEmpty()
      .withMessage('Address field is required.')
      .isLength({ max: 255 })
      .withMessage('Address field must be 255 characters only.'),
    body('contact')
      .notEmpty()
      .withMessage('Contact field is required.')
      .isNumeric()
      .withMessage('Contact field must be a number.'),
  ],
  login: [
    body('userNameOrEmail')
      .notEmpty()
      .withMessage('Username or email field is required.')
      .isLength({ max: 255 })
      .withMessage('Username or email field must be 255 characters only.'),
    body('password')      
      .notEmpty()
      .withMessage('Password field is required.')
      .isLength({ max: 255 })
      .withMessage('Password field must be 255 characters only.'),
  ],
  forgotPassword: [
    body('email')
      .notEmpty()
      .withMessage('Email field is required.')
      .normalizeEmail()
      .isEmail()
      .withMessage('Incorrect email address format.')
      .isLength({ max: 255 })
      .withMessage('Email field must be 255 characters only.')
      .custom(async value => {
        const emailExists = await CustomersModel.findOne({ email: value });
        if (!emailExists) {
          return Promise.reject('No account found with that email address.');
        }
      }),
  ],
  resetPassword: [
    body('newPassword')
      .notEmpty()
      .withMessage('New password field is required.')
      .isLength({ min: 8 })
      .withMessage('Password should be 8 minimum characters.'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password field is required.')
      .custom(async (value, { req }) => {
        if (value !== req.body.newPassword) {
          return Promise.reject('Password confirmation does not match new password.');
        }
      }),
  ],
  updateProfile: [
    body('userName')
      .notEmpty()
      .withMessage('Username field is required.')
      .isLength({ max: 255 })
      .withMessage('Username field must be 255 characters only.')
      .custom(async (value, { req }) => {
        const customer = await CustomersModel.findById(req.params.id);
        if (customer.userName !== value) {
          const userNameExists = await CustomersModel.findOne({ userName: value })
          if (userNameExists) {
            return Promise.reject('Username already exists.');
          }
        }
      }),
    body('email')
      .notEmpty()
      .withMessage('Email field is required.')
      .normalizeEmail()
      .isEmail()
      .withMessage('Incorrect email address format.')
      .custom(async (value, { req }) => {
        const user = await CustomersModel.findById(req.params.id);
        if (user.email !== value) {
          const emailExists = await CustomersModel.findOne({ email: value })
          if (emailExists) {
            return Promise.reject('Email already exists.');
          }
        }
      }),
    body('firstName')
      .notEmpty()
      .withMessage('Firstname field is required.')
      .isLength({ max: 255 })
      .withMessage('Firstname field must be 255 characters only.'),
    body('middleName')
      .isLength({ max: 255 })
      .withMessage('Middlename field must be 255 characters only.'),
    body('lastName')
      .notEmpty()
      .withMessage('Lastname field is required.')
      .isLength({ max: 255 })
      .withMessage('Lastname field must be 255 characters only.'),
  ],
  updateAddress: [
    body('region')
      .notEmpty()
      .withMessage('Regin field is required.'),
    body('province')
      .notEmpty()
      .withMessage('Province field is required.'),
    body('city')
      .notEmpty()
      .withMessage('City field is required.'),
    body('barangay')
      .notEmpty()
      .withMessage('Barangay field is required.'),
    body('postalCode')
      .notEmpty()
      .withMessage('Postal code field is required.')
      .isLength({ max: 255 })
      .withMessage('Postal code field must be 255 characters only.'),
    body('street')
      .notEmpty()
      .withMessage('Street field is required.')
      .isLength({ max: 255 })
      .withMessage('Street field must be 255 characters only.'),
    body('address')
      .notEmpty()
      .withMessage('Address field is required.')
      .isLength({ max: 255 })
      .withMessage('Address field must be 255 characters only.'),
    body('contact')
      .notEmpty()
      .withMessage('Contact field is required.')
      .isNumeric()
      .withMessage('Contact field must be a number.'),
  ],
  changePassword: [
    body('oldPassword')
      .notEmpty()
      .withMessage('Old password field is required.')
      .custom(async (value, { req }) => {
        let customer = await CustomersModel.findById(req.userData.customerId);
        if (customer) {
          let isValidPassword = false;
          try {
            isValidPassword = await bcrypt.compare(value, customer.password);
          } catch (err) {
            return Promise.reject(err);
          }

          if (!isValidPassword) {
            return Promise.reject('Incorrect old password.');
          }
        }
      }),
    body('newPassword')
      .notEmpty()
      .withMessage('New password field is required.')
      .isLength({ min: 8 })
      .withMessage('New password field should be 8 minimum characters.'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password field is required.')
      .custom(async (value, { req }) => {
        if (value !== req.body.newPassword) {
          return Promise.reject('Password confirmation does not match new password.');
        }
      }),
  ]
};

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (errors.isEmpty()) {
    return next()
  }
  const extractedErrors = []
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }))

  return res.status(422).json({
    errors: extractedErrors,
  })
};

module.exports = {
  usersValidationRules,
  adminValidationRules,
  branchesValidationRules,
  categoriesValidationRules,
  brandsValidationRules,
  rolesValidationRules,
  productsValidationRules,
  suppliersValdationRules,
  settingsValidationRules,
  tagsValidationRules,
  promotionsValidationRules,
  customersValidationRules,
  validate,
};