const ConsoleStates = {
  starting: "Starting",
  waitingForGot: "waitingForGot",
  waitingForValueCommandResponse: "waitingForValueCommandResponse",
  waitingForJSONCommandResponse: "waitingForJSONCommandResponse",
  waitingforValueCommandComplete: "waitingforValueCommandComplete",
  waitingforSettingCommandCompete: "waitingforSettingCommandCompete"
}

class ConsoleIO {

  constructor() {
    this.port = null;
    this.reader = null;
    this.handleIncomingText = null;
    this.lineBuffer = "";
    this.command = "";
    this.reply = null;
    this.setState(ConsoleStates.starting);
  }

  async connectToSerialPort() {

    if (!"serial" in navigator) {
      this.port = null;
      return "This browser doesn't support serial connection. Try Edge or Chrome.";
    }

    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 115200, bufferSize: 10000 });
    }
    catch (error) {
      return "Serial port open failed:" + error.message;
    }

    return "";
  }

  async disconnectFromSerialPort() {
    await this.port.close();
    this.reader = null;
  }

  setState(newState) {
    console.log(`    State:${newState}`);
    this.state = newState;
  }

  handleCommand(text) {

    text = text.trim();

    console.log("Got a reply:" + text);

    switch (this.state) {

      case ConsoleStates.starting:
        break;

      case ConsoleStates.waitingForGot:
        if (text.startsWith("Got command: ")) {
          text = text.slice("Got command: ".length);
          if (text == this.command) {
            if (text.startsWith('{')) {
              this.setState(ConsoleStates.waitingForJSONCommandResponse);
            }
            else {
              // if the command contains an equals it is a setting command
              if (text.includes('=')) {
                this.setState(ConsoleStates.waitingforSettingCommandCompete);
              }
              else {
                this.setState(ConsoleStates.waitingForValueCommandResponse);
              }
            }
            break;
          }
          else {
            this.setState(ConsoleStates.starting);
            this.broken(`Got ${text} doesn't match ${this.command}`);
            return;
          }
        }
        break;

      case ConsoleStates.waitingforSettingCommandCompete:
        if (text == "setting set OK") {
          this.kept(`Set command: ${this.command} completed OK`);
          this.setState(ConsoleStates.starting);
        }
        break;

      case ConsoleStates.waitingForValueCommandResponse:

        if (text == "done") {
          this.setState(ConsoleStates.starting);
          this.kept("done");
          this.result = null;
          return;
        }

        if (text == "setting not found") {
          this.setState(ConsoleStates.starting);
          this.broken(`Setting ${this.command} not found`);
          return;
        }

        // return the value
        let items = text.split('=');

        if (items.length == 1) {
          // value not present - might be a command
          this.result = "";
          return;
        }
        else {
          // send the value back
          this.setState(ConsoleStates.waitingforValueCommandComplete);
          this.result = items[1];
          return;
        }

      case ConsoleStates.waitingforValueCommandComplete:

        if (text = "setting displayed OK") {
          this.setState(ConsoleStates.starting);
          this.kept(this.result);
          this.result = null;
          return;
        }
        break;

      case ConsoleStates.waitingForJSONCommandResponse:
        if (text.startsWith("{")) {
          // A respose to a JSON command - check for OK
          try {
            let responseObject = JSON.parse(text);
            if (responseObject.error == 0) {
              // no error - promise has been kept
              this.setState(ConsoleStates.starting);
              this.kept(responseObject.message);
            }
            else {
              this.setState(ConsoleStates.starting);
              this.broken(text);
              return;
            }
          }
          catch (e) {
            this.setState(ConsoleStates.starting);
            this.broken(e);
            return;
          }
        }
        else {
          // should get JSON back from a JSON command
          this.setState(ConsoleStates.starting);
          this.broken(`No JSON received from ${this.command} request`);
          return;
        }
    }
  }

  performCommand(command) {
    console.log("Performing:" + command);
    const commandPromise = new Promise((kept, broken) => {
      if (this.state != ConsoleStates.starting) {
        broken(`Command ${this.command} already active when command ${command} received`);
      }
      else {
        this.kept = kept;
        this.broken = broken;
        this.command = command;
        this.setState("waitingForGot");
        this.sendText(command + '\r');
      }
    });

    const timeout = 5000;

    const timeoutPromise = new Promise((kept, broken) => {
      setTimeout(() => {
        broken(`Operation timed out after ${timeout} ms`);
      }, timeout);
    });

    return Promise.race([commandPromise, timeoutPromise]);
  }

  async performCommands(commands) {
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      await this.performCommand(command);
    }
  }

  async writeUint8Array(valArray) {
    const writer = this.port.writable.getWriter();
    await writer.write(valArray);
    writer.releaseLock();
  }

  async sendText(text) {
    let bytes = new TextEncoder("utf-8").encode(text);
    await this.writeUint8Array(bytes);
  }

  handleIncomingBytes(bytes) {
    var text = new TextDecoder("utf-8").decode(bytes);
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch == '\n') {
        if (this.lineBuffer.length > 0) {
          this.handleCommand(this.lineBuffer);
          this.lineBuffer = "";
        }
      }
      else {
        if (ch != '\r') {
          this.lineBuffer = this.lineBuffer + text[i];
        }
      }
    }
  }

  async pumpReceivedCharacters() {
    while (this.port.readable && this.keepReading) {
      this.reader = this.port.readable.getReader();
      try {
        while (true) {
          const { value, done } = await this.reader.read();
          if (done) {
            break;
          }
          // value is a Uint8Array.
          this.handleIncomingBytes(value);
        }
      } catch (error) {
        console.log(`Serial error:${error.message}`);
      } finally {
        // Allow the serial port to be closed later.
        this.reader.releaseLock();
      }
    }
    await this.port.close();
  }

  async disconnect() {
    if (this.port == null || this.keepReading == false) {
      return;
    }
    this.keepReading = false;

    if (this.reader != null) {
      this.reader.cancel();
    }
  }

  async startSerialPump(destination) {
    this.keepReading = true;
    this.handleIncomingText = destination;
    await this.pumpReceivedCharacters();
    return "Serial disconnected";
  }
}

