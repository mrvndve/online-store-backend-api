const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const schema = mongoose.Schema;

const suppliersSchema = new schema({
  branch: { type: mongoose.Types.ObjectId, required: true, ref: 'branches'},
  name: { type: String, required: true, maxlength: 255 },
  contact: { type: String, required: true, maxlength: 255 },
  email: { type: String, required: true, unique: true, maxlength: 255, },
  address: { type: String, required: true, maxlength: 255 },
  isActive: { type: Boolean, required: true },
}, { 
  timestamps: { 
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt',
  },
});

suppliersSchema.plugin(uniqueValidator);

module.exports = mongoose.model('suppliers', suppliersSchema);
