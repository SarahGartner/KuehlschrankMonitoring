const express = require('express');
require('dotenv/config');
const Kuehlgeraet = require('../models/Kuehlgeraete');
const User = require('../models/User');
const CrossGate = require('../models/CrossGate');
var mqtt = require('mqtt');
const router = express.Router();

//READ
router.get('/', async (req, res) => {
    try {
        const crossGates = await CrossGate.find();
        res.json(crossGates);
    } catch (error) {
        res.json({ message: error });
    }
});

router.get('/ByUser', async (req, res) => {
    try {
        const crossGates = await CrossGate.find(({ userId: req.query.userId }));
        res.json(crossGates);
    } catch (error) {
        res.json({ message: error });
    }
});


//CREATE
router.post('/Save', async (req, res) => {
    const crossGate = new CrossGate({
        _id: req.body.crossGateId,
        name: req.body.name,
        gps: req.body.gps,
        userId: req.body.userId
    });
    try {
        await crossGate.save();
        res.json(crossGate);
    } catch (error) {
        res.json({ message: error });
        console.log(error);
    };
});


//Update (fridge)
//Add Fridge
router.get('/AddFridge', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.query.userId });
        if (user.token != "" && user.token == req.query.token) {
            const kuehlgeraet = await Kuehlgeraet.findOne({ _id: req.query.fridgeId });
            var client = mqtt.connect(process.env.MQTTBROKER);
            var topic = req.query.userId + "/" + req.query.crossGateId + '/addTag'
            client.publish(topic, JSON.stringify({
                "tag": req.query.fridgeId
            }))
            res.json('updated');
        } else {
            res.status(403);
            res.json('Not logged in');
        }
    } catch (error) {
        res.json({ message: error });
    }
});

module.exports = router;