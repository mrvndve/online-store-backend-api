const mongoose = require('mongoose');
const schema = mongoose.Schema;

const cartsSchema = new schema({
  customer: { type: mongoose.Types.ObjectId, required: true, ref: 'customers'},
  product: { type: mongoose.Types.ObjectId, required: true, ref: 'products'},
  quantity: { type: Number },
  variant: { type: Object },
}, { 
  timestamps: { 
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt',
  },
});

module.exports = mongoose.model('carts', cartsSchema);
