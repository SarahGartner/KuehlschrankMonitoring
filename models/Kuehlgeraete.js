const mongoose = require('mongoose');


const KuehlgeraeteSchema = mongoose.Schema({
    _id: {
        type: String
    },
    kgId: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: false
    },
    userId: {
        type: Number,
        required: false
    },
    crossGateId: {
        type: Number,
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
    }
},{
    collection: 'fridges'
}
);

module.exports = mongoose.model('Kuehlgeraete', KuehlgeraeteSchema);