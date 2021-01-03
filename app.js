const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors')
const port = process.env.PORT || 3000;
require('dotenv/config');

const sensordatenRoutes = require('./routes/sensordatenRoutes');
const kuehlgeraeteRoutes = require('./routes/kuehlgeraeteRoutes');

//JSON aus Body auslesen
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

//Routen
app.use('/sensordata', sensordatenRoutes);
app.use('/fridges', kuehlgeraeteRoutes);


//Mit Datenbank verbinden
mongoose.connect(process.env.DB,
    { useUnifiedTopology: true, useNewUrlParser: true, retrywrites: false }, () =>
    console.log('Mit Kühlschrankmonitoring MongoDB verbunden')
);

app.listen(port);