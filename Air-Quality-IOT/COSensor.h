// COSensor.h
#ifndef CO_SENSOR_H
#define CO_SENSOR_H

class COSensor {
public:
    COSensor(int pin, float sensitivity, float loadResistor, float cOff);
    void begin();
    float readConcentration();

private:
    int _sensorPin;
    float _sensitivity;
    float _loadResistor;
    float _cOff;
    float _voltageRef;
    int _adcResolution;
};

#endif
