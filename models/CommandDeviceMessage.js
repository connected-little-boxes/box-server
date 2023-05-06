const mongoose = require('mongoose');

const CommandDeviceMessageSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Owner',
            required: true
        },
        message: {
            type: String,
            default:""
        },
        device: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Device',
            required: false
        },
        name: {
            type: String,
            default:""
        },
        description: {
            type: String,
            default:""
        },
        command:{
            type: mongoose.Schema.Types.ObjectId,
            ref:'Command',
            required: false
        }
    });

module.exports = mongoose.model('CommandDeviceMessage', CommandDeviceMessageSchema);
