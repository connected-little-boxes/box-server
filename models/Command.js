const mongoose = require('mongoose');

const CommandSchema = new mongoose.Schema(
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
        messages: {
            type: [mongoose.Schema.Types.ObjectId],
            ref:'CommandDeviceMessage',
            default:[]
        }
    });

module.exports = mongoose.model('Command', CommandSchema);

