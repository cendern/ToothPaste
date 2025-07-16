#include <espHID.h>
#include <USB.h>

USBHIDKeyboard keyboard;

// Start the hid keyboard
void hidSetup()
{
  keyboard.begin();
  USB.begin();
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

// Send the raw keycode over the report (upto 6 keys pressed + 2 byte modifier mask)
void sendKeycode(uint8_t* modifiers, uint8_t* keys, bool slowMode) {
    // Press modifier keys
    if (*modifiers & 0x01) keyboard.press(KEY_LEFT_CTRL);
    if (*modifiers & 0x02) keyboard.press(KEY_LEFT_SHIFT);
    if (*modifiers & 0x04) keyboard.press(KEY_LEFT_ALT);
    if (*modifiers & 0x08) keyboard.press(KEY_LEFT_GUI);
    if (*modifiers & 0x10) keyboard.press(KEY_RIGHT_CTRL);
    if (*modifiers & 0x20) keyboard.press(KEY_RIGHT_SHIFT);
    if (*modifiers & 0x40) keyboard.press(KEY_RIGHT_ALT);
    if (*modifiers & 0x80) keyboard.press(KEY_RIGHT_GUI);

    // Press regular keys (assuming keys is an array of 6 keys, as USB HID standard)
    for (int i = 0; i < 6; i++) {
        if (keys[i] != 0) {
            keyboard.press(keys[i]);
        }
    }

    delay(10); // optionally slower delay if slowMode

    keyboard.releaseAll();
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