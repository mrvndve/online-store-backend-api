const mongoose = require('mongoose');
const schema = mongoose.Schema;

const xenditPayments = new schema({
  transaction: { type: mongoose.Types.ObjectId, required: true, ref: 'transactions'},
  xenditInvoiceId: { type: String, required: true },
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
});

module.exports = mongoose.model('xendit_payments', xenditPayments);
