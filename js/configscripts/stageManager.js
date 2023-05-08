async function displayStage(stage) {

    // clear away the old stage help
    let stageElement = document.getElementById("stageDescription");

    while (stageElement.children.length > 0) {
        stageElement.removeChild(stageElement.children[0]);
    }

    // draw the new stage
    stage.description.forEach(message => {
        let element;
        if (message.startsWith("*")) {
            message = message.slice(1);
            element = document.createElement("h3");
        }
        else {
            element = document.createElement("p");
        }
        element.innerText = message;
        stageElement.appendChild(element);
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
        buttonElement.className = "btn btn-success mb-4 btn-block";
        buttonElement.textContent = button.buttonText;
        buttonElement.addEventListener("click", button.buttonDest);
        stageElement.appendChild(buttonElement);
    }
}

async function selectStage(newStage) {
    stage = newStage;
    await displayStage(stage);
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
            console.log("console opened for business");
            consoleIO.startSerialPump(handleIncomingText);
        }
    }
    selectStage(stage);
}
