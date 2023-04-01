const express = require('express');
const router = express.Router();
const authenticateToken = require('../_helpers/authenticateToken');

// define the home page route
router.get('/', authenticateToken, async function (req, res) {
    const WiFiSettings = {
        heading: "Configure WiFi",
        helpText: "These are the settings that the device will use to connect to the WiFi. They are stored securely in the device.",
        settingDetails:
            [
                { displayName: "WiFi SSID", deviceName: "wifissid1", type: "text" },
                { displayName: "WiFi Password", deviceName: "wifipwd1", type: "password" }
            ]
    };

    res.render("configureDevice.ejs", { name: res.user.name, settings: WiFiSettings });
});

module.exports = router;
