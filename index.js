const express = require('express');
const app = express();

app.use('/uploads', express.static('storage/uploads'));

const dotenv = require('dotenv');
dotenv.config();

// Routes
require('./routes')(app);

// Error Handlers
require('./middleware/error-handler')(app);

// Establish connection in MongoDB & Mongoose
require('./middleware/mongoose');

// Establish connection in express server
const port = process.env.PORT || 5000;
app.listen(port, () => { 
  console.log(`Application is listening to port ${port}`);
});