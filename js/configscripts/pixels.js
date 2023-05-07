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
            "Press device plugged in when your device is plugged in."],
        inputFields: [],
        buttons: [
            { buttonText: "Device plugged in", buttonDest: doConnectToDevice }
        ]
    },
    ConnectToDevice: {
        description: ["*Connect to device",
            `Next we will connect your device to the browser. Press the Connect Device button below when you are ready.`,
            `A dialog box will pop up inviting you to select a device to program.`,
            "Press Connect to device when you are ready."],
        inputFields: [],
        buttons: [
            { buttonText: "Connect to device", buttonDest: doAttemptConnection }
        ]
    },
    PixelConfig: {
        description: ["*Configure the pixels",
            `You need to specify the pin you have used to connect the pixels and the number of pixels that you have connected. If you have connected a grid of pixels you will specify the width (x) and the height (y) of the grid. If you have connected a string or a ring of pixels you put the length into x and set the value of y to 1.`],
        inputFields: [
            { displayName: "Pixel Pin", deviceName: "pixelcontrolpin", type: "number", allowEmpty: false, loadType: "fromDevice" },
            { displayName: "Number of X pixels", deviceName: "noofxpixels", type: "number", allowEmpty: false, loadType: "fromDevice" },
            { displayName: "Number of Y pixels", deviceName: "noofypixels", type: "number", allowEmpty: false, loadType: "fromDevice" }
        ],
        buttons: [
            { buttonText: "Configure pixels", buttonDest: doConfigPixels }
        ]
    },
    PixelTest: {
        description: ["*Pixel test",
            `Wait for the device to reset. Then click the "Test pixels" button. The pixels should turn blue. If they don't click "Reconfigure pixels" and try again.`],
        inputFields: [
        ],
        buttons: [
            { buttonText: "Test pixels", buttonDest: doTestPixels },
            { buttonText: "Recconfigure pixels", buttonDest: doReconfigurePixels },
            { buttonText: "Pixels are blue", buttonDest: doTestPassed }
        ]
    },
    ConnectFailed: {
        description: ["*Connect failed",
            `The connection to your device seems to have failed`,
            `Make sure that it is connected correctly.`,
            "Press Retry Connection to try again."],
        inputFields: [],
        buttons: [
            { buttonText: "Retry", buttonDest: doAttemptConnection }
        ]
    }
}

async function doStart(host) {
    console.log("starting");
    hostAddress = host;
    settingsURL = hostAddress + "createDevice/networkSettings.json";
    await selectStage(stages.ConnectUSB);
}

async function doConnectToDevice() {
    await selectStage(stages.ConnectToDevice);
}

async function doReconfigurePixels(){
    await selectStage(stages.PixelConfig);
}

async function doTestPixels() {
    // Turn all the lights blue
    let result = await consoleIO.performCommand(`{"process":"pixels","command":"setnamedcolour","colourname":"blue"}`);
    addLineToLog("Set pixels to blue");
    await selectStage(stages.PixelTest);
}

async function doAttemptConnection() {
    connectConIOandSelectStage(stages.PixelConfig);
}

async function doConfigPixels() {

    let fields = stages.PixelConfig.inputFields;
    let commandList = [];

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
        let command = field.deviceName + "=" + value;
        commandList.push(command);
    }

    addLineToLog("Connecting to device");

    // now get the rest of the settings from the server to send to the device

    addLineToLog("Sending settings to the device");

    await consoleIO.performCommands(commandList);
    addLineToLog("Device configured");

    addLineToLog("Resetting device");
    await consoleIO.performCommand("restart");
    addLineToLog("Device reset");

    selectStage(stages.PixelTest);
}


function doGoHome() {
    window.location.replace("/");
}
