const { response } = require('express');
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');

router.get('/', (req, res) => {
    res.render('register.ejs')
});

router.post('/', async (req, res) => {
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
        res.redirect('/login');
    } catch (err) {
        console.log("err:", err.message);
        res.redirect('/register');
    }
})

module.exports = router;
