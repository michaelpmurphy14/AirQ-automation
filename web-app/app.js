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
const combinedCharacteristicUUID = '19b10005-e8f2-537e-4f6c-d104768a1214'; // Updated UUID for combined data
const batteryCharacteristicUUID = '19b10004-e8f2-537e-4f6c-d104768a1214';
const buzzerCharacteristicUUID = '19b10003-e8f2-537e-4f6c-d104768a1214';
const coCharacteristicUUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

// Global Variables for BLE
let bleDevice = null;
let bleServer = null;
let combinedCharacteristic = null;
let batteryCharacteristic = null;
let coCharacteristic = null;
let buzzerCharacteristic = null;

// Connect to BLE Device
connectButton.addEventListener('click', async () => {
    try {
        console.log('Requesting Bluetooth Device...');
        bleDevice = await navigator.bluetooth.requestDevice({
            // Use filters to specify the devices to be shown
            filters: [
                { services: [bleServiceUUID] }, // Filter by service UUID
                // { name: 'YourDeviceName' }, // Uncomment and replace with your device's name to filter by device name
                // { namePrefix: 'Prefix' } // Uncomment and replace with the prefix of your device's name to filter by name prefix
            ],
            // optionalServices: [bleServiceUUID] // Include this if you need to access other optional services
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
        vocCharacteristic = await service.getCharacteristic(vocCharacteristicUUID);
        bleStateContainer.innerHTML = 'Connected';
        bleStateContainer.style.color = '#24af37';

        await startNotifications(sensorCharacteristic, handleSensorData);
        await startNotifications(batteryCharacteristic, handleBatteryLevel);
        await startNotifications(coCharacteristic, handleCOLevel);
        await startNotifications(vocCharacteristic, handleVOCLevel);
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

// Sensor Data
function handleCombinedSensorData(event) {
    let combinedData = new TextDecoder().decode(event.target.value);
    let dataParts = combinedData.split(', '); // Assuming the format is "Temp:XX.X°C, CO:YY ppm, VOC:ZZ ohms"

    // Extract and update temperature data
    let temperatureData = dataParts[0].split(':')[1]; // "XX.X°C"
    document.getElementById('temperatureData').textContent = temperatureData;

    // Extract and update CO level data
    let coData = dataParts[1].split(':')[1]; // "YY ppm"
    document.getElementById('coData').textContent = coData;

    // Extract and update VOC level data
    let vocData = dataParts[2].split(':')[1]; // "ZZ ohms"
    document.getElementById('vocData').textContent = vocData;
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

// Event Listeners
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
        combinedCharacteristic = await service.getCharacteristic(combinedCharacteristicUUID);
        batteryCharacteristic = await service.getCharacteristic(batteryCharacteristicUUID);
        coCharacteristic = await service.getCharacteristic(coCharacteristicUUID);
        buzzerCharacteristic = await service.getCharacteristic(buzzerCharacteristicUUID);

        bleStateContainer.innerHTML = 'Connected';
        bleStateContainer.style.color = '#24af37';

        await startNotifications(combinedCharacteristic, handleCombinedSensorData);
        await startNotifications(batteryCharacteristic, handleBatteryLevel);
        await startNotifications(coCharacteristic, handleCOLevel);
    } catch (error) {
        console.log('Argh! ' + error);
    }
});

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

// Buzzer Control Buttons
buzzerOnButton.addEventListener('click', () => writeBuzzerValue(1));
buzzerOffButton.addEventListener('click', () => writeBuzzerValue(0));
