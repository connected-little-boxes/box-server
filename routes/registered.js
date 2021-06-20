const { response } = require('express');
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const authenticateToken = require('../_helpers/authenticateToken');

router.get('/', authenticateToken, (req, res) => {
    res.render('registered.ejs', { role: res.user.role })
});

module.exports = router;
