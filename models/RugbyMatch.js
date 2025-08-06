const mongoose = require('mongoose');

const RugbyMatchSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default:""
        },
        guid: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default:""
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Owner',
            required: true
        },
        resetCode: {
            type: String,
            default:""
        },
        players: {
            type: [String],
            ref:'rugbyPlayerGUID',
            default:[]
        }
    });

module.exports = mongoose.model('rugbyMatch', RugbyMatchSchema);

