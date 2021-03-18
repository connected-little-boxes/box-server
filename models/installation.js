const mongoose = require('mongoose');

const installationSchema = new mongoose.Schema(
    {
        version: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        printerDestinations: {
            type: [String],
            default:undefined,
            required: true
        },
        displayDestinations: {
            type: [String],
            default:undefined,
            required: true
        },
        managers: {
            type: [mongoose.Schema.Types.ObjectId],
            ref:'Manager',
            default:undefined,
            required: true
        },
        location: {
            type: [String],
            required: false
        }
    });

module.exports = mongoose.model('Installation', installationSchema);

