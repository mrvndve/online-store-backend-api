const Double = require('@mongoosejs/double');
const mongoose = require('mongoose');
const schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');

const branchesSchema = new schema({
  name: { type: String, required: true, unique: true, maxlength: 255 },
  region: { type: String, required: true, maxlength: 255 },
  province: { type: String, required: true, maxlength: 255 },
  city: { type: String, required: true, maxlength: 255 },
  barangay: { type: String, required: true, maxlength: 255 },
  postalCode: { type: String, required: true, maxlength: 255 },
  street: { type: String, required: true, maxlength: 255 },
  address: { type: String, required: true, maxlength: 255 },
  email: { type: String, required: true, unique: true, maxlength: 255 },
  contact: { type: String, required: true, maxlength: 25 },
  defaultDeliveryFee: { type: Double, required: true, },
  outsideCityDeliveryFee: { type: Double, required: true, },
  isActive: { type: Boolean, required: true },
}, { 
  timestamps: { 
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt',
  },
});

branchesSchema.plugin(uniqueValidator);

module.exports = mongoose.model('branches', branchesSchema);
