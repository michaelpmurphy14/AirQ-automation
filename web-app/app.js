const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const bleStateContainer = document.getElementById('bleState');
const gasResistanceContainer = document.getElementById('gasResistance');
const batteryLevelContainer = document.getElementById('batteryLevel');

// Define BLE Device Specs
var deviceName = 'ESP32';
var bleService = '19b10000-e8f2-537e-4f6c-d104768a1214';
var ledCharacteristicUuid = '19b10002-e8f2-537e-4f6c-d104768a1214';
var sensorCharacteristicUuid = '19b10001-e8f2-537e-4f6c-d104768a1214';
var batteryCharacteristicUuid = '19b10004-e8f2-537e-4f6c-d104768a1214';
var buzzerCharacteristicUuid = '19b10003-e8f2-537e-4f6c-d104768a1214';

// Global Variables to Handle Bluetooth
var bleServer;
var bleServiceFound;
var sensorCharacteristicFound;
var batteryCharacteristicFound;
var buzzerCharacteristicFound;

// Connect Button
connectButton.addEventListener('click', () => {
    if (isWebBluetoothEnabled()) {
        connectToDevice();
    }
});

// Disconnect Button
disconnectButton.addEventListener('click', disconnectDevice);

// Control Buttons
document.getElementById('ledRed').addEventListener('click', () => writeLedCharacteristic(0xFF0000)); // Red
document.getElementById('ledGreen').addEventListener('click', () => writeLedCharacteristic(0x00FF00)); // Green
document.getElementById('ledBlue').addEventListener('click', () => writeLedCharacteristic(0x0000FF)); // Blue
document.getElementById('ledOff').addEventListener('click', () => writeLedCharacteristic(0x000000)); // Off
document.getElementById('buzzerOn').addEventListener('click', () => writeBuzzerCharacteristic(1)); // On
document.getElementById('buzzerOff').addEventListener('click', () => writeBuzzerCharacteristic(0)); // Off

// Check if BLE is available in your Browser
function isWebBluetoothEnabled() {
    if (!navigator.bluetooth) {
        console.log("Web Bluetooth API is not available in this browser!");
        bleStateContainer.innerHTML = "Web Bluetooth API is not available in this browser!";
        return false;
    }
    console.log('Web Bluetooth API supported in this browser.');
    return true;
}

// Connect to BLE Device and Enable Notifications
function connectToDevice(){
    console.log('Initializing Bluetooth...');
    navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [bleService]
    })
    .then(device => {
        console.log('Device Selected:', device.name);
        bleStateContainer.innerHTML = 'Connected to device ' + device.name;
        bleStateContainer.style.color = "#24af37";
        device.addEventListener('gattservicedisconnected', onDisconnected);
        return device.gatt.connect();
    })
    .then(gattServer => {
        bleServer = gattServer;
        console.log("Connected to GATT Server");
        return bleServer.getPrimaryService(bleService);
    })
    .then(service => {
        bleServiceFound = service;
        console.log("Service discovered:", service.uuid);
        return Promise.all([
            service.getCharacteristic(sensorCharacteristicUuid),
            service.getCharacteristic(batteryCharacteristicUuid),
            service.getCharacteristic(buzzerCharacteristicUuid)
        ]);
    })
    .then(characteristics => {
        sensorCharacteristicFound = characteristics[0];
        batteryCharacteristicFound = characteristics[1];
        buzzerCharacteristicFound = characteristics[2];

        sensorCharacteristicFound.addEventListener('characteristicvaluechanged', handleSensorDataChange);
        sensorCharacteristicFound.startNotifications();

        batteryCharacteristicFound.addEventListener('characteristicvaluechanged', handleBatteryDataChange);
        batteryCharacteristicFound.startNotifications();

        console.log("Notifications Started.");
    })
    .catch(error => {
        console.log('Error: ', error);
    });
}

function onDisconnected(event) {
    console.log('Device Disconnected:', event.target.device.name);
    bleStateContainer.innerHTML = "Device disconnected";
    bleStateContainer.style.color = "#d13a30";
    connectButton.disabled = false;
    disconnectButton.disabled = true;
}

function handleSensorDataChange(event) {
    const newValueReceived = new TextDecoder().decode(event.target.value);
    console.log("Sensor data changed: ", newValueReceived);
    gasResistanceContainer.innerHTML = newValueReceived.split(',')[0]; // Assuming the first value is gas resistance
}

function handleBatteryDataChange(event) {
    const newValueReceived = new TextDecoder().decode(event.target.value);
    console.log("Battery data changed: ", newValueReceived);
    batteryLevelContainer.innerHTML = newValueReceived.split(',')[1]; // Assuming the second value is battery level
}

function writeLedCharacteristic(value) {
    if (bleServer && bleServer.connected && bleServiceFound) {
        bleServiceFound.getCharacteristic(ledCharacteristicUuid)
        .then(characteristic => {
            console.log("Found the LED characteristic: ", characteristic.uuid);
            const data = new Uint32Array([value]);
            return characteristic.writeValue(data);
        })
        .then(() => {
            console.log("Value written to LED characteristic:", value);
        })
        .catch(error => {
            console.error("Error writing to the LED characteristic: ", error);
        });
    } else {
        console.error("Bluetooth is not connected. Cannot write to characteristic.")
        window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!")
    }
}

function writeBuzzerCharacteristic(value) {
    if (bleServer && bleServer.connected && bleServiceFound) {
        bleServiceFound.getCharacteristic(buzzerCharacteristicUuid)
        .then(characteristic => {
            console.log("Found the Buzzer characteristic: ", characteristic.uuid);
            const data = new Uint8Array([value]);
            return characteristic.writeValue(data);
        })
        .then(() => {
            console.log("Value written to Buzzer characteristic:", value);
        })
        .catch(error => {
            console.error("Error writing to the Buzzer characteristic: ", error);
        });
    } else {
        console.error("Bluetooth is not connected. Cannot write to characteristic.")
        window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!")
    }
}

function disconnectDevice() {
    console.log("Disconnect Device.");
    if (bleServer && bleServer.connected) {
        bleServer.disconnect();
        console.log("Device Disconnected");
        bleStateContainer.innerHTML = "Device Disconnected";
        bleStateContainer.style.color = "#d13a30";
        connectButton.disabled = false;
        disconnectButton.disabled = true;
    } else {
        console.error("Bluetooth is not connected.");
        window.alert("Bluetooth is not connected.")
    }
}
