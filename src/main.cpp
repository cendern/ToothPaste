#include <Arduino.h>
#include <bluefruit.h>
#include <Adafruit_nRFCrypto.h>
#include <Adafruit_TinyUSB.h>

#define LED PIN_015
#define SERVICE_UUID        "19b10000-e8f2-537e-4f6c-d104768a1214"
#define INPUT_STRING_CHARACTERISTIC "6856e119-2c7b-455a-bf42-cf7ddd2c5907"
#define LED_CHARACTERISTIC_UUID "19b10002-e8f2-537e-4f6c-d104768a1214"

// From https://github.com/hathach/tinyusb/blob/master/src/class/hid/hid.h
#define HID_ASCII_TO_KEYCODE \
    {0, 0                     }, /* 0x00 Null      */ \
    {0, 0                     }, /* 0x01           */ \
    {0, 0                     }, /* 0x02           */ \
    {0, 0                     }, /* 0x03           */ \
    {0, 0                     }, /* 0x04           */ \
    {0, 0                     }, /* 0x05           */ \
    {0, 0                     }, /* 0x06           */ \
    {0, 0                     }, /* 0x07           */ \
    {0, HID_KEY_BACKSPACE     }, /* 0x08 Backspace */ \
    {0, HID_KEY_TAB           }, /* 0x09 Tab       */ \
    {0, HID_KEY_ENTER         }, /* 0x0A Line Feed */ \
    {0, 0                     }, /* 0x0B           */ \
    {0, 0                     }, /* 0x0C           */ \
    {0, HID_KEY_ENTER         }, /* 0x0D CR        */ \
    {0, 0                     }, /* 0x0E           */ \
    {0, 0                     }, /* 0x0F           */ \
    {0, 0                     }, /* 0x10           */ \
    {0, 0                     }, /* 0x11           */ \
    {0, 0                     }, /* 0x12           */ \
    {0, 0                     }, /* 0x13           */ \
    {0, 0                     }, /* 0x14           */ \
    {0, 0                     }, /* 0x15           */ \
    {0, 0                     }, /* 0x16           */ \
    {0, 0                     }, /* 0x17           */ \
    {0, 0                     }, /* 0x18           */ \
    {0, 0                     }, /* 0x19           */ \
    {0, 0                     }, /* 0x1A           */ \
    {0, HID_KEY_ESCAPE        }, /* 0x1B Escape    */ \
    {0, 0                     }, /* 0x1C           */ \
    {0, 0                     }, /* 0x1D           */ \
    {0, 0                     }, /* 0x1E           */ \
    {0, 0                     }, /* 0x1F           */ \
                                                      \
    {0, HID_KEY_SPACE         }, /* 0x20           */ \
    {1, HID_KEY_1             }, /* 0x21 !         */ \
    {1, HID_KEY_APOSTROPHE    }, /* 0x22 "         */ \
    {1, HID_KEY_3             }, /* 0x23 #         */ \
    {1, HID_KEY_4             }, /* 0x24 $         */ \
    {1, HID_KEY_5             }, /* 0x25 %         */ \
    {1, HID_KEY_7             }, /* 0x26 &         */ \
    {0, HID_KEY_APOSTROPHE    }, /* 0x27 '         */ \
    {1, HID_KEY_9             }, /* 0x28 (         */ \
    {1, HID_KEY_0             }, /* 0x29 )         */ \
    {1, HID_KEY_8             }, /* 0x2A *         */ \
    {1, HID_KEY_EQUAL         }, /* 0x2B +         */ \
    {0, HID_KEY_COMMA         }, /* 0x2C ,         */ \
    {0, HID_KEY_MINUS         }, /* 0x2D -         */ \
    {0, HID_KEY_PERIOD        }, /* 0x2E .         */ \
    {0, HID_KEY_SLASH         }, /* 0x2F /         */ \
    {0, HID_KEY_0             }, /* 0x30 0         */ \
    {0, HID_KEY_1             }, /* 0x31 1         */ \
    {0, HID_KEY_2             }, /* 0x32 2         */ \
    {0, HID_KEY_3             }, /* 0x33 3         */ \
    {0, HID_KEY_4             }, /* 0x34 4         */ \
    {0, HID_KEY_5             }, /* 0x35 5         */ \
    {0, HID_KEY_6             }, /* 0x36 6         */ \
    {0, HID_KEY_7             }, /* 0x37 7         */ \
    {0, HID_KEY_8             }, /* 0x38 8         */ \
    {0, HID_KEY_9             }, /* 0x39 9         */ \
    {1, HID_KEY_SEMICOLON     }, /* 0x3A :         */ \
    {0, HID_KEY_SEMICOLON     }, /* 0x3B ;         */ \
    {1, HID_KEY_COMMA         }, /* 0x3C <         */ \
    {0, HID_KEY_EQUAL         }, /* 0x3D =         */ \
    {1, HID_KEY_PERIOD        }, /* 0x3E >         */ \
    {1, HID_KEY_SLASH         }, /* 0x3F ?         */ \
                                                      \
    {1, HID_KEY_2             }, /* 0x40 @         */ \
    {1, HID_KEY_A             }, /* 0x41 A         */ \
    {1, HID_KEY_B             }, /* 0x42 B         */ \
    {1, HID_KEY_C             }, /* 0x43 C         */ \
    {1, HID_KEY_D             }, /* 0x44 D         */ \
    {1, HID_KEY_E             }, /* 0x45 E         */ \
    {1, HID_KEY_F             }, /* 0x46 F         */ \
    {1, HID_KEY_G             }, /* 0x47 G         */ \
    {1, HID_KEY_H             }, /* 0x48 H         */ \
    {1, HID_KEY_I             }, /* 0x49 I         */ \
    {1, HID_KEY_J             }, /* 0x4A J         */ \
    {1, HID_KEY_K             }, /* 0x4B K         */ \
    {1, HID_KEY_L             }, /* 0x4C L         */ \
    {1, HID_KEY_M             }, /* 0x4D M         */ \
    {1, HID_KEY_N             }, /* 0x4E N         */ \
    {1, HID_KEY_O             }, /* 0x4F O         */ \
    {1, HID_KEY_P             }, /* 0x50 P         */ \
    {1, HID_KEY_Q             }, /* 0x51 Q         */ \
    {1, HID_KEY_R             }, /* 0x52 R         */ \
    {1, HID_KEY_S             }, /* 0x53 S         */ \
    {1, HID_KEY_T             }, /* 0x55 T         */ \
    {1, HID_KEY_U             }, /* 0x55 U         */ \
    {1, HID_KEY_V             }, /* 0x56 V         */ \
    {1, HID_KEY_W             }, /* 0x57 W         */ \
    {1, HID_KEY_X             }, /* 0x58 X         */ \
    {1, HID_KEY_Y             }, /* 0x59 Y         */ \
    {1, HID_KEY_Z             }, /* 0x5A Z         */ \
    {0, HID_KEY_BRACKET_LEFT  }, /* 0x5B [         */ \
    {0, HID_KEY_BACKSLASH     }, /* 0x5C '\'       */ \
    {0, HID_KEY_BRACKET_RIGHT }, /* 0x5D ]         */ \
    {1, HID_KEY_6             }, /* 0x5E ^         */ \
    {1, HID_KEY_MINUS         }, /* 0x5F _         */ \
                                                      \
    {0, HID_KEY_GRAVE         }, /* 0x60 `         */ \
    {0, HID_KEY_A             }, /* 0x61 a         */ \
    {0, HID_KEY_B             }, /* 0x62 b         */ \
    {0, HID_KEY_C             }, /* 0x63 c         */ \
    {0, HID_KEY_D             }, /* 0x66 d         */ \
    {0, HID_KEY_E             }, /* 0x65 e         */ \
    {0, HID_KEY_F             }, /* 0x66 f         */ \
    {0, HID_KEY_G             }, /* 0x67 g         */ \
    {0, HID_KEY_H             }, /* 0x68 h         */ \
    {0, HID_KEY_I             }, /* 0x69 i         */ \
    {0, HID_KEY_J             }, /* 0x6A j         */ \
    {0, HID_KEY_K             }, /* 0x6B k         */ \
    {0, HID_KEY_L             }, /* 0x6C l         */ \
    {0, HID_KEY_M             }, /* 0x6D m         */ \
    {0, HID_KEY_N             }, /* 0x6E n         */ \
    {0, HID_KEY_O             }, /* 0x6F o         */ \
    {0, HID_KEY_P             }, /* 0x70 p         */ \
    {0, HID_KEY_Q             }, /* 0x71 q         */ \
    {0, HID_KEY_R             }, /* 0x72 r         */ \
    {0, HID_KEY_S             }, /* 0x73 s         */ \
    {0, HID_KEY_T             }, /* 0x75 t         */ \
    {0, HID_KEY_U             }, /* 0x75 u         */ \
    {0, HID_KEY_V             }, /* 0x76 v         */ \
    {0, HID_KEY_W             }, /* 0x77 w         */ \
    {0, HID_KEY_X             }, /* 0x78 x         */ \
    {0, HID_KEY_Y             }, /* 0x79 y         */ \
    {0, HID_KEY_Z             }, /* 0x7A z         */ \
    {1, HID_KEY_BRACKET_LEFT  }, /* 0x7B {         */ \
    {1, HID_KEY_BACKSLASH     }, /* 0x7C |         */ \
    {1, HID_KEY_BRACKET_RIGHT }, /* 0x7D }         */ \
    {1, HID_KEY_GRAVE         }, /* 0x7E ~         */ \
    {0, HID_KEY_DELETE        }  /* 0x7F Delete    */ \


const uint8_t asciiToKeycode[128][2] = {HID_ASCII_TO_KEYCODE};

bool deviceConnected = false;
bool oldDeviceConnected = false;
uint32_t value = 0;
uint8_t const desc_hid_report[] = {
    TUD_HID_REPORT_DESC_KEYBOARD()
};


Adafruit_USBD_HID keyboard;

BLEService pService = BLEService(SERVICE_UUID); // Create a BLE Service
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

#include <cstdint>

uint8_t asciiToHID(char c) {
    // Letters
    if (c >= 'a' && c <= 'z') {
        return 4 + (c - 'a'); // HID_KEY_A = 4
    }
    if (c >= 'A' && c <= 'Z') {
        return 4 + (c - 'A'); // TODO: Handle uppercase letters by returning keycode + shift modifier
    }

    // Numbers
    if (c >= '1' && c <= '9') {
        return 30 + (c - '1'); // '1' = 30
    }
    if (c == '0') {
        return 39; // '0' = 39
    }

    // Special characters
    switch (c) {
        case '\n': return 40;  // Enter
        case ' ':  return 44;  // Space
        case '\b': return 42;  // Backspace
        case '\t': return 43;  // Tab
        case '-':  return 45;  // Minus
        case '=':  return 46;  // Equal
        case '[':  return 47;  // Left bracket
        case ']':  return 48;  // Right bracket
        case '\\': return 49;  // Backslash
        case '#':  return 50;  // Non-US # and ~ (if needed)
        case ';':  return 51;  // Semicolon
        case '\'': return 52;  // Apostrophe
        case '`':  return 53;  // Grave accent
        case ',':  return 54;  // Comma
        case '.':  return 55;  // Period
        case '/':  return 56;  // Slash
        case '!':  return 0xCF;  // Slash
        default:
            return 0; // No HID mapping available
    }
}


void sendKey(uint8_t* keycode, uint8_t modifier) {

  keyboard.keyboardReport(0, modifier, keycode); // key press
  delay(5);

  keyboard.keyboardRelease(0); // key release
  delay(5);
}

void sendString(const char* str) {
    while (*str) {

        uint8_t ascii = (uint8_t)(*str);
        uint8_t modifier = 0;
        uint8_t keycode[6]  = {0};

        if ( asciiToKeycode[ascii][0] ) 
          modifier = KEYBOARD_MODIFIER_LEFTSHIFT;

        keycode[0] = asciiToKeycode[*str][1];


        sendKey(keycode, modifier);
        str++;
    }
}

void onWrite(uint16_t conn_hdl, BLECharacteristic* chr, uint8_t* data, uint16_t len) {
  Serial.print("Received: ");
  Serial.write(data, len); // Print exactly what was written
  sendString((const char*)data); // Send the received string as keystrokes

  Serial.print("Keystrokes sent.");
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  delay(100);

  // Manual begin() is required on core without built-in support e.g. mbed rp2040
  Serial.println("Starting TinyUSB Device...");
  TinyUSBDevice.begin(0);

  keyboard.setBootProtocol(HID_ITF_PROTOCOL_KEYBOARD);
  keyboard.setPollInterval(2);
  keyboard.setReportDescriptor(desc_hid_report, sizeof(desc_hid_report));
  keyboard.setStringDescriptor("ClipBoard Keyboard");

  // Initialize HID keyboard
  if (!keyboard.begin()) {
    Serial.println("Failed to start HID keyboard");
    while (1);
  }

  // If already enumerated, additional class driverr begin() e.g msc, hid, midi won't take effect until re-enumeration
  if (TinyUSBDevice.mounted()) {
    TinyUSBDevice.detach();
    delay(10);
    TinyUSBDevice.attach();
  }

  Serial.println("Setting up BLE...");
  pinMode(LED, OUTPUT);

  // Create the BLE Device
  Bluefruit.begin();
  Bluefruit.setTxPower(4); // Set the transmit power to 4 dBm
  Bluefruit.setName("Clipboard NRF");

  // Bluefruit Connection Callbacks
  Bluefruit.Periph.setConnectCallback(onConnect);
  Bluefruit.Periph.setDisconnectCallback(onDisconnect);



  pService.begin(); // Initialize the BLE Service

  // Set the inputString Characteristic properties
  inputStringCharacteristic.setProperties(CHR_PROPS_READ | CHR_PROPS_WRITE | CHR_PROPS_NOTIFY | CHR_PROPS_INDICATE);
  inputStringCharacteristic.setPermission(SECMODE_OPEN, SECMODE_OPEN); // No security
  inputStringCharacteristic.setMaxLen(250);
  inputStringCharacteristic.setWriteCallback(onWrite); // Register the write callback
  inputStringCharacteristic.begin();

  // https://www.bluetooth.com/specifications/gatt/viewer?attributeXmlFile=org.bluetooth.descriptor.gatt.client_characteristic_configuration.xml

  // Setup advertising
  Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
  Bluefruit.Advertising.addTxPower();
  Bluefruit.Advertising.addName();
  Bluefruit.Advertising.addService(pService);
  

  //Start advertising
  Bluefruit.Advertising.restartOnDisconnect(true);
  Bluefruit.Advertising.setInterval(32, 244);    // in unit of 0.625 ms
  Bluefruit.Advertising.setFastTimeout(30);      // number of seconds in fast mode
  Bluefruit.Advertising.start(0); // Start advertising with no timeout
  Serial.println("Waiting a client connection to notify...");
}

void loop() {

}


