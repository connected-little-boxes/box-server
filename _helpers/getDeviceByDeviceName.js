const { response } = require('express');
const Device = require('../models/device');

async function getDeviceByDeviceName(req, res, next) {
    let device;
  
    try {
  
      device = await Device.findOne({ name: req.params.name });
  
      if (device === null) {
        return res.status(404).json({ message: 'Cannot find device' });
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