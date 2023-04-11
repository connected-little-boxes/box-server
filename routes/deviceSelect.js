const { response } = require('express');
const express = require('express');
const router = express.Router();
const Device = require('../models/device');
const Manager = require('../manager');
const authenticateToken = require('../_helpers/authenticateToken');

// define the home page route
router.get('/', authenticateToken, async function (req, res) {
  let userDevices = await Device.find({ owner: { $eq: res.user._id } });
  res.render('deviceSelect.ejs', { name: res.user.name, role: res.user.role, devices: userDevices });
})

router.post('/', authenticateToken, async (req, res) => {
  console.log(`filtering on ${req.body.filter}`);

  const regex = new RegExp(req.body.filter, 'i');

  let userDevices = await Device.find({
    $and:
      [
        { owner: { $eq: res.user._id } },
        {
          $or: [
            { name: { $regex: regex } },
            { friendlyName: { $regex: regex } }
          ]
        }
      ]
  });
  res.render('deviceSelect.ejs', { name: res.user.name, role: res.user.role, devices: userDevices });
})

module.exports = router;