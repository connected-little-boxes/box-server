const { response } = require('express');
const express = require('express');
const router = express.Router();
const Device = require('../models/device');
const Manager = require('../manager');
const User = require('../models/user');
const authenticateToken = require('../_helpers/authenticateToken');
const getDeviceByDeviceName = require('../_helpers/getDeviceByDeviceName');
const menuPage = require('../_helpers/menuPage');
const validateFriendlyName = require('../_helpers/validateFriendlyName');
const generateQRCode = require('../_helpers/generateQRCode');
const { ProcessManagerCommandItems, ProcessManagerCommands, ProcessManagerMessageItems, ProcessManagerMessages, ProcessManagers } = require('../models/ProcessManager');
const buildUserDescriptions = require('../_helpers/buildUserDescriptions');


router.get('/:device_guid', authenticateToken, async function (req, res) {
    let device_guid = req.params.device_guid;

    let device = await Device.findOne({ guid: device_guid });

    if (!device) {
        menuPage(
            "Open Device",
            `Device not found ${device_guid}`,
            [
                { description: "Continue", route: "/" }
            ],
            res
        );
        return;
    };

    let tags = device.tags;

    if(!tags){
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

    res.render('pythonIshEditor.ejs', { device: device});
});

router.post('/saveProgram/:name', authenticateToken, getDeviceByDeviceName, async (req, res) => {

    let device = res.device;
    let codeText = req.body.codeTextarea;

    console.log("send code command pressed for:", device.name, " command:", codeText);

    let command= {
        process:"robot",
        command:"send",
        text:codeText
    }

    let commandJSON = JSON.stringify(command);
  
    mgr = Manager.getActiveManger();
  
    await mgr.sendJSONCommandToDevice(device.name, commandJSON);
  
    res.render('pythonIshEditor.ejs', { device: device});
})
  
module.exports = router;
