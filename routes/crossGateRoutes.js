const express = require('express');
// const Kuehlgeraet = require('../models/Kuehlgeraete');
// const User = require('../models/User');
const CrossGate = require('../models/CrossGate');
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

module.exports = router;