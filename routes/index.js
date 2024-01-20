const bodyParser = require('body-parser');

module.exports = (app) => {
  // Requests Body Parser
  app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));
  app.use(bodyParser.json({ limit: '500mb', extended: true }));

  // Requests CORS Handler
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
  });

  // Routes
  const adminRoutes = require('./admin');
  const usersRoutes = require('./users');
  const branchesRoutes = require('./branches');
  const categoriesRoutes = require('./categories');
  const brandsRoutes = require('./brands');
  const rolesRoutes = require('./roles');
  const productRoutes = require('./products');
  const suppliersRoutes = require('./suppliers');
  const settingsRoutes = require('./settings');
  const tagsRoutes = require('./tags');
  const promotionsRoutes = require('./promotions');
  const transactionsRoutes = require('./transactions');
  const customerRoutes = require('./customers');

  app.use('/api/admin', adminRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/branches', branchesRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/brands', brandsRoutes);
  app.use('/api/roles', rolesRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/suppliers', suppliersRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/tags', tagsRoutes);
  app.use('/api/promotions', promotionsRoutes);
  app.use('/api/transactions', transactionsRoutes);
  app.use('/api/customer', customerRoutes);
}