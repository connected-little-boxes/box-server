const { response } = require('express');
const express = require('express');
const router = express.Router();
const Device = require('../models/device');
const Manager = require('../manager');
const authenticateToken = require('../_helpers/authenticateToken');

// define the home page route
router.get('/', authenticateToken, async function (req, res) {

  let userDevices;

  if (res.user.role == "admin") {
    userDevices = await Device.find();
  }
  else {
    userDevices = await Device.find({ owner: { $eq: res.user._id } });
  }

  userDevices.sort((a, b) => {
    let textA = (a.friendlyName ? a.friendlyName : a.name).toUpperCase();
    let textB = (b.friendlyName ? b.friendlyName : b.name).toUpperCase();
    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
  });

  res.render('deviceSelect.ejs', { name: res.user.name, role: res.user.role, devices: userDevices });
})

router.post('/', authenticateToken, async (req, res) => {

  let user = res.user;
  const regex = new RegExp(req.body.filter, 'i');

  let userDevices;

  if (res.user.role == "admin") {
    userDevices = await Device.find({ friendlyName: { $regex: regex } });
  }
  else {
    userDevices = await Device.find({
      $and:
        [
          { owner: { $eq: res.user._id } },
          {
            $or: [
              { friendlyName: { $regex: regex } }
            ]
          }
        ]
    });
  }

  userDevices.sort((a, b) => {
    let textA = (a.friendlyName ? a.friendlyName : a.name).toUpperCase();
    let textB = (b.friendlyName ? b.friendlyName : b.name).toUpperCase();
    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
  });

  res.render('deviceSelect.ejs', { name: res.user.name, role: res.user.role, devices: userDevices });
})

module.exports = router;