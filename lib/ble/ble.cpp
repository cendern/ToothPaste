#include "ble.h"

bool oldDeviceConnected = false;
bool deviceConnected= false;

BLEServer* bluServer = NULL; // Pointer to the BLE Server instance
BLECharacteristic* inputCharacteristic = NULL; // Characteristic for sensor data
BLECharacteristic* slowModeCharacteristic = NULL; // Characteristic for LED control


class MyServerCallbacks: public BLEServerCallbacks { // Callback handler for BLE Connection events
  void onConnect(BLEServer* bluServer) {
    deviceConnected = true;
  };

  void onDisconnect(BLEServer* bluServer) {
    deviceConnected = false;
  }
};

class MyCharacteristicCallbacks : public BLECharacteristicCallbacks { // Callback handler for BLE Characteristic events
  void onWrite(BLECharacteristic* inputCharacteristic) {
    String value = String(inputCharacteristic->getValue().c_str());
    if (value.length() > 0) {
      sendString(value.c_str()); // send the string over HID
    }
  }
};


void bleSetup(){
    // Create the BLE Device
    BLEDevice::init("ClipBoard");
    BLEDevice::setPower(ESP_PWR_LVL_N3); // low power for heat
    // Create the BLE Server
    bluServer = BLEDevice::createServer();
    bluServer->setCallbacks(new MyServerCallbacks());

    // Create the BLE Service
    BLEService *pService = bluServer->createService(SERVICE_UUID);

    // Create a BLE Characteristic
    inputCharacteristic = pService->createCharacteristic(
                        INPUT_STRING_CHARACTERISTIC,
                        BLECharacteristic::PROPERTY_READ   |
                        BLECharacteristic::PROPERTY_WRITE  |
                        BLECharacteristic::PROPERTY_NOTIFY |
                        BLECharacteristic::PROPERTY_INDICATE
                        );

    // Create the ON button Characteristic
    slowModeCharacteristic = pService->createCharacteristic(
                        LED_CHARACTERISTIC_UUID,
                        BLECharacteristic::PROPERTY_WRITE
                        );

    // Register the callback for the ON button characteristic
    inputCharacteristic->setCallbacks(new MyCharacteristicCallbacks());

    // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.descriptor.gatt.client_characteristic_configuration.xml
    // Create a BLE Descriptor
    inputCharacteristic->addDescriptor(new BLE2902());
    slowModeCharacteristic->addDescriptor(new BLE2902());

    // Start the service
    pService->start();

    // Start advertising
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(false);
    pAdvertising->setMinPreferred(0x0);  // set value to 0x00 to not advertise this parameter
    BLEDevice::startAdvertising();
}