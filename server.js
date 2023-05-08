const express = require('express');
const path = require('path');
const favicon = require('express-favicon');
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

const Manager = require('./manager');
const authenticateToken = require('./_helpers/authenticateToken');

var devices = require('./routes/devices');
var login = require('./routes/login');
var logout = require('./routes/logout');
var register = require('./routes/register');
var registered = require('./routes/registered');
var users = require('./routes/users');
var terminal = require('./routes/terminal');
var deviceSelect = require('./routes/deviceSelect');
var lightShow = require('./routes/lightShow');
var hardware = require('./routes/hardware');
var command = require('./routes/command');
var changePassword = require('./routes/changePassword');
var processManager = require('./routes/processManager');

console.log("Starting up...");

const mgr = Manager.getActiveManger();

mgr.startServices().then(() => {

  console.log("Services now running....");

  app.get('/', authenticateToken, async (req, res) => {
    userDevices = await Device.find();
    res.render('index.ejs', { name: res.user.name, role: res.user.role, devices: userDevices, 
      host: process.env.HOST_ADDRESS });
  });

  app.use('/js', express.static('js'));
  app.use('/devices', devices);
  app.use('/users', users);
  app.use('/login', login);
  app.use('/logout', logout);
  app.use('/register', register);
  app.use('/registered', registered);
  app.use('/terminal', terminal);
  app.use('/deviceSelect', deviceSelect);
  app.use('/lightShow', lightShow);
  app.use('/hardware', hardware);
  app.use('/command', command);
  app.use('/processManager', processManager);
  app.use('/changePassword',changePassword);

  app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));  
  console.log(`Server listening on:${port}`);

  app.listen(port, () => console.log("Server started"));
});

