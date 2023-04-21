const mongoose = require('mongoose');

const CommandGroupSchema = new mongoose.Schema(
    {
        guid: {
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
        commands: {
            type: [mongoose.Schema.Types.ObjectId],
            ref:'Command',
            default:[]
        },
        lastPerformedDate: {
            type: Date,
            default: Date.now(),
            required: false
        },
        name: {
            type: String,
            default:"",
            required: false
        },
        description: {
            type: String,
            default:"",
            required: false
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Owner',
            required: true
        }
    });

module.exports = mongoose.model('CommandGroup', CommandGroupSchema);

