#include <hid.h>

Adafruit_USBD_HID keyboard;
const uint8_t asciiToKeycode[128][2] = {HID_ASCII_TO_KEYCODE};
const uint8_t desc_hid_report[] = {TUD_HID_REPORT_DESC_KEYBOARD()};

void hidSetup(){
  // Manual begin() is required on core without built-in support e.g. mbed rp2040
  Serial.println("Starting TinyUSB Device...");
  TinyUSBDevice.begin(0);

  keyboard.setBootProtocol(HID_ITF_PROTOCOL_KEYBOARD);
  keyboard.setPollInterval(1);
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

}


void sendKey(uint8_t* keycode, uint8_t modifier) {

  
  keyboard.keyboardReport(0, modifier, keycode); // key press
  delay(10);

  keyboard.keyboardRelease(0); // key release
  delay(10);
}

void sendString(const char* str) {
    while (*str) { // until we hit a null pointer, iterate over each char in a string 

        uint8_t ascii = (uint8_t)(*str);
        uint8_t modifier = 0;
        uint8_t keycode[6]  = {0};

        if ( asciiToKeycode[ascii][0] ) 
          modifier = KEYBOARD_MODIFIER_LEFTSHIFT;

        keycode[0] = asciiToKeycode[ascii][1];

        while (!keyboard.ready()) delay(10); // wait for previous report to be fully sent

        sendKey(keycode, modifier);
        str++;
    }
}


void viewString(const char* str) {
    while (*str) {

        uint8_t ascii = (uint8_t)(*str);
        uint8_t modifier = 0;
        uint8_t keycode[6]  = {0};
        
        Serial.printf("Ascii: %c", char(ascii));

        if ( asciiToKeycode[ascii][0] ) 
          modifier = KEYBOARD_MODIFIER_LEFTSHIFT;

        keycode[0] = asciiToKeycode[*str][1];

        Serial.print("Keycode: ");
        for (int i = 0; i < 6; i++) {
            Serial.print("0x");
            if (keycode[i] < 0x10) Serial.print("0");  // leading zero
            Serial.print(keycode[i], HEX);
            Serial.print(" ");
        }

        Serial.printf("Modifier: %d", modifier);
        str++;
    }
}
