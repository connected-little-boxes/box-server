const { response } = require('express');
const express = require('express');
const router = express.Router();
const Device = require('../models/device');
const Manager = require('../manager');
const authenticateToken = require('../_helpers/authenticateToken');

// define the home page route
router.get('/', authenticateToken, async function (req, res) {
  userDevices = await Device.find({owner:{$eq:res.user._id}});
  res.render('deviceSelect.ejs', { name: res.user.name, role: res.user.role, devices: userDevices });
})

module.exports = router;