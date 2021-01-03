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
    } catch(error) {
        res.json({message: error});
    }
});


//Alle Sensordaten eines Geräts
router.post('/ByGId', async (req, res) => {
    try {
        const sensordaten = await Sensordaten.find({'_id.gId': req.body.GId});
        res.json(sensordaten);
    } catch(error) {
        res.json({message: error});
    }
});

//Alle Sensordaten eines Geräts zwischen 2 Zeitstempel
router.post('/ByTimestamps', async (req, res) => {
    try {
        const sensordaten = await Sensordaten.find(
            {
                '_id.gId': req.body.GId,
                '_id.zeitstempel' : 
                    {$gte: req.body.gte, 
                    $lt: req.body.lt
                }
            }
        );
        res.json(sensordaten);
    } catch(error) {
        res.json({message: error});
    }
});

//Alle Sensordaten eines Geräts der letzten 7 Tage
router.post('/oneWeek', async (req, res) => {
    try {
        const sensordaten = await Sensordaten.find(
            {
                '_id.gId': req.body.GId,
                '_id.zeitstempel' : 
                    {$gte: Date.now() - 604800000, 
                    $lt: Date.now()
                }
            }
        );
        res.json(sensordaten);
    } catch(error) {
        res.json({message: error});
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
                '_id.gId': req.body.GId,
                '_id.zeitstempel' : 
                    {$gte: Date.now() - req.body.ms, 
                    $lt: Date.now()
                }
            }
        );
        res.json(sensordaten);
    } catch(error) {
        res.json({message: error});
    }
});


//CREATE
//mehrere Sensordaten speichern
router.post('/Save', async (req, res) => {
    const sensordaten = [];
    req.body.Daten.forEach(e => 
        sensordaten.push(
            new Sensordaten({
            _id: {
                gId: e.GId,
                zeitstempel: e.Zeitstempel
            },
            temperatur: e.Temperatur,
            luftfeuchtigkeit: e.Luftfeuchtigkeit,
        })));
    try {
        const savedSensordaten = [];
        await sensordaten.forEach(e => 
            e.save());
        sensordaten.forEach(e => 
            savedSensordaten.push(e));
        res.json(savedSensordaten);
        console.log(savedSensordaten);
    } catch(error) {
        res.json({message: error});
        console.log(error);
    }
});


module.exports = router;