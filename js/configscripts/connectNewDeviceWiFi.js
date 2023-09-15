var device = null;
var flashConnected = false;
var terminal = null;
var accessPoint, hostAddress, hostIPAddress;
var stages;

var stage;
var consoleIO;

function buildStages() {
  stages = {
    FormatSelect: {
      description: [`*Introduction`,
        `Welcome to Connected Little Boxes. You can use this web site to set your box up so that it works on your WiFi network.`,
        `This is useful if you don't want to connect your box to a computer. You can set up your box with just a phone`,
        `We will turn your box into a WiFi access point that you can connect to with your phone, tablet or laptop. `,
        `You can't use the same device (phone, tablet or laptop) to view these pages and configure the box though, because the process involves disconnecting fron the internet and connecting to a web page produced by your box.`,
        `If you only have one device you can select a single page view of the instructions which you can print or leave open on your device while you work through the configuration process.`,
        `The interactive setup takes you through each step.`,
        `If your box has lights (perhaps it has a light for each letter in a word or name) the colour of the lights will indicate the state of the box,`,
        `If you're working with a bare device (or can see the device) the behaviour of the (usually) blue led on the device will indicate state.`,
        `The printable instructions describe the entire process on one page.`,
        `Select what kind of device you have or press Done to exit.`
      ],
      inputFields: [],
      buttons: [
        { buttonText: "Set up box with lights in", buttonDest: async () => { await selectStage(stages.LightBoxPowerOn) } },
        { buttonText: "Set up a bare device", buttonDest: async () => { await selectStage(stages.BareDevicePowerOn) } },
        { buttonText: "Get printable instructions", buttonDest: async () => { await selectStage(stages.ShowPrintablePages) } }
      ]
    },

    LightBoxPowerOn: {
      description: [`*Light box power on`,
        `The first thing we are going to do is power up your box.`,
        `Note that if you have multiple boxes you will need to configure each in turn.`,
        `Plug in your box. Click the button that matches what you see.`
      ],
      inputFields: [],
      buttons: [
        { buttonText: "Changing colours", buttonDest: async () => { await selectStage(stages.ChangingDisplay); } },
        { buttonText: "All white", buttonDest: async () => { await selectStage(stages.WhiteDisplay); } },
        { buttonText: "All black", buttonDest: async () => { await selectStage(stages.BlackDisplay); } },
      ]
    },

    BlackDisplay: {
      description: [`*No light from the box`,
        `You might be able to spot a light near the USB socket on the box. The light may be flashing. If you can see a light it means that the device is active but the lights are not configured or connected properly.`,
        `If you can't see any lights it means that there is no power or that the box does not contain firmware.`,
        `Click the button that matches what you see:`
      ],
      inputFields: [],
      buttons: [
        { buttonText: "Light inside box", buttonDest: async () => { await selectStage(stages.LightInBox); } },
        { buttonText: "No light inside box", buttonDest: async () => { await selectStage(stages.NoLightInBox); } }
      ]
    },

    LightInBox: {
      description: [`*Light in box`,
        `You can use the light in the box to set up your box in the same way as you you would set up a bare device. Then you can sort out the lights.`,
        `Click the button to continue:`
      ],
      inputFields: [],
      buttons: [
        { buttonText: "Configure using lights in the box", buttonDest: async () => { await selectStage(stages.BareDevicePowerOn); } }
      ]
    },

    NoLightInBox: {
      description: [`*No light in box`,
        `Before you go any further, make sure that your box is properly connected to the USB port on your computer. You might find that the box will work in another port.`,
        `If you are sure that the box is powered up but you still don't see anything, you may need to reload the firmware.`,
        `Click the button to continue:`
      ],
      inputFields: [],
      buttons: [
        { buttonText: "Load the firmware into the box", buttonDest: async () => { window.location.replace("/hardware/flash"); } }
      ]
    },

    ChangingDisplay: {
      description: ["*Changing Display",
        `If the lights are changing it means that there are some existing WiFi settings stored in the box.`,
        `The box is using these to try and connect to the local WiFi. If the settings are not valid (perhaps you are using the box in a new location) the box will eventually give up and display white lights. You can't configure the box over WiFi until the lights go white, so just grab a coffee and wait. It won't be long.`,
        `If the lights keep changing it means the box is connected to the internet.`,
        'Press the button when the lights turn white.'
      ],
      inputFields: [],
      buttons: [
        { buttonText: "White display", buttonDest: async () => { await selectStage(stages.ConnectForSetup); } }
      ]
    },

    ConnectForSetup: {
      description: ["*Connect to box for setup",
        `Next we will connect to your box with your phone. Remember that you can only do this when the lights on your box are showing a white display or the light on the device is lit and not flashing.`,
        `QR:WIFI:S:${accessPoint};`,
        `Scan the above QR code with your phone to connect to the box WiFi.`,
        `If your phone can't read QR codes or you are using a different box you should open your Wifi settings and connect to a WiFi access point called:`,
        `#${accessPoint}`,
        `Press Connected to box when you are connected.`
      ],
      inputFields: [],
      buttons: [
        { buttonText: "Connected to box", buttonDest: async () => { await selectStage(stages.ConnectToPage); } }
      ]
    },
    ConnectToPage: {
      description: ["*Open the setup page",
        `Now that the phone is connected to the box you can browse the settings web site it is serving:`,
        `QR:${hostAddress}`,
        `Scan the above QR code with your phone to navigate to the box web page.`,
        `If your phone can't read QR codes or you are using a different device to configure your box you should start your browser and a web page with the address:`,
        `#${hostAddress}`,
        `If this doesn't work you can enter the direct IP address for the box into your:`,
        `#${hostIPAddress}`,
        "Press Page Open when you have opened the page."
      ],
      inputFields: [],
      buttons: [
        { buttonText: "Page open", buttonDest: async () => { await selectStage(stages.PageIsOpen); } }]
    },
    PageIsOpen: {
      description: [
        `You should see the following web page:`,
        `IMAGE:/public/images/settingsPage.png`,
        `Enter your WiFi settings into the page and press the Update button. You can also use the page to configure the number of pixels connected to the device. If you want to view and change all the settings you can use the full settings link.`,
        `When you press the Update button on to page the box will confirm that the settings have been stored. Then you can use the reset link to reset the box.`,
        `When the box is reset it will try to use the new settings to connect to the network. If these didn't work the box will display the white display and you can connect to it again to check that your settings are correct.`,
      ],
      inputFields: [],
      buttons: [
      ]
    },

    BareDevicePowerOn: {
      description: [`*Bare Device power on`,
        `Your device should be fitted with a light (which is frequently blue). Some devices have two lights, a blue light and a red light. In that case we are considering the blue light.`,
        `This light indicates the status of your device`,
        `Plug your device into power, wait for a few seconds and then click the button which matches what you see`
      ],
      inputFields: [],
      buttons: [
        { buttonText: "Light is flashing slowly", buttonDest: async () => { await selectStage(stages.LightFlashingSlowly); } },
        { buttonText: "Light is flashing quickly", buttonDest: async () => { await selectStage(stages.LightFlashingQuickly); } },
        { buttonText: "Light is lit", buttonDest: async () => { await selectStage(stages.ConnectForSetup); } }
      ]
    },

    LightFlashingSlowly: {
      description: [`*Bare Device light flashing slowly`,
        `This indicates that your device is running and has connected to the internet. So your WiFi settings are working. Yay!`
      ],
      inputFields: [],
      buttons: []
    },

    LightFlashingQuickly: {
      description: [`*Bare Device light flashing quickly`,
      `If the light is flashing quickly it means that there are some existing WiFi settings stored in the box.`,
      `The box is using these to try and connect to the local WiFi. If the settings are not valid (perhaps you are using the box in a new location) the box will eventually give up and the lights will stop flashing and turn on. You can't configure the box over WiFi until the lights go white, so just grab a coffee and wait. It won't be long.`,
      `If the lights start to flash slowly this means that the box is connected to the internet.`,
      `Click the button that matches what you see`
    ],
      inputFields: [],
      buttons: [
        { buttonText: "Light is flashing slowly", buttonDest: async () => { await selectStage(stages.LightFlashingSlowly); } },
        { buttonText: "Light is lit", buttonDest: async () => { await selectStage(stages.ConnectForSetup); } }
      ]
    },

    ShowPrintablePages: {
      description: [`*Select your printable instructions`,
      `There are two sets of instructions, for either a light which contains coloured pixels or a bare processor board.`,
      `Click the button to select the instructions that you want.`
    ],
      inputFields: [],
      buttons: [
        { buttonText: "Get instructions for a light", buttonDest: async () => { await selectStage(stages.ShowPrintablePageLight); } },
        { buttonText: "Get instructions for a device", buttonDest: async () => { await selectStage(stages.ShowPrintablePageDevice); } }
      ]

    },

    ShowPrintablePageLight: {
      description: [
        `Plug in your box. If it displays changing colours it means that it is either connected to the internet or trying to connect.` +
        `If the box fails to connect to the internet, or it there are no connection settings in the box it will light all the pixels dim white.`,
        `If the box is display all the pixels white you can use your phone or computer to connect to it over WiFi. The box hosts an access point.`,
        `*Connecting to the box WiFi`,
        `The first thing you need to do is connect to the WiFi hosted by the box. The host has the name:`,
        `#${accessPoint}`,
        `If your phone can connect to WiFi using a QR code you can use the code below:`,
        `QR:WIFI:S:${accessPoint};`,
        `*Opening the settings page`,
        `Once you have connected to the box WiFi you can open the box settings page in your browser. The page has the following addresses:`,
        `#${hostAddress} or ${hostIPAddress}`,
        `If your phone can browse to a web site by using a QR code you can use the code below:`,
        `QR:${hostAddress}`,
        `Once you have connected to the page you will see the site below:`,
        `IMAGE:/public/images/settingsPage.png`,
        `Enter your WiFi settings into the page and press the Update button. You can also use the page to configure the number of pixels connected to the device. If you want to view and change all the settings you can use the full settings link.`,
        `When you press the Update button the box will confirm that the settings have been stored. Then you can use the reset link to reset the box.` +
        `When the box is reset it will try to use the new settings to connect to the network. If these don't work the box will display the dim white display and you can connect to it again to check that your settings are correct.`,
        `#www.clbportal.com/connect`
      ],
      inputFields: [],
      buttons: [
        { buttonText: "Print", buttonDest: doPrintPage }
      ]
    },
    ShowPrintablePageDevice: {
      description: [
        `The device should have one or more tiny lights on it. One of them (usually the blue one) shows what the device is doing. Plug in your device.`, 
        `If the light on the device is flashing slowly it means that the device is connected to the WiFi and you don't need to configure it.`,
        `If the light is flashing quickly the device is trying to connect to the internet. If it fails to connect the light will stop flashing and stay lit.`,
        `If the light is lit the device is hosing a WiFi access point you can connect to.`, 
        `*Connecting to the box WiFi`,
        `The first thing you need to do is connect to the WiFi hosted by the box. The host has the name:`,
        `#${accessPoint}`,
        `If your phone can connect to WiFi using a QR code you can use the code below:`,
        `QR:WIFI:S:${accessPoint};`,
        `*Opening the settings page`,
        `Once you have connected to the box WiFi you can open the box settings page in your browser. The page has the following addresses:`,
        `#${hostAddress} or ${hostIPAddress}`,
        `If your phone can browse to a web site by using a QR code you can use the code below:`,
        `QR:${hostAddress}`,
        `Once you have connected to the page you will see the site below:`,
        `IMAGE:/public/images/settingsPage.png`,
        `Enter your WiFi settings into the page and press the Update button. You can also use the page to configure the number of pixels connected to the device. If you want to view and change all the settings you can use the full settings link.`,
        `When you press the Update button the box will confirm that the settings have been stored. Then you can use the reset link to reset the box.` +
        `When the box is reset it will try to use the new settings to connect to the network. If these don't work the box will display the dim white display and you can connect to it again to check that your settings are correct.`,
        `#www.clbportal.com/connect`
      ],
      inputFields: [],
      buttons: [
        { buttonText: "Done", buttonDest: doPrintDone },
        { buttonText: "Print", buttonDest: doPrintPage }
      ]
    }

  }
}

async function doExit() {
  await selectStage(stages.FormatSelect);
}

async function doStart(configAccessPoint, configHostAddress, configHostIPAddress) {
  console.log(`AP: ${configAccessPoint}, Host:${configHostAddress}, IP:${configHostIPAddress}`);
  accessPoint = configAccessPoint;
  hostAddress = configHostAddress;
  hostIPAddress = configHostIPAddress;
  buildStages();
  await selectStage(stages.FormatSelect);
}

async function doPrint() {
  await selectStage(stages.ShowPrintablePage);
}

async function doPrintDone() {
  await selectStage(stages.FormatSelect);
}

async function doPrintPage() {
  printPage();
  await selectStage(stages.FormatSelect);
}

async function doPowerOn() {
  await selectStage(stages.PowerOn);
}

async function doPageIsOpen() {

  await selectStage(stages.PageIsOpen);
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
          if ((field.type != "password") ||
            (field.type == "password" && value != "")) {
            let command = field.deviceName + "=" + value;
            commandList.push(command);
          }
          break;
      }
    }
  }

  addLineToLog("Connecting to box");

  // now get the rest of the settings from the server to send to the box

  addLineToLog("Getting box name");

  let deviceName = await consoleIO.performCommand("mqttdevicename");

  let fullURL = `${hostAddress}hardware/networkSettings.json/${deviceName}/${userEnteredFriendlyName}`;

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

  addLineToLog("Sending settings to the box");

  await consoleIO.performCommands(commandList);
  addLineToLog("Device configured");

  addLineToLog("Resetting box");
  await consoleIO.performCommand("restart");
  addLineToLog("Device reset");

  selectStage(stages.ConfigSuccess);

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

function doGoHome() {
  window.location.replace("/");
}

