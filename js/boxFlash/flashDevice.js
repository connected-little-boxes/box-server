var device = null;
let chip = null;
var flashConnected = false;
var hostAddress;
let transport;
let esploader;
let file1 = null;
let connected = false;
const fileArray = [];

var stage;
var consoleIO;

import * as esptooljs from "./bundle.js";
const ESPLoader = esptooljs.ESPLoader;
const Transport = esptooljs.Transport;
const logOutput = document.getElementById('logOutput');

let espLoaderTerminal = {
  clean() {
    logOutput.value = "";
  },
  writeLine(data) {
    logOutput.value = logOutput.value + data + '\n';
    logOutput.scrollTop = logOutput.scrollHeight;
  },
  write(data) {
    logOutput.value = logOutput.value + data;
    logOutput.scrollTop = logOutput.scrollHeight;
  }
}

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
      { buttonText: "Connect to device", buttonDest: doAttemptDeviceConnection }
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
      { buttonText: "Retry", buttonDest: doAttemptDeviceConnection }
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

async function doAttemptDeviceConnection() {
  if (device === null) {
    device = await navigator.serial.requestPort({});

    transport = new Transport(device);
  }
  try {
    esploader = new ESPLoader(transport, 115200, espLoaderTerminal);
    connected = true;
    chip = await esploader.main_fn();
  } catch (e) {
    console.error(e.message);
    console.log(`Error: ${e.message}`);
  }

  let nextState;

  if (connected) {
    console.log('Connected to device :' + chip);
    nextState = stages.StartFlash;
  }
  else {
    console.log('Connect failed');
    nextState = stages.ConnectFailed;
  }
  await selectStage(nextState);
}

async function doSetupDevice() {
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

async function ESP8266flashFromUrl(url) {

  let fileArray = [];

  return new Promise(async (kept, broken) => {
    let filename = url.slice(url.lastIndexOf('/') + 1);
    espLoaderTerminal.writeLine(`Flashing file:${filename}`);

    fetch(url, {
      method: 'GET',
      responseType: 'arraybuffer', // Treat the response as binary data
    }).then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.arrayBuffer();
      })
      .then(async data => {
        // Handle the binary data here
        const binaryData = new Uint8Array(data);
        let binaryString = "";
        for(let i=0; i<binaryData.length;i++)
        {
          let ch = String.fromCharCode(binaryData[i]);
          binaryString += ch;
        }
        let temp = url.slice(url.lastIndexOf('_') + 1);
        let addressText = temp.slice(0, temp.indexOf('.'));
        let loadAddress = parseInt(addressText);
        fileArray.push({ data: binaryString, address: loadAddress });
        try {
          await esploader.write_flash(
            fileArray,
            'keep',
            undefined,
            undefined,
            false,
            true,
            (fileIndex, written, total) => {
              console.log("Progress:" + (written / total) * 100);
            },
            (image) => CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)),
          );
          kept("Worked OK");
        } catch (e) {
          console.error(e);
          term.writeln(`Error: ${e.message}`);
          broken(e.message);
        }
      })
      .catch(error => {
        console.error('Error fetching the network file:', error);
      });
  });
}

async function doFlash() {
  await ESP8266flashFromUrl('/firmware/flash/esp8266/firmware_0x0000.bin');

  return true;
}

function doGoHome() {
  window.location.replace("/");
}

window.onload = async function () {
  await doStart();
}
