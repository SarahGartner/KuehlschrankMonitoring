const mongoose = require('mongoose');


const SensordatenSchema = mongoose.Schema({
    _id: {
        gId: {
            type: Number,
            required: true
        },
        zeitstempel: {
            type: Date,
            required: true,
            default: Date.now
        }
    },
    temperatur: {
        type: mongoose.Schema.Types.Decimal128,
        required: false
    },
    luftfeuchtigkeit: {
        type: mongoose.Schema.Types.Decimal128,
        required: false
    },
    fehlermeldungId: {
        type: Number,
        required: false
    }
},{
    collection: 'Sensordaten'
}
);

module.exports = mongoose.model('Sensordaten', SensordatenSchema);