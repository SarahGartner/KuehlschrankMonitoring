const mongoose = require('mongoose');

const CrossGateSchema = mongoose.Schema({
    _id: {
        type: String
    },
    name: {
        type: String,
        required: false
    },
    gps: {
        type: Boolean
    },
    userId: {
        type: String
    }
},{
    collection: 'crossgates'
}
);

module.exports = mongoose.model('CrossGate', CrossGateSchema);