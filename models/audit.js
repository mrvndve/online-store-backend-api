const mongoose = require('mongoose');
const schema = mongoose.Schema;

const auditSchema = new schema({
  branch: { type: mongoose.Types.ObjectId, required: true, ref: 'branches'},
  user: { type: mongoose.Types.ObjectId, required: true, ref: 'users'},
  module: { type: String, required: true },
  action: { type: String, required: true },
  data: { type: Object },
  message: { type: String, required: true },                                                                            
}, {             
  timestamps: {       
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt',                                             
  },                                                             
});

module.exports = mongoose.model('audit', auditSchema);
