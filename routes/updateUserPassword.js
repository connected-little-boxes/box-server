const { response } = require('express');
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const authenticateToken = require('../_helpers/authenticateToken');

router.get('/', authenticateToken, (req, res) => {
    res.render('updateUserPassword.ejs', { role: res.user.role, message:"" });
});

router.post('/', authenticateToken, async (req, res) => {

    if(res.user.role != "admin"){
        res.redirect('/');
        return;
    }

    try {
        const existingUser = await User.findOne({ email: req.body.email });

        if (existingUser == null) {
            console.log("No user with that name");
            res.render('updateUserPassword.ejs', { role: res.user.role, message:`No user with the email ${req.body.email}` });
            return;
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        await existingUser.updateOne(
            {
                password: hashedPassword,
            }
          );
        
        console.log("Password changed:", req.body.email);
        res.render('updateUserPassword.ejs', { role: res.user.role, message:`Password changed successfully` });
    } catch (err) {
        console.log("err:", err.message);
        res.render('updateUserPassword.ejs', { role: res.user.role, message:`Change failed: ${err.message}` });
    }
})

module.exports = router;
