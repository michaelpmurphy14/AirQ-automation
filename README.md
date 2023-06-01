# AirQ automation
 using ESP32C3 chip to collect and analyze air quality data
# Background
Create a sensor platform that can provide air quality data in a self-contained manner while also having the option to interface with an application.
 
A MiCS524 sensor for CO and a BME680 sensor for VOC, eCO2, and Temp/Humidity will connect to a Seeed Studio XIAO nRF52840 board and will be powered by an internal battery. The board will transmit data to an integrated RGB led and audible alert module and will also push data over BLE and WiFi to an application server. The device will be addressable by a single momentary push-button switch for checking battery status, pairing, etc...
 
The device will be able to be charged through the usb-c port on the nRF52840 board, and battery life will be 5-7 days on a single charge under normal load. The device will connect to any MagSafe device and will be able to provide charge-through capabilities when plugged in, as well as the capability to act as a standalone back-up power-bank to the connected device for a limited period
# Hardware Setup
## Bill of Materials
[Seed XIAO ESP32C3](https://www.seeedstudio.com/Seeed-XIAO-ESP32C3-p-5431.html)

[MICS 5524 Sensor](https://wiki.dfrobot.com/Fermion__MEMS_Gas_Sensor___MiCS-5524_SKU_SEN0440)

[BME680 Sensor](https://www.adafruit.com/product/3660)

[Buzzer]

[RGB Led]

[Li-Po Battery]

[QI Wireless Charging Unit]

## Technical Challenges
### Calibration
Each device will have to manually calibrated to provide an accurate range of gas readings from the MIS5524 Sensor. To compare each sensor and chip configuration, we will use onboard tinyML to calibrate to known values and adjust for drift over time
