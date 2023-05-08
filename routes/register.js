const { response } = require('express');
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const authenticateToken = require('../_helpers/authenticateToken');

router.get('/', authenticateToken, (req, res) => {
    res.render('register.ejs', { role: res.user.role });
});

router.post('/', authenticateToken, async (req, res) => {

    if(res.user.role != "admin"){
        res.redirect('/register');
        return;
    }

    try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser != null) {
            console.log("User already registered");
            res.redirect('/');
            return;
        }
    }
    catch (err) {
        console.log("Register failed:", err.message);
        res.redirect('../routes/login');
        return;
    }

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User(
            {
                name: req.body.name,
                password: hashedPassword,
                role: 'user',
                email: req.body.email
            });
        await user.save();
        console.log("User successfully registered:", req.body.email);
        res.redirect('/registered');
    } catch (err) {
        console.log("err:", err.message);
        res.redirect('/register');
    }
})

module.exports = router;
