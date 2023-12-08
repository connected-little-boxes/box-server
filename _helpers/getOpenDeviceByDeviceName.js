const { response } = require('express');
const Device = require('../models/device');

// Must be used after authenticateToken as it uses the user record which is added to res 

async function getOpenDeviceByDeviceName(req, res, next) {

  let device;

  try {

    device = await Device.findOne({ name: req.params.name });

    if (device === null) {
      return res.status(404).json({ message: `GetOpenDeviceByName: cannot find device ${req.params.name}` });
    }
  }
  catch (err) {
    res.status(500).json({ message: err.message });
    return;
  }

  res.device = device;

  next();
}

module.exports = getOpenDeviceByDeviceName;