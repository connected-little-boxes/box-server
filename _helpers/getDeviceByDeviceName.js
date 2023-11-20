const { response } = require('express');
const Device = require('../models/device');

// Must be used after authenticateToken as it uses the user record which is added to res 

async function getDeviceByDeviceName(req, res, next) {

  let user = res.user;

  let device;

  try {

    device = await Device.findOne({ name: req.params.name });

    if (device === null) {
      return res.status(404).json({ message: `GetDeviceByName: cannot find device ${req.params.name}` });
    }

    if (device.owner) {
      let owner_id = device.owner;
      let user_id = user._id;

      if (!owner_id.equals(user_id)) {
        if (user.role != "admin") {
          return res.status(404).json({ message: `GetDeviceByName: user does not own the device ${req.params.name}` });
        }
      }
    }
  }
  catch (err) {
    res.status(500).json({ message: err.message });
    return;
  }

  res.device = device;

  next();
}

module.exports = getDeviceByDeviceName;