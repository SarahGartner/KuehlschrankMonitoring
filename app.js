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
// app.use(cors());
app.use(cors({
    origin: 'http://kuehlschrankmonitoring.azurewebsites.net/'
}));

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
                bot.sendMessage(user['telegramId'], 'Achtung! Dein Kühlgerät "' + e['name'] + '" hat in den letzten 10 Minuten keine Daten gesendet!');
                console.log("HIER TELEGRAM");
            } else if (!e['intervalOK'] && data[data.length - 1]['_id']['timestamp'] >= date) {
                const user = await User.findOne({ '_id': e['userId'] });
                await Kuehlgeraet.findOneAndUpdate({ _id: e['_id'] }, {
                    intervalOK: true
                });
                bot.sendMessage(user['telegramId'], 'Dein Kühlgerät "' + e['name'] + 
                '" sendet wieder Daten! Die aktuelle Temperatur beträgt: ' + JSON.parse(JSON.stringify(data[data.length - 1]['temperature']))['$numberDecimal'] + 
                "°C und die Luftfeuchtigkeit beträgt: " + JSON.parse(JSON.stringify(data[data.length - 1]['humidity']))['$numberDecimal'] + "%.");
                console.log("ALLES WIEDER OK");
            }
        })
    } catch (err) {
        console.log(err);
    }
}, (10 * 60 * 1000))



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
                messageArray.forEach(async e => {
                    if (kuehlgeraet[0]['minTemperature'] != kuehlgeraet[0]['maxTemperature']) {
                        //temp
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
                                        'Die Temperatur deines Kühlgerätes "' + kuehlgeraet[0]['name'] + '" liegt ' +
                                        Math.round(((JSON.parse(JSON.stringify(kuehlgeraet[0]['minTemperature'])))['$numberDecimal'] - e['temp']) * 10) / 10 +
                                        '°C unter der Minimaltemperatur. Gemessene Temperatur: '
                                        + e['temp'] + "°C");
                                }
                                else if (e['temp'] > (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxTemperature'])))['$numberDecimal'])
                                    bot.sendMessage(user[0]['telegramId'],
                                        'Die Temperatur deines Kühlgerätes "' + kuehlgeraet[0]['name'] + '" liegt ' +
                                        Math.round((e['temp'] - (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxTemperature'])))['$numberDecimal']) * 10) / 10 +
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
                                            'Die Luftfeuchtigkeit deines Kühlgerätes "' + kuehlgeraet[0]['name'] + '" liegt ' +
                                            Math.round(((JSON.parse(JSON.stringify(kuehlgeraet[0]['minHumidity'])))['$numberDecimal'] - e['hum']) * 10) / 10 +
                                            '% unter der Minimalluftfeuchtigkeit. Gemessene Luftfeuchtigkeit: '
                                            + e['hum'] + "%");
                                    }
                                    else if (e['hum'] > (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxHumidity'])))['$numberDecimal'])
                                        bot.sendMessage(user[0]['telegramId'],
                                            'Die Luftfeuchtigkeit deines Kühlgerätes "' + kuehlgeraet[0]['name'] + '" liegt ' +
                                            Math.round((e['hum'] - (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxHumidity'])))['$numberDecimal']) * 10) / 10 +
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
        //wenn client id einegegeben
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
    })();
});