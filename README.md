# box-server

This is the server  for Connected Little Boxes. It builds a database of connected devices and allows remote management and control.

You will need node.js and Mongo DB installed on your server to make it work. 

You will also need to make a .env file to configure the server. These are the settings you will need:
```
DATABASE_URL=url of the databse
INSTALLATION_VERSION=your version details

MQTT_CLIENT_ID=id of the server on MQTT
MQTT_HOST_URL=url of MQTT host
MQTT_USER=username on MQTT host
MQTT_PASSWORD=password on MQTT host

MQTT_CONNECTED_TOPIC=topic for connection messages (must match that in client devices)
MQTT_REGISTERED_TOPIC=topic for registration messages (must match that in client devices)

ACTIVE_TOKEN_SECRET=Key for JWT authentication
REFRESH_TOKEN_SECRET=Key for JWT authentication

CONFIG_ACCESS_POINT=CLB_SETUP
CONFIG_HOST_ADDRESS=http://clb.local

```
The final two settings are used in the configuration instruction pages and must must match the ones in your embedded device. 

have fun