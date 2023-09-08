var device = null;
var flashConnected = false;
var terminal = null;
var accessPoint, hostAddress,hostIPAddress;
var stages;

var stage;
var consoleIO;

function buildStages() {
  stages = {
    FormatSelect: {
      description: [
        `You can use this page to configure your box over WiFi. The box will turn into a WiFi access point that you can connect to. It will host a web page you can use to set up the box.`,
        `You can do the box using any WiFi enabled device, for example a smartphone or laptop.`,
        `You can't use the same device to view these pages and connect to the box.`,
        `The interactive setup takes you through each step.`,
        `The printed instructions describe the entire process on one page.`,
        `Select what kind of help you would like.`

      ],
      inputFields: [],
      buttons: [
        { buttonText: "Single page of instructions (which can be printed)", buttonDest: doPrint },
        { buttonText: "Interactive Setup", buttonDest: doPowerOn }
      ]
    },
    PowerOn: {
      description: ["*Get started",
        `The first thing we are going to do is power up your box.`,
        `Note that if you have multiple boxes you will need to configure each in turn. Don't have more than one box showing a grey screen when you are trying to connect to it to set it up.`,
        `If your box contains lights one of two things will happen:`,
        `1.The lights will display an changing display`,
        `1.All the lights will light up dim white.`,
        "Press the button that matches what happens."
      ],
      inputFields: [],
      buttons: [
        { buttonText: "Changing display", buttonDest: doChangingDisplay },
        { buttonText: "Dim white display", buttonDest: doGreyDisplay },
        { buttonText: "Exit", buttonDest: doExit }
      ]
    },
    ChangingDisplay: {
      description: ["*Changing Display",
        `If the lights are changing it means that there are some existing WiFi settings stored in the box.`,
        `The box is using these to try and connect to the local WiFi. If the settings are not valid (perhaps you are using the box in a new location) the box will eventually give up and display grey lights. You can't configure the box over WiFi until it goes grey, so just grab a coffee and wait. It won't be long.`,
        `If the lights keep changing it means the box is connected to the internet.`,
        `If they stop and go dim white this means that all connection attempts failed.`,
        'Press the button if the lights turn dim white.'
      ],
      inputFields: [],
      buttons: [
        { buttonText: "Dim white display", buttonDest: doGreyDisplay },
        { buttonText: "Exit", buttonDest: doExit }
      ]
    },
    GreyDisplay: {
      description: ["*Connect to box for setup",
        `Next we will connect to your box with your phone. Remember that you can only do this when the lights on your box are showing a dim white display.`,
        `QR:WIFI:S:${accessPoint};`,
        `Scan the above QR code with your phone to connect to the box WiFi.`,
        `If your phone can't read QR codes or you are using a different box you should open your Wifi settings and connect to a WiFi access point called:`,
        `#${accessPoint}`,
        `Press Connected to box when you are connected.`
      ],
      inputFields: [],
      buttons: [
        { buttonText: "Connected to box", buttonDest: doConnectToPage },
        { buttonText: "Exit", buttonDest: doExit }
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
        { buttonText: "Page open", buttonDest: doPageIsOpen },
        { buttonText: "Exit", buttonDest: doExit }
      ]
    },
    PageIsOpen: {
      description: [
        `You should see the following web page:`,
        `IMAGE:public/images/settingsPage.png`,
        `Enter your WiFi settings into the page and press the Update button. You can also use the page to configure the number of pixels connected to the device. If you want to view and change all the settings you can use the full settings link.`,
        `When you press the Update button the box will confirm that the settings have been stored. Then you can use the reset link to reset the box.` + 
        `When the box is reset it will try to use the new settings to connect to the network. If these don't work the box will display the dim white display and you can connect to it again to check that your settings are correct.`,
      ],
      inputFields: [],
      buttons: [
        { buttonText: "Done", buttonDest: doPrintDone }
      ]
    },

    ShowPrintablePage: {
      description: [
        `Plug in your box. If it displays changing colours it means that it is either connected to the internet or trying to connect.` +
        `If the box fails to connect to the internet, or it there are no connection settings in the box it will light all the pixels dim white.`,
        `If the box is display all the pixels dim white you can use your phone or computer to connect to it over WiFi. The box hosts an access point.`,
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
        `IMAGE:public/images/settingsPage.png`,
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

async function doExit()
{
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

async function doChangingDisplay() {
  await selectStage(stages.ChangingDisplay);
}

async function doGreyDisplay() {
  await selectStage(stages.GreyDisplay);
}

async function doConnectToPage() {
  await selectStage(stages.ConnectToPage);
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

