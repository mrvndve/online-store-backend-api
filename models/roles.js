const mongoose = require('mongoose');
const schema = mongoose.Schema;

const rolesSchema = new schema({
  branch: { type: mongoose.Types.ObjectId, required: true, ref: 'branches'},
  name: { type: String, required: true, maxlength: 255, },
  remarks: { type: String, required: true, maxlength: 255, },
  permissions: { type: Array, required: true },
  isActive: { type: Boolean, required: true },
  isDefault: { type: Boolean },
}, {             
  timestamps: {       
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt',                                             
  },                                                             
});

module.exports = mongoose.model('roles', rolesSchema);
