const { response } = require('express');
const RugbyMatch = require('../models/RugbyMatch');

// Must be used after authenticateToken as it uses the user record which is added to res 

async function getRugbyMatchByName(req, res, next) {

  let matchName = req.params.matchName;

  let rugbyMatch;

  try {

    rugbyMatch =  await RugbyMatch.findOne({ name: matchName });

    if (rugbyMatch === null) {
      return res.status(404).json({ message: `getRugbyMatchByName: cannot find match ${req.params.matchName}` });
    }
  }
  catch (err) {
    res.status(500).json({ message: err.message });
    return;
  }

  res.rugbyMatch = rugbyMatch;

  next();
}

module.exports = getRugbyMatchByName;