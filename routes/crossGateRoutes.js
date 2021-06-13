const express = require('express');
require('dotenv/config');
const Kuehlgeraet = require('../models/Kuehlgeraete');
const User = require('../models/User');
const CrossGate = require('../models/CrossGate');
var mqtt = require('mqtt');
const Kuehlgeraete = require('../models/Kuehlgeraete');
const router = express.Router();

var options = {
    username: process.env.MQTTUSER,
    password: process.env.MQTTPW,
    port: process.env.MQTTPORT
};
var client = mqtt.connect(process.env.MQTTBROKER, options);

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
            var topic = req.query.userId + "/" + req.query.crossGateId + '/addTag';
            client.publish(topic, req.query.fridgeId);
            res.json('updated');
        } else {
            res.status(403);
            res.json('Not logged in');
        }
    } catch (error) {
        res.json({ message: error });
    }
});

//Delete Fridge
router.get('/DeleteFridge', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.query.userId });
        if (user.token != "" && user.token == req.query.token) {
            var topic = req.query.userId + "/" + req.query.crossGateId + '/deleteTag';
            client.publish(topic, req.query.fridgeId);
            res.json('updated');
        } else {
            res.status(403);
            res.json('Not logged in');
        }
    } catch (error) {
        res.json({ message: error });
    }
});

//Activate/Deaktivate GPS
router.get('/toggleGPS', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.query.userId });
        if (user.token != "" && user.token == req.query.token) {
            var topic = req.query.userId + "/" + req.query.crossGateId + '/activateGPS';
            client.publish(topic, req.query.activate);
            (req.query.activate == 'true' || req.query.activate == 'True') ? res.json('activated') : res.json('deactivated');
        } else {
            res.status(403);
            res.json('Not logged in');
        }
    } catch (error) {
        res.json({ message: error });
    }
});

// // Delete Fridge
// router.get('/DeleteAllFridges', async (req, res) => {
//     try {
//         const user = await User.findOne({ _id: req.query.userId });
//         if (user.token != "" && user.token == req.query.token) {
//             var json = "{}";
//             var client = mqtt.connect(process.env.MQTTBROKER);
//             var topic = req.query.userId + "/" + req.query.crossGateId + '/deleteAllTags'
//             client.publish(topic, json);
//             res.json('updated');
//         } else {
//             res.status(403);
//             res.json('Not logged in');
//         }
//     } catch (error) {
//         res.json({ message: error });
//     }
// });

// Delete Fridge
// router.get('/DeleteAllFridges', async (req, res) => {
//     try {
//         const user = await User.findOne({ _id: req.query.userId });
//         if (user.token != "" && user.token == req.query.token) {
//             const kuehlgeraete = await Kuehlgeraete.find({ 'crossGateId' : req.query.crossGateId});
//             console.log(kuehlgeraete);
//             var json = "{";
//             kuehlgeraete.forEach(kg => {
//                 if(json == "{")
//                     json = json + '"tag": "' + kg['_id'] + '"'
//                 else
//                     json = json + '"tag": "' + kg['_id'] + '" ,'
//             });
//             json = json + "}"
//             var client = mqtt.connect(process.env.MQTTBROKER);
//             var topic = req.query.userId + "/" + req.query.crossGateId + '/deleteAllTags'
//             client.publish(topic, json);
//             res.json('updated');
//         } else {
//             res.status(403);
//             res.json('Not logged in');
//         }
//     } catch (error) {
//         console.log(error);
//         res.json({ message: error });
//     }
// });

module.exports = router;