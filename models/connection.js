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
    resetCode:
    {
        type:Number,
        required: true
    },
});

module.exports = mongoose.model('Connection', connectionSchema);

