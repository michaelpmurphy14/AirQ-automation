document.getElementById('connect').addEventListener('click', function() {
    navigator.bluetooth.requestDevice({ filters: [{ services: ['19b10000-e8f2-537e-4f6c-d104768a1214'] }] })
    .then(device => device.gatt.connect())
    .then(server => server.getPrimaryService('19b10000-e8f2-537e-4f6c-d104768a1214'))
    .then(service => {
        // Get all characteristics
        return Promise.all([
            service.getCharacteristic('19b10001-e8f2-537e-4f6c-d104768a1214'), // Sensor Data
            service.getCharacteristic('19b10002-e8f2-537e-4f6c-d104768a1214'), // LED Control
            service.getCharacteristic('19b10003-e8f2-537e-4f6c-d104768a1214'), // Buzzer Control
            service.getCharacteristic('19b10004-e8f2-537e-4f6c-d104768a1214')  // Battery Level
        ]);
    })
    .then(characteristics => {
        const [sensorChar, ledChar, buzzerChar, batteryChar] = characteristics;

        // Sensor Data
        sensorChar.startNotifications().then(_ => {
            sensorChar.addEventListener('characteristicvaluechanged', event => {
                const value = new TextDecoder().decode(event.target.value);
                document.getElementById('sensorData').textContent = value;
            });
        });

        // LED Control
        document.getElementById('ledColor').addEventListener('change', event => {
            const color = event.target.value;
            const buffer = new Uint8Array([parseInt(color.substring(1), 16)]);
            ledChar.writeValue(buffer);
        });

        // Buzzer Control
        document.getElementById('buzzerOn').addEventListener('click', () => {
            buzzerChar.writeValue(new Uint8Array([1]));
        });
        document.getElementById('buzzerOff').addEventListener('click', () => {
            buzzerChar.writeValue(new Uint8Array([0]));
        });

        // Battery Level
        batteryChar.startNotifications().then(_ => {
            batteryChar.addEventListener('characteristicvaluechanged', event => {
                const value = new TextDecoder().decode(event.target.value);
                document.getElementById('batteryLevel').textContent = value + ' V';
            });
        });
    })
    .catch(error => {
        console.log('Connection failed!', error);
    });
});
