let device, sensorCharacteristic, ledCharacteristic, buzzerCharacteristic, batteryCharacteristic;

document.getElementById('connect').addEventListener('click', async () => {
    try {
        device = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['19b10000-e8f2-537e-4f6c-d104768a1214'] }]
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('19b10000-e8f2-537e-4f6c-d104768a1214');
        sensorCharacteristic = await service.getCharacteristic('19b10001-e8f2-537e-4f6c-d104768a1214');
        ledCharacteristic = await service.getCharacteristic('19b10002-e8f2-537e-4f6c-d104768a1214');
        buzzerCharacteristic = await service.getCharacteristic('19b10003-e8f2-537e-4f6c-d104768a1214');
        batteryCharacteristic = await service.getCharacteristic('19b10004-e8f2-537e-4f6c-d104768a1214');

        await sensorCharacteristic.startNotifications();
        sensorCharacteristic.addEventListener('characteristicvaluechanged', handleSensorData);

        document.getElementById('connect').disabled = true;
        document.getElementById('disconnect').disabled = false;
    } catch (error) {
        console.error('Connection failed', error);
    }
});

document.getElementById('disconnect').addEventListener('click', async () => {
    if (!device) return;
    await device.gatt.disconnect();
    document.getElementById('connect').disabled = false;
    document.getElementById('disconnect').disabled = true;
});

function handleSensorData(event) {
    const sensorData = new TextDecoder().decode(event.target.value);
    document.getElementById('sensorData').textContent = `Sensor Data: ${sensorData}`;
}

document.getElementById('ledRed').addEventListener('click', () => writeLedCharacteristic('red'));
document.getElementById('ledGreen').addEventListener('click', () => writeLedCharacteristic('green'));
document.getElementById('ledBlue').addEventListener('click', () => writeLedCharacteristic('blue'));
document.getElementById('ledOff').addEventListener('click', () => writeLedCharacteristic('off'));

document.getElementById('buzzerOn').addEventListener('click', () => writeBuzzerCharacteristic('1'));
document.getElementById('buzzerOff').addEventListener('click', () => writeBuzzerCharacteristic('0'));

async function writeLedCharacteristic(value) {
    if (!ledCharacteristic) return;
    const encoder = new TextEncoder();
    await ledCharacteristic.writeValue(encoder.encode(value));
}

async function writeBuzzerCharacteristic(value) {
    if (!buzzerCharacteristic) return;
    const encoder = new TextEncoder();
    await buzzerCharacteristic.writeValue(encoder.encode(value));
}
