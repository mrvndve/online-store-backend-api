const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const schema = mongoose.Schema;

const usersSchema = new schema({
  branch: { type: mongoose.Types.ObjectId, required: true, ref: 'branches'},
  role: { type: mongoose.Types.ObjectId, required: true, ref: 'roles'},
  userName: { type: String, required: true, unique: true, maxlength: 255, },
  password: { type: String, required: true, maxlength: 255, },
  email: { type: String, required: true, unique: true, maxlength: 255, },
  firstName: { type: String, required: true, maxlength: 255, },
  middleName: { type: String, required: false, maxlength: 255, },
  lastName: { type: String, required: true, maxlength: 255, },
  fullName: { type: String, required: true, maxlength: 255, },
  contact: { type: String, required: true, maxlength: 25, },
  isActive: { type: Boolean, required: true, },
}, { 
  timestamps: { 
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt',
  },
});

usersSchema.plugin(uniqueValidator);

module.exports = mongoose.model('users', usersSchema);
