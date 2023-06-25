const mongoose = require('mongoose');
const schema = mongoose.Schema;
const Double = require('@mongoosejs/double');

const transactionsSchema = new schema({
  branch: { type: mongoose.Types.ObjectId, required: true, ref: 'branches'},
  customer: { type: mongoose.Types.ObjectId, required: true, ref: 'customers'},
  driver: { type: mongoose.Types.ObjectId, ref: 'users'},
  product: { type: mongoose.Types.ObjectId, required: true, ref: 'products'},
  unitPrice: { type: Double },
  discount: { type: Double },
  variant: { type: Object },
  quantity: { type: Number },
  total: { type: Double },
  paymentMethod: { type: String },
  status: { type: String },
  cancelReason: { type: String },
  returnReason: { type: String },
  contact: { type: Number },
  address: { type: String },
}, { 
  timestamps: { 
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt',
  },
});

module.exports = mongoose.model('transactions', transactionsSchema);
