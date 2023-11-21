// DOM Elements
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const buzzerOnButton = document.getElementById('buzzerOnButton');
const buzzerOffButton = document.getElementById('buzzerOffButton');
const temperatureDataContainer = document.getElementById('temperatureData');
const coDataContainer = document.getElementById('coData');
const vocDataContainer = document.getElementById('vocData');
const batteryLevelContainer = document.getElementById('batteryLevel');
const bleStateContainer = document.getElementById('bleState');

// BLE Service and Characteristic UUIDs
const bleServiceUUID = '19b10000-e8f2-537e-4f6c-d104768a1214';
const combinedSensorCharacteristicUUID = '19b10005-e8f2-537e-4f6c-d104768a1214';
const batteryCharacteristicUUID = '19b10004-e8f2-537e-4f6c-d104768a1214';
const buzzerCharacteristicUUID = '19b10003-e8f2-537e-4f6c-d104768a1214';
const coCharacteristicUUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

// Global Variables for BLE
let bleDevice = null;
let bleServer = null;
let combinedSensorCharacteristic = null;
let batteryCharacteristic = null;
let coCharacteristic = null;
let buzzerCharacteristic = null;

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
        combinedSensorCharacteristic = await service.getCharacteristic(combinedSensorCharacteristicUUID);
        batteryCharacteristic = await service.getCharacteristic(batteryCharacteristicUUID);
        coCharacteristic = await service.getCharacteristic(coCharacteristicUUID);
        buzzerCharacteristic = await service.getCharacteristic(buzzerCharacteristicUUID);

        bleStateContainer.innerHTML = 'Connected';
        bleStateContainer.style.color = '#24af37';

        await startNotifications(combinedSensorCharacteristic, handleCombinedSensorData);
        await startNotifications(batteryCharacteristic, handleBatteryLevel);
        await startNotifications(coCharacteristic, handleCOData);
    } catch (error) {
        console.log('Argh! ' + error);
    }
});

// Disconnect from BLE Device
disconnectButton.addEventListener('click', () => {
    if (!bleDevice) {
        return;
    }
    console.log('Disconnecting from Bluetooth Device...');
    if (bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
        bleStateContainer.innerHTML = 'Disconnected';
        bleStateContainer.style.color = '#d13a30';
    } else {
        console.log('> Bluetooth Device is already disconnected');
    }
});

// Handle Combined Sensor Data (Temperature and VOC)
function handleCombinedSensorData(event) {
    let combinedData = new TextDecoder().decode(event.target.value);
    if (combinedData) {
        let dataParts = combinedData.split(","); // Assuming data is comma-separated
        temperatureDataContainer.textContent = dataParts[0];
        vocDataContainer.textContent = dataParts[1];
    } else {
        console.log("Received undefined combined sensor data");
    }
}

// Handle CO Data
function handleCOData(event) {
    let coValue = new TextDecoder().decode(event.target.value);
    coDataContainer.textContent = coValue;
}

// Handle Battery Level
function handleBatteryLevel(event) {
    let batteryValue = new TextDecoder().decode(event.target.value);
    batteryLevelContainer.textContent = batteryValue + ' V';
}

// Start Notifications
async function startNotifications(characteristic, handler) {
    characteristic.addEventListener('characteristicvaluechanged', handler);
    await characteristic.startNotifications();
}

// Control Buzzer
buzzerOnButton.addEventListener('click', () => writeBuzzerValue(1));
buzzerOffButton.addEventListener('click', () => writeBuzzerValue(0));

// Write Buzzer Value
function writeBuzzerValue(value) {
    if (!buzzerCharacteristic) {
        console.log('Buzzer Characteristic is not found!');
        return;
    }
    let data = new Uint8Array([value]);
    buzzerCharacteristic.writeValue(data)
        .then(() => {
            console.log(`Buzzer value ${value} written`);
        })
        .catch(error => {
            console.log('Error when writing value!', error);
        });
}
