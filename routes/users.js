const { response } = require('express');
const express = require('express');
const router = express.Router();
const Owner = require('../models/user');

router.post('/', async function(req,res) {
  const user = new User({
    firstName: req.body.firstName,
    surname: req.body.surname,
    role:'user',
    email: req.body.email
  });
})

router.get('/', async function (req, res) {
  try {
    const users = await Users.find();
    res.json(users);
  }
  catch (err) {
    res.status(500).json({ message: err.message });
  }
})

router.get('/:id', getUserByID, async function (req, res) {
  try {
    res.json(res.device);
  }
  catch (err) {
    res.status(500).json({ message: err.message });
  }
})

async function getUserByID(req, res, next) {
  let owner;

  try {
    user = await User.findById(req.params.id);

    if (user == null) {
      return res.status(404).json({ message: 'Cannot find user' });
    }
  }
  catch (err) {
    res.status(500).json({ message: err.message });
  }

  response.user = user;
  next();
}


module.exports = router;