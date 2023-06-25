const mongoose = require('mongoose');
const schema = mongoose.Schema;

const ratingsSchema = new schema({
  customer: { type: mongoose.Types.ObjectId, required: true, ref: 'customers'},
  product: { type: mongoose.Types.ObjectId, required: true, ref: 'products'},
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
});

module.exports = mongoose.model('ratings', ratingsSchema);
