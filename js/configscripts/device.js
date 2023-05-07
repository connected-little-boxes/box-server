var device = null;
var flashConnected = false;
var terminal = null;
var hostAddress;

var settingsURL;

var stage;
var consoleIO;

const stages = {
  ConnectUSB: {
    description: ["*Plug into the usb socket",
      `You'll need a usb cable to connect your device to your computer. When you plug it the computer should recognise it automatically and install the drivers. If it doesn't you may have to install them by hand. `,
      `In Windows you can check in Device Manager to make sure that the device is working OK. Click the Windows Start button and search for 'Device' and then select the Device Manager from the menu. If all is well you should see your device appear.`,
      "Press device plugged in when your device is plugged in.",
      `If you have already flashed the firmware and just want to configure a device you can press Skip`
    ],
    inputFields: [],
    buttons: [
      { buttonText: "Device plugged in", buttonDest: doConnectToDevice },
      { buttonText: "Skip", buttonDest: doSkipToWiFi }
    ]
  },
  ConnectToDevice: {
    description: ["*Connect to device for flashing",
      `Next we will connect your device to the browser. Press the Connect Device button below when you are ready.`,
      `A dialog box will pop up inviting you to select a device to program.`,
      "Press Connect to device when you are ready."
    ],
    inputFields: [],
    buttons: [
      { buttonText: "Connect to device", buttonDest: doAttemptESPmanagerConnection }
    ]
  },
  StartFlash: {
    description: ["*Start the flash",
      `Now that you are connected you can start the process.`,
      `Note that this will take a while. The log window will show the progress.`,
      `If the process stops at the 'sync' part this might be because your device has not reset.`,
      `You can try pressing the reset button on your device, reloading this page in your browser and trying again.`,
      `We've not tested the process with every possible ESP device, and some don't respond to our reset signals. However, if you are using a Wemos device it should just work.`,
      "Press Start Flash when you are ready."],
    inputFields: [],
    buttons: [
      { buttonText: "Start Flash", buttonDest: doStartFlash }
    ]
  },
  ConnectFailed: {
    description: ["*Connect failed",
      `The connection to your device seems to have failed`,
      `Make sure that it is connected correctly.`,
      "Press Retry Connection to try again."],
    inputFields: [],
    buttons: [
      { buttonText: "Retry", buttonDest: doAttemptESPmanagerConnection }
    ]
  },
  ConfigWiFi: {
    description: ["*Configure Device",
      `Enter the device friendly name and the settings that the device will use to connect to the WiFi.`,
      `They are stored securely in the device.`,
      `Other settings will be downloaded from the internet and used to connect your device to the server.`
    ],
    inputFields: [
      { displayName: "Device Name", deviceName: "friendlyName", type: "text", allowEmpty: false, loadType: "localValue" },
      { displayName: "WiFi SSID", deviceName: "wifissid1", type: "text", allowEmpty: false, loadType: "fromDevice" },
      { displayName: "WiFi Password", deviceName: "wifipwd1", type: "password", allowEmpty: false, loadType: "fromDevice" }
    ],
    buttons: [
      { buttonText: "Submit", buttonDest: doConfigWiFi }
    ]
  },
  ConfigSuccess: {
    description: ["*Configuration complete",
      'The device has been configured as a Connected Little Box.',
      'You will find it listed in your devices.'],
    inputFields: [],
    buttons: [
      { buttonText: "Done", buttonDest: doGoHome }
    ]
  }
}

async function doStart(host) {
  console.log("starting");
  hostAddress = host;
  settingsURL = hostAddress + "createDevice/networkSettings.json"

  await selectStage(stages.ConnectUSB);
}

async function doConnectToDevice() {
  await selectStage(stages.ConnectToDevice);
}

async function doConfigWiFi() {

  let fields = stages.ConfigWiFi.inputFields;
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
          userEnteredFriendlyName = value;
          break;
        case "fromDevice":
          let command = field.deviceName + "=" + value;
          commandList.push(command);
          break;
      }
    }
  }

  addLineToLog("Connecting to device");

  // now get the rest of the settings from the server to send to the device

  addLineToLog("Getting device name");

  let deviceName = await consoleIO.performCommand("mqttdevicename");

  let fullURL = `${settingsURL}/${deviceName}/${userEnteredFriendlyName}`;

  addLineToLog("Getting setting information from the server");

  getFromServer(fullURL, async settingsJSON => {
    let settings = JSON.parse(settingsJSON);
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

  });
}

async function connectConIOandSelectStage(stage) {
  if (consoleIO == null) {

    consoleIO = new ConsoleIO();

    let result;

    result = await consoleIO.connectToSerialPort();

    if (result != "") {
      alert("Could not continue: " + result);
      selectStage(stages.ConnectFailed);
      return false;
    }
    else {
      consoleIO.startSerialPump(handleIncomingText);
    }
  }
  selectStage(stage);
}

async function doSkipToWiFi() {
  connectConIOandSelectStage(stages.ConfigWiFi);
}

async function doAttemptESPmanagerConnection() {

  let worked = await connectESPManager();
  if (worked) {
    selectStage(stages.StartFlash);
  }
  else {
    selectStage(stages.ConnectFailed);
  }
}

async function doStartFlash() {
  // Do the flash - this releases the serial port when it has finished

  await doFlash();

  // need to connect a ConsoleIO to the serial port for 
  // subsequent commands

  await connectConIOandSelectStage(stages.ConfigWiFi);
}

function addLineToLog(message) {
  let output = document.getElementById('logOutput');
  output.value = output.value + message + '\n';
  output.scrollTop = output.scrollHeight;
}

function addTextToTerminal(text) {
  let output = document.getElementById('terminal');
  output.value = output.value + text;
  output.scrollTop = output.scrollHeight;
}

async function connectESPManager() {
  console.log("Connecting..");

  if (device === null) {
    device = new ESPManager(addLineToLog);
  }

  let { worked, message } = await device.connect();

  if (!worked) {
    alert(message);
    flashConnected = false;
    return false;
  }
  else {
    flashConnected = true;
    return true;
  }
}

async function doFlash() {

  // Automatically connect if we have not been connected already

  if (!flashConnected) {
    let result = await connectESPManager();
    if (!result) {
      return false;
    }
  }

  console.log("Flashing..");

  let { worked, message } = await device.flashDevice();

  console.log(message);

  if (!worked) {
    alert(message);
  }

  flashConnected = false;
  return true;
}

function doGoHome() {
  window.location.replace("/");
}
