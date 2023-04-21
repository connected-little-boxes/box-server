const mongoose = require('mongoose');

const CommandDeviceMessageSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Owner',
            required: true
        },
        guid: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        device: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Device',
            required: false
        },
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        commandGUID:{
            type: String,
            required: true
        }
    });

module.exports = mongoose.model('CommandDeviceMessage', CommandDeviceMessageSchema);
