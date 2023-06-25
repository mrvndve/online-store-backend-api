const mongoose = require('mongoose');
const schema = mongoose.Schema;

const customersSchema = new schema({
  userName: { type: String, required: true, maxlength: 255 },
  password: { type: String, required: true, maxlength: 255 },
  email: { type: String, required: true, maxlength: 255 },
  firstName: { type: String, required: true, maxlength: 255 },
  middleName: { type: String, maxlength: 255 },
  lastName: { type: String, required: true, maxlength: 255 },
  fullName: { type: String, required: true, maxlength: 255 },
  region: { type: String, required: true, maxlength: 255 },
  province: { type: String, required: true, maxlength: 255 },
  city: { type: String, required: true, maxlength: 255 },
  barangay: { type: String, required: true, maxlength: 255 },
  postalCode: { type: String, required: true, maxlength: 255 },
  street: { type: String, required: true, maxlength: 255 },
  address: { type: String, required: true, maxlength: 255 },
  contact: { type: String, required: true, maxlength: 255 },
  emailVerified: { type: Boolean },
}, { 
  timestamps: { 
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt',
  },
});

module.exports = mongoose.model('customers', customersSchema);
