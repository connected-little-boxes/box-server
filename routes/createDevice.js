const { response } = require('express');
const express = require('express');
const router = express.Router();
const Device = require('../models/device');
const Manager = require('../manager');
const authenticateToken = require('../_helpers/authenticateToken');

// define the home page route
router.get('/', authenticateToken, async function (req, res) {

    res.render("createDevice.ejs", { name: res.user.name });
});
  
module.exports = router;
