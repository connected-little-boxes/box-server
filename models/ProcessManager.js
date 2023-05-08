const mongoose = require('mongoose');

const commandItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        desc: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        }
    }
)

const commandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ""
        },
        items:
        {
            type: [commandItemSchema],
            default:[]
        }
    });

const processManagerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ""
        },
        configJS : {
            type: String,
            required: true
        },
        commands: {
            type: [commandSchema],
            required: true
        }
    }
);

module.exports = mongoose.model('ProcessManager', processManagerSchema);