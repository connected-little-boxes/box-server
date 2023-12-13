const mongoose = require('mongoose');

const RugbyMatchSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default:""
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
        devices: {
            type: [mongoose.Schema.Types.ObjectId],
            ref:'Device',
            default:[]
        }
    });

module.exports = mongoose.model('rugbyMatch', RugbyMatchSchema);

