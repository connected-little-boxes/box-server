var device = null;
var flashConnected = false;
var terminal = null;
let hostAddress;

let settingsURL;

var stage;
var consoleIO;

const stages = {
  ConnectUSB: {
    description: ["*Plug into the usb socket",
      `You'll need a usb cable to connect your device to your computer. When you plug it the computer should recognise it automatically and install the drivers. If it doesn't you may have to install them by hand. `,
      `In Windows you can check in Device Manager to make sure that the device is working OK. Click the Windows Start button and search for 'Device' and then select the Device Manager from the menu. If all is well you should see your device appear.`,
      "Next you need to connect your device to the browser. Press device plugged in when your device is plugged in and dialogue box will appear inviting you to select the device to work with.",
      `Once the device has been selected the configuration will begin.`
    ],
    inputFields: [],
    buttons: [
      { buttonText: "Device plugged in", buttonDest: doAttemptConnection }
    ]
  },
  BoxConfig: {
    description: ["*Configure Device",
      `Some settings are stored securely in the device. Other settings will be downloaded from the internet and used to connect your device to the server.`,
      `You don't have to set up all the WiFi credentials, but they will be useful if you take the device to a new location or want to connect your box to your phone.`,
      `You won't see any of the password values, but you can set new ones by entering them into the box`,
      `Press Submit when you have finished`
    ],
    inputFields: [
      { displayName: "Device Name", deviceName: "friendlyName", type: "text", allowEmpty: false, loadType: "fromDevice" },
      { displayName: "WiFi SSID 1", deviceName: "wifissid1", type: "text", allowEmpty: false, loadType: "fromDevice" },
      { displayName: "WiFi Password 1", deviceName: "wifipwd1", type: "password", allowEmpty: true, loadType: "fromDevice" },
      { displayName: "WiFi SSID 2", deviceName: "wifissid2", type: "text", allowEmpty: true, loadType: "fromDevice" },
      { displayName: "WiFi Password 2", deviceName: "wifipwd2", type: "password", allowEmpty: true, loadType: "fromDevice" },
      { displayName: "WiFi SSID 3", deviceName: "wifissid3", type: "text", allowEmpty: true, loadType: "fromDevice" },
      { displayName: "WiFi Password 3", deviceName: "wifipwd3", type: "password", allowEmpty: true, loadType: "fromDevice" },
      { displayName: "WiFi SSID 4", deviceName: "wifissid4", type: "text", allowEmpty: true, loadType: "fromDevice" },
      { displayName: "WiFi Password 4", deviceName: "wifipwd4", type: "password", allowEmpty: true, loadType: "fromDevice" },
      { displayName: "Number of X pixels", deviceName: "noofxpixels", type: "number", allowEmpty: false, loadType: "fromDevice" },
      { displayName: "Number of Y pixels", deviceName: "noofypixels", type: "number", allowEmpty: false, loadType: "fromDevice" }
    ],
    buttons: [
      { buttonText: "Submit", buttonDest:   doConfigBox }
    ]
  },
  ConnectFailed: {
    description: ["*Connect failed",
      `The connection to your device seems to have failed`,
      `Make sure that it is connected correctly and that no other program (for example serial terminal program) is using the device.`,
      "Press Retry Connection to try again."],
    inputFields: [],
    buttons: [
      { buttonText: "Retry", buttonDest: doAttemptConnection }
    ]
  },
  ConfigSuccess: {
    description: ["*Configuration complete",
      'The device has been configured as a Connected Little Box.',
      'You will find it listed in your devices.'],
    inputFields: [],
    buttons: [
      { buttonText: "Exit ", buttonDest: () => { window.location.replace("/");}  }
    ]
  }
}

async function doStart() {
  console.log("starting");
  // get the name of the web host
  hostAddress = window.location.origin;
  settingsURL = `${hostAddress}/connect/initialSettings.json`;
  await selectStage(stages.ConnectUSB);
}

async function doConnectToDevice() {
  await selectStage(stages.ConnectToDevice);
}

async function doReconfigurePixels() {
  await selectStage(stages.PixelConfig);
}

async function doTestPassed() {
  await selectStage(stages.ConfigSuccess);
}

async function doTestPixels() {
  // Turn all the lights blue
  let result = await consoleIO.performCommand(`{"process":"pixels","command":"setnamedcolour","colourname":"blue"}`);
  addLineToLog("Set pixels to blue");
  await selectStage(stages.PixelTest);
}

async function doAttemptConnection() {
  connectConIOandSelectStage(stages.BoxConfig);
}

async function doConfigBox() {

  let fields = stages.BoxConfig.inputFields;
  let commandList = [];
  let userEnteredFriendlyName;

  for (let i = 0; i < fields.length; i++) {
    let field = fields[i];
    let inputElement = document.getElementById(field.deviceName);
    let value = inputElement.value;
    if (value == "") {
      if (!field.allowEmpty) {
        alert(`Please fill in ` + field.displayName);
        return;
      }
    }
    if (field.loadType) {
      let loadType = field.loadType;
      switch (loadType) {
        case "localValue":
          break;
        case "fromDevice":
          if (field.deviceName == "friendlyName") {
            userEnteredFriendlyName = value;
          }
          if ((field.type != "password") ||
            (field.type == "password" && value != "")) {
            let command = field.deviceName + "=" + value;
            commandList.push(command);
          }
          break;
      }
    }
  }

  addLineToLog("Connecting to device");

  // now get the rest of the settings from the server to send to the device

  addLineToLog("Getting device name");

  let deviceName = await consoleIO.performCommand("mqttdevicename");

  let fullURL = `${hostAddress}/connect/initialSettings.json/${deviceName}/${userEnteredFriendlyName}`;

  addLineToLog("Getting setting information from the server");

  let settings = await getFromServer(fullURL);

  if (!settings) {
    window.location.replace(`${hostAddress}hardware/setupDevice`);
  }

  for (let i = 0; i < settings.length; i++) {
    let setting = settings[i];
    let command = setting.deviceName + "=" + setting.value;
    commandList.push(command);
  }

  commandList.push("wifiactive=yes");
  commandList.push("mqttactive=yes");

  addLineToLog("Sending settings to the device");

  await consoleIO.performCommands(commandList);
  addLineToLog("Device configured");

  addLineToLog("Resetting device");
  await consoleIO.performCommand("restart");
  addLineToLog("Device reset");

  selectStage(stages.ConfigSuccess);
}

function doGoHome() {
  window.location.replace("/");
}
