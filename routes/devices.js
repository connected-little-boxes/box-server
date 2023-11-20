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
const { ProcessManagerCommandItems, ProcessManagerCommands, ProcessManagerMessageItems, ProcessManagerMessages, ProcessManagers } = require('../models/ProcessManager');
const buildUserDescriptions = require('../_helpers/buildUserDescriptions');

// define the home page route
router.get('/', authenticateToken, async function (req, res) {
  try {
    const devices = await Device.find();
    res.json(devices);
  }
  catch (err) {
    res.status(500).json({ message: err.message });
  }
})

router.post('/sendconsolecommand/:name', authenticateToken, getDeviceByDeviceName, async (req, res) => {
  console.log("send console command pressed for:", res.device.name, " command:", req.body.consoleCommand);

  mgr = Manager.getActiveManger();

  await mgr.sendConsoleCommandToDevice(res.device.name, req.body.consoleCommand);

  res.redirect('/devices/' + res.device.name);
})

router.post('/sendjsoncommand/:name', authenticateToken, getDeviceByDeviceName,
  async (req, res) => {
    console.log("send json command pressed for:", res.device.name, " command:", req.body.jsonCommand);
    mgr = Manager.getActiveManger();
    await mgr.sendJSONCommandToDevice(res.device.name, req.body.jsonCommand);
    res.redirect('/devices/' + res.device.name);
  })

router.get('/restart/:name', authenticateToken, getDeviceByDeviceName,
  async (req, res) => {

    mgr = Manager.getActiveManger();

    await mgr.restartDevice(res.device.name);

    res.redirect('/devices/' + res.device.name);
  })

router.get('/check/:name', authenticateToken, getDeviceByDeviceName,
  async (req, res) => {

    mgr = Manager.getActiveManger();

    res.redirect('/devices/' + res.device.name);
  })


router.get('/otaUpdate/:name', authenticateToken, getDeviceByDeviceName,
  async (req, res) => {

    mgr = Manager.getActiveManger();

    await mgr.startDeviceOTAupdate(res.device.name);

    res.redirect('/devices/' + res.device.name);
  })


router.get('/:name', authenticateToken, getDeviceByDeviceName, async (req, res) => {
  // need to build a description of the processes which can be associated with this device
  // at the moment we just have pixels

  let device = res.device;
  let deviceProcessManagers = device.processManagers;
  let managers = [];

  let ownerName = "";
  let owner = await User.findOne({_id:device.owner});

  if(owner){
    ownerName = owner.name;
  }

  // We are going to display something for each process manager that
  // will allow the user to select which processes are active in the remote 
  // device. The ProcessManager table contains a list of all the process managers
  // get a list of all the ProcessManager objects
  //
  let systemProcessManagers = await ProcessManagers.find({});

  systemProcessManagers.forEach(systemProcessManager => {

    const processActive = deviceProcessManagers.some(id => id.equals(systemProcessManager));
    // want to see if the device processManagers array contains a reference to this manager

    let processDescription = {
      _id: systemProcessManager._id,
      name: systemProcessManager.name,
      description: systemProcessManager.description,
      active: processActive
    }
    managers.push(processDescription);
  });

  let role = res.user.role;

  res.render('device.ejs', { device: res.device, managers: managers, owner: ownerName, role:role});
});

router.post('/updateDetails/:name/:friendlyName', authenticateToken, getDeviceByDeviceName, async (req, res) => {

  // this is the friendly name that we would like to use - need to make sure it has 
  // not already been entered - if it has we will add a unique number on the end

  let orignalFriendlyName = req.params.friendlyName;
  let editedFriendlyName = req.body.friendlyName;
  let owner = res.user;

  let proposedFriendlyName;

  if (editedFriendlyName == orignalFriendlyName) {
    // If the friendly name hasn't been edited we just write it back again
    proposedFriendlyName = orignalFriendlyName;
  }
  else{
    // Check to make sure that the user hasn't entered a name that
    // clashes with an existing one
    proposedFriendlyName = await validateFriendlyName(editedFriendlyName,owner._id);
  }

  await res.device.updateOne(
    {
      friendlyName: proposedFriendlyName,
      bootCommands: req.body.bootCommands,
      description: req.body.description,
      tags: req.body.tags
    }
  );
  res.redirect('/devices/' + res.device.name);
})


router.get('/moveToNewOwner/:device_id', authenticateToken, async function (req, res) {

  let device_id = req.params.device_id;

  let device = await Device.findOne(
      { _id: device_id }
  );

  let users;

  if(device.owner){
    owner = await User.findOne({ _id: device.owner });
    users = await buildUserDescriptions(owner._id, owner.name);
  }
  else{
    users = await buildUserDescriptions();
  }

  res.render("deviceMove.ejs", { device: device, users: users });
});

router.post('/moveToNewOwner/:device_id', authenticateToken, async function (req, res) {

  let owner_id = req.body.user;

  let device_id = req.params.device_id;

  try {

      let device = await Device.findOne(
          { _id: device_id }
      );

      await device.updateOne(
          { owner: owner_id }
      );
  }
  catch (error) {
      menuPage(
          "Device move",
          `Move failed: ${error}`,
          [
              { description: "Continue", route: "/deviceSelect" }
          ],
          res
      );
  }

  menuPage(
      "Device move",
      "Move completed successfully",
      [
        { description: "Continue", route: "/deviceSelect" }
      ],
      res
  );
});

module.exports = router;