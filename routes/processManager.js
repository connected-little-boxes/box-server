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
const ProcessManager = require('../models/ProcessManager');

router.get('/activate/:manager_id/:device_id', authenticateToken, async function (req, res) {

    // activate the device
    let manager_id = req.params.manager_id;
    let device_id = req.params.device_id;
    let user = res.user;

    let device = await Device.findOne(
        { _id: device_id }
    );

    let manager = await ProcessManager.findOne(
        { _id: manager_id }
    );

    res.render("configureDeviceHardware.ejs", { 
        name : user.name,
        title : `Configure ${manager.name}`,
        configScript : manager.configJS,
        host: process.env.HOST_ADDRESS, 
        device: device, 
        manager: manager });
});

module.exports = router;
