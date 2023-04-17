const Device = require('../models/device');
const express = require('express');
const router = express.Router();
const GUIDcommand = require('../models/GUIDcommand');
const Manager = require('../manager');
const authenticateToken = require('../_helpers/authenticateToken');
const qrcode = require('qrcode');
const Uuid = require('uuid');

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

async function saveCommand(owner_id, device_id, command) {

    const uuid = Uuid.v4();

    let url = process.env.HOST_ADDRESS + "GUIDcommand/" + uuid;

    let qrCode = await generateQRCode(url);

    let newGUID = new GUIDcommand({
        guid: uuid,
        command: command,
        pageURL: url,
        pageQRcode: qrCode,
        devices: [device_id],
        owner: owner_id
    });

    await newGUID.save();
    return newGUID;
}

// define the home page route
router.get('/:guid', async function (req, res) {

    let guid = req.params.guid;

    let command = await GUIDcommand.findOne(
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

router.get('/manage/:deviceID', authenticateToken, async function (req, res) {

    // first find all the GUID commands for this device

    let device_id = req.params.deviceID;

    let GUIDcommands =  await GUIDcommand.find({
        $and:
            [
                { owner: { $eq: res.user._id } },
                {
                    devices: {
                        $elemMatch: { $eq: device_id}
                    }
                }
            ]
    });

    res.render("GUIDmanage.ejs", { username: res.user.name, deviceID: device_id, GUIDcommands: GUIDcommands });
});

router.get('/edit/:GUIDcommandID/:deviceID', authenticateToken, async function (req, res) {

    let GUIDcommandID = req.params.GUIDcommandID;
    let deviceID = req.params.deviceID;

    let command = await GUIDcommand.findOne(
        { guid: GUIDcommandID }  
    );

    res.render("GUIDcommandEdit.ejs", { GUIDcommand: command, deviceID:deviceID });
});

router.post('/edit/:GUIDcommandID/:deviceID', async function (req, res) {

    let GUIDcommandID = req.params.GUIDcommandID;
    let deviceID = req.params.deviceID;

    let command = await GUIDcommand.findOne(
        { guid: GUIDcommandID }
    );

    await command.updateOne(
        {
            description: req.body.description,
            command: req.body.command
        }
    );

    res.redirect("/GUIDcommand/manage/"+deviceID); 

});

router.get('/delete/:GUIDcommandID/:deviceID', authenticateToken, async function (req, res) {

    let GUIDcommandID = req.params.GUIDcommandID;
    let deviceID = req.params.deviceID;

    let command = await GUIDcommand.findOne(
        { guid: GUIDcommandID }  
    );

    res.render("GUIDcommandDelete.ejs", { GUIDcommand: command, deviceID:deviceID });
});

router.post('/delete/:GUIDcommandID/:deviceID', async function (req, res) {

    let GUIDcommandID = req.params.GUIDcommandID;
    let deviceID = req.params.deviceID;

    await GUIDcommand.deleteOne(
        { guid: GUIDcommandID }
    );

    res.redirect("/GUIDcommand/manage/"+deviceID); 
});

router.get('/new/:deviceID', authenticateToken, async function (req, res) {

    let ownerID = res.user._id;
    let deviceID = req.params.deviceID;

    let command = await saveCommand(ownerID, deviceID,`{"process":"pixels","command":"setnamedbackground","colourname":"blue"}`);

    res.render("GUIDcommandEdit.ejs", { GUIDcommand: command, deviceID:deviceID });
});

module.exports = router;
