const { response } = require('express');
const Device = require('../models/device');

// Must be used after authenticateToken as it uses the user record which is added to res 

async function getOpenDeviceByDeviceGUID(req, res, next) {

  let deviceGuid = req.params.deviceGuid;
  let device;

  try {

    device = await Device.findOne({ guid: deviceGuid });

    if (device === null) {
      return res.status(404).json({ message: `getOpenDeviceByDeviceGUID: cannot find device ${deviceGuid}` });
    }
  }
  catch (err) {
    res.status(500).json({ message: err.message });
    return;
  }

  res.device = device;

  next();
}

module.exports = getOpenDeviceByDeviceGUID;