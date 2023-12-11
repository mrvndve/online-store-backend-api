const environment = process.env.NODE_ENV;

const FRONTEND_DOMAIN = environment === 'development' ? 'http://localhost:3000' : process.env.FRONTEND_DOMAIN;

module.exports =  {
  FRONTEND_DOMAIN,
};