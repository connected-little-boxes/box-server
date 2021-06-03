const mongoose = require('mongoose')
const mqtt = require('mqtt');
const Device = require('./models/device');
const Process = require('./models/process');
const Connection = require('./models/connection');
const Installation = require('./models/installation');

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

        // make an entry into the connected table

        const result = await this.db.collection("connectLog").insertOne(messageObject);

        if (result.insertedCount == 1) {
            console.log("Device: " + messageObject.name + " connection logged.");
        }

        var device = null;

        device = await Device.findOne({ name: messageObject.name });

        if (device != null) {

            if (device.bootCommands != null) {

                const devCommandTopic = process.env.MQTT_TOPIC_PREFIX + "/command/" + device.name;

                console.log("Got boot commands:");
                let commandList = device.bootCommands.split("\n");

                for (let command of commandList) {
                    console.log("    sending-", command);
                    await this.mqttClient.publish(devCommandTopic, command);
                }
            }

            let displayName;

            if (device.friendlyName != "") {
                console.log("got a friendly name");
                displayName = device.friendlyName;
            }
            else {
                console.log("Using device name");
                displayName = messageObject.name;
            }

            await this.showMessageToAll(displayName + " on");
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
        let printcommand = '{"process":"printer","command":"print","text":"' + message + '"}';
        let printdest = process.env.MQTT_TOPIC_PREFIX + "/command/" + printer;
        console.log("        ", printcommand," to ", printdest);
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
        console.log("        ", displayCommand," to ",displaydest);
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

    async sendJSONCommandToDevice(deviceName, command)
    {
        let topic = process.env.MQTT_TOPIC_PREFIX + '/command/'+deviceName;
        console.log('Sending:',command,"to:",topic);
        this.mqttClient.publish(topic,command);
    }

    async sendConsoleCommandToDevice(deviceName, command)
    {
        console.log('Sending console command:', deviceName);
        let jsonCommand = '{"process":"console","command":"remote","commandtext":"'+command+'"}'
        this.sendJSONCommandToDevice(deviceName,jsonCommand);
    }

    async restartDevice(deviceName)
    {
        console.log('Restarting:', deviceName);
        this.sendJSONCommandToDevice(deviceName,'{"process":"console","command":"remote","commandtext":"restart"}');
    }

    async startDeviceOTAupdate(deviceName)
    {
        console.log('Updating:', deviceName);
        this.sendJSONCommandToDevice(deviceName,'{"setting":"otaupdateurl","value":"http://otadrive.com/DeviceApi/Update?"}');
        this.sendJSONCommandToDevice(deviceName,'{"setting":"otaupdateproductkey","value":"efc8b1da-4927-48aa-95d1-c52a6cda8099"}');
        this.sendJSONCommandToDevice(deviceName,'{"process":"console","command":"remote","commandtext":"otaupdate"}');
    }

    async handleIncomingMessage(topic, message, packet) {

        let messageString = String.fromCharCode(...message);

        console.log("Received a packet:", messageString, "on topic", topic);

        let messageObject = null;

        try {
            messageObject = JSON.parse(messageString);
        }
        catch (err) {
            console.log("Invalid incoming json: " + err);
            return;
        }

        // ugly and to be removed in time....
        if (messageObject.hasOwnProperty('device')) {
            console.log("got device");
            messageObject.name = messageObject.device;
        }

        if (topic === process.env.MQTT_TOPIC_PREFIX +'/'+ process.env.MQTT_CONNECTED_TOPIC) {
            this.doDeviceConnected(messageObject);
        }

        if (topic === process.env.MQTT_TOPIC_PREFIX +'/'+ process.env.MQTT_REGISTERED_TOPIC) {
            this.doDeviceRegistration(messageObject);
        }
    }

    async connectServices() {
        console.log("Connecting services");

        this.mqttClient.subscribe( process.env.MQTT_TOPIC_PREFIX +'/'+ process.env.MQTT_CONNECTED_TOPIC, { qos: 1 });
        this.mqttClient.subscribe( process.env.MQTT_TOPIC_PREFIX +'/'+ process.env.MQTT_REGISTERED_TOPIC, { qos: 1 });
        this.mqttClient.on("message", (topic, message, packet) =>
            this.handleIncomingMessage(topic, message, packet));

        this.mqttClient.publish(process.env.MQTT_TOPIC_PREFIX + '/command/CLB-302fc7', '{"process":"max7219Messages","command":"display","text":"Server"}');

        this.addPrinter("CLB-b00808");
        this.addDisplay("CLB-3030da");
    }

    async startServices() {
        console.log("Starting services");

        let promiseList = [];

        promiseList[0] = this.startDBPromise(
            process.env.DATABASE_URL,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useCreateIndex: true
            });

        promiseList[1] = this.startMqttPromise(
            process.env.MQTT_HOST_URL,
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

    static getActiveManger()
    {
        if(Manager.activeManager == null)
            Manager.activeManager = new Manager();

        return Manager.activeManager;
    }
}

module.exports = Manager;
