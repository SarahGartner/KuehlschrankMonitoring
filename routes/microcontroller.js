const express = require('express');
const Sensordaten = require('../models/Sensordaten');
const router = express.Router();


router.get('/', (req, res) => {
    res.send('Routen für den Microcontroller :)');
});

router.post('/sensordaten', async (req, res) => {
    const sensordaten = new Sensordaten({
        _id: {
            gId: req.body.GId,
            zeitstempel: req.body.Zeitstempel
        },
        temperatur: req.body.Temperatur,
        luftfeuchtigkeit: req.body.Luftfeuchtigkeit,
        // fehlermeldungId: req.body.FehlermeldungId,
    });
    console.log(sensordaten);
    try {
        const savedSensordaten = await sensordaten.save();
        res.json(savedSensordaten);
        // console.log(savedSensordaten);
    } catch(error) {
        res.json({message: error});
    }
});


module.exports = router;