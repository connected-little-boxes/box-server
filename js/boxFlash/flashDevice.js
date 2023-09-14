var device = null;
let chip = null;
var hostAddress;
let transport;
let esploader;
let connected = false;
const fileArray = [];


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
      "Click device plugged in when your device is plugged in.",
      `If you have already flashed the firmware and just want to configure a device you can press Skip`
    ],
    inputFields: [],
    buttons: [
      { buttonText: "Device plugged in", buttonDest: doConnectToDevice }    ]
  },
  ConnectToDevice: {
    description: ["*Connect to device for flashing",
      `Next we will connect your device to the browser. Press the Connect Device button below when you are ready.`,
      `A dialog box will pop up inviting you to select a device to program.`,
      "Click Connect to device when you are ready."
    ],
    inputFields: [],
    buttons: [
      { buttonText: "Connect to device", buttonDest: doAttemptDeviceConnection }
    ]
  },
  StartFlash: {
    description: ["*Start the flash",
      `Now that you are connected you can start the process.`,
      `Note that this will take a while. The window below will show the progress.`,
      "Click Start Flash when you are ready."],
    inputFields: [],
    buttons: [
      { buttonText: "Start Flash", buttonDest: doFlash }
    ]
  },
  FlashDone: {
    description: ["*Flash complete",
      `The flash process has completed.`,
      `Your device should be running the Connected Little Boxes software.`,
      `The led on your device will indicate the state of the device.`,
      `*Slowly flashing led`,
      `If the led is flashing slowly this means that your box is connected to your WiFi.`,
      `*Quickly flashing led`,
      `If the led is flashing quickly this means that your box cannot see any WiFi connections that it recognises.`,
      `*Lit led`,
      `If the led is lit but not flashing this means that your box is hosting a WiFi access point you can use to configure it.`,
      `*Led Off`,
      `If the led is not lit it means that there is a problem with your box. Try flashing it again using a different USB connection on your computer.`,
      `Click the button that matches what you see`],
    inputFields: [],
    buttons: [
      { buttonText: "Slow flash", buttonDest: doLedSlowFlashStatus },
      { buttonText: "Quick flash", buttonDest: doLedQuickFlashStatus },
      { buttonText: "Led lit", buttonDest: doLedLitStatus },
      { buttonText: "Led off", buttonDest: doLedOffStatus }
    ]
  },
  ConnectFailed: {
    description: ["*Connect failed",
      `The connection to your device seems to have failed`,
      `Make sure that it is connected correctly and that it is not connected to another program on your computer.`,
      "Click Retry Connection to try again."],
    inputFields: [],
    buttons: [
      { buttonText: "Retry", buttonDest: doAttemptDeviceConnection }
    ]
  },
  LedSlowFlash: {
    description: ["*Status led slow flash",
      `This indicates that your box has found a WiFi network and successfully connected to it.`,
      `This is what we call a happy ending.`,
      "Click Done to return to the main menu."],
    inputFields: [],
    buttons: [
      { buttonText: "Done", buttonDest: doExitFlash }
    ]
  },
  LedQuickFlash: {
    description: ["*Status led quick flash",
      `This indicates that your box has settings for WiFi connections but it can't see any of them to connect to.`,
      `Check that the WiFi access point for this box is working`,
      `You can load up to five sets of WiFi settings into your box. Click WiFi settings below to do this.`,
      `Otherwise click Done to return to the main menu.`],
    inputFields: [],
    buttons: [
      { buttonText: "WiFi Settings", buttonDest: doWiFiSettingsUSB },
      { buttonText: "Done", buttonDest: doExitFlash }
    ]
  },

  LedLit: {
    description: ["*Status led lit",
      `This indicates that your box is hosting a WiFi network you can use to configure your box. Click WiFi configure to find out more.`,
      `Check that the WiFi access point for this box is working`,
      `Otherwise click Done to return to the main menu.`],
    inputFields: [],
    buttons: [
      { buttonText: "WiFi Configure", buttonDest: doWiFiSettingsAP },
      { buttonText: "Done", buttonDest: doExitFlash }
    ]
  },

  LedOff: {
    description: ["*Status led off",
      `This means that the software in your box is not running correctly.`,
      `Plug the box into a different USB port and repeat the flashing process.`,
      `Otherwise click Done to return to the main menu.`],
    inputFields: [],
    buttons: [
      { buttonText: "Retry Flash", buttonDest: doConnectToDevice },
      { buttonText: "Done", buttonDest: doExitFlash }
    ]
  },

  NoFirmwareFiles: {
    description: ["*Flash failed",
      `There are no firmware files for the device.`,
      `This means that we can't turn it into a Connected Little Box.`,
      "Please send us the device information shown below and we will see if we can add them for your device."],
    inputFields: [],
    buttons: [
      { buttonText: "Done", buttonDest: doExitFlash }
    ]
  }
}

async function doExitFlash() {
  window.location.replace(`/`);
}


async function doWiFiSettingsUSB(){
  window.location.replace("/connect/usb");
}


async function doWiFiSettingsAP (){
  window.location.replace("/connect/wifi");
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

async function doLedSlowFlashStatus() {
  await selectStage(stages.LedSlowFlash);
}
async function doLedQuickFlashStatus() {
  await selectStage(stages.LedQuickFlash);
}
async function doLedLitStatus() {
  await selectStage(stages.LedLit);
}
async function doLedOffStatus() {
  await selectStage(stages.LedOff);
}

const firmwareLocations = {

  'ESP8266EX': ['/firmware/flash/esp8266/firmware_0x0000.bin'], // Wemos D1 Mini ESP8266

  'ESP32-D0WDQ6 (revision 1)': [ // Wemos Mini D1 ESP32
    '/firmware/flash/esp32/bootloader_dio_40m_0x1000.bin',
    '/firmware/flash/esp32/partitions_0x8000.bin',
    '/firmware/flash/esp32/boot_app0_0xe000.bin',
    '/firmware/flash/esp32/firmware_0x10000.bin'
  ],
  'ESP32-D0WD (revision 1)': [ // DOIT
    '/firmware/flash/esp32/bootloader_dio_40m_0x1000.bin',
    '/firmware/flash/esp32/partitions_0x8000.bin',
    '/firmware/flash/esp32/boot_app0_0xe000.bin',
    '/firmware/flash/esp32/firmware_0x10000.bin'
  ]
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
    console.log(`Error: ${e.message}`);
    await selectStage(stages.ConnectFailed);
    return;
  }

  let nextState;

  if (connected) {

    console.log('Connected to device :' + chip);

    let firmware = firmwareLocations[chip];

    if(!firmware){
      nextState = stages.NoFirmwareFiles;
    }
    else{
    nextState = stages.StartFlash;
    }
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

async function GetFileArrayFromUrls(urls) {

  for (let urlNo = 0; urlNo < urls.length; urlNo++) {
    let url = urls[urlNo];
    espLoaderTerminal.writeLine(`Fetching from:${url}`)

    let response = await fetch(url, {
      method: 'GET',
      responseType: 'arraybuffer', // Treat the response as binary data
    });

    if (!response.ok) {
      return null;
    }

    let data = await response.arrayBuffer();

    // Handle the binary data here
    const binaryData = new Uint8Array(data);
    let binaryString = "";
    for (let i = 0; i < binaryData.length; i++) {
      let ch = String.fromCharCode(binaryData[i]);
      binaryString += ch;
    }
    let temp = url.slice(url.lastIndexOf('_') + 1);
    let addressText = temp.slice(0, temp.indexOf('.'));
    let loadAddress = parseInt(addressText);
    fileArray.push({ data: binaryString, address: loadAddress });
  }

  return fileArray;
}

async function flashFromUrls(urls) {

  let fileArray = await GetFileArrayFromUrls(urls);

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

    espLoaderTerminal.writeLine(`Flash complete`);

    await esploader.hard_reset();

    espLoaderTerminal.writeLine(`Device reset`);
  }
  catch (error) {
    console.error('Error fetching the network file:', error);
  }
}

async function doFlash() {

  let firmware = firmwareLocations[chip];

  if (firmware) {
    await flashFromUrls(firmware);
    await selectStage(stages.NoFirmwareFiles)
    return true;
  }
  else {
    await selectStage(stages.NoFirmwareFiles);
    return;
  }
}

function doGoHome() {
  window.location.replace("/");
}

window.onload = async function () {
  await doStart();
}
