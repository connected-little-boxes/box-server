
// PORT is defined in Heroku
// Otherwise we use 3000 for localhost

const port = process.env.PORT || 3000;

// We also need to use dotenv to bring in the local settings

if (port == 3000)
    require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose')
const mqtt = require('mqtt');
const bcrypt = require('bcrypt');
const Device = require('./models/device');
const Connection = require('./models/connection');
const Installation = require('./models/installation');
const { ProcessManagerCommandItems, ProcessManagerCommands, ProcessManagerMessageItems, ProcessManagerMessages, ProcessManagers } = require('./models/ProcessManager');
const User = require('./models/user');
const { Console } = require('console');

class Manager {

    startDBPromise(dbUrl, options) {
        return new Promise((kept, broken) => {
            mongoose.connect(dbUrl, options);
            const db = mongoose.connection;
            db.once('open', () => kept(db));
            db.on('error', (error) => broken(error));
        });
    }

    startMqttPromise(hostUrl, options) {
        console.log(`Connecting to MQTT server at: ${hostUrl}`);
        return new Promise((kept, broken) => {
            const mqttClient = mqtt.connect(hostUrl, options);
            mqttClient.on("connect", () => kept(mqttClient));
            mqttClient.on("error", (error) => broken(error));
        });
    }

    async doDeviceRegistration(messageObject) {

        console.log("Registering a device from: ", JSON.stringify(messageObject));

        var device = null;

        if (messageObject.hasOwnProperty('name')) {
            try {
                device = await Device.findOne({ name: messageObject.name });
                if (device != null) {
                    await device.updateOne({
                        name: messageObject.name,
                        processor: messageObject.processor,
                        version: messageObject.version,
                        processes: messageObject.processes,
                        sensors: messageObject.sensors
                    });
                    console.log("Device updated");
                }
                else {
                    device = new Device({
                        name: messageObject.name,
                        friendlyName: messageObject.friendlyName,
                        processor: messageObject.processor,
                        version: messageObject.version,
                        processes: messageObject.processes,
                        sensors: messageObject.sensors
                    });
                    await device.save();
                    console.log("Device created");
                }
            }
            catch (err) {
                console.log('Device registration failed:', err.message);
                return false;
            }

            const devCommandTopic = process.env.MQTT_TOPIC_PREFIX + "/command/" + messageObject.name;

            await this.mqttClient.publish(devCommandTopic, '{"process":"registration","command":"register"}');
        }
        else {
            console.log('Device registration failed: missing device name');
        }
    }

    async doDeviceConnected(messageObject) {

        console.log("Connecting a device from: ", JSON.stringify(messageObject));

        // Log the connection

        let connection = new Connection(
            {
                device: messageObject.name,
                date: new Date(),
                resetCode: messageObject.resetcode
            }
        );

        await connection.save();

        var device = null;

        device = await Device.findOne({ name: messageObject.name });

        if (device != null) {

            if (device.bootCommands != null) {

                const devCommandTopic = process.env.MQTT_TOPIC_PREFIX + "/command/" + device.name;

                let commandList = device.bootCommands.split("\n");

                for (let command of commandList) {
                    let commandText = command.trim()
                    if (commandText.length == 0) {
                        continue;
                    }
                    console.log("   sending boot command:", commandText);
                    await this.mqttClient.publish(devCommandTopic, commandText);
                }
            }

            let displayName;

            if (device.friendlyName != "") {
                displayName = device.friendlyName;
            }
            else {
                displayName = messageObject.name;
            }

            await device.updateOne({
                lastConnectedDate: Date.now()
            });

            await this.showMessageToAll(displayName + " on");
        }
    }

    getDeviceNameFromTopic(topic) {
        let elements = topic.split('/');
        return elements[elements.length - 1];
    }

    async doDeviceResponse(topic, message, messageObject) {
        let deviceName = this.getDeviceNameFromTopic(topic);
        const date = new Date();
        const hours = date.getHours();
        const mins = date.getMinutes();

        console.log(`${hours}:${mins} Got a response: ${JSON.stringify(messageObject)} from:${deviceName}`);

        var device = null;

        device = await Device.findOne({ name: deviceName });

        if (device != null) {
            await device.updateOne({
                lastResponse: message,
                lastResponseDate: Date.now()
            });
        }
    }

    async getInstallation() {
        console.log("Loading installation configuration");

        let installation = await Installation.findOne({ version: process.env.INSTALLATION_VERSION });

        if (installation === null) {
            console.log("Creating a new installation record");
            installation = new Installation(
                {
                    version: process.env.INSTALLATION_VERSION,
                    name: "Connected Little Boxes",
                    printerDestinations: [],
                    displayDestinations: [],
                    managers: [],
                    location: "Location unknown"
                }
            );
            await installation.save();
            console.log("  new record saved");
        }
        else {
            console.log("  got configuration:", installation.name);
        }

        return installation;
    }

    async addPrinter(printerDestination) {
        console.log("Adding a printer destination:", printerDestination);

        let installation = await this.getInstallation();

        if (installation.printerDestinations.includes(printerDestination)) {
            console.log("  printer already present");
            return;
        }

        installation.printerDestinations.push(printerDestination);

        await installation.save();
    }

    async updateProcessManagers() {

        console.log("Updating process manager from JSON");

        let filePath = "./JSON/deviceprocesscommands.json";
        let jsonData = null;

        try {
            const data = fs.readFileSync(filePath, 'utf8');
            jsonData = JSON.parse(data);
        } catch (err) {
            console.error('Error reading or parsing file:', err);
            return false;
        }

        let processes = jsonData.processes;

        console.log(`  ..file loaded`);

        try {
            for (let procIndex = 0; procIndex < processes.length; procIndex++) {
                let process = processes[procIndex];

                console.log(`  ..working on ${process.name}`);

                let storedProcess = await ProcessManagers.findOne({ name: process.name });

                if (storedProcess) {
                    console.log(`  ..updating process manager for ${process.name}`);
                }
                else {
                    console.log(`  ..creating a process manager for ${process.name}`);
                    storedProcess = ProcessManagers({
                        name: process.name,
                        desc: process.desc
                    });
                    await storedProcess.save();
                }

                let commands = process.commands;

                for (let commandIndex = 0; commandIndex < commands.length; commandIndex++) {
                    let command = commands[commandIndex];
                    console.log(`     ..command ${command.name}`);
                    let storedCommand = await ProcessManagerCommands.findOne({ name: command.name });
                    if (storedCommand) {
                        console.log(`    ..updating the command`);
                    }
                    else {
                        console.log(`    ..creating new command`);
                        storedCommand = ProcessManagerCommands(
                            {
                                name: command.name,
                                desc: command.desc,
                                version: command.version,
                                processManager: storedProcess._id
                            });
                        await storedCommand.save();
                    }

                    for (let itemsIndex = 0; itemsIndex < command.items.length; itemsIndex++) {
                        let item = command.items[itemsIndex];
                        let name = command.name;
                        console.log(`        ..item ${name}`);

                        let storedItem = await ProcessManagerCommandItems.findOne({
                            $and:
                                [
                                    { processCommand: { $eq: storedCommand._id } },
                                    { name: { $eq: name } }
                                ]
                        });

                        if (storedItem) {
                            console.log(`        ..updating the item`);
                        }
                        else {
                            console.log(`        ..creating new item`);
                            storedItem = ProcessManagerCommandItems(
                                {
                                    name: name,
                                    desc: item.desc,
                                    optional: item.optional,
                                    version: command.version,
                                    type: item.type,
                                    processCommand: storedCommand._id
                                }
                            );
                            await storedItem.save();
                        }
                    }
                }
            };
        } catch (err) {
            console.error('Error building the data:', err);
            return false;
        }
    }

    async addDisplay(displayDestination) {
        console.log("Adding a display destination:", displayDestination);

        let installation = await this.getInstallation();

        if (installation.displayDestinations.includes(displayDestination)) {
            console.log("  display already present");
            return;
        }

        installation.displayDestinations.push(displayDestination);

        await installation.save();
    }

    async sendMessageToPrinter(message, printer) {
        let printcommand = '{"process":"printer","command":"print","options":"datestamp","text":"' + message + '"}';
        let printdest = process.env.MQTT_TOPIC_PREFIX + "/command/" + printer;
        console.log("        ", printcommand, " to ", printdest);
        this.mqttClient.publish(printdest, printcommand);
    }

    async sendMessageToPrinters(message, installation) {
        for (const printer of installation.printerDestinations) {
            await this.sendMessageToPrinter(message, printer);
        }
    }

    async printMessage(message) {
        console.log("Printing a message:", message);

        let installation = await this.getInstallation();

        await this.sendMessageToPrinters(message, installation);
    }

    async sendMessageToDisplay(message, display) {
        let displayCommand = '{"process":"max7219","command":"display","options":"scroll,sticky","text":"' + message + '"}';
        let displaydest = process.env.MQTT_TOPIC_PREFIX + '/command/' + display;
        console.log("        ", displayCommand, " to ", displaydest);
        this.mqttClient.publish(displaydest, displayCommand);
    }

    async sendMessageToDisplays(message, installation) {
        for (const display of installation.displayDestinations) {
            await this.sendMessageToDisplay(message, display);
        }
    }

    async displayMessage(message) {
        console.log("Displaying a message:", message);

        let installation = await this.getInstallation();

        await this.sendMessageToDisplays(message, installation);
    }

    async showMessageToAll(message) {
        console.log("Showing a message to all:", message);

        let installation = await this.getInstallation();

        await this.sendMessageToPrinters(message, installation);
        await this.sendMessageToDisplays(message, installation);
    }

    async sendJSONCommandToDevice(deviceName, command) {
        let topic = process.env.MQTT_TOPIC_PREFIX + '/command/' + deviceName;

        console.log(`Sending:${command} to:${topic}`);

        // validate the command JSON and add a sequence number
        let commandObject = null;
        try {
            commandObject = JSON.parse(command);
            commandObject["seq"] = this.sequenceNumber++;
            command = JSON.stringify(commandObject);
        }
        catch (err) {
            console.log(`Invalid json command:${command} error:${err} for:${deviceName}`);
            throw (err);
        }

        this.mqttClient.publish(topic, command);

        // store the command for debugging

        var device = null;

        device = await Device.findOne({ name: deviceName });

        if (device != null) {
            await device.updateOne({
                lastCommand: command
            });
        }
    }

    async sendConsoleCommandToDevice(deviceName, command) {
        console.log('Sending console command:', deviceName);
        let jsonCommand = '{"process":"console","command":"remote","cmd":"' + command + '"}';
        this.sendJSONCommandToDevice(deviceName, jsonCommand);
    }

    async restartDevice(deviceName) {
        console.log('Restarting:', deviceName);
        this.sendJSONCommandToDevice(deviceName, '{"process":"console","command":"remote","cmd":"restart"}');
    }

    async startDeviceOTAupdate(deviceName) {
        console.log('Updating:', deviceName);
        this.sendJSONCommandToDevice(deviceName, '{"process":"console","command":"remote","cmd":"otaupdate"}');
    }

    async sendCommandToDevices(devices, command) {
        console.log(`Sending command:${command}`);

        devices.forEach(device => {
            console.log(`    to:${device.name}`);
            this.sendJSONCommandToDevice(device.name, command);
        });
    }

    async findTaggedDevices(tag) {
        let result = await Device.find({ tags: { $regex: ".*" + tag + ".*" } });
        return result;
    }

    async setLightColours(tag, colour) {
        let devices = await this.findTaggedDevices(tag);
        let command = `{"process":"pixels","command":"setnamedcolour","colourname":"${colour}"}`;
        this.sendCommandToDevices(devices, command);
    }

    async setLightPattern(tag, pattern) {
        let devices = await this.findTaggedDevices(tag);
        let command = `{"process":"pixels","command":"pattern","pattern":"mask","colourmask":"${pattern}"}`;
        this.sendCommandToDevices(devices, command);
    }

    async setWalkingLightPattern(tag, pattern) {
        let devices = await this.findTaggedDevices(tag);
        let command = `{"process":"pixels","command":"pattern","pattern":"walking","colourmask":"${pattern}"}`;
        this.sendCommandToDevices(devices, command);
    }

    async setLightsTimedTwinkle(tag) {
        let devices = await this.findTaggedDevices(tag);
        let command = `{"process":"pixels","command":"twinkle","options":"timed","sensor":"clock","trigger":"minute"}`;
        this.sendCommandToDevices(devices, command);
    }

    async setLightsTimedRandom(tag) {
        let devices = await this.findTaggedDevices(tag);
        let command = `{"process":"pixels","command":"setrandomcolour","options":"timed","sensor":"clock","trigger":"minute"}`;
        this.sendCommandToDevices(devices, command);
    }

    async handleIncomingMessage(topic, message, packet) {

        let messageString = String.fromCharCode(...message);

        const date = new Date();
        const hours = date.getHours();
        const mins = date.getMinutes();

        console.log(`${hours}:${mins} Received a packet:{messageString} on topic {topic}`);

        let messageObject = null;

        try {
            messageObject = JSON.parse(messageString);
        }
        catch (err) {
            console.log("Invalid incoming json: " + err);
            return;
        }

        if (topic === process.env.MQTT_TOPIC_PREFIX + '/' + process.env.MQTT_CONNECTED_TOPIC) {
            await this.doDeviceConnected(messageObject);
        }

        if (topic === process.env.MQTT_TOPIC_PREFIX + '/' + process.env.MQTT_REGISTERED_TOPIC) {
            await this.doDeviceRegistration(messageObject);
        }

        if (topic.startsWith(`${process.env.MQTT_TOPIC_PREFIX}/${process.env.MQTT_DATA_TOPIC}`)) {
            await this.doDeviceResponse(topic, message, messageObject);
        }
    }

    async checkForAdminUser() {
        const adminUser = await User.findOne({ email: process.env.INITIAL_ADMIN_USERNAME });

        if (adminUser == null) {
            console.log(`  Admin user not registered`);
            const hashedPassword = await bcrypt.hash(process.env.INITIAL_ADMIN_PASSWORD, 10);
            const user = new User(
                {
                    name: process.env.INITIAL_ADMIN_USERNAME,
                    password: hashedPassword,
                    role: 'admin',
                    email: process.env.INITIAL_ADMIN_USERNAME
                });
            await user.save();
            console.log("  Admin user successfully registered");
        }
    }

    async connectServices() {
        console.log("Connecting services");

        this.sequenceNumber = 0;

        this.mqttClient.subscribe(process.env.MQTT_TOPIC_PREFIX + '/' + process.env.MQTT_CONNECTED_TOPIC, { qos: 1 });
        this.mqttClient.subscribe(process.env.MQTT_TOPIC_PREFIX + '/' + process.env.MQTT_REGISTERED_TOPIC, { qos: 1 });
        this.mqttClient.subscribe(process.env.MQTT_TOPIC_PREFIX + '/' + process.env.MQTT_DATA_TOPIC + '/#', { qos: 1 });
        this.mqttClient.on("message", (topic, message, packet) =>
            this.handleIncomingMessage(topic, message, packet));

        await this.addPrinter("CLB-b00808");
        await this.addDisplay("CLB-3030da");
        await this.updateProcessManagers();
        await this.checkForAdminUser();
    }

    async startServices() {
        console.log("Starting services");

        let promiseList = [];

        promiseList[0] = this.startDBPromise(
            process.env.DATABASE_URL,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

        promiseList[1] = this.startMqttPromise(
            "mqtt://" + process.env.MQTT_HOST_URL,
            {
                clientID: process.env.MQTT_CLIENT_ID,
                username: process.env.MQTT_USER,
                password: process.env.MQTT_PASSWORD
            });

        let services = await Promise.all(promiseList);

        this.db = services[0];
        this.mqttClient = services[1];

        await this.connectServices();

        await this.showMessageToAll("System starting");
    }

    static activeManager = null;

    static getActiveManger() {
        if (Manager.activeManager == null)
            Manager.activeManager = new Manager();

        return Manager.activeManager;
    }
}

module.exports = Manager;
