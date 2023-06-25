const nodeMailer = require('nodemailer');
const HttpError = require('./http-error');

const sendEmail = (toEmail, subject, message) => {
  const transporter = nodeMailer.createTransport({
    port: 465,
    host: 'smtp.gmail.com',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
    secure: true,
  });

  const mailData = {
    from: process.env.EMAIL,
    to: toEmail,
    subject,
    text: message,
  }

  transporter.sendMail(mailData, (err, info) => {
    if (err) {
      throw new HttpError(err, 500);
    }
  });
};

module.exports = {
  sendEmail,
};