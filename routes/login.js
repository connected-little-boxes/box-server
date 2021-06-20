const { response } = require('express');
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.get('/', (req, res) => {
    res.render('login.ejs')
});

const jwtExpirySeconds = 300

router.post('/', async (req, res) => {
    console.log("Doing the login..");
    try {
        // first find the user
        const existingUser = await User.findOne({ email: req.body.email });

        if (existingUser == null) {
            console.log("Login fail no user registered for:", req.body.email);
            res.redirect('/');
            return;
        }
        else {
            // we have the user - now check the password
            const validPassword = await bcrypt.compare(req.body.password, existingUser.password);
            if (validPassword) {
                console.log("Got a valid password");
                // now make the jwt token to send back to the browser
                console.log("user:", existingUser.id, existingUser._id, existingUser.role);
                userDetails = {
                    id: existingUser.id
                }
                const accessToken = jwt.sign(
                    userDetails, 
                    process.env.ACTIVE_TOKEN_SECRET,
                    {
                        algorithm: "HS256",
                        expiresIn: jwtExpirySeconds,
                    });

                //console.log(`Made a token:${accessToken}`);
                
                res.cookie("token", accessToken, { maxAge: jwtExpirySeconds * 1000 });
                res.redirect('../');
                console.log("Sucessful login for:", req.body.email);
                return;
            }
            else {
                console.log("Login fail invalid password");
                res.redirect('/');
                return;
            }
        }
    }
    catch (err) {
        console.log(err.message);
        res.redirect('/');
        return;
    }
})

module.exports = router;
