let myDevice;
let sensorCharacteristic;
let ledCharacteristic;
let buzzerCharacteristic;
let batteryCharacteristic;

document.getElementById('connectButton').addEventListener('click', () => {
    connect();
});

document.getElementById('disconnectButton').addEventListener('click', () => {
    disconnect();
});

document.getElementById('ledRed').addEventListener('click', () => {
    sendLedColor(0xFF0000); // Red
});

document.getElementById('ledGreen').addEventListener('click', () => {
    sendLedColor(0x00FF00); // Green
});

document.getElementById('ledBlue').addEventListener('click', () => {
    sendLedColor(0x0000FF); // Blue
});

document.getElementById('ledOff').addEventListener('click', () => {
    sendLedColor(0x000000); // Off
});

document.getElementById('buzzerOn').addEventListener('click', () => {
    sendBuzzerState(true);
});

document.getElementById('buzzerOff').addEventListener('click', () => {
    sendBuzzerState(false);
});

async function connect() {
    try {
        const serviceUuid = '19b10000-e8f2-537e-4f6c-d104768a1214';
        const sensorCharacteristicUuid = '19b10001-e8f2-537e-4f6c-d104768a1214';
        const ledCharacteristicUuid = '19b10002-e8f2-537e-4f6c-d104768a1214';
        const buzzerCharacteristicUuid = '19b10003-e8f2-537e-4f6c-d104768a1214';
        const batteryCharacteristicUuid = '19b10004-e8f2-537e-4f6c-d104768a1214';

        console.log('Requesting Bluetooth Device...');
        myDevice = await navigator.bluetooth.requestDevice({
            filters: [{ services: [serviceUuid] }]
        });

        console.log('Connecting to GATT Server...');
        const server = await myDevice.gatt.connect();

        console.log('Getting Service...');
        const service = await server.getPrimaryService(serviceUuid);

        console.log('Getting Characteristics...');
        sensorCharacteristic = await service.getCharacteristic(sensorCharacteristicUuid);
        ledCharacteristic = await service.getCharacteristic(ledCharacteristicUuid);
        buzzerCharacteristic = await service.getCharacteristic(buzzerCharacteristicUuid);
        batteryCharacteristic = await service.getCharacteristic(batteryCharacteristicUuid);

        await sensorCharacteristic.startNotifications();
        sensorCharacteristic.addEventListener('characteristicvaluechanged', handleSensorData);

        await batteryCharacteristic.startNotifications();
        batteryCharacteristic.addEventListener('characteristicvaluechanged', handleBatteryData);

        document.getElementById('connectButton').disabled = true;
        document.getElementById('disconnectButton').disabled = false;
    } catch (error) {
        console.log('Argh! ' + error);
    }
}

function disconnect() {
    if (!myDevice) {
        return;
    }
    console.log('Disconnecting from Bluetooth Device...');
    if (myDevice.gatt.connected) {
        myDevice.gatt.disconnect();
        document.getElementById('connectButton').disabled = false;
        document.getElementById('disconnectButton').disabled = true;
    } else {
        console.log('> Bluetooth Device is already disconnected');
    }
}

function handleSensorData(event) {
    let data = event.target.value;
    let decoder = new TextDecoder('utf-8');
    let sensorData = decoder.decode(data);

    // Assuming the sensor data is comma-separated
    let parts = sensorData.split(',');
    document.getElementById('gasResistance').textContent = parts[0];
}

function handleBatteryData(event) {
    let data = event.target.value;
    let batteryLevel = data.getUint8(0);
    document.getElementById('batteryLevel').textContent = `Battery Level: ${batteryLevel}%`;
}

function sendLedColor(color) {
    if (!ledCharacteristic) {
        return;
    }
    let buffer = new Uint32Array([color]);
    ledCharacteristic.writeValue(buffer);
}

function sendBuzzerState(state) {
    if (!buzzerCharacteristic) {
        return;
    }
    let buffer = new Uint8Array([state ? 1 : 0]);
    buzzerCharacteristic.writeValue(buffer);
}

console.log('Page loaded');
