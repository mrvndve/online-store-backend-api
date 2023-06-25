const AuditModel = require('../models/audit');
const HttpError = require('./http-error');
const messages = require('../helpers/messages');

const audit = async (userId, branchId, module, action, message, data = null) => {
  const newAudit = new AuditModel({
    branch: branchId,
    user: userId,
    module,
    action,
    message,
    data,
  });

  try {
    await newAudit.save();
  } catch (err) {
    throw new HttpError(process.env.NODE_ENV === 'development' ? err : messages.FAILED, 500);
  }
};

module.exports = audit;