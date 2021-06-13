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
    longitude: {
        type: Number
    },
    latitude: {
        type: Number
    },
    battery: {
        type: Number
    },
    rssi: {
        type: String
    },
    speed: {
        type: Number
    },
    altitude: {
        type: Number
    }
},{
    collection: 'Sensordata'
}
);

module.exports = mongoose.model('Sensordaten', SensordatenSchema);