
async function displayStage(stage) {

    // clear away the old stage help
    let stageElement = document.getElementById("stageDescription");

    while (stageElement.children.length > 0) {
        stageElement.removeChild(stageElement.children[0]);
    }

    // draw the new stage
    let orderedList = null;

    stage.description.forEach(message => {
        let element;

        if (message.startsWith("IMAGE:")) {
            console.log("doing the image thing");
            message = message.slice(6);
            image = document.createElement("img");
            image.style.margin = `20px`;
            image.style.border = "2px solid black";
            image.src = message;
            stageElement.appendChild(image);
            return;
        }


        if (message.startsWith("QR:")) {
            message = message.slice(3);
            qrCode = document.createElement("p");
            new QRCode(qrCode,
            {
                text: message,
                width: 128,
                height: 128,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H  
            });          
            stageElement.appendChild(qrCode);
            return;
        }

        if (message.startsWith("#")) {
            message = message.slice(1);
            element = document.createElement("p");
            element.style.fontFamily = "'Courier New', monospace";
            element.style.fontSize = "20";
            element.style.whiteSpace = "pre";            
            element.textContent = message;
            stageElement.appendChild(element);
            return;
        }

        if (message.startsWith("*")) {
            message = message.slice(1);
            element = document.createElement("h3");
            element.textContent = message;
            stageElement.appendChild(element);
        }
        else {
            if (message.startsWith("1.")) {
                message = message.slice(2);
                if (!orderedList) {
                    orderedList = document.createElement("ol");
                    stageElement.appendChild(orderedList);
                }
                element = document.createElement("li");
                element.textContent = message;
                orderedList.appendChild(element)
            }
            else {
                orderedList = null;
                element = document.createElement("p");
                element.textContent = message;
                stageElement.appendChild(element);
            }
        }
    });

    // this needs to be a for loop with a counter because we need to wait for 
    // each command to complete.  
    for (let i = 0; i < stage.inputFields.length; i++) {
        let field = stage.inputFields[i];
        let divElement = document.createElement("div");
        divElement.className = "form-group mt-4";
        let labelElement = document.createElement("label");
        labelElement.setAttribute('for', field.deviceName);
        labelElement.textContent = field.displayName;
        divElement.appendChild(labelElement);
        let inputElement = document.createElement("input");
        inputElement.setAttribute("type", field.type);
        inputElement.setAttribute("id", field.deviceName);
        inputElement.className = "form-control";
        let deviceValue = "";
        if (field.loadType) {
            let loadType = field.loadType;
            switch (loadType) {
                case "localValue":
                    break;
                case "fromDevice":
                    if (field.type == "password") {
                        deviceValue = "";
                    }
                    else {
                        try {
                            console.log(`   Getting ${field.deviceName}`);
                            deviceValue = await consoleIO.performCommand(field.deviceName);
                        }
                        catch (e) {
                            alert(e);
                            selectStage(stages.ConnectFailed);
                            return;
                        }
                    }
                    break;
            }
        }

        inputElement.value = deviceValue;

        divElement.appendChild(inputElement);
        stageElement.appendChild(divElement);
    }

    for (let i = 0; i < stage.buttons.length; i++) {
        let button = stage.buttons[i];
        let buttonElement = document.createElement("button");

        buttonElement.className = "btn btn-primary w-100";
        buttonElement.textContent = button.buttonText;
        buttonElement.setAttribute("id", button.buttonText);
        buttonElement.setAttribute("type", "button");
        buttonElement.addEventListener("click", button.buttonDest);

        let parElement = document.createElement("p");
        parElement.appendChild(buttonElement);
        stageElement.appendChild(parElement);
    }
}

async function selectStage(newStage) {
    stage = newStage;
    await displayStage(stage);
}

async function printPage(){
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
        if (element.tagName === 'BUTTON') {
            element.classList.add('no-print');
        }
    });

    window.print();

    // After printing, restore the display of hidden buttons
    allElements.forEach(element => {
        if (element.tagName === 'BUTTON') {
            element.classList.remove('no-print');
        }
    });    
}

async function doTestPassed() {
    window.location.replace("/");
}

function addLineToLog(message) {
    let output = document.getElementById('logOutput');
    output.value = output.value + message + '\n';
    output.scrollTop = output.scrollHeight;
}

let textHandlerFunction = null;

function handleIncomingText(text) {
    console.log(`Received:${text}`)
    if (textHandlerFunction != null) {
        textHandlerFunction(text);
    }
}

async function getFromServer(url) {

    try {
        let result = await fetch(url, {
            credentials: "include",
        });
        let data = await result.json();
        return data;
    }
    catch (error) {
        alert(`Bad fetch: ${error}`);
        return null;
    }
}

async function connectConIOandSelectStage(stage) {
    if (consoleIO == null) {

        consoleIO = new ConsoleIO();

        let result;

        result = await consoleIO.connectToSerialPort();

        if (result != "") {
            alert(`Could not continue: ${result}`);
            selectStage(stages.ConnectFailed);
            return false;
        }
        else {
            console.log("Console opened");
            consoleIO.startSerialPump(handleIncomingText);
        }
    }
    await selectStage(stage);
    return true;
}

