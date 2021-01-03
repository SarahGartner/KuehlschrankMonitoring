const express = require('express');
const Sensordaten = require('../models/Sensordaten');
const Kuehlgeraet = require('../models/Kuehlgeraete');
const router = express.Router();


router.get('/', (req, res) => {
    res.send('Routen für die Webapp :)');
});

//Alle Sensordaten aus der DB
router.get('/alleSensordaten', async (req, res) => {
    try {
        const sensordaten = await Sensordaten.find();
        res.json(sensordaten);
    } catch(error) {
        res.json({message: error});
    }
});

//Alle Sensordaten eines Geräts
router.post('/sensordatenProId', async (req, res) => {
    try {
        const sensordaten = await Sensordaten.find({'_id.gId': req.body.GId});
        res.json(sensordaten);
    } catch(error) {
        res.json({message: error});
    }
});

//Alle Sensordaten eines Geräts zwischen 2 Zeitstempel
router.post('/sensordatenProIdZwischenZeitstempel', async (req, res) => {
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
router.post('/sensordatenProId1Woche', async (req, res) => {
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
router.post('/sensordatenProIdMillisekunden', async (req, res) => {
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

//Alle Kuehlgeraete aus der DB
router.get('/alleKuehlgeraete', async (req, res) => {
    try {
        const kuehlgeraete = await Kuehlgeraet.find();
        res.json(kuehlgeraete);
    } catch(error) {
        res.json({message: error});
    }
});

module.exports = router;