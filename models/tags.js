const mongoose = require('mongoose');
const schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');

const tagsSchema = new schema({
  name: { type: String, required: true, unique: true, maxlength: 255 },
  description: { type: String, required: true, maxlength: 255 },
  isActive: { type: Boolean, required: true, },
}, { 
  timestamps: { 
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt',
  },
});

tagsSchema.plugin(uniqueValidator);

module.exports = mongoose.model('tags', tagsSchema);
