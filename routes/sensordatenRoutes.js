const express = require('express');
const Sensordaten = require('../models/Sensordaten');
const Kuehlgeraet = require('../models/Kuehlgeraete');
const router = express.Router();


//READ
//Alle Sensordaten aus der DB
router.get('/', async (req, res) => {
    try {
        const sensordaten = await Sensordaten.find();
        res.json(sensordaten);
    } catch (error) {
        res.json({ message: error });
    }
});


//Alle Sensordaten eines Geräts
router.post('/ByMac', async (req, res) => {
    try {
        const sensordaten = await Sensordaten.find({ '_id.sensorMac': req.body.sensorMac });
        res.json(sensordaten);
    } catch (error) {
        res.json({ message: error });
    }
});

//Alle Sensordaten eines Geräts zwischen 2 Zeitstempel
router.post('/ByTimestamps', async (req, res) => {
    try {
        const sensordaten = await Sensordaten.find(
            {
                '_id.sensorMac': req.body.sensorMac,
                '_id.timestamp':
                {
                    $gte: req.body.gte,
                    $lt: req.body.lt
                }
            }
        );
        res.json(sensordaten);
    } catch (error) {
        res.json({ message: error });
    }
});

//Alle Sensordaten eines Geräts der letzten 7 Tage
router.post('/oneWeek', async (req, res) => {
    try {
        const sensordaten = await Sensordaten.find(
            {
                '_id.sensorMac': req.body.sensorMac,
                '_id.timestamp':
                {
                    $gte: Date.now() - 604800000,
                    $lt: Date.now()
                }
            }
        );
        res.json(sensordaten);
    } catch (error) {
        res.json({ message: error });
    }
});

//Alle Sensordaten eines Geräts der letzten beliebigen Millisekunden
// 1 Stunde: 3600000
// 1 Tag: 86400000
// 1 Woche: 604800000
router.post('/ByMilliseconds', async (req, res) => {
    try {
        const sensordaten = await Sensordaten.find(
            {
                '_id.sensorMac': req.body.sensorMac,
                '_id.timestamp':
                {
                    $gte: Date.now() - req.body.ms,
                    $lt: Date.now()
                }
            }
        );
        res.json(sensordaten);
    } catch (error) {
        res.json({ message: error });
    }
});


//CREATE
//mehrere Sensordaten speichern
//Wenn Mac-Adresse unbekannt -> neues KG
router.post('/Save', async (req, res) => {
    const sensordaten = [];
    req.body.forEach(e =>
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
        await sensordaten.forEach(e =>
            e.save());
        sensordaten.forEach(e =>
            savedSensordaten.push(e));
        res.json(savedSensordaten);
    } catch (error) {
        res.json({ message: error });
    };
    req.body.forEach(async e => {
        try {
            const kuehlgeraet = await Kuehlgeraet.find({ _id: e.sensorMac });
            if (kuehlgeraet.length == 0) {
                await new Kuehlgeraet({
                    _id: e.sensorMac,
                    fridgeId: "",
                    name: "",
                    userId: e.userId,
                    crossGateId: e.crossGateId,
                    minTemp: 0,
                    maxTemp: 0,
                    minHum: 0,
                    maxHum: 0,
                }).save();
            }
        } catch (error) {
            console.log(error);
        }
    }
    )
});


//DELETE
//alle Sensordaten löschen
//NUR FÜR ENTWICKLERZWECKE
router.get('/DeleteAll', async (req, res) => {
    try {
        const sensordaten = await Sensordaten.deleteMany({});
        res.json(sensordaten);
    } catch (error) {
        res.json({ message: error });
    }
});

//Sensordaten eines Users löschen
router.post('/DeleteByUser', async (req, res) => {
    try {
        const sensordaten = await Sensordaten.deleteMany({userId: res.body.userId});
        res.json(sensordaten);
    } catch (error) {
        res.json({ message: error });
    }
});


module.exports = router;