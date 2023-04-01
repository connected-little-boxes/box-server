const express = require('express');
const router = express.Router();
const authenticateToken = require('../_helpers/authenticateToken');

// define the home page route
router.get('/', authenticateToken, async function (req, res) {

    res.render("configureWiFi.ejs", { name: res.user.name });
});
  
module.exports = router;
