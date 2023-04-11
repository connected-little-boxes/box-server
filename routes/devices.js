const { response } = require('express');
const express = require('express');
const router = express.Router();
const Device = require('../models/device');
const Manager = require('../manager');
const authenticateToken = require('../_helpers/authenticateToken');
const getDeviceByDeviceName = require('../_helpers/getDeviceByDeviceName');


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

router.post('/sendconsolecommand/:name', authenticateToken, async (req, res) => {
  console.log("send json command pressed for:",res.device.name," command:", req.body.consoleCommand);

  mgr = Manager.getActiveManger();

  await mgr.sendConsoleCommandToDevice(res.device.name, req.body.consoleCommand);

  res.redirect('/devices/' + res.device.name);
})

router.post('/sendjsoncommand/:name', authenticateToken, getDeviceByDeviceName,
  async (req, res) => {
    console.log("send json command pressed for:",res.device.name," command:", req.body.jsonCommand);
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

    console.log("doing the check thingy");

    res.redirect('/devices/' + res.device.name);
  })


  router.get('/otaUpdate/:name', authenticateToken, getDeviceByDeviceName,
  async (req, res) => {

    mgr = Manager.getActiveManger();

    await mgr.startDeviceOTAupdate(res.device.name);

    res.redirect('/devices/' + res.device.name);
  })


router.get('/:name', authenticateToken, getDeviceByDeviceName, async (req, res) => {

  res.render('device.ejs', { device: res.device });
})

router.post('/:name', authenticateToken, getDeviceByDeviceName, async (req, res) => {
  console.log("updating the device");
  await res.device.updateOne(
    {
      friendlyName: req.body.friendlyName,
      bootCommands: req.body.bootCommands,
      description: req.body.description,
      tags: req.body.tags
    }
  );
  res.redirect('/devices/' + res.device.name);
})

module.exports = router;