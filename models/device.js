const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        friendlyName: {
            type: String,
            required: false
        },
        processor: {
            type: String,
            required: true
        },
        version: {
            type: String,
            required: true
        },
        regDate: {
            type: Date,
            default: Date.now(),
            required: true
        },
        lastConnectedDate: {
            type: Date,
            default: Date.now(),
            required: true
        },
        lastCommand: {
            type: String,
            default:"none",
            required: true
        },
        lastResponseDate: {
            type: Date,
            default: Date.now(),
            required: true
        },
        lastResponse: {
            type: String,
            default:"none",
            required: true
        },
        processManagers: {
            type: [mongoose.Schema.Types.ObjectId],
            ref:'ProcessManager',
            default:[]
        },  
        bootCommands: {
            type: String,
            default:undefined,
            required: false
        },
        description: {
            type: String,
            default:undefined,
            required: false
        },
        tags: {
            type: String,
            default:undefined,
            required: false
        },
        sensors: {
            type: [String],
            default:undefined,
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Owner',
            required: false
        },
        location: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Location',
            required: false
        }
    });

module.exports = mongoose.model('Device', deviceSchema);

