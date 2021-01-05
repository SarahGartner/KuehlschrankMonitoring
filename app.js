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
    const crossgateId = topic.split('/')[1];
    const sensorMac = '555';
    const temperature = 4.4;
    const humidity = 40.6;
    const sensordata = [{
        "sensorMac": "MQTTTest",
        "temperature": 4.1,
        "humidity": 80,
        "userId": userId,
        "crossGateId": "44-55-33"
    }];
    // const timestamp = "";
    // console.log(message[0]['temp'].toString());
    // console.log(sensorMac);
    console.log(topic + ': ' + message);

    const sensordaten = [];
    const fridges = [];
    sensordata.forEach(e =>
        sensordaten.push(
            new Sensordaten({
                _id: {
                    sensorMac: e.sensorMac,
                    timestamp: e.timestamp
                },
                temperature: e.temperature,
                humidity: e.humidity,
                userId: e.userId,
                crossGateId: e.crossGateId
            })
        )
    )
    try {
        const savedSensordaten = [];
        sensordaten.forEach(e =>
            e.save());
        sensordaten.forEach(e =>
            savedSensordaten.push(e));
        console.log(savedSensordaten);
    } catch (error) {
        console.log(error);
    };
    sensordata.forEach(async e => {
        try {
            const kuehlgeraet = await Kuehlgeraet.find({ _id: e.sensorMac });
            if (kuehlgeraet.length == 0) {
                await new Kuehlgeraet({
                    _id: e.sensorMac,
                    fridgeId: "",
                    name: "",
                    userId: e.userId,
                    crossGateId: e.crossGateId
                }).save();
            }
        } catch (error) {
            console.log(error);
        }
    }
    )
})