const Double = require('@mongoosejs/double');
const mongoose = require('mongoose');
const schema = mongoose.Schema;

const productsSchema = new schema({
  branch: { type: mongoose.Types.ObjectId, required: true, ref: 'branches'},
  skuCode: { type: String, required: true, maxlength: 255, },
  name: { type: String, required: true, maxlength: 255, },
  subName: { type: String, required: true, maxlength: 255, },
  description: { type: String, required: true },
  specifications: { type: Array, },
  images: { type: Array },
  categories: { type: Array },
  tags: { type: Array },
  brand: { type: mongoose.Types.ObjectId, required: true, ref: 'brands'},
  modelNumber: { type: String, required: true, },
  price: {  type: Double, required: true },
  sellerPrice: { type: Double, required: true, },
  promotion: { type: Object },
  variations: { type: Array, },
  stocks: { type: Number },
  stocksBefore: { type: Number },
  stocksAfter: { type: Number },
  rating: { type: Double },
  daysOfWarranty: { type: Number },
  isActive: { type: Boolean, required: true, },
}, {             
  timestamps: {       
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt',                                             
  },                                                             
});

module.exports = mongoose.model('products', productsSchema);
