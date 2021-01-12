require('dotenv/config');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const port = process.env.PORT || 3000;
const https = require('https');
const Sensordaten = require('./models/Sensordaten');
const Kuehlgeraet = require('./models/Kuehlgeraete');
const User = require('./models/User');
const TelegramBot = require('node-telegram-bot-api');

const sensordatenRoutes = require('./routes/sensordatenRoutes');
const kuehlgeraeteRoutes = require('./routes/kuehlgeraeteRoutes');
const userRoutes = require('./routes/userRoutes');

// Telegram Bot
const token = process.env.TELEGRAMTOKEN;
const bot = new TelegramBot(token, { polling: true });

//JSON aus Body auslesen
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

//Routen
app.use('/sensordata', sensordatenRoutes);
app.use('/fridges', kuehlgeraeteRoutes);
app.use('/users', userRoutes);


//Mit Datenbank verbinden
mongoose.connect(process.env.DB,
    { useUnifiedTopology: true, useNewUrlParser: true, retrywrites: false }, () =>
    console.log('Mit Kühlschrankmonitoring MongoDB verbunden')
);


app.listen(port);




// setInterval(function () {
//     console.log("hi")
//     //get all fridges
//     //foreach fridge, get last sensordata
//     //see if last sensordata is more than 5 minutes from time now
// }, 5000)


//MQTT
var mqtt = require('mqtt')
var users = [];
var client;

(async () => {
    client = mqtt.connect('mqtt://test.mosquitto.org')
    const user = await User.find();
    user.forEach(u => {
        users.push(u['_id']);
    })
    users.forEach(u => {
        client.subscribe(u + '/#', function (err) {
            if (!err) {
            }
        })
    })
})();


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
                    timestamp: e['timestamp']
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
                    crossGateId: crossGateId,
                    tempOK: true
                }).save();
            } else {
                const user = await User.find({ _id: userId });
                console.log(kuehlgeraet[0]['minTemperature']);
                if (kuehlgeraet[0]['minTemperature'] != kuehlgeraet[0]['maxTemperature']) {
                    messageArray.forEach(async e => {
                        if (e['temp'] > (JSON.parse(JSON.stringify(kuehlgeraet[0]['minTemperature'])))['$numberDecimal'] &&
                            e['temp'] < (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxTemperature'])))['$numberDecimal']
                        ) {
                            if (!kuehlgeraet[0]['tempOK']) {
                                try {
                                    await Kuehlgeraet.findOneAndUpdate({ _id: kuehlgeraet[0]['_id'] }, {
                                        tempOK: true
                                    });
                                } catch {
                                }
                            }
                        } else {
                            if (kuehlgeraet[0]['tempOK']) {
                                // console.log("achtung");
                                if (e['temp'] < (JSON.parse(JSON.stringify(kuehlgeraet[0]['minTemperature'])))['$numberDecimal'])
                                    bot.sendMessage(user[0]['telegramId'],
                                        'Die Temperatur ihres Kühlgerätes "' + kuehlgeraet[0]['name']
                                        + '" liegt unter der Minimaltemperatur. Gemessene Temperatur: '
                                        + e['temp'] + "°C");
                                else if (e['temp'] > (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxTemperature'])))['$numberDecimal'])
                                    bot.sendMessage(880108458,
                                        'Die Temperatur ihres Kühlgerätes "' + kuehlgeraet[0]['name']
                                        + '" liegt über der Maximaltemperatur. Gemessene Temperatur: '
                                        + e['temp'] + "°C");
                                console.log("ALARM: Außerhalb Temperaturbereich");
                                try {
                                    console.log("doneee");
                                    await Kuehlgeraet.findOneAndUpdate({ _id: kuehlgeraet[0]['_id'] }, {
                                        tempOK: false,
                                    });
                                } catch {
                                }
                            }
                        }
                    });
                }
            }
        } catch (error) {
        }
    }
    )
})


//Telegram bot Konversation
bot.on('message', (msg) => {
    newUser = true;
    userId = 201508;
    telegramId = 0;
    const chatId = msg.chat.id;
    (async () => {
        const user = await User.find({ 'telegramId': chatId });
        if (user[0] == undefined) newUser = true;
        else {
            newUser = false;
            userId = user[0]['_id'];
            console.log(userId);
        }
        //wenn client id einegegeben
        if (msg.text.toString() == '201508') {
            const user = await User.find({ '_id': msg.text.toString() });
            if (user[0] != undefined){
                await User.findOneAndUpdate({ _id: msg.text.toString() }, {
                    telegramId : chatId
                });
            }
            console.log(user[0]['firstName']);
            bot.sendMessage(chatId, "Hallo " + user[0]['firstName'] + ', dein Telegram Alert System wurde eingerichtet. Du bist mit dem Usernamen ' + user[0]['_id'] + " gespeichert.");
            console.log(chatId);
        } else if (msg.text.toString() == "/start") {
            bot.sendMessage(chatId, 'Willkommen! Bitte gib deine Client-Id ein, um deine Subscription abzuschließen!');
        } else if (newUser) {
            bot.sendMessage(chatId, 'Bitte gib deine Client-Id ein, um deine Subscription abzuschließen!');
        } else {
            bot.sendMessage(chatId, "Hallo " + user[0]['firstName'] + ". Ich kann dir leider keine Fragen beantworten.");
        }
    })();
});