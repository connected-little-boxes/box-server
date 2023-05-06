const { response } = require('express');
const express = require('express');
const router = express.Router();
const Device = require('../models/device');
const Manager = require('../manager');
const authenticateToken = require('../_helpers/authenticateToken');

router.post('/setLightColour', authenticateToken, async (req, res) => {

  mgr = Manager.getActiveManger();

  //await mgr.sendConsoleCommandToDevice(res.device.name, req.body.colourCommand);
  console.log(`Want colour:${req.body.colourCommand} for:${req.body.deviceTag}`);
 
  await mgr.setLightColours(req.body.deviceTag,req.body.colourCommand);

  res.redirect('/lightShow');
})

router.post('/setTimedTwinkle', authenticateToken, async (req, res) => {

  mgr = Manager.getActiveManger();

  await mgr.setLightsTimedTwinkle(req.body.deviceTag);

  res.redirect('/lightShow');
})

router.post('/setRandomLightColour', authenticateToken, async (req, res) => {

  mgr = Manager.getActiveManger();

  await mgr.setLightsTimedRandom(req.body.deviceTag);

  res.redirect('/lightShow');
})


router.post('/setWalkingLightPattern', authenticateToken, async (req, res) => {

  mgr = Manager.getActiveManger();

  await mgr.setWalkingLightPattern(req.body.deviceTag,req.body.colourPattern);

  res.redirect('/lightShow');
})


router.post('/setLightPattern', authenticateToken, async (req, res) => {

  mgr = Manager.getActiveManger();

  await mgr.setLightPattern(req.body.deviceTag,req.body.colourPattern);

  res.redirect('/lightShow');
})



// define the home page route
router.get('/', authenticateToken, async function (req, res) {
  userDevices = await Device.find();
  res.render('lightShow.ejs', { name: res.user.name, role: res.user.role, devices: userDevices });
})

module.exports = router;