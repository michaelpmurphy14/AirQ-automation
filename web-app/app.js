// DOM Elements
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const temperatureDataContainer = document.getElementById('temperatureData');
const coDataContainer = document.getElementById('coData');
const vocDataContainer = document.getElementById('vocData');
const batteryLevelContainer = document.getElementById('batteryLevel');
const bleStateContainer = document.getElementById('bleState');

// BLE Service and Characteristic UUIDs
const bleServiceUUID = '19b10000-e8f2-537e-4f6c-d104768a1214';
const combinedSensorCharacteristicUUID = '19b10005-e8f2-537e-4f6c-d104768a1214';
const batteryCharacteristicUUID = '19b10004-e8f2-537e-4f6c-d104768a1214';
const coCharacteristicUUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

// Global Variables for BLE
let bleDevice = null;
let bleServer = null;
let combinedSensorCharacteristic = null;
let batteryCharacteristic = null;
let coCharacteristic = null;

// Connect to BLE Device
connectButton.addEventListener('click', async () => {
    try {
        console.log('Requesting Bluetooth Device...');
        bleDevice = await navigator.bluetooth.requestDevice({
            filters: [{ services: [bleServiceUUID] }],
        });

        console.log('Connecting to GATT Server...');
        bleServer = await bleDevice.gatt.connect();

        console.log('Getting Service...');
        const service = await bleServer.getPrimaryService(bleServiceUUID);

        console.log('Getting Characteristics...');
        combinedSensorCharacteristic = await getCharacteristic(service, combinedSensorCharacteristicUUID);
        batteryCharacteristic = await getCharacteristic(service, batteryCharacteristicUUID);
        coCharacteristic = await getCharacteristic(service, coCharacteristicUUID);

        bleStateContainer.innerHTML = 'Connected';
        bleStateContainer.style.color = '#24af37';

        // Enable/Disable buttons based on connection status
        connectButton.disabled = true;
        disconnectButton.disabled = false;

        // Start notifications if characteristics are valid
        if (combinedSensorCharacteristic) {
            await startNotifications(combinedSensorCharacteristic, handleCombinedSensorData);
        }
        if (batteryCharacteristic) {
            await startNotifications(batteryCharacteristic, handleBatteryLevel);
        }
        if (coCharacteristic) {
            await startNotifications(coCharacteristic, handleCOLevel);
        }
    } catch (error) {
        console.log('Argh! ' + error);
    }
});

// Disconnect from BLE Device
disconnectButton.addEventListener('click', () => {
    if (!bleDevice) {
        console.log('No Bluetooth Device to disconnect');
        return;
    }
    console.log('Disconnecting from Bluetooth Device...');
    if (bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
        bleStateContainer.innerHTML = 'Disconnected';
        bleStateContainer.style.color = '#d13a30';

        // Enable/Disable buttons based on connection status
        connectButton.disabled = false;
        disconnectButton.disabled = true;
    } else {
        console.log('> Bluetooth Device is already disconnected');
    }
});


async function getCharacteristic(service, uuid) {
    try {
        const characteristic = await service.getCharacteristic(uuid);
        console.log(`Characteristic ${uuid} found`, characteristic);
        return characteristic;
    } catch (error) {
        console.error(`Error getting characteristic ${uuid}:`, error);
        return null;
    }
}

// Start Notifications
async function startNotifications(characteristic, handler) {
    try {
        characteristic.addEventListener('characteristicvaluechanged', handler);
        await characteristic.startNotifications();
        console.log(`Started notifications for ${characteristic.uuid}`);
    } catch (error) {
        console.error(`Error starting notifications for ${characteristic.uuid}:`, error);
    }
}

// Handle Combined Sensor Data (Temperature and VOC)
function handleCombinedSensorData(event) {
    let sensorValues = new TextDecoder().decode(event.target.value).split(',');
    if (sensorValues.length >= 2) {
        let temperature = sensorValues[0] + " °C";
        let vocResistance = sensorValues[1] + " ohms";
        temperatureDataContainer.textContent = temperature;
        vocDataContainer.textContent = vocResistance;
    } else {
        console.log('Invalid sensor data received:', sensorValues);
    }
}

// Handle CO Data
function handleCOLevel(event) {
    let coValue = new TextDecoder().decode(event.target.value);
    coDataContainer.textContent = coValue + " ppm";
}

// Handle Battery Level
function handleBatteryLevel(event) {
    let batteryValue = new TextDecoder().decode(event.target.value);
    batteryLevelContainer.textContent = batteryValue + ' V';
}


