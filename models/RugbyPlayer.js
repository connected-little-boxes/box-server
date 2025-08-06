const mongoose = require('mongoose');

const RugbyPlayerSchema = new mongoose.Schema(
    {
        guid: {
            type: String,
            required: false
        },
        deviceGuid: {
            type: String,
            required: false
        },
        matchGuid: {
            type: String,
            required: false
        },
        teamName: {
            type: String,
            required: false
        },
        trackingCode: {
            type: String,
            default:""
        }
    });

module.exports = mongoose.model('rugbyPlayer', RugbyPlayerSchema);