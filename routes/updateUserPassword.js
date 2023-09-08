const { response } = require('express');
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const authenticateToken = require('../_helpers/authenticateToken');
const menuPage = require('../_helpers/menuPage');

router.get('/', authenticateToken, (req, res) => {
    res.render('updateUserPassword.ejs', { role: res.user.role, message: "" });
});

router.post('/', authenticateToken, async (req, res) => {

    if (res.user.role != "admin") {
        menuPage(
            "Password change",
            "Only admin users can change passwords",
            [
                { description: "Continue", route: "/" }
            ],
            res
        );
        return;
    }

    try {
        const existingUser = await User.findOne({ email: req.body.email });

        if (existingUser == null) {
            console.log("No user with that name");
            res.render('updateUserPassword.ejs', { role: res.user.role, message: `No user with the email ${req.body.email}` });
            return;
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        await existingUser.updateOne(
            {
                password: hashedPassword,
            }
        );

        console.log("Password changed:", req.body.email);

        menuPage(
            "Password change",
            "Password changed successfully",
            [
                { description: "Continue", route: "/" }
            ],
            res
        );
    } catch (err) {
        console.log("err:", err.message);
        menuPage(
            "Password change",
            `Password changed failed: ${err.message}`,
            [
                { description: "Continue", route: "/" }
            ],
            res
        );
    }
})

module.exports = router;
