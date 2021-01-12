const mongoose = require('mongoose');

// mongoose.set('useCreateIndex', true);

const UserSchema = mongoose.Schema({
    _id: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    phonenumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    telegramId: {
        type: Number,
        required: false
    }
},{
    collection: 'users'
}
);

module.exports = mongoose.model('User', UserSchema);