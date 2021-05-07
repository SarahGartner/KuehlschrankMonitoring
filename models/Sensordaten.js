const mongoose = require('mongoose');


const SensordatenSchema = mongoose.Schema({
    _id: {
        sensorMac: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            required: true,
            default: Date.now
        }
    },
    temperature: {
        type: Number,
        required: false
    },
    humidity: {
        type: Number,
        required: false
    },
    userId: {
        type: String
    },
    crossGateId: {
        type: String
    },
},{
    collection: 'Sensordata'
}
);

module.exports = mongoose.model('Sensordaten', SensordatenSchema);