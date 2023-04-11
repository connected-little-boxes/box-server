const Device = require('../models/device');
const express = require('express');
const router = express.Router();
const authenticateToken = require('../_helpers/authenticateToken');
const getDeviceByDeviceName = require('../_helpers/getDeviceByDeviceName');

// define the home page route
router.get('/', authenticateToken, async function (req, res) {

    res.render("pixelHardware.ejs", { name: res.user.name, host: process.env.HOST_ADDRESS });
});


router.get('/control/:name', authenticateToken, getDeviceByDeviceName, async function (req, res) {

    let deviceName = req.params.name;

    console.log("Device: " + deviceName + " pixel control");

    res.render("pixelManage.ejs", { name: res.user.name, host: process.env.HOST_ADDRESS });

    

});

module.exports = router;
