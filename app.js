const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv/config');

const webappRoutes = require('./routes/webapp');
const microRoutes = require('./routes/microcontroller');


//JSON aus Body auslesen
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use('/webapp', webappRoutes);
app.use('/micro', microRoutes);


mongoose.connect('mongodb://kuehlschrankmonitoring:1kFDVoKr8zHrVubhpjAe3jeYNMowxy4ZoAfDyKNOyTy8sMXs0r0gVd8rmB4ppK4ZBJQOFi3th0oEi8gEJoj6JA==@kuehlschrankmonitoring.mongo.cosmos.azure.com:10255/?ssl=true&appName=@kuehlschrankmonitoring@',
    { useUnifiedTopology: true, useNewUrlParser: true, retrywrites: false }, () =>
    console.log('Mit Kühlschrankmonitoring MongoDB verbunden')
);


app.listen(3000);