#include <espHID.h>
#include <USB.h>

#include <USBHIDKeyboard.h>
#include <USBHIDMouse.h>
#include <USBHIDConsumerControl.h>
#include <USBHIDSystemControl.h>

// Needed to enable CDC if defined
#if ARDUINO_USB_CDC_ON_BOOT
    #include <USBCDC.h>
    USBCDC USBSerial; 
#endif



USBHIDKeyboard keyboard; // Non-boot Keyboard
USBHIDMouse mouse;
USBHIDConsumerControl control;
USBHIDSystemControl syscontrol;


uint8_t const desc_hid_report[] = {
    TUD_HID_REPORT_DESC_KEYBOARD()
};

// Start the hid keyboard
void hidSetup()
{ 
  if(ARDUINO_USB_CDC_ON_BOOT) USBSerial.begin(); 
  keyboard.begin();
  mouse.begin();
  control.begin();
  syscontrol.begin();

  // Ideally these shouldn't be needed since they're already defined in the header, but i have no idea why they don't work consistently
  USB.manufacturerName(USB_MANUFACTURER);
  USB.productName(USB_PRODUCT);

  USB.begin();
  DEBUG_SERIAL_PRINTLN(tud_hid_get_protocol());
}

// Send a string with a delay between each character (crude implementation of alternative polling rates since ESPHID doesn't expose this)
size_t sendStringSlow(const char *str, int delayms) {
  size_t sentCount = 0;

  for (size_t i = 0; str[i] != '\0'; i++) {
    char ch = str[i];

    keyboard.print(ch);  // Send single character
    sentCount++;

    delay(delayms);  // Blocking delay between characters
  }

  return sentCount;
}

// Send a string
void sendString(const char *str, bool slowMode)
{
  if(!slowMode)
    keyboard.print(str);
    
  else
    sendStringSlow(str, SLOWMODE_DELAY_MS);
}

// Cast a pointer to a string pointer and send the string 
void sendString(void *arg, bool slowMode)
{
  const char *str = static_cast<const char *>(arg);
  sendString(str, slowMode);
}

// Press all the keys in the array together and release them after 50ms (max 6)
void sendKeycode(uint8_t* keys, bool slowMode) {
    for(int i=0; i<7; i++){
      keyboard.press(keys[i]);
    }
    delay(50); // optionally slower delay if slowMode
    keyboard.releaseAll();
}

void moveMouse(int32_t x, int32_t y, int32_t LClick, int32_t RClick){
  
  //Click before moving if the click is in the same report
  if(!(mouse.isPressed(MOUSE_LEFT)) && LClick == 1){
    mouse.press(MOUSE_LEFT);
  }

  if(!(mouse.isPressed(MOUSE_RIGHT)) && RClick == 1){
    mouse.press(MOUSE_RIGHT);
  }
  

  //smoothMoveMouse(x, y, 20, 5); // Move the mouse by dx and dy over 20 steps and SLOWMODE_DELAY_MS ms between each step
  mouse.move(x, y);

  // Release after moving the mouse
  if (mouse.isPressed(MOUSE_LEFT) && LClick == 2) {
      mouse.release(MOUSE_LEFT);
  }
  
  if (mouse.isPressed(MOUSE_RIGHT) && RClick == 2) {
      mouse.release(MOUSE_RIGHT);
  }
  
}

void moveMouse(uint8_t* mousePacket){ // mousePacket is an array of int32_t values sent over a uint8_t stream
  int32_t* ints = reinterpret_cast<int32_t*>(mousePacket); // Safely cast uint8_t* to uint32_t*
  moveMouse(ints[0], ints[1], ints[2], ints[3]);
}


// ##################### Delay Functions #################### //
// Timer callback must match `void (*)(void *)`
void sendStringCallback(void *arg)
{
  const char *str = static_cast<const char *>(arg);
  sendString(str, true);
}

// Delayed send function to wait before sending a string
void sendStringDelay(void *arg, int delayms){
  esp_timer_create_args_t timer_args = {
      .callback = &sendStringCallback,
      .arg = arg,
      .dispatch_method = ESP_TIMER_TASK,
      .name = "delayedFn"
    };
    esp_timer_handle_t oneShotTimer;
    esp_timer_create(&timer_args, &oneShotTimer);
    esp_timer_start_once(oneShotTimer, delayms*1000); // Delay uses ms
}