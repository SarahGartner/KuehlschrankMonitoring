const express = require('express');
const app = express();
const mongoose = require('mongoose');
const port = process.env.PORT || 3000;
require('dotenv/config');

const webappRoutes = require('./routes/webapp');
const microRoutes = require('./routes/microcontroller');

//JSON aus Body auslesen
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/webapp', webappRoutes);
app.use('/micro', microRoutes);

//Mit Datenbank verbinden
mongoose.connect(process.env.DB,
    { useUnifiedTopology: true, useNewUrlParser: true, retrywrites: false }, () =>
    console.log('Mit Kühlschrankmonitoring MongoDB verbunden')
);

app.listen(port);