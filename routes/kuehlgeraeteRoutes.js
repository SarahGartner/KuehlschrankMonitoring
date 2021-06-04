const express = require('express');
const Kuehlgeraet = require('../models/Kuehlgeraete');
const User = require('../models/User');
const router = express.Router();


//READ
//Alle Kuehlgeraete aus der DB
router.get('/', async (req, res) => {
    try {
        const kuehlgeraete = await Kuehlgeraet.find();
        res.json(kuehlgeraete);
    } catch (error) {
        res.json({ message: error });
    }
});

//1 Kuehlgeraet mit bestimmter Mac-Adresse aus der DB
router.get('/ByMac', async (req, res) => {
    try {
        const kuehlgeraete = await Kuehlgeraet.find({ _id: req.query._id });
        res.json(kuehlgeraete);
    } catch (error) {
        res.json({ message: error });
    }
});

//alle Kuehlgeraet eines Users aus der DB
router.get('/ByUser', async (req, res) => {
    try {
        const kuehlgeraete = await Kuehlgeraet.find({ userId: req.query.userId });
        res.json(kuehlgeraete);
    } catch (error) {
        res.json({ message: error });
    }
});


//CREATE
//Kuehlgeraete speichern
router.post('/Save', async (req, res) => {
    const kuehlgeraet = new Kuehlgeraet({
        _id: req.body.sensorMac,
        fridgeId: req.body.fridgeId,
        name: req.body.name,
        userId: req.body.userId,
        crossGateId: req.body.crossGateId,
        minTemperature: req.body.minTemperature,
        maxTemperature: req.body.maxTemperature,
        minHumidity: req.body.minHumidity,
        maxHumidity: req.body.maxHumidity,
        tempOK: true,
        humOK: true
    });
    try {
        const savedKuehlgeraet = await kuehlgeraet.save();
        res.json(savedKuehlgeraet);
    } catch (error) {
        res.json({ message: error });
    }
});

//UPDATE
//Kuehlgeraete updaten
router.post('/Update', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.query.userId });
        if (user.token != "" && user.token == req.query.token) {
            const kuehlgeraet = await Kuehlgeraet.findOne({ _id: req.body._id });
            if (kuehlgeraet.userId == user._id) {
                const kuehlgeraete = await Kuehlgeraet.findOneAndUpdate({ _id: req.body._id }, {
                    name: req.body.name,
                    minTemperature: req.body.minTemperature,
                    maxTemperature: req.body.maxTemperature,
                    minHumidity: req.body.minHumidity,
                    maxHumidity: req.body.maxHumidity,
                    fridgeId: req.body.fridgeId
                });
                kuehlgeraete.name= req.body.name;
                kuehlgeraete.minTemperature= req.body.minTemperature;
                kuehlgeraete.maxTemperature= req.body.maxTemperature;
                kuehlgeraete.minHumidity= req.body.minHumidity;
                kuehlgeraete.maxHumidity= req.body.maxHumidity;
                kuehlgeraete.fridgeId= req.body.fridgeId;
                res.json(kuehlgeraete);
            } else {
                res.status(403);
                res.json('Wrong User');
            }
        } else {
            res.status(403);
            res.json('Not logged in');
        }
    } catch (error) {
        res.json({ message: error });
    }
});

//Delete
//alle Kuehlgeraete löschen
//NUR FÜR ENTWICKLERZWECKE
router.get('/DeleteAll', async (req, res) => {
    try {
        const kuehlgeraete = await Kuehlgeraet.deleteMany({});
        res.json(kuehlgeraete);
    } catch (error) {
        res.json({ message: error });
    }
});

//alle Kuehlgeraete eines Users löschen
router.post('/DeleteByUser', async (req, res) => {
    try {
        const kuehlgeraete = await Kuehlgeraet.deleteMany({ userId: req.body.userId });
        res.json(kuehlgeraete);
    } catch (error) {
        res.json({ message: error });
    }
});

//Kühlgerät nach Id löschen
router.get('/DeleteById', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.query.userId });
        if (user.token != "" && user.token == req.query.token) {
            const kuehlgeraet = await Kuehlgeraet.findOne({ _id: req.query._id });
            if (kuehlgeraet.userId == user._id) {
                await Kuehlgeraet.deleteOne({ _id: req.query._id });
                res.json("Deleted: " + kuehlgeraet._id);
            } else {
                res.status(403);
                res.json('Wrong User');
            }
        } else {
            res.status(403);
            res.json('Not logged in');
        }
    } catch (error) {
        res.json({ message: error });
    }
});


module.exports = router;