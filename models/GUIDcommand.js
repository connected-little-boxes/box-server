const mongoose = require('mongoose');

const GUIDcommandSchema = new mongoose.Schema(
    {
        guid: { 
            type: String,
            required: true
        },
        command: {
            type: String,
            required: true
        },
        pageURL: {
            type: String,
            required: true
        },
        pageQRcode: {
            type: String,
            required: true
        },
        devices: {
            type: [mongoose.Schema.Types.ObjectId],
            ref:'Device',
            required: true
        },
        lastPerformedDate: {
            type: Date,
            default: Date.now(),
            required: false
        },
        description: {
            type: String,
            default:undefined,
            required: false
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Owner',
            required: true
        }
    });

module.exports = mongoose.model('GUIDcommand', GUIDcommandSchema);

