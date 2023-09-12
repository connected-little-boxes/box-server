
var device = null;
let chip = null;
var flashConnected = false;
var hostAddress;

var stage;
var consoleIO;

const baudrates = document.getElementById('baudrates');
const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');
const resetButton = document.getElementById('resetButton');
const consoleStartButton = document.getElementById('consoleStartButton');
const consoleStopButton = document.getElementById('consoleStopButton');
const eraseButton = document.getElementById('eraseButton');
const programButton = document.getElementById('programButton');
const filesDiv = document.getElementById('files');
const programDiv = document.getElementById('program');
const consoleDiv = document.getElementById('console');
const lblBaudrate = document.getElementById('lblBaudrate');
const lblConnTo = document.getElementById('lblConnTo');
const table = document.getElementById('fileTable');
const terminal = document.getElementById('terminal');

document.onload = ()=>{
  doStart();
};


// import { Transport } from './cp210x-webusb.js'
import * as esptooljs from "./bundle.js";
const ESPLoader = esptooljs.ESPLoader;
const Transport = esptooljs.Transport;

let term = new Terminal({ cols: 120, rows: 40 });
term.open(terminal);

let transport;
let esploader;
let file1 = null;
let connected = false;

function handleFileSelect(evt) {
  var file = evt.target.files[0];

  if (!file) return;

  var reader = new FileReader();

  reader.onload = (function (theFile) {
    return function (e) {
      file1 = e.target.result;
      evt.target.data = file1;
    };
  })(file);

  reader.readAsBinaryString(file);
}

let espLoaderTerminal = {
  clean() {
    term.clear();
  },
  writeLine(data) {
    term.writeln(data);
  },
  write(data) {
    term.write(data)
  }
}

async function doConnectToDevice() 
{
  if (device === null) {
    device = await navigator.serial.requestPort({});
    transport = new Transport(device);
  }

  try {
    esploader = new ESPLoader(transport, baudrates.value, espLoaderTerminal);
    connected = true;

    chip = await esploader.main_fn();

    // Temporarily broken
    // await esploader.flash_id();
  } catch (e) {
    console.error(e);
    term.writeln(`Error: ${e.message}`);
  }

  console.log('Settings done for :' + chip);
  lblBaudrate.style.display = 'none';
  lblConnTo.innerHTML = 'Connected to device: ' + chip;
  lblConnTo.style.display = 'block';
  baudrates.style.display = 'none';
  connectButton.style.display = 'none';
  disconnectButton.style.display = 'initial';
  eraseButton.style.display = 'initial';
  filesDiv.style.display = 'initial';
  consoleDiv.style.display = 'none';
};

async function doResetDevice()
{
  if (device === null) {
    device = await navigator.serial.requestPort({});
    transport = new Transport(device);
  }

  await transport.setDTR(false);
  await new Promise((resolve) => setTimeout(resolve, 100));
  await transport.setDTR(true);
};

async function doEraseDevice()
{
  try {
    await esploader.erase_flash();
  } catch (e) {
    console.error(e);
    term.writeln(`Error: ${e.message}`);
  } finally {
  }
};

function addFile (file, offset)
{
  var rowCount = table.rows.length;
  var row = table.insertRow(rowCount);

  // //Column 1 - Offset
  // var cell1 = row.insertCell(0);
  // var element1 = document.createElement('input');
  // element1.type = 'text';
  // element1.id = 'offset' + rowCount;
  // element1.value = '0x1000';
  // cell1.appendChild(element1);

  // // Column 2 - File selector
  // var cell2 = row.insertCell(1);
  // var element2 = document.createElement('input');
  // element2.type = 'file';
  // element2.id = 'selectFile' + rowCount;
  // element2.name = 'selected_File' + rowCount;
  // element2.addEventListener('change', handleFileSelect, false);
  // cell2.appendChild(element2);

  // // Column 3  - Progress
  // var cell3 = row.insertCell(2);
  // cell3.classList.add('progress-cell');
  // cell3.style.display = 'none';
  // cell3.innerHTML = `<progress value="0" max="100"></progress>`;

  // // Column 4  - Remove File
  // var cell4 = row.insertCell(3);
  // cell4.classList.add('action-cell');
  // if (rowCount > 1) {
  //   var element4 = document.createElement('input');
  //   element4.type = 'button';
  //   var btnName = 'button' + rowCount;
  //   element4.name = btnName;
  //   element4.setAttribute('class', 'btn');
  //   element4.setAttribute('value', 'Remove'); // or element1.value = "button";
  //   element4.onclick = function () {
  //     removeRow(row);
  //   };
  //   cell4.appendChild(element4);
  // }
};

// to be called on disconnect - remove any stale references of older connections if any
function cleanUp() {
  device = null;
  transport = null;
  chip = null;
}

async function doDisconnect() {
  if (transport) await transport.disconnect();

  term.clear();
  connected = false;
  cleanUp();
};

let isConsoleClosed = false;
async function doStarty () {
  if (device === null) {
    device = await navigator.serial.requestPort({});
    transport = new Transport(device);
  }
  lblConsoleFor.style.display = 'block';
  consoleStartButton.style.display = 'none';
  consoleStopButton.style.display = 'initial';
  programDiv.style.display = 'none';

  await transport.connect();
  isConsoleClosed = false;

  while (true && !isConsoleClosed) {
    let val = await transport.rawRead();
    if (typeof val !== 'undefined') {
      term.write(val);
    } else {
      break;
    }
  }
  console.log('quitting console');
};

async function doClose() {
  isConsoleClosed = true;
  await transport.disconnect();
  await transport.waitForUnlock(1500);
  term.clear();
  consoleStartButton.style.display = 'initial';
  consoleStopButton.style.display = 'none';
  programDiv.style.display = 'initial';
};

function validate_program_inputs() {
  let offsetArr = [];
  var rowCount = table.rows.length;
  var row;
  let offset = 0;
  let fileData = null;

  // check for mandatory fields
  for (let index = 1; index < rowCount; index++) {
    row = table.rows[index];

    //offset fields checks
    var offSetObj = row.cells[0].childNodes[0];
    offset = parseInt(offSetObj.value);

    // Non-numeric or blank offset
    if (Number.isNaN(offset)) return 'Offset field in row ' + index + ' is not a valid address!';
    // Repeated offset used
    else if (offsetArr.includes(offset)) return 'Offset field in row ' + index + ' is already in use!';
    else offsetArr.push(offset);

    var fileObj = row.cells[1].childNodes[0];
    fileData = fileObj.data;
    if (fileData == null) return 'No file selected for row ' + index + '!';
  }
  return 'success';
}

async function doProgram() {
  const err = validate_program_inputs();

  if (err != 'success') {
    alertMsg.innerHTML = '<strong>' + err + '</strong>';
    alertDiv.style.display = 'block';
    return;
  }

  // Hide error message
  alertDiv.style.display = 'none';

  const fileArray = [];
  const progressBars = [];

  for (let index = 1; index < table.rows.length; index++) {
    const row = table.rows[index];

    const offSetObj = row.cells[0].childNodes[0];
    const offset = parseInt(offSetObj.value);

    const fileObj = row.cells[1].childNodes[0];
    const progressBar = row.cells[2].childNodes[0];

    progressBar.value = 0;
    progressBars.push(progressBar);

    row.cells[2].style.display = 'initial';
    row.cells[3].style.display = 'none';

    fileArray.push({ data: fileObj.data, address: offset });
  }

  try {
    await esploader.write_flash(
      fileArray,
      'keep',
      undefined,
      undefined,
      false,
      true,
      (fileIndex, written, total) => {
        progressBars[fileIndex].value = (written / total) * 100;
      },
      (image) => CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)),
    );
  } catch (e) {
    console.error(e);
    term.writeln(`Error: ${e.message}`);
  } finally {
    // Hide progress bars and show erase buttons
    for (let index = 1; index < table.rows.length; index++) {
      table.rows[index].cells[2].style.display = 'none';
      table.rows[index].cells[3].style.display = 'initial';
    }
  }
};



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
      { buttonText: "Device plugged in", buttonDest: startDoConnectToDevice },
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

async function startDoConnectToDevice() {
   await selectStage(stages.ConnectToDevice);
}

async function doAttemptESPmanagerConnection() {
  {
    if (device === null) {
      device = await navigator.serial.requestPort({});

      transport = getTransport(device);
    }
  
    try {
      esploader = new ESPLoader(transport, baudrates.value, espLoaderTerminal);
      connected = true;
  
      chip = await esploader.main_fn();
  
      // Temporarily broken
      // await esploader.flash_id();
    } catch (e) {
      console.error(e);
      console.log(`Error: ${e.message}`);
    }
  
    console.log('Settings done for :' + chip);
    lblBaudrate.style.display = 'none';
    lblConnTo.innerHTML = 'Connected to device: ' + chip;
    lblConnTo.style.display = 'block';
    baudrates.style.display = 'none';
    connectButton.style.display = 'none';
    disconnectButton.style.display = 'initial';
    eraseButton.style.display = 'initial';
    filesDiv.style.display = 'initial';
    consoleDiv.style.display = 'none';
  };

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

