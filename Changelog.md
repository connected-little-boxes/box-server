# Version 2.4.1

* Added changelog (yay!)
* added Notes field to device data and allowed this to be edited in the device edit page
* changed the open device data field into a link on the device edit page and added extra description.
* moved the main menu button to the top of the device select page to make it quicker to get back
* change the device name display to show the device MQTT name rather than the friendly name in connectNewDeviceUSB.js
* added a loadType value "fromDeviceReadOnly" which gets a setting from the device but doesn't save it back. Allows us to show the device name without people being able to change it
* changed the retry behaviour in connectNewDeviceUSB.js to reload the page rather than retry the connection
* changed the behaviour of the initialSettings path in the connectedNewDevice.js route. It now doesn't register a device. Instead it passes back the URL values so that this command can be used to display the PythonIsh and JSON command paths to the device. Updated the connectNewDevice workflow to display the QR code and the address. 
* changed the python UI load to check for an updated version of HullOS before opening the UI. Needs to be at least version 4.
* modified the Pythonish editor so that it displays the device name rather than the friendly name if the friendly name has not been set
* changed reference to the word robot to the word device in the PyhonIsh editor
