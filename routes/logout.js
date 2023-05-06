const { response } = require('express');
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.get('/', (req, res) => {
    res.cookie("token", "invalid");
    res.render('logout.ejs')
});


module.exports = router;
