const { response } = require('express');
const express = require('express');
const router = express.Router();
const authenticateToken = require('../_helpers/authenticateToken');
const Device = require('../models/device');

router.get('/wifi', (req, res) => {
    res.render('connectNewDeviceOverWiFi.ejs',{ 
        configAccessPoint: process.env.CONFIG_ACCESS_POINT,
        configHostAddress: process.env.CONFIG_HOST_ADDRESS,
        configHostIPAddress: process.env.CONFIG_HOST_IP_ADDRESS
     });
});

router.get('/usb', (req, res) => {
    res.render('connectNewDeviceOverUSB.ejs');
});


router.get('/initialSettings.json/:name/:friendlyName', authenticateToken, async function (req, res) {

    let deviceName = req.params.name;
    let friendlyName = req.params.friendlyName;

    console.log("Device: " + deviceName + " registering");

    let device = await Device.findOne({ name: req.params.name });

    if (device == null) {
        // Create a new device record
        device = new Device({
            name: deviceName,
            friendlyName: friendlyName,
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
            owner: res.user._id,
            friendlyName: friendlyName
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
