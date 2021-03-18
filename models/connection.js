const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(
{
    device: {
        type: String,
        required: true
    },
    date:
    {
        type: Date,
        required: true
    },
    reset:
    {
        type: String,
        required: true
    },
    resetCode:
    {
        type:Number,
        required: true
    },
    cpu:
    {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Connection', connectionSchema);

