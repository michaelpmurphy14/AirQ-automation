// DOM Elements
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const temperatureDataContainer = document.getElementById('temperatureData');
const humidityDataContainer = document.getElementById('humidityData');
const pressureDataContainer = document.getElementById('pressureData');
const iaqDataContainer = document.getElementById('iaqData');
const staticIaqDataContainer = document.getElementById('staticIaqData');
const co2DataContainer = document.getElementById('co2Data');
const vocDataContainer = document.getElementById('vocData');
const coDataContainer = document.getElementById('coData');
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

// Initially, set the disconnect button to disabled
disconnectButton.classList.add('disabled');

// Connect to BLE Device
connectButton.addEventListener('click', async () => {
    try {
        console.log('Requesting Bluetooth Device...');
        bleDevice = await navigator.bluetooth.requestDevice({
            filters: [{ services: [bleServiceUUID] }],
        });

        console.log(`Connecting to GATT Server of ${bleDevice.name}...`);
        bleServer = await bleDevice.gatt.connect();

        console.log('Getting Service...');
        const service = await bleServer.getPrimaryService(bleServiceUUID);

        console.log('Getting Characteristics...');
        combinedSensorCharacteristic = await getCharacteristic(service, combinedSensorCharacteristicUUID);
        batteryCharacteristic = await getCharacteristic(service, batteryCharacteristicUUID);
        coCharacteristic = await getCharacteristic(service, coCharacteristicUUID);

        bleStateContainer.innerHTML = 'Connected';
        bleStateContainer.style.color = '#24af37';

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

        connectButton.classList.add('disabled');
        disconnectButton.classList.remove('disabled');
    } catch (error) {
        console.error('Connection failed:', error);
        bleStateContainer.innerHTML = 'Connection Failed';
        bleStateContainer.style.color = '#d13a30';
    }
});

bleDevice.addEventListener('gattserverdisconnected', onDisconnected);

function onDisconnected() {
    console.log('Device disconnected');
    reconnect();
}

async function reconnect() {
    if (!bleDevice) {
        return;
    }
    try {
        console.log('Reconnecting...');
        await bleDevice.gatt.connect();
        // Reinitialize services and characteristics
        // ... code to reinitialize services and characteristics ...
    } catch (error) {
        console.log('Reconnect failed:', error);
    }
}

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

async function startNotifications(characteristic) {
    try {
        if (characteristic.properties.notify) {
            await characteristic.startNotifications();
            console.log(`Started notifications for ${characteristic.uuid}`);
            characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
        } else {
            console.log(`Notifications not supported for ${characteristic.uuid}`);
        }
    } catch (error) {
        console.error(`Error starting notifications for ${characteristic.uuid}:`, error);
    }
}

function handleCharacteristicValueChanged(event) {
    let characteristic = event.target;
    console.log(`Notification from ${characteristic.uuid}: `, event.target.value);

    // Decode the data from the characteristic
    let value = new TextDecoder().decode(event.target.value);

    // Process the data based on the characteristic UUID
    switch (characteristic.uuid) {
        case '19b10005-e8f2-537e-4f6c-d104768a1214': // Combined Sensor Characteristic
            processCombinedSensorData(value);
            break;
        case '19b10004-e8f2-537e-4f6c-d104768a1214': // Battery Characteristic
            processBatteryData(value);
            break;
        case '6e400002-b5a3-f393-e0a9-e50e24dcca9e': // CO Characteristic
            processCOData(value);
            break;
        default:
            console.log('Unknown characteristic UUID:', characteristic.uuid);
    }
}

function processCombinedSensorData(data) {
    let sensorValues = data.split(',');
    if (sensorValues.length >= 7) {
        temperatureDataContainer.textContent = "Temperature: " + sensorValues[0] + " °C";
        humidityDataContainer.textContent = "Humidity: " + sensorValues[1] + " %";
        pressureDataContainer.textContent = "Pressure: " + sensorValues[2] + " hPa";
        iaqDataContainer.textContent = "IAQ: " + sensorValues[3];
        staticIaqDataContainer.textContent = "Static IAQ: " + sensorValues[4];
        co2DataContainer.textContent = "CO2 Equivalent: " + sensorValues[5] + " ppm";
        vocDataContainer.textContent = "Breath VOC Equivalent: " + sensorValues[6] + " ppm";
    } else {
        console.log('Invalid sensor data received:', sensorValues);
    }
}

function processBatteryData(data) {
    let batteryLevel = parseFloat(data);
    batteryLevelContainer.textContent = 'Battery: ' + batteryLevel.toFixed(2) + '%';
}

function processCOData(data) {
    let coLevel = parseFloat(data);
    coDataContainer.textContent = 'CO Level: ' + coLevel.toFixed(2) + ' ppm';
}
function handleCharacteristicValueChanged(event) {
    let characteristic = event.target;
    console.log(`Notification from ${characteristic.uuid}: `, event.target.value);

function handleCombinedSensorData(event) {
    let sensorValues = new TextDecoder().decode(event.target.value).split(',');
    if (sensorValues.length >= 7) {
        temperatureDataContainer.textContent = "Temperature: " + sensorValues[0] + " °C";
        humidityDataContainer.textContent = "Humidity: " + sensorValues[1] + " %";
        pressureDataContainer.textContent = "Pressure: " + sensorValues[2] + " hPa";
        iaqDataContainer.textContent = "IAQ: " + sensorValues[3];
        staticIaqDataContainer.textContent = "Static IAQ: " + sensorValues[4];
        co2DataContainer.textContent = "CO2 Equivalent: " + sensorValues[5] + " ppm";
        vocDataContainer.textContent = "Breath VOC Equivalent: " + sensorValues[6] + " ppm";
    } else {
        console.log('Invalid sensor data received:', sensorValues);
    }
}

function handleCOLevel(event) {
    let coValue = new TextDecoder().decode(event.target.value);
    coDataContainer.textContent = coValue + " ppm";
}

function handleBatteryLevel(event) {
    let batteryVoltage = parseFloat(new TextDecoder().decode(event.target.value));
    let batteryPercent = ((batteryVoltage - 2.8) / 2) * 100;
    batteryPercent = Math.max(0, Math.min(100, batteryPercent)); // Clamping between 0 and 100
    batteryLevelContainer.textContent = 'Battery: ' + batteryPercent.toFixed(2) + '%';
}

// Disconnect from BLE Device
disconnectButton.addEventListener('click', () => {
    if (!bleDevice) {
        console.log('No Bluetooth Device to disconnect');
        return;
    }
    console.log('Disconnecting from Bluetooth Device...');
    if (bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
        console.log('Disconnected successfully.');
        bleStateContainer.innerHTML = 'Disconnected';
        bleStateContainer.style.color = '#d13a30';

        connectButton.classList.remove('disabled');
        disconnectButton.classList.add('disabled');
    } else {
        console.log('> Bluetooth Device is already disconnected');
    }
});
