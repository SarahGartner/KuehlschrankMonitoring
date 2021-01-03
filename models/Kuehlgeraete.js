const mongoose = require('mongoose');


const KuehlgeraeteSchema = mongoose.Schema({
    //mac-adresse?
    _id: {
        type: String
    },
    name: {
        type: String,
        required: true
    },
    userId: {
        type: Number,
        required: true
    },
    sendeInterval: {
        type: Number,
        required: true,
        default: 300000
    },
    minTemperatur: {
        type: mongoose.Schema.Types.Decimal128,
        required: false
    },
    maxTemperatur: {
        type: mongoose.Schema.Types.Decimal128,
        required: false
    },
    minLuftfeuchtigkeit: {
        type: mongoose.Schema.Types.Decimal128,
        required: false
    },
    maxLuftfeuchtigkeit: {
        type: mongoose.Schema.Types.Decimal128,
        required: false
    }
},{
    collection: 'Kuehlgeraete'
}
);

module.exports = mongoose.model('Kuehlgeraete', KuehlgeraeteSchema);