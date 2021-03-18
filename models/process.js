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
        desc: {
            type: String,
            required: true
        },
        items:
        {
            type: [commandItemSchema],
            required: true
        }
    });

const processSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        commands: {
            type: [commandSchema],
            required: true
        }
    }
);

module.exports = mongoose.model('Process', processSchema);