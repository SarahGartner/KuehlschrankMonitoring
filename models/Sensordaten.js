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
        type: mongoose.Schema.Types.Decimal128,
        required: false
    },
    humidity: {
        type: mongoose.Schema.Types.Decimal128,
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