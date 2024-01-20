const mongoose = require('mongoose');

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

const environment = process.env.NODE_ENV

mongoose.set('strictQuery', false);

if (environment === 'development') {
  mongoose
    .connect(`mongodb://127.0.0.1:27017/${dbName}`, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('MongoDB is running in development!');
    })
    .catch(err => {
      console.log(err);
    });
} else {
  mongoose
    .connect(`mongodb+srv://${dbUsername}:${dbPassword}@dbaas-db-10913461-73938a35.mongo.ondigitalocean.com/${dbName}?tls=true&authSource=admin&replicaSet=dbaas-db-10913461`)
    .then(() => {
      console.log('MongoDB is running in production!');
    })
    .catch(err => {
      console.log(err);
    });
}