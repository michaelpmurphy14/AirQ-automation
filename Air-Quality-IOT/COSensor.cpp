// COSensor.cpp
#include "COSensor.h"
#include <Arduino.h>

COSensor::COSensor(int pin, float sensitivity, float loadResistor, float cOff)
    : _sensorPin(pin), _sensitivity(sensitivity), _loadResistor(loadResistor), _cOff(cOff) {
    _voltageRef = 1.2; // Default reference voltage
    _adcResolution = 4095; // Default ADC resolution
}

void COSensor::begin() {
    analogReadResolution(12); // Set ADC resolution to 12 bits
}

float COSensor::readConcentration() {
    int sensorValue = analogRead(_sensorPin);
    float sensorVoltage = (sensorValue / (float)_adcResolution) * _voltageRef;
    sensorVoltage -= _cOff;
    return (sensorVoltage / (_sensitivity / 1000.0)) / _loadResistor;
}
