const mongoose = require('mongoose');
const schema = mongoose.Schema;

const promotionsSchema = new schema({
  branch: { type: mongoose.Types.ObjectId, required: true, ref: 'branches'},
  name: { type: String, required: true, maxlength: 255 },
  description: { type: String, required: true, maxlength: 255 },
  discountPercent: { type: Number },
  products: { type: Array },
  isActive: { type: Boolean, required: true, },
}, { 
  timestamps: { 
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt',
  },
});

module.exports = mongoose.model('promotions', promotionsSchema);
