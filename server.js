require('dotenv').config()

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

const port = 3000;

const mongoose = require('mongoose');

const Manager = require('./manager');
const authenticateToken = require('./_helpers/authenticateToken');

var devices = require('./routes/devices');
var login = require('./routes/login');
var register = require('./routes/register');
var users = require('./routes/users');

console.log("Starting up...");

const mgr = Manager.getActiveManger();

mgr.startServices();

console.log("Services now running....");

app.get('/', authenticateToken, async (req, res) => {

  console.log("building index page");

  userDevices = await Device.find();
  res.render('index.ejs', { name: res.user.name, devices: userDevices });
});

app.use('/devices', devices);
app.use('/users', users);
app.use('/login', login);
app.use('/register', register)

app.listen(port, () => console.log("Server started"));
