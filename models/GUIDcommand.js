const mongoose = require('mongoose');

const GUIDcommandSchema = new mongoose.Schema(
    {
        guid: {
            type: String,
            required: true
        },
        friendlyName: {
            type: String,
            required: false
        },
        command: {
            type: String,
            required: true
        },
        pageURL: {
            type: String,
            required: true
        },
        device: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Device',
            required: true
        },
        lastPerformedDate: {
            type: Date,
            default: Date.now(),
            required: true
        },
        description: {
            type: String,
            default:undefined,
            required: false
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Owner',
            required: false
        }
    });

module.exports = mongoose.model('GUIDcommandSchema', GUIDcommandSchema);

