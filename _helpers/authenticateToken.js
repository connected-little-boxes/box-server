const jwt = require('jsonwebtoken');
const User = require('../models/user');

const jwtExpirySeconds = 6000;
const jwtRenewSeconds = 30;

async function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  // if the cookie is not set, return an unauthorized error
  if (!token) {
    console.log("Authentication: Token cookie not found");
    res.redirect('/login');
    return;
  }

  if(token == "logged out"){
    console.log("Authentication: Token cookie logged out");
    res.redirect('/login');
    return;
  }
  
  //console.log("Got a token:", token);

  var payload;

  try {
    // Parse the JWT string and store the result in `payload`.
    // Note that we are passing the key in this method as well. This method will throw an error
    // if the token is invalid (if it has expired according to the expiry time we set on sign in),
    // or if the signature does not match
    payload = jwt.verify(token, process.env.ACTIVE_TOKEN_SECRET);
  } catch (e) {
    console.log("Authentication: jwt verify failed", e.message);
    res.redirect('/login');
    return;
  }

  // got the token - use the ID in the token to look up the user
  const user = await User.findOne({ _id: payload.id });

  if (user === null) {
    console.log("Authentication: User not found");
    res.redirect('/login');
    return;
  }
  
  // Put in the response for later code to use
  res.user = user;

  // now handle refresh - see how much time we have left
  // on this token...

  const nowUnixSeconds = Math.round(Number(new Date()) / 1000);

  const tokenSecondsLeft = payload.exp - nowUnixSeconds;

  // console.log(`Token seconds left:${tokenSecondsLeft}`);
  if (tokenSecondsLeft < jwtRenewSeconds) {
    console.log("Authentication: Making a new token..");
    // need to make a new token
    userDetails = {
      id: user.id
    };

    const accessToken = jwt.sign(
      userDetails,
      process.env.ACTIVE_TOKEN_SECRET,
      {
        algorithm: "HS256",
        expiresIn: jwtExpirySeconds,
      });

    //console.log(`Made a token:${accessToken}`);
    res.cookie("token", accessToken, { maxAge: jwtExpirySeconds * 1000 });
  }
  next();
}

module.exports = authenticateToken;