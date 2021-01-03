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
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },
    minTemperatur: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
    },
    maxTemperatur: {
        type: mongoose.Schema.Types.Decimal128,
        required: true
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