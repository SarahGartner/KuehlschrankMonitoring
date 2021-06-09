const express = require('express');
const User = require('../models/User');
var uuid = require('uuid');
const { updateOne } = require('../models/User');
const router = express.Router();

//READ
//Alle User aus der DB
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        // const resUsers = new Array();
        users.forEach(user => {
            user.password = undefined;
            user.token = undefined;
        });
        res.json(users);
    } catch (error) {
        res.json({ message: error });
    }
});

//User per _id
router.get('/ById', async (req, res) => {
    try {
        const user = await User.findOne({ '_id': req.query.userId });
        const resUser = new User({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            phonenumber: user.phonenumber,
            email: user.email,
            telegramId: req.body.telegramId,
        });
        res.json(resUser);
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
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phonenumber: req.body.phoneNumber,
        email: req.body.email,
        telegramId: req.body.telegramId,
        token: ''
    });
    try {
        const savedUser = await user.save();
        res.json(savedUser);
        //Muss irgendwie auf client aus app.js zugreifen
        // var mqtt = require('mqtt');
        // client = mqtt.connect('mqtt://test.mosquitto.org');
        // const client = require('./app.js')
        // client.subscribe(req.body.userId + '/#', function (err) {
        //     if (!err) {
        //     }
        // });
    } catch (error) {
        res.json({ message: error });
        console.log(error);
    };
});

//UPDATE
//Login
router.get('/Login', async (req, res) => {
    try {
        const user = await User.findOne({ '_id': req.query.userId });
        if (user.password == req.query.password) {
            const token = uuid.v1();
            await User.updateOne({ _id: user._id }, { token: token })
            const resUser = new User({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                phonenumber: user.phonenumber,
                email: user.email,
                token: token
            });
            res.json(resUser);
        } else {
            res.status(403);
            res.json('Wrong Password');
        }
    } catch (error) {
        res.json({ message: error });
    }
});

//Change Password
router.get('/ChangePassword', async (req, res) => {
    try {
        const user = await User.findOne({ '_id': req.query.userId });
        if(req.query.oldPassword == user.password){
            await User.updateOne({ _id: user._id }, { password: req.query.newPassword })
            res.json("Changed Password");
        } else {
            res.status(403);
            res.json('Wrong Password');
        }
    } catch (error) {
        res.json({ message: error });
    }
});

//Update User
router.post('/Update', async (req, res) => {
    try {
        const user = await User.findOne({ '_id': req.query.userId });
        if (user.token != "" && user.token == req.query.token) {
            const newUser = await User.findOneAndUpdate({ _id: req.query.userId }, {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                phoneNumber: req.body.phoneNumber
            })
            newUser.firstName = req.body.firstName;
            newUser.lastName = req.body.lastName;
            newUser.email = req.body.email;
            newUser.phoneNumber = req.body.phoneNumber;
            res.json(newUser);
        } else {
            res.status(403);
            res.json('Wrong Password');
        }
    } catch (error) {
        res.json({ message: error });
    }
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