const Device = require('../models/device');
const express = require('express');
const router = express.Router();
const Command = require('../models/Command');
const CommandGroup = require('../models/CommandGroup');
const Manager = require('../manager');
const authenticateToken = require('../_helpers/authenticateToken');
const messageDisplay = require('../_helpers/messageDisplay');
const qrcode = require('qrcode');
const Uuid = require('uuid');
const CommandDeviceMessage = require('../models/CommandDeviceMessage');

function generateQRCode(data) {
    return new Promise((kept, broken) => {
        qrcode.toDataURL(data, function (err, url) {
            if (err) {
                broken(err);
            }
            else {
                kept(url);
            }
        });
    });
}

async function saveCommandGroup(owner_id) {

    const uuid = Uuid.v4();

    let url = process.env.HOST_ADDRESS + "command/" + uuid;

    let qrCode = await generateQRCode(url);

    let newCommandGroup = new CommandGroup({
        guid: uuid,
        pageURL: url,
        pageQRcode: qrCode,
        owner: owner_id
    });

    await newCommandGroup.save();
    return newCommandGroup;
}

async function buildCommandDescription(commandGroup) {
    let commands = [];

    for (let i = 0; i < commandGroup.commands.length; i++) {
        let commandGUID = commandGroup.commands[i];
        let command = await Command.findOne(
            { guid: commandGUID }
        );
        let commandDetails = {
            guid: command.guid,
            name: command.name,
            description: command.description
        };
        commands.push(commandDetails);
    };

    return commands;
}

async function buildCommandMessageDescription(command) {
    let messageDescriptions = [];

    for (let i = 0; i < command.messages.length; i++) {
        let messageGUID = command.messages[i];
        let message = await CommandDeviceMessage.findOne(
            { guid: messageGUID }
        );
        let device = await Device.findOne(
            { guid: message.device }
        );
        let messageDetails = {
            guid: message.guid,
            name: message.name,
            description: message.description,
            message: message.message,
            deviceName: device.name,
            deviceFriendlyName: device.friendlyName
        };
        messageDescriptions.push(messageDetails);
    };

    return messageDescriptions;
}

router.get('/commandGroupSelect', authenticateToken, async function (req, res) {

    // find all the groups owned by this user
    let commandGroups = await CommandGroup.find({ owner: res.user._id });

    res.render("commandGroupSelect.ejs", { username: res.user.name, commandGroups: commandGroups });
});

router.get('/commandGroupEdit/:commandGroupID', authenticateToken, async function (req, res) {

    let commandGroupID = req.params.commandGroupID;

    let commandGroup = await CommandGroup.findOne(
        { guid: commandGroupID }
    );

    let commands = await buildCommandDescription(commandGroup);

    res.render("commandGroupEdit.ejs", { commandGroup: commandGroup, commands: commands });
});

router.post('/commandGroupEdit/:commandGroupGUID', authenticateToken, async function (req, res) {
    let owner_id = res.user._id;

    let commandGroupGUID = req.params.commandGroupGUID;

    await CommandGroup.updateOne(
        { guid: commandGroupGUID },
        {
            description: req.body.description,
            name: req.body.name
        }
    );

    res.redirect("/command/commandGroupSelect/");
});

router.get('/commandGroupDeleteConfirm/:commandGroupGUID', authenticateToken, async function (req, res) {

    let commandGroupGUID = req.params.commandGroupGUID;

    let commandGroup = await CommandGroup.findOne(
        { guid: commandGroupGUID }
    );

    res.render("commandGroupDeleteConfirm.ejs", { commandGroup: commandGroup, commandGroupGUID: commandGroupGUID });
});

router.get('/commandGroupDelete/:commandGroupGUID', async function (req, res) {

    let GUIDcommandGroupID = req.params.commandGroupGUID;

    try {

        const result = await CommandGroup.deleteOne(
            { guid: GUIDcommandGroupID }
        );
        if (result.deletedCount == 1) {
            message = "Deleted OK";
        }
        else {
            message = "Delete operation failed";
        }
    }
    catch (error) {
        message = "Delete failed:${error}";
    }

    messageDisplay(
        "Command group delete",
        message,
        [
            { description: "Continue", route: "/command/commandGroupSelect/" }
        ],
        res
    );
});

router.get('/commandDeleteConfirm/:commandGUID/:commandGroupGUID', async function (req, res) {

    let commandGUID = req.params.commandGUID;
    let commandGroupGUID = req.params.commandGroupGUID;

    let command = await Command.findOne(
        { guid: commandGUID }
    );

    res.render("commandDeleteConfirm.ejs", { command: command, commandGroupGUID: commandGroupGUID });
});

router.get('/commandDelete/:commandGUID/:commandGroupGUID', async function (req, res) {

    let commandGUID = req.params.commandGUID;
    let commandGroupGUID = req.params.commandGroupGUID;

    // remove from the commands in the command group

    let commandGroup = await CommandGroup.findOne(
        { guid: commandGroupGUID }
    );

    let index = commandGroup.commands.indexOf(commandGUID);

    if (index >= 0) {
        commandGroup.commands.splice(index, 1);
        await commandGroup.save();
    }

    // remove from the list of commands
    await Command.deleteOne(
        { guid: commandGUID }
    );

    res.redirect("/command/commandGroupEdit/" + commandGroupGUID);
});

router.get('/commandGroupDetailsEdit/:commandGroupGUID', async function (req, res) {

    let commandGroupGUID = req.params.commandGroupGUID;

    // remove from the commands in the command group

    let commandGroup = await CommandGroup.findOne(
        { guid: commandGroupGUID }
    );

    res.render("commandGroupDetailsEdit.ejs", { commandGroup: commandGroup });
});

router.post('/commandGroupDetailsEdit/:commandGroupGUID', async function (req, res) {

    let commandGroupGUID = req.params.commandGroupGUID;

    await CommandGroup.updateOne(
        { guid: commandGroupGUID },
        {
            name: req.body.name,
            description: req.body.description
        }
    );

    res.redirect("/command/commandGroupEdit/" + commandGroupGUID);
});

router.get('/commandGroupNew', authenticateToken, async function (req, res) {
    res.render("commandGroupNew.ejs");
});

router.post('/commandGroupNew', authenticateToken, async function (req, res) {

    let owner_id = res.user._id;

    const newGuid = Uuid.v4();

    let url = process.env.HOST_ADDRESS + "command/" + newGuid;

    let qrCode = await generateQRCode(url);

    let newCommandGroup = new CommandGroup({
        guid: newGuid,
        pageURL: url,
        pageQRcode: qrCode,
        name: req.body.name,
        description: req.body.description,
        owner: owner_id
    });

    await newCommandGroup.save();

    res.redirect("/command/commandGroupEdit/" + newCommandGroup.guid);
});

router.get('/commandNew/:commandGroupGUID', authenticateToken, async function (req, res) {

    let commandGroupGUID = req.params.commandGroupGUID;

    res.render("commandNew.ejs", { commandGroupGUID: commandGroupGUID });
});

router.post('/commandNew/:commandGroupGUID', authenticateToken, async function (req, res) {

    let owner_id = res.user._id;

    let commandGroupGUID = req.params.commandGroupGUID;

    const newGuid = Uuid.v4();

    let newCommand = new Command({
        guid: newGuid,
        name: req.body.name,
        description: req.body.description,
        owner: owner_id
    });

    await newCommand.save();

    let commandGroup = await CommandGroup.findOne({
        guid: commandGroupGUID
    });

    commandGroup.commands.push(newCommand.guid);

    await commandGroup.save();

    let messageDescriptions = await buildCommandMessageDescription(newCommand);

    res.render("commandEdit.ejs", { command: newCommand, messageDescriptions: messageDescriptions, commandGroupGUID: commandGroupGUID });
});

router.get('/commandDetailsEdit/:commandGroupGUID/:commandGUID', async function (req, res) {

    let commandGroupGUID = req.params.commandGroupGUID;
    let commandGUID = req.params.commandGUID;

    // remove from the commands in the command group

    let command = await Command.findOne(
        { guid: commandGUID }
    );

    res.render("commandDetailsEdit.ejs", { commandGroupGUID: commandGroupGUID, command: command });
});

router.post('/commandDetailsEdit/:commandGroupGUID/:commandGUID', async function (req, res) {

    let commandGroupGUID = req.params.commandGroupGUID;
    let commandGUID = req.params.commandGUID;

    await Command.updateOne(
        { guid: commandGUID },
        {
            name: req.body.name,
            description: req.body.description
        }
    );

    let command = await Command.findOne(
        { guid: commandGUID }
    );

    let messageDescriptions = await buildCommandMessageDescription(command);

    res.render("commandEdit.ejs", { command: command, messageDescriptions: messageDescriptions, commandGroupGUID: commandGroupGUID });

});

router.get('/commandEdit/:commandGroupGUID/:commandGUID', authenticateToken, async function (req, res) {

    let commandGUID = req.params.commandGUID;
    let commandGroupGUID = req.params.commandGroupGUID;

    let command = await Command.findOne({
        guid: commandGUID
    });

    let messageDescriptions = await buildCommandMessageDescription(command);

    res.render("commandEdit.ejs", { command: command, messageDescriptions: messageDescriptions, commandGroupGUID: commandGroupGUID });
});

router.post('/commandEdit/:commandGroupGUID/:commandGUID', authenticateToken, async function (req, res) {

    let commandGroupGUID = req.params.commandGroupGUID;
    let commandGUID = req.params.commandGUID;

    await Command.updateOne(
        { guid: commandGUID },
        {
            name: req.body.name,
            description: req.body.description
        }
    );

    let commandGroup = await CommandGroup.findOne(
        { guid: commandGroupGUID }
    )

    res.render("commandEdit.ejs", { commandGroup: commandGroup });
});

router.get('/commandMessageNew/:commandGUID/:commandGroupGUID', authenticateToken, async function (req, res) {

    let owner_id = res.user._id;
    let commandGroupGUID = req.params.commandGroupGUID;
    let commandGUID = req.params.commandGUID;

    const newGuid = Uuid.v4();

    let newMessage = new CommandDeviceMessage({
        guid: newGuid,
        name: "",
        description: "",
        message:"",
        owner: owner_id,
        command:commandGUID
        });

    let command = await Command.findOne({
        guid: commandGUID
    });

    command.messages.push(newMessage._id);

    res.render("commandMessageEdit.ejs", { commandMessage: newMessage, commandGroupGUID: commandGroupGUID, commandGUID: commandGUID });
});

router.post('/commandMessageEdit/:commandMessageGUID/:commandGroupGUID/:commandGUID', authenticateToken, async function (req, res) {

    let commandMessageGUID = req.params.commandMessageGUID;
    let commandGroupGUID = req.params.commandGroupGUID;
    let commandGUID = req.params.commandGUID;

    let name=req.body.name;
    let description=req.body.description;
    let deviceName = req.body.deviceName;
    let message = req.body.message;

    let device = await Device.findOne({
        $and:
            [
                { owner: { $eq: res.user._id } },
                { friendlyName: { $eq: deviceName } }
            ]
    });

    if(!device){
        messageDisplay(
            "Create new message", 
            `Device ${deviceName} not found`, 
            [
                {description:"Continue", route:"/command/commandGroupSelect/"}
            ],
            res
        );
        return;
    }

    // got the device - now we can update the message
    await CommandDeviceMessage.updateOne(
        {guid:commandMessageGUID},
        {
            name:name,
            description:description,
            device:device._id,
            message:message        }
    );

    let command = await Command.findOne({
        guid: commandGUID
    });

    let messageDescriptions = await buildCommandMessageDescription(command);

    res.render("commandEdit.ejs", { command: command, messageDescriptions: messageDescriptions, commandGroupGUID: commandGroupGUID });
});


// define the home page route
router.get('perform/:guid', async function (req, res) {

    let guid = req.params.guid;

    let command = await Command.findOne(
        { guid: guid }
    );

    mgr = Manager.getActiveManger();

    let message = "Command sent OK";

    for (let i = 0; i < command.devices.length; i++) {

        let device_id = command.devices[i];

        let deviceObject = await Device.findOne(
            { _id: device_id }
        )
        try {
            await mgr.sendJSONCommandToDevice(deviceObject.name, command.command);
        }
        catch (error) {
            message = error;
            break;
        }
    };

    res.render("GUIDcommandDone.ejs", { GUIDcommand: command, message: message });
});

router.get('/oldmanage/:deviceID', authenticateToken, async function (req, res) {

    // first find all the GUID commands for this device

    let device_id = req.params.deviceID;

    let GUIDcommands = await Command.find({
        $and:
            [
                { owner: { $eq: res.user._id } },
                {
                    devices: {
                        $elemMatch: { $eq: device_id }
                    }
                }
            ]
    });

    res.render("GUIDmanage.ejs", { username: res.user.name, deviceID: device_id, GUIDcommands: GUIDcommands });
});





router.post('/newcommand/:commandID', authenticateToken, async function (req, res) {

    res.render('/')


});


module.exports = router;
