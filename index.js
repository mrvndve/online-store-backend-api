const express = require('express');
const app = express();

app.use('/uploads', express.static('storage/uploads'));

// Increase the payload limit for JSON requests
app.use(express.json({ limit: '20mb' }));

// Increase the payload limit for form data requests
app.use(express.urlencoded({ limit: '20mb', extended: true }));

const dotenv = require('dotenv');
dotenv.config();

// Routes
require('./routes')(app);

// Error Handlers
require('./middleware/error-handler')(app);

// Establish connection in MongoDB & Mongoose
require('./middleware/mongoose');

// Establish connection in express server
const port = process.env.PORT || 5001;
app.listen(port, () => { 
  console.log(`Application is listening to port ${port}`);
});