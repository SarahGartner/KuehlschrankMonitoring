const mongoose = require('mongoose');


const KuehlgeraeteSchema = mongoose.Schema({
    _id: {
        type: String
    },
    fridgeId: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: false
    },
    userId: {
        type: String,
        required: true
    },
    crossGateId: {
        type: String,
        required: false
    },
    minTemperature: {
        type: Number,
        required: false
    },
    maxTemperature: {
        type: Number,
        required: false
    },
    minHumidity: {
        type: Number,
        required: false
    },
    maxHumidity: {
        type: Number,
        required: false
    },
    tempOK: {
        type: Boolean,
        required: true,
        default: true
    },
    humOK: {
        type: Boolean,
        required: true,
        default: true
    },
    intervalOK: {
        type: Boolean,
        required: true,
        default: true
    }
},{
    collection: 'fridges'
}
);

module.exports = mongoose.model('Kuehlgeraete', KuehlgeraeteSchema);