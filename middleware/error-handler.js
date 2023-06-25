const HttpError = require('../helpers/http-error');

module.exports = (app) => {
  app.use((req, res, next) => {
    const error = new HttpError('Could not find this route.', 404);
    throw error;
  });
  
  app.use((error, req, res, next) => {
    if (res.headerSent) {
      return next(error);
    }
    
    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occured.'});
  });
}