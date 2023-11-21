#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME680.h>
#include <Adafruit_NeoPixel.h>
#include "COSensor.h"

// Pin Definitions
#define I2C_SDA 5
#define I2C_SCL 6
#define LED_PIN 20
#define BUZZER_PIN 1
#define BATTERY_PIN 4

// BME680 and CO Sensor Instances
Adafruit_BME680 bme;
COSensor coSensor(3, 2.125, 10.0, 0.10786);

// NeoPixel Setup
Adafruit_NeoPixel pixels(1, LED_PIN, NEO_GRB + NEO_KHZ800);

// BLE Variables
BLEServer* pServer = nullptr;
BLECharacteristic *pCombinedCharacteristic, *pLedCharacteristic, *pBuzzerCharacteristic, *pBatteryCharacteristic, *pCOCharacteristic;

// UUIDs
const char* SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214";
const char* COMBINED_CHARACTERISTIC_UUID = "19b10005-e8f2-537e-4f6c-d104768a1214"; // New UUID for combined data
const char* LED_CHARACTERISTIC_UUID = "19b10002-e8f2-537e-4f6c-d104768a1214";
const char* BUZZER_CHARACTERISTIC_UUID = "19b10003-e8f2-537e-4f6c-d104768a1214";
const char* BATTERY_CHARACTERISTIC_UUID = "19b10004-e8f2-537e-4f6c-d104768a1214";
const char* CO_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

// Forward Declarations
void setupBLE();
void setupBME680();
void updateSensorData();
void updateBatteryLevel();
void updateCOData();

class MyServerCallbacks : public BLEServerCallbacks {
public:
    MyServerCallbacks(Adafruit_NeoPixel& pixels) : pixels(pixels) {}

    void onConnect(BLEServer* pServer) override {
        updateLedColor(0, 255, 0); // Green when connected
        triggerBuzzer();
    }

    void onDisconnect(BLEServer* pServer) override {
        updateLedColor(0, 0, 255); // Blue when disconnected
    }

private:
    Adafruit_NeoPixel& pixels;

    void updateLedColor(uint8_t red, uint8_t green, uint8_t blue) {
        pixels.setPixelColor(0, pixels.Color(red, green, blue));
        pixels.show();
    }

    void triggerBuzzer() {
        digitalWrite(BUZZER_PIN, HIGH);
        delay(500);
        digitalWrite(BUZZER_PIN, LOW);
    }
};

void setup() {
    Serial.begin(115200);
    pixels.begin();
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(BATTERY_PIN, INPUT);

    setupBME680();
    setupBLE();

    pixels.setPixelColor(0, pixels.Color(0, 0, 255)); // Blue when powered on
    pixels.show();
}

void loop() {
    if (pServer->getConnectedCount() > 0) {
        updateSensorData();
        updateBatteryLevel();
        updateCOData();

    }
}

void setupBLE() {
    BLEDevice::init("ESP32");
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks(pixels));

    BLEService *pService = pServer->createService(SERVICE_UUID);

    // BME680 Characteristic
    pCombinedCharacteristic = pService->createCharacteristic(
                      COMBINED_CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
    pCombinedCharacteristic->addDescriptor(new BLE2902());

    // LED Characteristic
    pLedCharacteristic = pService->createCharacteristic(
                      LED_CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_WRITE
                    );
    pLedCharacteristic->addDescriptor(new BLE2902());

    // Buzzer Characteristic
    pBuzzerCharacteristic = pService->createCharacteristic(
                      BUZZER_CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_WRITE
                   );
    pBuzzerCharacteristic->addDescriptor(new BLE2902());

    // Battery Characteristic
    pBatteryCharacteristic = pService->createCharacteristic(
                     BATTERY_CHARACTERISTIC_UUID,
                     BLECharacteristic::PROPERTY_READ |
                     BLECharacteristic::PROPERTY_NOTIFY
                    );
    pBatteryCharacteristic->addDescriptor(new BLE2902());

    // CO Characteristic
    pCOCharacteristic = pService->createCharacteristic(
                    CO_CHARACTERISTIC_UUID,
                     BLECharacteristic::PROPERTY_READ |
                     BLECharacteristic::PROPERTY_NOTIFY
                    );
    pCOCharacteristic->addDescriptor(new BLE2902());

    pService->start();

    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(false);
    pAdvertising->setMinPreferred(0x0);
    BLEDevice::startAdvertising();
    Serial.println("Waiting for a client connection to notify...");
}

void setupBME680() {
    Wire.begin(I2C_SDA, I2C_SCL, 100000);
    if (!bme.begin(0x76, &Wire)) {
        Serial.println("Could not find a valid BME680 sensor, check wiring!");
        while (1);
    }
    bme.setTemperatureOversampling(BME680_OS_8X);
}

void updateSensorData() {
    if (!bme.performReading()) {
        Serial.println("Failed to perform reading :(");
        return;
    }

    // Send temperature and VOC as a combined string, separated by a comma
    String combinedData = String(bme.temperature) + "," + String(bme.gas_resistance);
    pCombinedCharacteristic->setValue(combinedData.c_str());
    pCombinedCharacteristic->notify();
    Serial.println("Combined data notified: " + combinedData);
    delay(1000);
}

void updateCOData() {
    // Send CO level as a raw value
    float concentration = coSensor.readConcentration();
    pCOCharacteristic->setValue(String(concentration).c_str());
    pCOCharacteristic->notify();
    Serial.print("CO Concentration: ");
    Serial.print(concentration);
    Serial.println(" ppm");
    delay(5000);
}

void updateBatteryLevel() {
    uint32_t Vbatt = analogRead(BATTERY_PIN);
    float Vbattf = 2 * Vbatt / 4095.0 * 3.3; // Calculate battery voltage
    if (Vbattf < 3.0) {
        pixels.setPixelColor(0, pixels.Color(255, 0, 0)); // Red when battery is low
        pixels.show();
        delay(1000);
        pixels.setPixelColor(0, pixels.Color(0, 0, 0)); // Turn off LED
        pixels.show();
        delay(1000);
    }
    pBatteryCharacteristic->setValue(String(Vbattf).c_str());
    pBatteryCharacteristic->notify();
    Serial.print("Battery Voltage: ");
    Serial.println(Vbattf, 3);
}
