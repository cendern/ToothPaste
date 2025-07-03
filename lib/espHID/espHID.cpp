#include <espHID.h>
#include <USB.h>

USBHIDKeyboard keyboard;

// Start the hid keyboard
void hidSetup()
{
  keyboard.begin();
  USB.begin();
}


// Send a string with a delay
size_t sendStringSlow(const char *str, bool slowMode)
{
  size_t size = strlen(str);

  size_t n = 0;
  while (size--)
  {
    if (*str != '\r')
    {
      if (keyboard.write(*str))
      {
        n++;
      }
      else
      {
        break;
      }
    }
    size--;
    delay(slowMode);
  }
  return n;
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

