
class ConsoleIO {

  constructor() {
    this.port = null;
    this.reader = null;
    this.handleIncomingText = null;
    this.lineBuffer = "";
    this.command = "";
    this.gotCommandBack = false;
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

  handleCommand(text) {
    console.log("Got a reply:" + text + " " + text.length);
    if (this.gotCommandBack) {
      this.gotCommandBack = false;
      this.command = "";
      // text contains the response to the command
      if(text.startsWith("{")){
        // might be a respose to a JSON command - check for OK
        try{
          let responseObject = JSON.parse(text);
          if(responseObject.error == 0){
            // no error - promise has been kept
            this.kept(responseObject.message);
          }
          else {
            this.broken(text);
            return;
          }
        }
        catch (e){
          this.broken(e);
          return;
        }
      }
      if (text == "done") {
        console.log("command complete");
        this.kept(text);
        return;
      }
      else {
        let replies = text.split('=');
        if (replies.length > 1) {
          this.kept(replies[1])
        }
        else {
          this.broken(text);
        }
      }
    }
    if (text == this.command) {
      this.gotCommandBack = true;
    }
  }

  performCommand(command) {
    console.log("Performing:" + command);
    const commandPromise = new Promise((kept, broken) => {
      if (this.command != "") {
        broken("Command already active:" + command);
      }
      else {
        this.kept = kept;
        this.broken = broken;
        this.command = command;
        this.gotCommandBack = false;
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

