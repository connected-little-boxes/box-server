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
const getProcessManagerByName = require('../_helpers/getProcessManagerByName');
const { ProcessManagerCommandItems, ProcessManagerCommands, ProcessManagerMessageItems, ProcessManagerMessages, ProcessManagers } = require('../models/ProcessManager');

router.get('/activate/:manager_id/:device_id', authenticateToken, async function (req, res) {

    // activate the device
    let manager_id = req.params.manager_id;
    let device_id = req.params.device_id;
    let user = res.user;

    let device = await Device.findOne(
        { _id: device_id }
    );

    let manager = await ProcessManagers.findOne(
        { _id: manager_id }
    );

    res.render("configureDeviceHardware.ejs", {
        name: user.name,
        title: `Configure ${manager.name}`,
        configScript: `/js/configscripts/${manager.name}.js`,
        host: process.env.HOST_ADDRESS,
        device: device,
        manager: manager
    });
});

router.get('/select', authenticateToken, async function (req, res) {

    let managers = await ProcessManagers.find();

    res.render("processManagerSelect.ejs", {
        managers: managers
    });
});

router.get('/:name', authenticateToken, getProcessManagerByName, async (req, res) => {

    let manager = res.processManager;
    let messages = await ProcessManagerMessages.find({processManager:manager._id});

    res.render("processManager.ejs", {
        manager: manager,
        messages:messages
    });
});

router.get('/messageNew/:name', authenticateToken, getProcessManagerByName, async function (req, res) {

    let manager = res.processManager;
    let commands = await ProcessManagerCommands.find({processManager:manager._id});
    res.render("processManagerMessageNew.ejs", {
        manager: manager,
        commands: commands
    });
});

router.post('/messageNew/:name', authenticateToken, getProcessManagerByName, async function (req, res) {
    let manager = res.processManager;
    let name = req.body.name;
    let description = req.body.description;
    let commandName = req.body.commandName;

    let command = await ProcessManagerCommands.findOne({
        $and:
          [
            { ProcessManager: { $eq: manager._id } },
            { name: { $eq: commandName } }
          ]
      });

    if(command){
        // Got the command that the user has selected - build a new message for this 
        // command and then let the user enter the information for the command
        let newMessage =  ProcessManagerMessages({
            name: name,
            desc: description,
            manager:manager._id
        });

        await newMessage.save();

        // Find all the items for this command 
        let items = await ProcessManagerCommandItems.find({
            processCommand:command._id
        })

        items.forEach( item => {
            
        })


    
    }


    res.render("processManagerMessageEdit.ejs", {
        messageName: name,
        manager: manager
    });
});

router.get('/messageEdit/:name/:messageName', authenticateToken, getProcessManagerByName, async function (req, res) {
    let manager = res.processManager;

    res.render("processManagerMessageEdit.ejs", {
        message: name,
        manager: manager
    });
});



module.exports = router;
