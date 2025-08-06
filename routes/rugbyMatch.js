const { response } = require('express');
const express = require('express');
const router = express.Router();
const Device = require('../models/device');
const Manager = require('../manager');
const User = require('../models/user');
const RugbyMatch = require('../models/RugbyMatch');
const RugbyPlayer = require('../models/RugbyPlayer');
const authenticateToken = require('../_helpers/authenticateToken');
const authenticateAdmin = require('../_helpers/authenticateAdmin');
const getDeviceByDeviceName = require('../_helpers/getDeviceByDeviceName');
const getOpenDeviceByDeviceName = require('../_helpers/getOpenDeviceByDeviceName');
const getOpenDeviceByDeviceGUID = require('../_helpers/getOpenDeviceByDeviceGUID');
const getRugbyMatchByName = require('../_helpers/getRugbyMatchByName');
const menuPage = require('../_helpers/menuPage');
const validateFriendlyName = require('../_helpers/validateFriendlyName');
const generateQRCode = require('../_helpers/generateQRCode');
const { ProcessManagerCommandItems, ProcessManagerCommands, ProcessManagerMessageItems, ProcessManagerMessages, ProcessManagers } = require('../models/ProcessManager');
const buildUserDescriptions = require('../_helpers/buildUserDescriptions');
const tinyLog = require('../_helpers/tinyLog');
const Uuid = require('uuid');

router.get('/index', authenticateToken, authenticateAdmin, async function (req, res) {
    res.render('rubgyIndex.ejs');
});

async function buildRugbyMatchNameList() {

    let nameList = [];

    let matches = await RugbyMatch.find();

    matches.sort((a, b) => {
        let textA = (a.friendlyName ? a.friendlyName : a.name).toUpperCase();
        let textB = (b.friendlyName ? b.friendlyName : b.name).toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });

    for (let i = 0; i < matches.length; i++) {
        let match = matches[i];
        let name = match.name;
        nameList.push(name);
    };
    return nameList;
}

async function findAllRobots() {
    const searchTerm = 'robot';
    let result = await Device.find({ tags: { $regex: new RegExp(searchTerm, 'i') } });
    return result;
}

router.get('/createMatch', authenticateToken, authenticateAdmin, async function (req, res) {

    let matchNameList = await buildRugbyMatchNameList();

    res.render("rugbyCreateMatch.ejs", { matchNameList: matchNameList });
});

router.post('/createMatch', authenticateToken, authenticateAdmin, async function (req, res) {

    let owner = res.user;

    let matchName = req.body.name;

    let matchDescription = req.body.description;

    let match = await RugbyMatch.findOne({ name: matchName });

    if (match) {
        menuPage(
            `Robot Rugby`,
            `Match ${matchName} already exists`,
            [
                { description: "Continue", route: "/rugbyMatch/index" }
            ],
            res
        );
        return;
    }

    let matchGuid = Uuid.v4();

    let players = [];

    let trackingCodeNumber = 0;

    // Get the robots for this match 
    // TODO - allow the user to select robots in the CreateMatch dialogue. 

    // At the moment we just find devices with red and blue tags and form them into teams 

    let teamNames = ["red", "blue"];

    for (const teamName of teamNames) {

        // get all the robots with the selected colour

        let robots = await Device.find({ tags: { $regex: new RegExp(teamName, 'i') } });

        // make a player for each of the robots

        for (const device of robots) {

            let newPlayer = RugbyPlayer({
                guid: Uuid.v4(),
                deviceGuid: device.guid,
                matchGuid: matchGuid,
                teamName: teamName,
                trackingCode: String(trackingCodeNumber)
            });

            await newPlayer.save();

            players.push(newPlayer.guid);

            trackingCodeNumber++;
        }
    }

    // Create a match

    let newMatch = RugbyMatch({
        name: matchName,
        guid: Uuid.v4(),
        description: matchDescription,
        owner: owner._id,
        players: players
    });

    await newMatch.save();

    menuPage(
        `Robot Rugby`,
        `Match ${matchName} created`,
        [
            { description: "Continue", route: "/rugbyMatch/index" }
        ],
        res
    );
});

router.get('/openMatch', authenticateToken, authenticateAdmin, async function (req, res) {

    let matchNameList = await buildRugbyMatchNameList();

    res.render("rugbyOpenMatch.ejs", { matchNameList: matchNameList });
});

router.post('/openMatch', authenticateToken, authenticateAdmin, async (req, res) => {

    let matchName = req.body.matchName;

    let match = await RugbyMatch.findOne({ name: matchName });

    if (!match) {
        menuPage(
            `Robot Rugby`,
            `Match ${matchName} not found`,
            [
                { description: "Continue", route: "/rugbyMatch/index" }
            ],
            res
        );
        return;
    }

    res.render("rugbyManageMatch.ejs", { match: match });
});

router.post('/editMatch/:matchName', authenticateToken, authenticateAdmin, getRugbyMatchByName, async function (req, res) {

    let matchName = req.params.matchName;
    let description = req.body.description;

    let match = res.rugbyMatch;

    await match.updateOne({ description: description });

    match = await RugbyMatch.findOne({ name: matchName });

    res.render("rugbyEditMatch.ejs", { match: match });
});

router.get('/getMatchAssets/:matchName', authenticateToken, authenticateAdmin, getRugbyMatchByName, async function (req, res) {

    let match = res.rugbyMatch;

    let devices = [];

    for (let i = 0; i < match.players.length; i++) {

        let player = await RugbyPlayer.findOne({ guid: match.players[i] });

        if (!player) {
            console.log(`${match.players[i]} player not found`);
            continue;
        }

        let device = await Device.findOne({ guid: player.deviceGuid });

        if (!device) {

            console.log(`${player.deviceGuid} device not found`);
            continue;
        }

        let name = device.friendlyName;
        let description = device.description;

        console.log(`Found ${name}:${description}`);
        
        if (!name) name = device.name;

        if (name.startsWith('Robot ')) {
            name = name.slice(6);
        }

        let url = `${process.env.HOST_ADDRESS}rugbyMatch/player/${match.name}/${device.guid}`;

        let qrCode = await generateQRCode(url);

        let deviceAsset = {
            name: name,
            description: description,
            url: url,
            qrCode: qrCode,
            teamName : player.teamName,
            trackingCode : player.trackingCode
        };

        devices.push(deviceAsset);
    }

    res.render("rugbyMakeAssets.ejs", { match: match, devices: devices });

});

router.get('/player/:matchName/:deviceGuid', getRugbyMatchByName, getOpenDeviceByDeviceGUID, async function (req, res) {

    let match = res.rugbyMatch;
    let device = res.device;

    let tags = device.tags;

    if (!tags) {
        menuPage(
            "Open Device - no tags",
            `Only devices with the robots tag can be opened directly. ${device_guid}`,
            [
                { description: "Continue", route: "/" }
            ],
            res
        );
        return;
    }

    if (!tags.includes("robot")) {
        menuPage(
            "Open Device - not a robot",
            `Only devices with the robots tag can be opened directly. ${device_guid}`,
            [
                { description: "Continue", route: "/" }
            ],
            res
        );
        return;
    };

    res.render('robotRugbyEditor.ejs', { device: device, match: match, message: "Robot opened" });
});

router.get('/doCommand/:matchName/:name/:command', getOpenDeviceByDeviceName, getRugbyMatchByName, async (req, res) => {

    let device = res.device;
    let match = res.rugbyMatch;

    let command = req.params.command;

    mgr = Manager.getActiveManger();

    // the ** prefix causes the robot control software to route the string straight to the robot

    await mgr.sendRawTextToDevice(device.name, `***${command}`);

    res.render('robotRugbyEditor.ejs', { device: device, match: match, message: "Command performed" });
});

router.get('/startArena/:matchName', authenticateToken, authenticateAdmin, getRugbyMatchByName, async (req, res) => {

    let match = res.rugbyMatch;
    console.log("Starting arena");

    let command = req.params.command;

    mgr = Manager.getActiveManger();

    let playerDescriptions = [];

    for (let i = 0; i < match.players.length; i++) {

        let player = await RugbyPlayer.findOne({ guid: match.players[i] });

        if (!player) {
            console.log(`${match.players[i]} player not found`);
            continue;
        }

        let device = await Device.findOne({ guid: player.deviceGuid });

        if (!device) {

            console.log(`${player.deviceGuid} device not found`);
            continue;
        }

        let playerDescription = ({
            name:device.friendlyName,
            id:device.name,
            trackingCodeNumber:player.trackingCode,
            team:player.teamName
        });

        playerDescriptions.push(playerDescription);
    }

    let matchDescription = ({
        name:match.name,
        description:match.description,
        players:playerDescriptions
    })

    console.log(matchDescription);

    await mgr.sendMessageToArena(JSON.stringify(matchDescription));

    res.render("rugbyManageMatch.ejs", { match: match });
});

router.get('/commandAllRobots/:matchName/:command', authenticateToken, authenticateAdmin, getRugbyMatchByName, async (req, res) => {

    let match = res.rugbyMatch;

    let command = req.params.command;

    mgr = Manager.getActiveManger();

    for (let i = 0; i < match.players.length; i++) {

        let player = await RugbyPlayer.findOne({ guid: match.players[i] });

        if (!player) {
            console.log(`${match.players[i]} player not found`);
            continue;
        }

        let device = await Device.findOne({ guid: player.deviceGuid });

        if (!device) {

            console.log(`${player.deviceGuid} device not found`);
            continue;
        }

        // the ** prefix causes the robot control software to route the string straight to the robot
        await mgr.sendRawTextToDevice(device.name, `***${command}`);
    }

    res.render("rugbyManageMatch.ejs", { match: match });
});

router.post('/saveProgram/:matchName/:name', getOpenDeviceByDeviceName, getRugbyMatchByName, async (req, res) => {
    let device = res.device;
    let match = res.rugbyMatch;

    mgr = Manager.getActiveManger();

    let codeText = req.body.codeTextarea;

    let updateResult = await device.updateOne({
        pythonIsh: codeText
    });

    // reload the device to update it
    device = await Device.findOne({ name: req.params.name });

    const date = new Date();
    const hours = date.getHours();
    const mins = date.getMinutes();
    const secs = date.getSeconds();

    let code = `begin\r\n${codeText}\r\nend\r\n`;
    // the ** prefix causes the robot control software to route the string straight to the robot
    await mgr.sendRawTextToDevice(device.name, `**${code}`);

    let message = `Program saved at ${hours}:${mins}:${secs}`;

    res.render('robotRugbyEditor.ejs', { device: device, match: match, message: message });
});


router.get('/sendProgramAndRun/:matchName', authenticateToken, authenticateAdmin, getRugbyMatchByName, async (req, res) => {

    let match = res.rugbyMatch;

    mgr = Manager.getActiveManger();

    for (let i = 0; i < match.players.length; i++) {

        let player = await RugbyPlayer.findOne({ guid: match.players[i] });

        if (!player) {
            console.log(`${match.players[i]} player not found`);
            continue;
        }

        let device = await Device.findOne({ guid: player.deviceGuid });

        if (!device) {

            console.log(`${player.deviceGuid} device not found`);
            continue;
        }

        let code = `begin\r\n${device.pythonIsh}\r\nend\r\n`;
        // the ** prefix causes the robot control software to route the string straight to the robot
        await mgr.sendRawTextToDevice(device.name, `**${code}`);
    }
    res.render("rugbyManageMatch.ejs", { match: match, code: match.resetCode });
});

router.post('/saveProgramToAllRobots/:matchName', authenticateToken, authenticateAdmin, getRugbyMatchByName, async (req, res) => {

    let match = res.rugbyMatch;
    let codeText = req.body.codeTextarea;

    await match.updateOne({ resetCode: codeText });

    match = await RugbyMatch.findOne({ name: match.name });

    mgr = Manager.getActiveManger();

    for (let i = 0; i < match.players.length; i++) {

        let player = await RugbyPlayer.findOne({ guid: match.players[i] });

        if (!player) {
            console.log(`${match.players[i]} player not found`);
            continue;
        }

        let device = await Device.findOne({ guid: player.deviceGuid });

        if (!device) {

            console.log(`${player.deviceGuid} device not found`);
            continue;
        }
        
        let updateResult = await device.updateOne({
            pythonIsh: codeText
        });

        let code = `begin\r\n${codeText}\r\nend\r\n`;
        // the ** prefix causes the robot control software to route the string straight to the robot
        await mgr.sendRawTextToDevice(device.name, `**${code}`);
    }
    res.render("rugbyManageMatch.ejs", { match: match, code: codeText });
});

module.exports = router;
