

const mongoose = require('mongoose');

const processManagerCommandItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        desc: {
            type: String,
            required: true
        },
        version: {
            type: String,
            required: true
        },
        optional: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        processCommand: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'ProcessManagerCommand',
            required: true
        }
    }
);

const processManagerCommandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        version: {
            type: String,
            required: true
        },
        desc: {
            type: String,
            required: true
        },
        processManager: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'ProcessManager',
            required: true
        }
    }
);

const processManagerMessageItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        },
        processManagerMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'ProcessManagerMessage',
            required: true
        }
    }
);

const processManagerMessageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        desc: {
            type: String,
            default: ""
        },
        processManager: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'ProcessManager',
            required: true
        }
    }
);

const processManagerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        desc: {
            type: String,
            default: ""
        }
    }
);

let ProcessManagerCommandItems= mongoose.model('ProcessManagerCommandItem', processManagerCommandItemSchema);
let ProcessManagerCommands= mongoose.model('ProcessManagerCommands', processManagerCommandSchema);
let ProcessManagerMessageItems=mongoose.model('ProcessManagerMessageItem', processManagerMessageItemSchema);
let ProcessManagerMessages= mongoose.model('ProcessManagerMessages', processManagerMessageSchema);
let ProcessManagers= mongoose.model('ProcessManagers', processManagerSchema);

module.exports = {
    ProcessManagerCommandItems,
    ProcessManagerCommands,
    ProcessManagerMessageItems,
    ProcessManagerMessages,
    ProcessManagers
 };