const { response } = require('express');
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const authenticateToken = require('../_helpers/authenticateToken');
const menuPage = require('../_helpers/menuPage');

router.get('/', authenticateToken, (req, res) => {
    res.render('changePassword.ejs', { name: res.user.name });
});

router.post('/', authenticateToken, async (req, res) => {

    let user = res.user;
    let enteredPassword = req.body.enteredPassword;
    let newPassword = req.body.newPassword;
    let repeatPassword = req.body.repeatPassword;

    let message = "";

    let password = user.password;

    const validPassword = await bcrypt.compare(enteredPassword, user.password);

    if (!validPassword) {
        message = "Incorrect password entered";
    }
    else {
        if (newPassword != repeatPassword) {
            message = "Repeat password and new password do not match";
        }
        else {
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedNewPassword;
            await user.save();
            message = "Password changed";
        }
    }

    menuPage(
        "Password change",
        message,
        [
            { description: "Continue", route: "/" }
        ],
        res
    );
});

module.exports = router;
