const Device = require('../models/device');
const express = require('express');
const router = express.Router();
const Command = require('../models/Command');
const CommandGroup = require('../models/CommandGroup');
const Manager = require('../manager');
const authenticateToken = require('../_helpers/authenticateToken');
const menuPage = require('../_helpers/menuPage');
const qrcode = require('qrcode');
const Uuid = require('uuid');
const CommandDeviceMessage = require('../models/CommandDeviceMessage');
const User = require('../models/user');

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

async function buildCommandDescription(commandGroup) {
    let commands = [];

    for (let i = 0; i < commandGroup.commands.length; i++) {
        let command_id = commandGroup.commands[i];
        let command = await Command.findOne(
            { _id: command_id }
        );
        let commandDetails = {
            _id: command._id,
            name: command.name,
            description: command.description
        };
        commands.push(commandDetails);
    };

    return commands;
}

async function buildUserDeviceFriendlyNameList(owner_id, selectedDeviceID) {

    let userDevices = await Device.find({ owner: owner_id });

    userDevices.sort((a, b) => {
        let textA = (a.friendlyName ? a.friendlyName : a.name).toUpperCase();
        let textB = (b.friendlyName ? b.friendlyName : b.name).toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });

    let nameList = [];

    for (let i = 0; i < userDevices.length; i++) {
        let device = userDevices[i];
        let name = (device.friendlyName ? device.friendlyName : device.name);
        if (device._id.equals(selectedDeviceID)) {
            nameList.unshift(name);
        }
        else {
            nameList.push(name);
        }
    };
    return nameList;
}


async function buildOneCommandMessageDescription(owner_id, message_id) {

    // find the message we are describing
    let message = await CommandDeviceMessage.findOne(
        { _id: message_id }
    );

    if (!message) {
        return null;
    }

    let selectedDeviceID = message.device;

    let deviceNames = await buildUserDeviceFriendlyNameList(owner_id, selectedDeviceID);

    let messageDetails = {
        _id: message.id,
        name: message.name,
        description: message.description,
        message: message.message,
        deviceNames: deviceNames
    };

    return messageDetails;
}

async function buildCommandMessageDescriptions(owner_id, messages) {
    let messageDescriptions = [];

    for (let i = 0; i < messages.length; i++) {
        let message_id = messages[i];
        let messageDetails = await buildOneCommandMessageDescription(owner_id, message_id);
        if (messageDetails) {
            messageDescriptions.push(messageDetails);
        }
    };

    return messageDescriptions;
}

router.get('/commandGroupSelect', authenticateToken, async function (req, res) {

    let user = res.user;

    // find all the groups owned by this user
    let commandGroups;
    let commandPage;

    if (user.role == "admin") {
        commandGroups = await CommandGroup.find();
        commandPage = "commandGroupAdminSelect.ejs";
    }
    else {
        commandGroups = await CommandGroup.find({ owner: user._id });
        commandPage = "commandGroupSelect.ejs";
    }

    commandGroups.sort((a, b) => {
        let textA = (a.name).toUpperCase();
        let textB = (b.name).toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });

    res.render(commandPage, { username: user.name, commandGroups: commandGroups });
});

router.get('/commandGroupNew', authenticateToken, async function (req, res) {
    res.render("commandGroupNew.ejs");
});

router.post('/commandGroupNew', authenticateToken, async function (req, res) {

    let owner_id = res.user._id;

    const newGuid = Uuid.v4();

    let url = process.env.HOST_ADDRESS + "command/perform/" + newGuid;

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

    res.redirect("/command/commandGroupEdit/" + newCommandGroup._id);
});

router.get('/commandGroupEdit/:commandGroup_id', authenticateToken, async function (req, res) {

    let commandGroup_id = req.params.commandGroup_id;

    let commandGroup = await CommandGroup.findOne(
        { _id: commandGroup_id }
    );

    let commands = await buildCommandDescription(commandGroup);

    res.render("commandGroupEdit.ejs", { commandGroup: commandGroup, commands: commands });
});


async function buildUserDescriptions(owner_id, owner_name) {

    let userDescriptions = [];


    let users = await User.find();

    for (let i = 0; i < users.length; i++) {
        let user = users[i];
        if (user._id.equals(owner_id)) {
            continue;
        }
        userDescriptions.push({ _id: String(user._id), name: user.name });
    };

    userDescriptions.sort((a, b) => {
        let textA = (a.name).toUpperCase();
        let textB = (b.name).toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });

    userDescriptions.unshift({ _id: owner_id, name: owner_name });

    return userDescriptions;
}


router.get('/commandGroupMove/:commandGroup_id', authenticateToken, async function (req, res) {

    let commandGroup_id = req.params.commandGroup_id;

    let commandGroup = await CommandGroup.findOne(
        { _id: commandGroup_id }
    );

    let owner = await User.findOne({ _id: commandGroup.owner });

    let users = await buildUserDescriptions(owner._id, owner.name);

    res.render("commandGroupMove.ejs", { commandGroup: commandGroup, ownerName: owner.name, users: users });
});

router.post('/commandGroupMove/:commandGroup_id', authenticateToken, async function (req, res) {

    let owner_id = req.body.user;

    let commandGroup_id = req.params.commandGroup_id;

    try {

        let commandGroup = await CommandGroup.findOne(
            { _id: commandGroup_id }
        );

        await commandGroup.updateOne(
            { owner: owner_id }
        );
    }
    catch (error) {
        menuPage(
            "Command group move",
            `Move failed: ${error}`,
            [
                { description: "Continue", route: "/command/commandGroupSelect/" }
            ],
            res
        );
    }

    menuPage(
        "Command group move",
        "Move completed successfully",
        [
            { description: "Continue", route: "/command/commandGroupSelect/" }
        ],
        res
    );
});


router.post('/commandGroupEdit/:commandGroup_id', authenticateToken, async function (req, res) {

    let commandGroup_id = req.params.commandGroup_id;

    await CommandGroup.updateOne(
        { _id: commandGroup_id },
        {
            description: req.body.description,
            name: req.body.name
        }
    );

    res.redirect("/command/commandGroupSelect/");
});

router.get('/commandGroupDeleteConfirm/:commandGroup_id', authenticateToken, async function (req, res) {

    let commandGroup_id = req.params.commandGroup_id;

    let commandGroup = await CommandGroup.findOne(
        { _id: commandGroup_id }
    );

    res.render("commandGroupDeleteConfirm.ejs", { commandGroup: commandGroup, commandGroup_id: commandGroup_id });
});

router.get('/commandGroupDelete/:commandGroup_id', async function (req, res) {

    let commandGroup_id = req.params.commandGroup_id;

    try {

        const result = await CommandGroup.deleteOne(
            { _id: commandGroup_id }
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

    menuPage(
        "Command group deleted",
        message,
        [
            { description: "Continue", route: "/command/commandGroupSelect/" }
        ],
        res
    );
});

router.get('/commandDeleteConfirm/:commandGroup_id/:command_id', async function (req, res) {

    let command_id = req.params.command_id;
    let commandGroup_id = req.params.commandGroup_id;

    let command = await Command.findOne(
        { _id: command_id }
    );

    res.render("commandDeleteConfirm.ejs", { command: command, commandGroup_id: commandGroup_id });
});

router.get('/commandDelete/:commandGroup_id/:command_id', async function (req, res) {

    let command_id = req.params.command_id;
    let commandGroup_id = req.params.commandGroup_id;

    // remove from the commands in the command group

    let commandGroup = await CommandGroup.findOne(
        { _id: commandGroup_id }
    );

    let index = commandGroup.commands.indexOf(command_id);

    if (index >= 0) {
        commandGroup.commands.splice(index, 1);
        await commandGroup.save();
    }

    try {

        const result = await Command.deleteOne(
            { _id: command_id }
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

    menuPage(
        "Command deleted",
        message,
        [
            { description: "Continue", route: "/command/commandGroupEdit/" + commandGroup_id }
        ],
        res
    );
});

router.get('/commandGroupDetailsEdit/:commandGroup_id', async function (req, res) {

    let commandGroup_id = req.params.commandGroup_id;

    // remove from the commands in the command group

    let commandGroup = await CommandGroup.findOne(
        { _id: commandGroup_id }
    );

    res.render("commandGroupDetailsEdit.ejs", { commandGroup: commandGroup });
});

router.post('/commandGroupDetailsEdit/:commandGroup_id', async function (req, res) {

    let commandGroup_id = req.params.commandGroup_id;

    await CommandGroup.updateOne(
        { _id: commandGroup_id },
        {
            name: req.body.name,
            description: req.body.description
        }
    );

    res.redirect("/command/commandGroupEdit/" + commandGroup_id);
});

router.get('/commandNew/:commandGroup_id', authenticateToken, async function (req, res) {

    let commandGroup_id = req.params.commandGroup_id;

    res.render("commandNew.ejs", { commandGroup_id: commandGroup_id });
});

router.post('/commandNew/:commandGroup_id', authenticateToken, async function (req, res) {

    let user = res.user;
    let owner_id = user._id;

    let commandGroup_id = req.params.commandGroup_id;

    let newCommand = new Command({
        name: req.body.name,
        description: req.body.description,
        owner: owner_id
    });

    await newCommand.save();

    let commandGroup = await CommandGroup.findOne({
        _id: commandGroup_id
    });

    commandGroup.commands.push(newCommand._id);

    await commandGroup.save();

    let messageDescriptions = await buildCommandMessageDescriptions(user, newCommand);

    res.render("commandEdit.ejs", { command: newCommand, messageDescriptions: messageDescriptions, commandGroup_id: commandGroup_id });
});

router.get('/commandDetailsEdit/:commandGroup_id/:command_id', async function (req, res) {

    let commandGroup_id = req.params.commandGroup_id;
    let command_id = req.params.command_id;

    // remove from the commands in the command group

    let command = await Command.findOne(
        { _id: command_id }
    );

    res.render("commandDetailsEdit.ejs", { commandGroup_id: commandGroup_id, command: command });
});

router.post('/commandDetailsEdit/:commandGroup_id/:command_id', async function (req, res) {

    let user = res.user;
    let owner_id = user._id;

    let commandGroup_id = req.params.commandGroup_id;
    let command_id = req.params.command_id;

    await Command.updateOne(
        { _id: command_id },
        {
            name: req.body.name,
            description: req.body.description
        }
    );

    let command = await Command.findOne(
        { _id: command_id }
    );

    let messageDescriptions = await buildCommandMessageDescriptions(owner_id, command.messages);

    res.render("commandEdit.ejs", { command: command, messageDescriptions: messageDescriptions, commandGroup_id: commandGroup_id });
});

router.get('/commandEdit/:commandGroup_id/:command_id', authenticateToken, async function (req, res) {

    let user = res.user;
    let owner_id = user._id;

    let command_id = req.params.command_id;
    let commandGroup_id = req.params.commandGroup_id;

    let command = await Command.findOne({
        _id: command_id
    });

    let messageDescriptions = await buildCommandMessageDescriptions(owner_id, command.messages);

    res.render("commandEdit.ejs", { command: command, messageDescriptions: messageDescriptions, commandGroup_id: commandGroup_id });
});

router.post('/commandEdit/:commandGroup_id/:command_id', authenticateToken, async function (req, res) {

    let command_id = req.params.command_id;

    let commandGroup_id = req.params.commandGroup_id;

    await Command.updateOne(
        { _id: command_id },
        {
            name: req.body.name,
            description: req.body.description
        }
    );

    for (let key in req.body) {
        if (key.startsWith('message_') && key.endsWith('_messageName')) {
            let body = req.body[key];
            console.log(`Processing: ${body}`);
            // have a message value to update
            let content = key.split('_');
            let id = content[1];
            message = await CommandDeviceMessage.findOne({ _id: id });

            if (message) {
                // got a message to update
                let name = req.body[`message_${id}_messageName`];
                let description = req.body[`message_${id}_description`];
                let deviceName = req.body[`message_${id}_deviceName`];
                let messageText = req.body[`message_${id}_messageText`];

                let device = await Device.findOne({
                    $and:
                        [
                            { owner: { $eq: res.user._id } },
                            { friendlyName: { $eq: deviceName } }
                        ]
                });

                await CommandDeviceMessage.updateOne(
                    { _id: id },
                    {
                        name: name,
                        description: description,
                        device: device._id,
                        message: messageText
                    }
                );
            }
        }
    }

    res.redirect(`/command/commandGroupEdit/${commandGroup_id}`);
});

router.get('/commandMessageNew/:commandGroup_id/:command_id', authenticateToken, async function (req, res) {

    let user = res.user;
    let owner_id = user._id;
    let commandGroup_id = req.params.commandGroup_id;
    let command_id = req.params.command_id;

    let newMessage = new CommandDeviceMessage({
        owner: owner_id,
        command: command_id
    });

    await newMessage.save();

    let command = await Command.findOne({
        _id: command_id
    });

    command.messages.push(newMessage._id);
    await command.save();

    let deviceFriendlyNameList = await buildUserDeviceFriendlyNameList(owner_id, null);

    res.render("commandMessageEdit.ejs", {
        commandMessage: newMessage, commandGroup_id: commandGroup_id,
        command_id: command_id, deviceFriendlyNameList: deviceFriendlyNameList
    });
});

router.get('/commandMessageEdit/:commandGroup_id/:command_id/:commandMessage_id', authenticateToken, async function (req, res) {
    let user = res.user;
    let owner_id = user._id;
    let commandGroup_id = req.params.commandGroup_id;
    let command_id = req.params.command_id;
    let message_id = req.params.commandMessage_id;

    let messageDescription = await buildOneCommandMessageDescription(user, message_id);

    if (!messageDescription) {
        menuPage(
            "Command message edit",
            `Message not found`,
            [
                { description: "Continue", route: "/command/commandGroupSelect/" }
            ],
            res
        );
    }

    let deviceFriendlyNameList = await buildUserDeviceFriendlyNameList(owner_id, messageDescription.device_id);

    res.render("commandMessageEdit.ejs", {
        commandMessage: messageDescription, commandGroup_id: commandGroup_id,
        command_id: command_id, deviceFriendlyNameList: deviceFriendlyNameList
    });
});


router.post('/commandMessageEdit/:commandGroup_id/:command_id/:commandMessage_id', authenticateToken, async function (req, res) {

    let user = res.user;
    let owner_id = user._id;

    let commandMessage_id = req.params.commandMessage_id;
    let commandGroup_id = req.params.commandGroup_id;
    let command_id = req.params.command_id;

    let name = req.body.name;
    let description = req.body.description;
    let deviceName = req.body.deviceName;
    let message = req.body.message;

    let device = await Device.findOne({
        $and:
            [
                { owner: { $eq: res.user._id } },
                { friendlyName: { $eq: deviceName } }
            ]
    });

    if (!device) {

        device = await Device.findOne({
            $and:
                [
                    { owner: { $eq: res.user._id } },
                    { name: { $eq: deviceName } }
                ]
        });

        if (!device) {

            await CommandDeviceMessage.deleteOne(
                { _id: commandMessage_id }
            );

            menuPage(
                "Create new message",
                `Device ${deviceName} not found`,
                [
                    { description: "Continue", route: "/command/commandGroupSelect/" }
                ],
                res
            );
            return;
        }
    }

    // got the device - now we can update the message
    await CommandDeviceMessage.updateOne(
        { _id: commandMessage_id },
        {
            name: name,
            description: description,
            device: device._id,
            message: message
        }
    );

    let command = await Command.findOne({
        _id: command_id
    });

    let messageDescriptions = await buildCommandMessageDescriptions(owner_id, command.messages);

    res.render("commandEdit.ejs", { command: command, messageDescriptions: messageDescriptions, commandGroup_id: commandGroup_id });
});


router.get('/commandMessageDeleteConfirm/:commandGroup_id/:command_id/:message_id', async function (req, res) {

    let command_id = req.params.command_id;
    let commandGroup_id = req.params.commandGroup_id;
    let message_id = req.params.message_id;

    let message = await CommandDeviceMessage.findOne(
        { _id: message_id }
    );

    res.render("commandMessageDeleteConfirm.ejs", { message: message, command_id: command_id, commandGroup_id: commandGroup_id });
});

router.get('/commandMessageDelete/:commandGroup_id/:command_id/:message_id', async function (req, res) {

    let command_id = req.params.command_id;
    let commandGroup_id = req.params.commandGroup_id;
    let message_id = req.params.message_id;

    // remove from the messages in the command group

    let command = await Command.findOne(
        { _id: command_id }
    );

    let index = command.messages.indexOf(message_id);

    if (index >= 0) {
        command.messages.splice(index, 1);
        await command.save();
    }

    try {

        const result = await CommandDeviceMessage.deleteOne(
            { _id: message_id }
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

    menuPage(
        "Command deleted",
        message,
        [
            { description: "Continue", route: "/command/commandEdit/" + commandGroup_id + "/" + command_id }
        ],
        res
    );
});


// define the home page route
router.get('/perform/:guid', async function (req, res) {

    let guid = req.params.guid;

    let commandGroup = await CommandGroup.findOne(
        { guid: guid }
    );

    let commands = await buildCommandDescription(commandGroup);

    let url = process.env.HOST_ADDRESS;

    res.render("commandGroupPerform.ejs", {
        commandGroup: commandGroup,
        commands: commands, guid: guid, url: url
    });
});

router.get('/performCommand/:guid/:command_id', async function (req, res) {

    let guid = req.params.guid;
    let command_id = req.params.command_id;

    let command = await Command.findOne({
        _id: command_id
    });

    mgr = Manager.getActiveManger();

    for (let i = 0; i < command.messages.length; i++) {

        let message_id = command.messages[i];

        let message = await CommandDeviceMessage.findOne(
            { _id: message_id }
        );

        let device_id = message.device;

        let deviceObject = await Device.findOne(
            { _id: device_id }
        )

        try {
            await mgr.sendJSONCommandToDevice(deviceObject.name, message.message);
        }
        catch (error) {
            message = error;
            break;
        }
    };

    res.redirect('/command/perform' + "/" + guid);
});


router.post('/newcommand/:commandID', authenticateToken, async function (req, res) {
    res.render('/')
});


module.exports = router;
