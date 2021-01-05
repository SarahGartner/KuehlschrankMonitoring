const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const port = process.env.PORT || 3000;
const https = require('https');
require('dotenv/config');
const Sensordaten = require('./models/Sensordaten');
const Kuehlgeraet = require('./models/Kuehlgeraete');

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



//MQTT
var mqtt = require('mqtt')
var client = mqtt.connect('mqtt://test.mosquitto.org')
user = [201501, 201508]


//bei User/save auch aufrufen!! 
//subscribe
user.forEach(u => {
    console.log(u)
    client.on('connect', function () {
        client.subscribe(u + '/#', function (err) {
            if (!err) {
            }
        })
    })
})

//saveSensordata
client.on('message', function (topic, message) {
    const userId = topic.split('/')[0];
    const crossGateId = topic.split('/')[1];
    messageArray = [];
    message = JSON.parse(message);
    Object.keys(message).forEach(key => messageArray.push(message[key]));
    const sensordaten = [];
    messageArray.forEach(e =>
        sensordaten.push(
            new Sensordaten({
                _id: {
                    sensorMac: e['sensorMac'],
                    // timestamp: ""
                },
                temperature: e['temp'],
                humidity: e['hum'],
                userId: userId,
                crossGateId: crossGateId
            })
        )
    )
    try {
        sensordaten.forEach(e =>
            e.save());
    } catch (error) {
    };
    messageArray.forEach(async e => {
        try {
            const kuehlgeraet = await Kuehlgeraet.find({ _id: e.sensorMac });
            if (kuehlgeraet.length == 0) {
                await new Kuehlgeraet({
                    _id: e['sensorMac'],
                    fridgeId: "",
                    name: "",
                    userId: userId,
                    crossGateId: crossGateId
                }).save();
            }
        } catch (error) {
        }
    }
    )
})