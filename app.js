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
const crossGateRoutes = require('./routes/crossGateRoutes');

// Telegram Bot
const token = process.env.TELEGRAMTOKEN;
const bot = new TelegramBot(token, { polling: true });

//JSON aus Body auslesen
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(cors());
app.use(cors({
    origin: 'http://kuehlschrankmonitoring.azurewebsites.net/'
}));

//Routen
app.use('/sensordata', sensordatenRoutes);
app.use('/fridges', kuehlgeraeteRoutes);
app.use('/users', userRoutes);
app.use('/crossGates', crossGateRoutes);


//Mit Datenbank verbinden
mongoose.connect(process.env.DB,
    { useUnifiedTopology: true, useNewUrlParser: true, retrywrites: false }, () =>
    console.log('Mit Kühlschrankmonitoring MongoDB verbunden')
);


app.listen(port);


//Überprüfe ob in letzten 10 Minuten Sensordaten gekommen sind.
//Telegram bot
setInterval(async function () {
    const date = new Date();
    date.setTime(date.getTime() - (10 * 60 * 1000));
    try {
        const kuehlgeraet = await Kuehlgeraet.find();
        kuehlgeraet.forEach(async e => {
            const data = await Sensordaten.find({ '_id.sensorMac': e['_id'] });
            if (e['intervalOK'] && data[data.length - 1]['_id']['timestamp'] < date) {
                const user = await User.findOne({ '_id': e['userId'] });
                await Kuehlgeraet.findOneAndUpdate({ _id: e['_id'] }, {
                    intervalOK: false
                });
                if (user['telegramId'] != undefined) {
                    var name;
                    if (e['name'] != "")
                        name = e['name']
                    else
                        name = e['_id']
                    bot.sendMessage(user['telegramId'], 'Achtung! Dein Kühlgerät "' + name + '" hat in den letzten 10 Minuten keine Daten gesendet!');
                }
            }
        })
    } catch (err) {
        console.log(err);
    }
}, (10 * 60 * 1000))



//MQTT
var mqtt = require('mqtt');
const { isEmptyObject } = require('jquery');
const CrossGate = require('./models/CrossGate');
var users = [];
var client;

(async () => {
    client = mqtt.connect(process.env.MQTTBROKER)
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


//Reminder an die Sarah weil wegen Kosten pro Zugriff: 
//Diese Route sollte noch umgebaut werden:
//zurzeit werden jedes Mal mind 2 DB-Zugriffe gemacht
//Besser wäre es, wenn bspw. immer wenn Kühlschränke bearbeitet werden (Save/Delete/Update)
//eine Liste mit allen Kühlschränken geladen wird
//und verglichen wird, ob die Id enthalten ist
//so spart man sich den Read aufruf
//man könnte so auch die Wertgrenzen vergleichen, ohne erneut auf die DB zugreiifen zu müssen
//saveSensordata
client.on('message', function (topic, message) {
    const userId = topic.split('/')[0];
    const crossGateId = topic.split('/')[1];
    var gps = false;
    // console.log(userId + crossGateId);
    messageArray = [];
    message = JSON.parse(message);
    Object.keys(message).forEach(key => messageArray.push(message[key]));
    const sensordaten = [];
    messageArray.forEach(e =>
        {
        gps = (e['long'] != null && e['lat'] != null);
        sensordaten.push(
            new Sensordaten({
                _id: {
                    sensorMac: e['sensorMac'],
                    timestamp: e['timestamp']
                },
                temperature: e['temp'],
                humidity: e['hum'],
                userId: userId,
                crossGateId: crossGateId,
                longitude: e['long'],
                latitude: e['lat'],
                battery: e['battery'],
                rssi: e['rssi']
            })
        )}
    )
    try {
        sensordaten.forEach(e =>
            e.save());
    } catch (error) {
    };
    messageArray.forEach(async e => {
        try {
            const crossGate = await CrossGate.find({_id: crossGateId});
            if (crossGate.length == 0) {
                await new CrossGate({
                    _id: crossGateId,
                    name: "",
                    gps: gps,
                    userId: userId
                }).save();
            }
            const kuehlgeraet = await Kuehlgeraet.find({ _id: e.sensorMac });
            if (kuehlgeraet.length == 0) {
                await new Kuehlgeraet({
                    _id: e['sensorMac'],
                    fridgeId: "",
                    name: "",
                    userId: userId,
                    crossGateId: crossGateId,
                    tempOK: true,
                    gps: gps
                }).save();
            } else {
                if (kuehlgeraet[0].gps != gps){
                    await Kuehlgeraet.findOneAndUpdate({ _id: kuehlgeraet[0]['_id'] }, {
                        gps: gps
                    });
                }
                if (kuehlgeraet[0].crossGateId != crossGateId){
                    await Kuehlgeraet.findOneAndUpdate({ _id: kuehlgeraet[0]['_id'] }, {
                        crossGateId: crossGateId
                    });
                }
                const user = await User.find({ _id: userId });
                messageArray.forEach(async e => {
                    if(kuehlgeraet[0]['name'].toString == "" || kuehlgeraet[0]['name'] == undefined)
                        fridgeName = kuehlgeraet[0]['name'];
                    else
                        fridgeName = kuehlgeraet[0]['_id'];
                    if (!kuehlgeraet[0]['intervalOK']) {
                        await Kuehlgeraet.findOneAndUpdate({ _id: kuehlgeraet[0]['_id'] }, {
                            intervalOK: true
                        });
                        if (user[0]['telegramId'] != undefined) {
                            bot.sendMessage(user[0]['telegramId'], 'Dein Kühlgerät "' + fridgeName +
                                '" sendet wieder Daten! Die aktuelle Temperatur beträgt: ' + e['temp'] +
                                "°C und die Luftfeuchtigkeit beträgt: " + e['hum'] + "%.");
                        }
                    }
                    //temp
                    if (kuehlgeraet[0]['minTemperature'] != kuehlgeraet[0]['maxTemperature']) {
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
                                if (e['temp'] < (JSON.parse(JSON.stringify(kuehlgeraet[0]['minTemperature'])))['$numberDecimal']) {
                                    bot.sendMessage(user[0]['telegramId'],
                                        'Die Temperatur deines Kühlgerätes "' + fridgeName + '" liegt ' +
                                        Math.round(((JSON.parse(JSON.stringify(kuehlgeraet[0]['minTemperature'])))['$numberDecimal'] - e['temp']) * 100) / 100 +
                                        '°C unter der Minimaltemperatur. Gemessene Temperatur: '
                                        + e['temp'] + "°C");
                                }
                                else if (e['temp'] > (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxTemperature'])))['$numberDecimal'])
                                    bot.sendMessage(user[0]['telegramId'],
                                        'Die Temperatur deines Kühlgerätes "' + fridgeName + '" liegt ' +
                                        Math.round((e['temp'] - (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxTemperature'])))['$numberDecimal']) * 100) / 010 +
                                        '°C über der Maximaltemperatur. Gemessene Temperatur: '
                                        + e['temp'] + "°C");
                                try {
                                    await Kuehlgeraet.findOneAndUpdate({ _id: kuehlgeraet[0]['_id'] }, {
                                        tempOK: false,
                                    });
                                } catch {
                                }
                            }
                        }
                        //hum
                        if (kuehlgeraet[0]['minHumidity'] != kuehlgeraet[0]['maxHumidity']) {
                            if (e['hum'] > (JSON.parse(JSON.stringify(kuehlgeraet[0]['minHumidity'])))['$numberDecimal'] &&
                                e['hum'] < (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxHumidity'])))['$numberDecimal']
                            ) {
                                if (!kuehlgeraet[0]['humOK']) {
                                    try {
                                        await Kuehlgeraet.findOneAndUpdate({ _id: kuehlgeraet[0]['_id'] }, {
                                            humOK: true
                                        });
                                    } catch {
                                    }
                                }
                            } else {
                                if (kuehlgeraet[0]['humOK']) {
                                    if (e['hum'] < (JSON.parse(JSON.stringify(kuehlgeraet[0]['minHumidity'])))['$numberDecimal']) {
                                        bot.sendMessage(user[0]['telegramId'],
                                            'Die Luftfeuchtigkeit deines Kühlgerätes "' + fridgeName + '" liegt ' +
                                            Math.round(((JSON.parse(JSON.stringify(kuehlgeraet[0]['minHumidity'])))['$numberDecimal'] - e['hum']) * 100) / 100 +
                                            '% unter der Minimalluftfeuchtigkeit. Gemessene Luftfeuchtigkeit: '
                                            + e['hum'] + "%");
                                    }
                                    else if (e['hum'] > (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxHumidity'])))['$numberDecimal'])
                                        bot.sendMessage(user[0]['telegramId'],
                                            'Die Luftfeuchtigkeit deines Kühlgerätes "' + fridgeName + '" liegt ' +
                                            Math.round((e['hum'] - (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxHumidity'])))['$numberDecimal']) * 100) / 100 +
                                            '% über der Maximalluftfeuchtigkeit. Gemessene Luftfeuchtigkeit: '
                                            + e['hum'] + "%");
                                    try {
                                        await Kuehlgeraet.findOneAndUpdate({ _id: kuehlgeraet[0]['_id'] }, {
                                            humOK: false,
                                        });
                                    } catch {
                                    }
                                }
                            }
                        }
                    }
                });
            }
        } catch (error) {
        }
    }
    )
})

//Telegram bot Konversation
bot.on('message', (msg) => {
    newUser = true;
    const chatId = msg.chat.id;
    (async () => {
        const user = await User.find({ 'telegramId': chatId });
        if (user[0] == undefined) newUser = true;
        else {
            newUser = false;
            userId = user[0]['_id'];
            console.log(userId);
        }
        //wenn client id eingegeben
        const userById = await User.find({ '_id': msg.text.toString() });
        if (userById[0] != undefined) {
            await User.findOneAndUpdate({ _id: msg.text.toString() }, {
                telegramId: chatId
            });
            console.log(userById[0]['firstName']);
            bot.sendMessage(chatId, "Hallo " + userById[0]['firstName'] + ', dein Telegram Alert System wurde eingerichtet. Du bist mit dem Usernamen ' + userById[0]['_id'] + " gespeichert.");
            newUser = false;
            console.log(chatId);
        }
        else if (msg.text.toString() == "/start") {
            bot.sendMessage(chatId, 'Willkommen! Bitte gib deine Client-Id ein, um deine Subscription abzuschließen!');
        } else if (newUser) {
            bot.sendMessage(chatId, 'Bitte gib deine Client-Id ein, um deine Subscription abzuschließen!');
        } else {
            bot.sendMessage(chatId, "Hallo " + user[0]['firstName'] +
                ". Ich kann dir leider keine Fragen beantworten. Um deine Sensorwerte auszulesen besuche die Seite http://kuehlschrankmonitoring.azurewebsites.net/ und logge dich mit deinem User-Id " + user[0]['_id'] + " ein!");
        }
        // if (msg.text.toString() == "Geräte") {
        //     const fridge = await Fridge.find({ '_id': user[0]['_id']});
        //     bot.sendMessage(chatId, "Hallo " + user[0]['firstName'] + "! Deine Geräte: " +
        //     "");
        // }
    })();
});