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

    let guid = "";

    let device = await Device.findOne({ name: req.params.name });

    let openUrl="";
    let deviceUrl="";

    if (device) {
        openUrl = process.env.HOST_ADDRESS + "openDevice/" + device.guid;
        deviceUrl = process.env.HOST_ADDRESS + "openDevice/command/" + device.guid;
    }

    let settings = {
        namedSettings: [
        { deviceName: "mqtthost", value: process.env.MQTT_HOST_URL },
        { deviceName: "mqttport", value: process.env.MQTT_PORT },
        { deviceName: "mqttsecure", value: process.env.MQTT_SECURE },
        { deviceName: "mqttuser", value: process.env.MQTT_USER },
        { deviceName: "mqttpwd", value: process.env.MQTT_PASSWORD },
        { deviceName: "mqttpre", value: process.env.MQTT_TOPIC_PREFIX },
        { deviceName: "mqttpub", value: process.env.MQTT_DATA_TOPIC },
        { deviceName: "mqttreport", value: process.env.MQTT_REPORT_TOPIC } 
        ],
        openUrl: openUrl,
        deviceUrl: deviceUrl 
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/json');
    json = JSON.stringify(settings);
    res.write(json);
    res.end();
});


module.exports = router;
