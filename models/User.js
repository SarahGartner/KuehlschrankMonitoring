const mongoose = require('mongoose');


const UserSchema = mongoose.Schema({
    _id: {
        type: String
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    vorname: {
        type: String,
        required: true
    },
    nachname: {
        type: String,
        required: true
    },
    telefonnummer: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    firma: {
        type: String,
        required: false
    }
},{
    collection: 'User'
}
);

module.exports = mongoose.model('User', UserSchema);