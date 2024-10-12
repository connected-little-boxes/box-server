const mongoose = require('mongoose');

const RFIDschema = new mongoose.Schema(
    {
        idString: {
            type: String,
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Owner',
            required: false
        },
        type:{
            type: String,
            default: "",
            required: true

        },
        payload:{
            type: String,
            default: "",
            required: false

        },
        lastSeenDate: {
            type: Date,
            default: Date.now(),
            required: true
        }
    });

module.exports = mongoose.model('RFIDcard', RFIDschema);
    
