const jwt = require('jsonwebtoken');
const User = require('../models/user');


async function authenticateToken(req, res, next) {
    const token = req.cookies.token;
  
    // if the cookie is not set, return an unauthorized error
    if (!token) {
      console.log("Token cookie not found");
      res.redirect('/login');
      return;
    }
  
    console.log("Got a token:", token);
  
    var payload;
  
    try {
      // Parse the JWT string and store the result in `payload`.
      // Note that we are passing the key in this method as well. This method will throw an error
      // if the token is invalid (if it has expired according to the expiry time we set on sign in),
      // or if the signature does not match
      payload = jwt.verify(token, process.env.ACTIVE_TOKEN_SECRET);
    } catch (e) {
      console.log("jwt failed", e.message);
      res.redirect('/login').end();
      return;
    }
  
    // got the token - use the ID in the token to look up the user
    const user = await User.findOne({ _id: payload.id });
  
    if (user === null) {
      console.log("User not found");
      res.redirect('/login');
      return;
    }
    res.user = user;
    next();
  } 
  
  module.exports = authenticateToken;  