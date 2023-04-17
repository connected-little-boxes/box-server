const Device = require('../models/device');
const GUIDcommand = require('../models/GUIDcommand');
const express = require('express');
const router = express.Router();
const authenticateToken = require('../_helpers/authenticateToken');
const getDeviceByDeviceName = require('../_helpers/getDeviceByDeviceName');
const qrcode = require('qrcode');
const crypto = require('crypto');

// define the home page route
router.get('/', authenticateToken, async function (req, res) {

    res.render("pixelHardware.ejs", { name: res.user.name, host: process.env.HOST_ADDRESS });
});

module.exports = router;
