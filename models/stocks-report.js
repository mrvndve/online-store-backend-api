const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const schema = mongoose.Schema;

const stocksReportSchema = new schema({
  branch: { type: mongoose.Types.ObjectId, required: true, ref: 'branches', },
  product: { type: mongoose.Types.ObjectId, required: true, ref: 'products', },
  supplier: { type: mongoose.Types.ObjectId, ref: 'suppliers', },
  receiptNo: { type: String, },
  decreaseReason: { type: String, },
  status: { type: String, }
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
});

stocksReportSchema.plugin(uniqueValidator);

module.exports = mongoose.model('stocks_report', stocksReportSchema);
