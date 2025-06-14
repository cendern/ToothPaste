//Framework libraries
#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ClipBoard libraries
#include "SecureSession.h"
#include "espHID.h"
#include "main.h"
#include "rgbRMT.h"

NeoPixelRMT led(GPIO_NUM_48);
bool deviceConnected = false;
bool oldDeviceConnected = false;
const int ledPin = 48; // Use the appropriate GPIO pin for your setup

BLEServer* bluServer = NULL; // Pointer to the BLE Server instance
BLECharacteristic* inputCharacteristic = NULL; // Characteristic for sensor data
BLECharacteristic* slowModeCharacteristic = NULL; // Characteristic for LED control

SecureSession sec;

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

    led.setColor(0, 0, 255);  // blue
    led.show();
  }
};


void bleSetup(){
    // Create the BLE Device
    BLEDevice::init("ClipBoard");
    
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

void setup() {
  hidSetup();
  bleSetup();

  led.begin();
  led.show();


  uint8_t pubKey[SecureSession::PUBKEY_SIZE];
  size_t pubLen;

  sec.init();
  
  int ret = sec.generateKeypair(pubKey, pubLen); // Generate the public key on setup
  if (!ret) {
    led.blink(500, 3, 30,30,30); // blink 3 times

    size_t olen = 0;
    char base64pubKey[50];
    mbedtls_base64_encode((unsigned char *)base64pubKey, sizeof(base64pubKey), &olen, pubKey, SecureSession::PUBKEY_SIZE); // turn the 
    base64pubKey[olen] = '\0';  // Null-terminate
    
    delay(5000);
    sendString(base64pubKey);
    
    led.set(0, 30, 30);
  }
  
  else{
    char retchar[12];
    snprintf(retchar, 12, "%d", ret);  

    sendString("Something went wrong: ");
    sendString(retchar);
    led.setColor(255, 0,0);  // Red
    led.show();
  }
  //Serial.println("Waiting a client connection to notify...");
}

void loop() {
  // notify changed value
  if (deviceConnected) {
    //inputCharacteristic->setValue(String(value).c_str());
    inputCharacteristic->notify();
    delay(300); // bluetooth stack will go into congestion, if too many packets are sent, in 6 hours test i was able to go as low as 3ms
  }

  // disconnecting
  if (!deviceConnected && oldDeviceConnected) {
    Serial.println("Device disconnected.");
    bluServer->startAdvertising(); // restart advertising
    Serial.println("Start advertising");
    oldDeviceConnected = deviceConnected;
  }

  // connecting
  if (deviceConnected && !oldDeviceConnected) {
    // do stuff here on connecting
    oldDeviceConnected = deviceConnected;
    Serial.println("Device Connected");
  }
}
