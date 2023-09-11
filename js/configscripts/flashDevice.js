var device = null;
var flashConnected = false;
var terminal = null;
var hostAddress;

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
      { buttonText: "Skip", buttonDest: doSetupDevice }
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
  }
}

async function doStart() {
  console.log("starting");
  // get the name of the web host
  hostAddress = window.location.origin;
  await selectStage(stages.ConnectUSB);
}

async function doConnectToDevice() {
  await selectStage(stages.ConnectToDevice);
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

async function doSetupDevice(){
  window.location.replace(`${hostAddress}hardware/setupDevice`);
}

async function doStartFlash() {
  // Do the flash - this releases the serial port when it has finished

  let flashResult = await doFlash();

  if (flashResult) {
    // now go off to set up the wifi and device name
    window.location.replace(`${hostAddress}hardware/setupDevice`);
  }
  else {
    selectStage(stages.ConnectFailed);
  }
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

