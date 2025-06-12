#include <Arduino.h>
#include <bluefruit.h>
#include <Adafruit_nRFCrypto.h>
#include <cstdint>
#include <hid.h>
#include <main.h>


bool deviceConnected = false;
uint32_t value = 0;


BLEService clipBoardService = BLEService(SERVICE_UUID); // Create a BLE Service
BLECharacteristic inputStringCharacteristic = BLECharacteristic(INPUT_STRING_CHARACTERISTIC); // Create a BLE Characteristic for the sensor
BLECharacteristic ledCharacteristic = BLECharacteristic(LED_CHARACTERISTIC_UUID); // Create a BLE Characteristic for the sensor

void onConnect(uint16_t conn_handle) { // Callback handler for BLE Connection events
    deviceConnected = true;
    BLEConnection* connection = Bluefruit.Connection(conn_handle);
    Serial.println("Device Connected");
};


void onDisconnect(uint16_t conn_handle, uint8_t reason) { // Callback handler for BLE Connection events
    deviceConnected = false;
    Serial.println("Device Disconnected");
    Serial.println(reason, HEX);
};


void onWrite(uint16_t conn_hdl, BLECharacteristic* chr, uint8_t* data, uint16_t len) {
  Serial.print("Received: ");
  Serial.write(data, len); // Print exactly what was written
  sendString((const char*)data); // Send the received string as keystrokes
  //viewString((const char*) data);
  Serial.println();
  Serial.print("Keystrokes sent.");
  Serial.println();
}


void bleDeviceSetup(){
  Serial.println("Setting up BLE...");

  Bluefruit.configPrphBandwidth(BANDWIDTH_MAX); // Set communication bandwidth
  
  // Create the BLE Device
  Bluefruit.begin();
  Bluefruit.setTxPower(4); // Set the transmit power to 4 dBm
  Bluefruit.setName("Clipboard NRF");

  // Device Security settings go here
  // Bluefruit.Security.setPIN(PAIRING_PIN);

  // Connection State Callbacks
  Bluefruit.Periph.setConnectCallback(onConnect);
  Bluefruit.Periph.setDisconnectCallback(onDisconnect);

  clipBoardService.begin(); // Initialize the BLE Service
}

void inputCharacteristicSetup(){
  // Set the inputString Characteristic properties
  inputStringCharacteristic.setProperties(CHR_PROPS_READ | CHR_PROPS_WRITE | CHR_PROPS_NOTIFY | CHR_PROPS_INDICATE);
  inputStringCharacteristic.setPermission(SECMODE_OPEN, SECMODE_OPEN); // No security
  inputStringCharacteristic.setMaxLen(250);
  inputStringCharacteristic.setWriteCallback(onWrite); // Register the write callback
  inputStringCharacteristic.begin();
}

void advertise(){
  // Setup advertising
  Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
  Bluefruit.Advertising.addTxPower();
  Bluefruit.Advertising.addName();
  Bluefruit.Advertising.addService(clipBoardService);
  

  //Start advertising
  Bluefruit.Advertising.restartOnDisconnect(true);
  Bluefruit.Advertising.setInterval(32, 244);    // in unit of 0.625 ms
  Bluefruit.Advertising.setFastTimeout(30);      // number of seconds in fast mode
  Bluefruit.Advertising.start(0); // Start advertising forever (until something changes the state)
  Serial.println("Waiting a client connection to notify...");
}


void setup() {
  Serial.begin(115200);
  //while ( !Serial ) delay(10);   // debugging with usb serial

  hidSetup(); // Initialize HID 

  bleDeviceSetup(); // Create the BLE device and clipBoard service
  inputCharacteristicSetup(); // Create and add the input characteristic to the clipBoard service

  advertise(); // Set up and begin advertising
 
}

void loop() {

}


