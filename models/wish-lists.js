const mongoose = require('mongoose');
const schema = mongoose.Schema;

const wishListsSchema = new schema({
  customer: { type: mongoose.Types.ObjectId, required: true, ref: 'customers'},
  product: { type: mongoose.Types.ObjectId, required: true, ref: 'products'},
}, { 
  timestamps: { 
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt',
  },
});

module.exports = mongoose.model('wish_lists', wishListsSchema);
