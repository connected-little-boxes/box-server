const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const User = require('./models/user');
const Device = require('./models/device');

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

const port = process.env.PORT || 3000;

const mongoose = require('mongoose');

const Manager = require('./manager');
const authenticateToken = require('./_helpers/authenticateToken');

var devices = require('./routes/devices');
var login = require('./routes/login');
var logout = require('./routes/logout');
var register = require('./routes/register');
var registered = require('./routes/registered');
var users = require('./routes/users');
var terminal = require('./routes/terminal');

console.log("Starting up...");

const mgr = Manager.getActiveManger();

mgr.startServices().then(() => {

  console.log("Services now running....");

  app.get('/', authenticateToken, async (req, res) => {
    userDevices = await Device.find();
    res.render('index.ejs', { name: res.user.name, role: res.user.role, devices: userDevices });
  });

  app.use('/devices', devices);
  app.use('/users', users);
  app.use('/login', login);
  app.use('/logout', logout);
  app.use('/register', register);
  app.use('/registered', registered);
  app.use('/terminal', terminal);

  console.log(`Server listening on:${port}`);

  app.listen(port, () => console.log("Server started"));
});

