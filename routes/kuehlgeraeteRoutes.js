const express = require('express');
const Sensordaten = require('../models/Sensordaten');
const Kuehlgeraet = require('../models/Kuehlgeraete');
const router = express.Router();


//READ
//Alle Kuehlgeraete aus der DB
router.get('/', async (req, res) => {
    try {
        const kuehlgeraete = await Kuehlgeraet.find();
        res.json(kuehlgeraete);
    } catch(error) {
        res.json({message: error});
    }
});

//1 Kuehlgeraet mit bestimmter Mac-Adresse aus der DB
router.post('/ByMacAddress', async (req, res) => {
    try {
        const kuehlgeraete = await Kuehlgeraet.find({_id: req.body.macAdresse});
        res.json(kuehlgeraete);
    } catch(error) {
        res.json({message: error});
    }
});

//alle Kuehlgeraet eines Users aus der DB
router.post('/ByUser', async (req, res) => {
    try {
        const kuehlgeraete = await Kuehlgeraet.find({userId: req.body.userId});
        res.json(kuehlgeraete);
    } catch(error) {
        res.json({message: error});
    }
});


//CREATE
//Kuehlgeraete speichern
router.post('/Save', async (req, res) => {
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