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
        required: false
    },
    crossGateId: {
        type: String,
        required: false
    },
    minTemperature: {
        type: mongoose.Schema.Types.Decimal128,
        required: false
    },
    maxTemperature: {
        type: mongoose.Schema.Types.Decimal128,
        required: false
    },
    minHumidity: {
        type: mongoose.Schema.Types.Decimal128,
        required: false
    },
    maxHumidity: {
        type: mongoose.Schema.Types.Decimal128,
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