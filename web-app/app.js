let esp32Device;
let sensorCharacteristic;
let batteryCharacteristic;
let ledCharacteristic;
let buzzerCharacteristic;

document.getElementById('connect').addEventListener('click', () => {
    connectToESP32();
});

document.getElementById('disconnect').addEventListener('click', () => {
    disconnectFromESP32();
});

document.getElementById('toggleBuzzer').addEventListener('click', () => {
    toggleBuzzer();
});

document.getElementById('setNeopixelRed').addEventListener('click', () => {
    setNeopixelColor(0xFF0000); // Red
});

document.getElementById('setNeopixelGreen').addEventListener('click', () => {
    setNeopixelColor(0x00FF00); // Green
});

document.getElementById('setNeopixelBlue').addEventListener('click', () => {
    setNeopixelColor(0x0000FF); // Blue
});

document.getElementById('setNeopixelOff').addEventListener('click', () => {
    setNeopixelColor(0x000000); // Off
});

async function connectToESP32() {
    try {
        const options = {
            filters: [{ namePrefix: 'ESP32' }],
            optionalServices: ['19b10000-e8f2-537e-4f6c-d104768a1214']
        };

        console.log('Requesting Bluetooth Device...');
        esp32Device = await navigator.bluetooth.requestDevice(options);
        const server = await esp32Device.gatt.connect();
        const service = await server.getPrimaryService('19b10000-e8f2-537e-4f6c-d104768a1214');

        sensorCharacteristic = await service.getCharacteristic('19b10001-e8f2-537e-4f6c-d104768a1214');
        batteryCharacteristic = await service.getCharacteristic('19b10004-e8f2-537e-4f6c-d104768a1214');
        ledCharacteristic = await service.getCharacteristic('19b10002-e8f2-537e-4f6c-d104768a1214');
        buzzerCharacteristic = await service.getCharacteristic('19b10003-e8f2-537e-4f6c-d104768a1214');

        sensorCharacteristic.startNotifications().then(() => {
            sensorCharacteristic.addEventListener('characteristicvaluechanged', handleSensorData);
        });

        batteryCharacteristic.startNotifications().then(() => {
            batteryCharacteristic.addEventListener('characteristicvaluechanged', handleBatteryData);
        });

        document.getElementById('connect').disabled = true;
        document.getElementById('disconnect').disabled = false;

        console.log('Connected to ESP32');
    } catch (error) {
        console.log('Error: ' + error);
    }
}

function disconnectFromESP32() {
    if (!esp32Device) return;

    esp32Device.gatt.disconnect();
    document.getElementById('connect').disabled = false;
    document.getElementById('disconnect').disabled = true;
    console.log('Disconnected from ESP32');
}

function handleSensorData(event) {
    const sensorData = new TextDecoder().decode(event.target.value);
    document.getElementById('sensorData').textContent = sensorData;
}

function handleBatteryData(event) {
    const batteryData = new TextDecoder().decode(event.target.value);
    document.getElementById('batteryData').textContent = 'Battery Voltage: ' + batteryData + ' V';
}

async function toggleBuzzer() {
    if (!buzzerCharacteristic) return;
    const value = new Uint8Array([1]);
    await buzzerCharacteristic.writeValue(value);
}

async function setNeopixelColor(color) {
    if
