const express = require('express');
const Sensordaten = require('../models/Sensordaten');
const Kuehlgeraet = require('../models/Kuehlgeraete');
const router = express.Router();


router.get('/', (req, res) => {
    res.send('Routen für den Microcontroller :)');
});

// //einzelne Sensordaten speichern
// router.post('/sensordatenEinzeln', async (req, res) => {
//     const sensordaten = new Sensordaten({
//         _id: {
//             gId: req.body.GId,
//             zeitstempel: req.body.Zeitstempel
//         },
//         temperatur: req.body.Temperatur,
//         luftfeuchtigkeit: req.body.Luftfeuchtigkeit,
//         // fehlermeldungId: req.body.FehlermeldungId,
//     });
//     console.log(sensordaten);
//     try {
//         const savedSensordaten = await sensordaten.save();
//         res.json(savedSensordaten);
//     } catch(error) {
//         res.json({message: error});
//     }
// });

//mehrere Sensordaten speichern
router.post('/sensordaten', async (req, res) => {
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

//Kuehlgeraete speichern
router.post('/kuehlgeraet', async (req, res) => {
    const kuehlgeraet = new Kuehlgeraet({
        _id: req.body.macAdresse,
        name: req.body.name,
        userId: req.body.userId,
        sendeInterval: req.body.sendeInterval,
        minTemperatur: req.body.minTemp,
        maxTemperatur: req.body.maxTemp,
        minLuftfeuchtigkeit: req.body.minLF,
        maxLuftfeuchtigkeit: req.body.maxLF,
    });
    console.log(kuehlgeraet);
    try {
        const savedKuehlgeraet = await kuehlgeraet.save();
        res.json(savedKuehlgeraet);
    } catch(error) {
        console.log(error);
        res.json({message: error});
    }
});

module.exports = router;