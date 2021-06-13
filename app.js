require('dotenv/config');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const port = process.env.PORT || 3000;
const https = require('https');
const Sensordaten = require('./models/Sensordaten');
const Kuehlgeraet = require('./models/Kuehlgeraete');
const CrossGate = require('./models/CrossGate');
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

//MQTT
var mqtt = require('mqtt');
const { isEmptyObject } = require('jquery');
const { deleteOne } = require('./models/Kuehlgeraete');
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



//Überprüfe ob in letzten 10 Minuten Sensordaten gekommen sind.
//Telegram bot
setInterval(async function () {
    users = [];
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
    const date = new Date();
    date.setTime(date.getTime() - (5 * 60 * 1000));
    try {
        const kuehlgeraet = await Kuehlgeraet.find();
        console.log(kuehlgeraet);
        kuehlgeraet.forEach(async e => {
            try {
                if (e != undefined) {
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
                }
            } catch (error) {
                console.log(error);
            }
        })
    } catch (err) {
        console.log(err);
    }
}, (10 * 60 * 1000))



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
    console.log(topic);
    const userId = topic.split('/')[0];
    const crossGateId = topic.split('/')[1];
    if (topic.split('/')[2] == "addTag" || topic.split('/')[2] == "deleteTag") { }
    if (topic.split('/')[2] == "activateGPS" || topic.split('/')[2] == "deactivateGPS") { }
    else if (topic.split('/')[2] == "add") {
        (async () => {
            const crossGate = await CrossGate.find({ _id: crossGateId });
            if (crossGate.length == 0) {
                await new CrossGate({
                    _id: crossGateId,
                    name: "",
                    gps: false,
                    userId: userId
                }).save();
            }
        });
    }
    else {
        var battery;
        messageArray = [];
        message = JSON.parse(message);
        var lat = message['gpsData']['lat'];
        var long = message['gpsData']['long'];
        var alti = message['gpsData']['alti'];
        var speed = message['gpsData']['speedKmh'];
        var gpsBool = (long != null && lat != null);

        Object.keys(message).forEach(key => messageArray.push(message[key]));
        const sensordaten = [];
        messageArray.filter(e => e['sensorMac'] != undefined).forEach(e => {
        // messageArray.forEach(e => {
            // if (e['sensorMac'] == undefined)
            // {
            //     return;
            // }
            batteryFull = true;
            if (e['battery'] > 2800) {
                battery = 100;
            } else if (e['battery'] > 2400) {
                battery = 65;
            } else if (e['battery'] > 2000) {
                battery = 35;
            } else {
                battery = 0;
                batteryFull = false;
            }
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
                    longitude: long,
                    latitude: lat,
                    battery: battery,
                    rssi: e['rssi'],
                    altitude: alti,
                    speed: speed
                })
            )
        }
        )
        try {
            sensordaten.forEach(e =>
                e.save());
        } catch (error) {
        };
        try{
            (async () => {const crossGate = await CrossGate.find({ _id: crossGateId });
            if (crossGate.length == 0) {
                await new CrossGate({
                    _id: crossGateId,
                    name: "",
                    gps: gpsBool,
                    userId: userId
                }).save();
            } });
        } catch (e)
        {}
        // console.log(messageArray);
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
                        tempOK: true,
                        gps: gpsBool
                    }).save();
                } else {
                    if (crossGate[0].userId != userId || crossGate[0].gps != gpsBool) {
                        console.log("DD");
                        await CrossGate.findOneAndUpdate({ _id: crossGateId }, {
                            userId: userId,
                            gps: gpsBool
                        });
                    }
                    batteryChanged = false;
                    batteryFull = true;
                    if (kuehlgeraet[0].batteryCharge != battery && (kuehlgeraet[0].batteryCharge == 0 || battery == 0)) {
                        batteryChanged = true;
                    }
                    if (battery == 0) {
                        batteryFull = false;
                    }
                    if (kuehlgeraet[0].gps != gpsBool || kuehlgeraet[0].crossGateId != crossGateId ||
                        kuehlgeraet[0].batteryCharge != battery) {
                        await Kuehlgeraet.findOneAndUpdate({ _id: kuehlgeraet[0]['_id'] }, {
                            gps: gps,
                            crossGateId: crossGateId,
                            batteryCharge: battery
                        });
                    }
                    const user = await User.find({ _id: userId });
                    messageArray.forEach(async e => {
                        if (kuehlgeraet[0]['name'].toString == "" || kuehlgeraet[0]['name'] == undefined)
                            fridgeName = kuehlgeraet[0]['name'];
                        else
                            fridgeName = kuehlgeraet[0]['_id'];
                        if (!batteryFull && batteryChanged) {
                            bot.sendMessage(user[0]['telegramId'], 'Der Akku deines Kühlgeräts "' + fridgeName +
                                '" ist fast leer. Wechsle ihn bald!')
                        }
                        if (batteryFull && batteryChanged) {
                            bot.sendMessage(user[0]['telegramId'], 'Der Akku deines Kühlgeräts "' + fridgeName +
                                '" wurde gewechselt!')
                        }
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
                            if (e['temp'] > (JSON.parse(JSON.stringify(kuehlgeraet[0]['minTemperature']))) &&
                                e['temp'] < (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxTemperature'])))
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
                                    if (e['temp'] < (JSON.parse(JSON.stringify(kuehlgeraet[0]['minTemperature'])))) {
                                        bot.sendMessage(user[0]['telegramId'],
                                            'Die Temperatur deines Kühlgerätes "' + fridgeName + '" liegt ' +
                                            Math.round(((JSON.parse(JSON.stringify(kuehlgeraet[0]['minTemperature']))) - e['temp']) * 100) / 100 +
                                            '°C unter der Minimaltemperatur. Gemessene Temperatur: '
                                            + e['temp'] + "°C");
                                    }
                                    else if (e['temp'] > (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxTemperature']))))
                                        bot.sendMessage(user[0]['telegramId'],
                                            'Die Temperatur deines Kühlgerätes "' + fridgeName + '" liegt ' +
                                            Math.round((e['temp'] - (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxTemperature'])))) * 100) / 010 +
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
                                if (e['hum'] > (JSON.parse(JSON.stringify(kuehlgeraet[0]['minHumidity']))) &&
                                    e['hum'] < (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxHumidity'])))
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
                                        if (e['hum'] < (JSON.parse(JSON.stringify(kuehlgeraet[0]['minHumidity'])))) {
                                            bot.sendMessage(user[0]['telegramId'],
                                                'Die Luftfeuchtigkeit deines Kühlgerätes "' + fridgeName + '" liegt ' +
                                                Math.round(((JSON.parse(JSON.stringify(kuehlgeraet[0]['minHumidity']))) - e['hum']) * 100) / 100 +
                                                '% unter der Minimalluftfeuchtigkeit. Gemessene Luftfeuchtigkeit: '
                                                + e['hum'] + "%");
                                        }
                                        else if (e['hum'] > (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxHumidity']))))
                                            bot.sendMessage(user[0]['telegramId'],
                                                'Die Luftfeuchtigkeit deines Kühlgerätes "' + fridgeName + '" liegt ' +
                                                Math.round((e['hum'] - (JSON.parse(JSON.stringify(kuehlgeraet[0]['maxHumidity'])))) * 100) / 100 +
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
    }
})

//Telegram bot Konversation
bot.on('message', (msg) => {
    var optionsNull = {
        "parse_mode": "Markdown",
        "reply_markup": { remove_keyboard: true }
    };
    var options = {
        "parse_mode": "Markdown",
        "reply_markup": JSON.stringify({
            "keyboard": [
                [{ text: "/help" }],
                [{ text: "/start" }],
                [{ text: "/fridges" }],
                [{ text: "/crossgates" }],
            ]
        })
    };
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
            try {
                await User.findOneAndUpdate({ 'telegramId': chatId }, {
                    telegramId: 0
                });
            } catch (err) {
                console.log(err);
            }
            await User.findOneAndUpdate({ _id: msg.text.toString() }, {
                telegramId: chatId
            });
            console.log(userById[0]['firstName']);
            bot.sendMessage(chatId, "Hallo " + userById[0]['firstName'] + ', dein Telegram Alert System wurde eingerichtet. Du bist mit dem Usernamen ' + userById[0]['_id'] + " gespeichert." +
                "\nMit dem Command /help findest du alle deine Commands.", options);
            newUser = false;
            console.log(chatId);
        }
        else if (msg.text.toString() == "/start") {
            bot.sendMessage(chatId, 'Willkommen! Bitte gib deine Client-Id ein, um deine Subscription abzuschließen!', optionsNull);
        }
        else if (newUser) {
            if (msg.text.toString() == "/help") {
                bot.sendMessage(chatId, 'Hallo ' +
                    '! \n /start: Richte dein Konto ein! \n /crossgates: Überblick über deine CrossGates (nur eingeloggt) \n /fridges: Überblick deiner Kühlgeräte (nur eingeloggt)'), options;
            } else {
                bot.sendMessage(chatId, 'Bitte gib deine Client-Id ein, um deine Subscription abzuschließen!', optionsNull);
            }
        }
        else {
            if (msg.text.toString() == "/help") {
                bot.sendMessage(chatId, 'Hallo ' + user[0]['firstName'] + ' (' + user[0]['_id'] + ')' +
                    '! \n /start: Anderen User einrichten? \n /crossgates: Überblick über deine CrossGates \n /fridges: Überblick deiner Kühlgeräte', options);
            }
            else if (msg.text.toString() == "/fridges") {
                try {
                    const kuehlgeraete = await Kuehlgeraet.find({ 'userId': user[0]['_id'] });
                    if (kuehlgeraete.length != 0) {
                        var kgs = "";
                        // var kb = new Array();
                        kuehlgeraete.forEach(async kg => {
                            // var z = ['text:' + kg['_id']];
                            // kb.push(z);
                            var status = kg['intervalOK'] ? "aktiv" : "inaktiv";
                            if (kgs == "") {
                                kgs = "Macadresse: " + kg['_id'] + "\nName: " + kg['name'] +
                                    "\nCrossGate: " + kg['crossGateId'] + "\nStatus: " + status;
                            }
                            else {
                                kgs = kgs + "\n\nMacadresse: " + kg['_id'] + "\nName: " + kg['name'] +
                                    "\nCrossGate: " + kg['crossGateId'] + kg['crossGateId'] + "\nStatus: " + status;
                            }
                            if (kg['intervalOK']) {
                                if (kg['gps'])
                                    kgs += "\nGPS: aktiv";
                                if (kg['minTemperature'] != kg['maxTemperature'] && !kg['tempOK']) {
                                    // const sensordaten = await Sensordaten.findOne({ '_id.sensorMac': kg['fridgeId'] });
                                    kgs += "\nAchtung! Temperatur ist außerhalb des festgelegten Temperaturbereichs!"; // + sensordaten['temperature'];
                                }
                                if (kg['minHumidity'] != kg['maxHumidity'] && !kg['humOK']) {
                                    kgs += "\nAchtung! Luftfeuchtigkeit ist außerhalb des festgelegten Temperaturbereichs!";
                                }
                            }
                        });
                        // var options = {
                        //     "parse_mode": "Markdown",
                        //     "reply_markup": JSON.stringify({
                        //         "keyboard": kb
                        //         // "keyboard": [
                        //         //     [{ text: "Yes" }],
                        //         //     [{ text: "No" }]
                        //         // ]
                        //     })
                        // };
                        bot.sendMessage(chatId, "Deine Kühlgeräte:\n\n" + kgs, optionsNull);
                    }
                    else {
                        bot.sendMessage(chatId, "noch keine Kühlgeräte registriert!", optionsNull);
                    }
                }
                catch (err) {
                }
            }
            else if (msg.text.toString() == "/crossgates") {
                try {
                    const crossgates = await CrossGate.find({ 'userId': user[0]['_id'] });
                    if (crossgates.length != 0) {
                        var cgs = "";
                        crossgates.forEach(cg => {
                            if (cgs == "")
                                cgs = "Macadresse: " + cg['_id'] + "\nName: " + cg['name'] +
                                    "\nGPS: " + (cg['gps'] ? "Ja" : "Nein");
                            else
                                cgs = cgs + "\n\nMacadresse: " + cg['_id'] + "\nName: " + cg['name'] +
                                    "\nGPS: " + (cg['gps'] ? "Ja" : "Nein");
                        });
                        bot.sendMessage(chatId, "Deine CrossGates:\n\n" + cgs, optionsNull);
                    }
                    else {
                        bot.sendMessage(chatId, "noch keine CrossGates registriert!", optionsNull);
                    }
                }
                catch (err) {
                }
            }
            else {
                bot.sendMessage(chatId, "Hallo " + user[0]['firstName'] +
                    ". Ich kann dir leider keine Fragen beantworten. Um deine Sensorwerte auszulesen besuche die Seite http://kuehlschrankmonitoring.azurewebsites.net/ und logge dich mit deinem User-Id "
                    + user[0]['_id'] + " ein!", options);
            }
        }
    })();
});