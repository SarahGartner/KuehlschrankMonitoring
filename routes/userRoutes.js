const express = require('express');
const User = require('../models/User');
const router = express.Router();
var mqtt = require('mqtt');

//READ
//Alle User aus der DB
router.get('/', async (req, res) => {
    try {
        const user = await User.find();
        res.json(user);
    } catch (error) {
        res.json({ message: error });
    }
});

//User per _id
router.post('/ById', async (req, res) => {
    try {
        const user = await User.find({ '_id': req.body.userId });
        res.json(user);
    } catch (error) {
        res.json({ message: error });
    }
});

//User per telegramId
router.post('/TelegramId', async (req, res) => {
    try {
        const user = await User.find({ 'telegramId': req.body.telegramId });
        res.json(user);
    } catch (error) {
        res.json({ message: error });
    }
});


//CREATE
//User speichern
router.post('/Save', async (req, res) => {
    const user = new User({
        _id: req.body.userId,
        password: req.body.password,
        firstName: req.body.firstname,
        lastName: req.body.lastname,
        phonenumber: req.body.phonenumber,
        email: req.body.email,
        telegramId: req.body.telegramId,
    });
    try {
        const savedUser = await user.save();
        res.json(savedUser);
        client.subscribe(savedUser['_id'] + '/#', function (err) {
            if (!err) {
            }
        });
    } catch (error) {
        res.json({ message: error });
        console.log(error);
    };
});

module.exports = router;

//DELETE
//Kühlgerät nach Id löschen
router.post('/DeleteById', async (req, res) => {
    try {
        const user = await User.deleteMany({ _id: req.body._id });
        res.json(user);
    } catch (error) {
        res.json({ message: error });
    }
});