// DOM Elements
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const buzzerOnButton = document.getElementById('buzzerOnButton');
const buzzerOffButton = document.getElementById('buzzerOffButton');
const sensorDataContainer = document.getElementById('sensorData');
const batteryLevelContainer = document.getElementById('batteryLevel');
const coLevelContainer = document.getElementById('coData');
const bleStateContainer = document.getElementById('bleState');

// BLE Service and Characteristic UUIDs
const bleServiceUUID = '19b10000-e8f2-537e-4f6c-d104768a1214';
const sensorCharacteristicUUID = '19b10001-e8f2-537e-4f6c-d104768a1214';
const batteryCharacteristicUUID = '19b10004-e8f2-537e-4f6c-d104768a1214';
const buzzerCharacteristicUUID = '19b10003-e8f2-537e-4f6c-d104768a1214';
const coCharacteristicUUID = 'de5941c4-8844-11ee-b9d1-0242ac120002';

// Global Variables for BLE
let bleDevice = null;
let bleServer = null;
let sensorCharacteristic = null;
let batteryCharacteristic = null;
let coCharacteristic = null;
let buzzerCharacteristic = null;

// Connect to BLE Device
connectButton.addEventListener('click', async () => {
    try {
        console.log('Requesting Bluetooth Device...');
        bleDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [bleServiceUUID]
        });

        console.log('Connecting to GATT Server...');
        bleServer = await bleDevice.gatt.connect();

        console.log('Getting Service...');
        const service = await bleServer.getPrimaryService(bleServiceUUID);

        console.log('Getting Characteristics...');
        sensorCharacteristic = await service.getCharacteristic(sensorCharacteristicUUID);
        batteryCharacteristic = await service.getCharacteristic(batteryCharacteristicUUID);
        coCharacteristic = await service.getCharacteristic(coCharacteristicUUID);
        buzzerCharacteristic = await service.getCharacteristic(buzzerCharacteristicUUID);

        bleStateContainer.innerHTML = 'Connected';
        bleStateContainer.style.color = '#24af37';

        await startNotifications(sensorCharacteristic, handleSensorData);
        await startNotifications(batteryCharacteristic, handleBatteryLevel);
        await startNotifications(coCharacteristic, handleCOLevel);
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

// Handle Sensor Data
function handleSensorData(event) {
    let sensorValue = new TextDecoder().decode(event.target.value);
    sensorDataContainer.textContent = sensorValue;
}

// Handle CO Level
function handleCOLevel(event) {
    let COValue = new TextDecoder().decode(event.target.value);
    batteryLevelContainer.textContent = COValue + ' PPM';
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
