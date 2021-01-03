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
    password: {
        type: String,
        required: true,
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
    company: {
        type: String,
        required: false
    },
    companyId: {
        type: String,
        required: false
    }
},{
    collection: 'User'
}
);

module.exports = mongoose.model('User', UserSchema);