const Device = require('../models/device');
const express = require('express');
const router = express.Router();
const authenticateToken = require('../_helpers/authenticateToken');

// define the home page route
router.get('/', authenticateToken, async function (req, res) {

    res.render("pixelHardware.ejs", { name: res.user.name, host: process.env.HOST_ADDRESS });
});


router.get('/networkSettings.json/:name', authenticateToken, async function (req, res) {

    let deviceName = req.params.name;

    console.log("Device: " + deviceName + " registering");

    let device = await Device.findOne({ name: req.params.name });

    if (device == null) {
        // Create a new device record
        device = new Device({
            name: deviceName,
            friendlyName: deviceName,
            owner: res.user._id,
            processor: "unknown",
            version: "unknown",
            processes: [],
            sensors: []
        });
        await device.save();
        console.log("Device Created");
    }
    else {
        await device.updateOne({
            owner: res.user._id
        });
        console.log("Device Updated");
    }

    let settings = [
        { deviceName: "mqtthost", value: process.env.MQTT_HOST_URL },
        { deviceName: "mqttport", value: process.env.MQTT_PORT },
        { deviceName: "mqttsecure", value: process.env.MQTT_SECURE },
        { deviceName: "mqttuser", value: process.env.MQTT_USER },
        { deviceName: "mqttpwd", value: process.env.MQTT_PASSWORD },
        { deviceName: "mqttpre", value: process.env.MQTT_TOPIC_PREFIX },
        { deviceName: "mqttpub", value: process.env.MQTT_DATA_TOPIC },
        { deviceName: "mqttreport", value: process.env.MQTT_REPORT_TOPIC }
    ];
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/json');
    json = JSON.stringify(settings);
    res.write(json);
    res.end();
});

module.exports = router;
