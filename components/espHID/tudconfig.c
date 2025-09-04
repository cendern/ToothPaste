#include "tinyusb.h"
#include "class/hid/hid_device.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"

#define TUSB_DESC_TOTAL_LEN      (TUD_CONFIG_DESC_LEN + CFG_TUD_HID * TUD_HID_DESC_LEN)

static const char *TAG = "hid_keyboard";

typedef struct {
    uint8_t keycode;
    bool shift;
} hid_key_t;

// Define ascii_to_hid array
static hid_key_t ascii_to_hid[128];


uint8_t const desc_hid_report1[] =
{
  TUD_HID_REPORT_DESC_KEYBOARD()
};

uint8_t const desc_hid_report2[] =
{
  TUD_HID_REPORT_DESC_MOUSE()
};



/**
 * @brief String descriptor
 */
const char *hid_string_descriptor[5] = {
    // array of pointer to string descriptors
    (char[]){0x09, 0x04},  // 0: is supported language is English (0x0409)
    "TinyUSB",             // 1: Manufacturer
    "TinyUSB Device",      // 2: Product
    "123456",              // 3: Serials, should use chip ID
    "Example HID interface",  // 4: HID
};

static const uint8_t hid_configuration_descriptor[] = {
    // Configuration number, interface count, string index, total length, attribute, power in mA
    TUD_CONFIG_DESCRIPTOR(1, 2, 0, TUSB_DESC_TOTAL_LEN, TUSB_DESC_CONFIG_ATT_REMOTE_WAKEUP, 500),

    // Interface number, string index, boot protocol, report descriptor len, EP In address, size & polling interval
    TUD_HID_DESCRIPTOR(0, 4, true, sizeof(desc_hid_report1), 0x81, 16, 1),
    TUD_HID_DESCRIPTOR(1, 4, true, sizeof(desc_hid_report2), 0x82, 16, 1),
};

// Initialize the mapping
static void init_ascii_to_hid(void) {
    memset(ascii_to_hid, 0, sizeof(ascii_to_hid));

    // Lowercase letters
    ascii_to_hid['a'] = (hid_key_t){HID_KEY_A, false};
    ascii_to_hid['b'] = (hid_key_t){HID_KEY_B, false};
    ascii_to_hid['c'] = (hid_key_t){HID_KEY_C, false};
    ascii_to_hid['d'] = (hid_key_t){HID_KEY_D, false};
    ascii_to_hid['e'] = (hid_key_t){HID_KEY_E, false};
    ascii_to_hid['f'] = (hid_key_t){HID_KEY_F, false};
    ascii_to_hid['g'] = (hid_key_t){HID_KEY_G, false};
    ascii_to_hid['h'] = (hid_key_t){HID_KEY_H, false};
    ascii_to_hid['i'] = (hid_key_t){HID_KEY_I, false};
    ascii_to_hid['j'] = (hid_key_t){HID_KEY_J, false};
    ascii_to_hid['k'] = (hid_key_t){HID_KEY_K, false};
    ascii_to_hid['l'] = (hid_key_t){HID_KEY_L, false};
    ascii_to_hid['m'] = (hid_key_t){HID_KEY_M, false};
    ascii_to_hid['n'] = (hid_key_t){HID_KEY_N, false};
    ascii_to_hid['o'] = (hid_key_t){HID_KEY_O, false};
    ascii_to_hid['p'] = (hid_key_t){HID_KEY_P, false};
    ascii_to_hid['q'] = (hid_key_t){HID_KEY_Q, false};
    ascii_to_hid['r'] = (hid_key_t){HID_KEY_R, false};
    ascii_to_hid['s'] = (hid_key_t){HID_KEY_S, false};
    ascii_to_hid['t'] = (hid_key_t){HID_KEY_T, false};
    ascii_to_hid['u'] = (hid_key_t){HID_KEY_U, false};
    ascii_to_hid['v'] = (hid_key_t){HID_KEY_V, false};
    ascii_to_hid['w'] = (hid_key_t){HID_KEY_W, false};
    ascii_to_hid['x'] = (hid_key_t){HID_KEY_X, false};
    ascii_to_hid['y'] = (hid_key_t){HID_KEY_Y, false};
    ascii_to_hid['z'] = (hid_key_t){HID_KEY_Z, false};

    // Uppercase letters (Shift)
    for (char c = 'A'; c <= 'Z'; c++) {
        ascii_to_hid[(int)c] = (hid_key_t){ascii_to_hid[(int)(c + 32)].keycode, true};
    }

    // Digits
    ascii_to_hid['0'] = (hid_key_t){HID_KEY_0, false};
    ascii_to_hid['1'] = (hid_key_t){HID_KEY_1, false};
    ascii_to_hid['2'] = (hid_key_t){HID_KEY_2, false};
    ascii_to_hid['3'] = (hid_key_t){HID_KEY_3, false};
    ascii_to_hid['4'] = (hid_key_t){HID_KEY_4, false};
    ascii_to_hid['5'] = (hid_key_t){HID_KEY_5, false};
    ascii_to_hid['6'] = (hid_key_t){HID_KEY_6, false};
    ascii_to_hid['7'] = (hid_key_t){HID_KEY_7, false};
    ascii_to_hid['8'] = (hid_key_t){HID_KEY_8, false};
    ascii_to_hid['9'] = (hid_key_t){HID_KEY_9, false};

    // Space and common punctuation
    ascii_to_hid[' ']  = (hid_key_t){HID_KEY_SPACE, false};
    ascii_to_hid['.']  = (hid_key_t){HID_KEY_PERIOD, false};
    ascii_to_hid[',']  = (hid_key_t){HID_KEY_COMMA, false};
    ascii_to_hid['\n'] = (hid_key_t){HID_KEY_ENTER, false};

    // Shifted symbols
    ascii_to_hid['!'] = (hid_key_t){HID_KEY_1, true};
    ascii_to_hid['@'] = (hid_key_t){HID_KEY_2, true};
    ascii_to_hid['#'] = (hid_key_t){HID_KEY_3, true};
    ascii_to_hid['$'] = (hid_key_t){HID_KEY_4, true};
    ascii_to_hid['%'] = (hid_key_t){HID_KEY_5, true};
    ascii_to_hid['^'] = (hid_key_t){HID_KEY_6, true};
    ascii_to_hid['&'] = (hid_key_t){HID_KEY_7, true};
    ascii_to_hid['*'] = (hid_key_t){HID_KEY_8, true};
    ascii_to_hid['('] = (hid_key_t){HID_KEY_9, true};
    ascii_to_hid[')'] = (hid_key_t){HID_KEY_0, true};
}

void tud_hid_send_string(const char *str)
{
    while (*str) {
        char c = *str++;
        if ((uint8_t)c >= 128) continue;

        hid_key_t hk = ascii_to_hid[(uint8_t)c];

        uint8_t modifier = hk.shift ? KEYBOARD_MODIFIER_LEFTSHIFT : 0;
        uint8_t keycode[6] = {hk.keycode};
        
        // Send key press
        tud_hid_keyboard_report(HID_ITF_PROTOCOL_KEYBOARD, modifier, keycode);
        vTaskDelay(pdMS_TO_TICKS(50));

        // Send key release
        tud_hid_keyboard_report(HID_ITF_PROTOCOL_KEYBOARD, 0, NULL);
        vTaskDelay(pdMS_TO_TICKS(20));
    }
}

void tudsetup()
{ 
  init_ascii_to_hid();
  const tinyusb_config_t tusb_cfg = {
        .device_descriptor = NULL,
        .string_descriptor = hid_string_descriptor,
        .string_descriptor_count = sizeof(hid_string_descriptor) / sizeof(hid_string_descriptor[0]),
        .external_phy = false,
#if (TUD_OPT_HIGH_SPEED)
        .fs_configuration_descriptor = hid_configuration_descriptor, // HID configuration descriptor for full-speed and high-speed are the same
        .hs_configuration_descriptor = hid_configuration_descriptor,
        .qualifier_descriptor = NULL,
#else
        .configuration_descriptor = hid_configuration_descriptor,
#endif // TUD_OPT_HIGH_SPEED
    };

    ESP_ERROR_CHECK(tinyusb_driver_install(&tusb_cfg));
    ESP_LOGI(TAG, "USB initialization DONE");
}


/********* TinyUSB HID callbacks ***************/

// Invoked when received GET HID REPORT DESCRIPTOR request
// Application return pointer to descriptor, whose contents must exist long enough for transfer to complete
// uint8_t const * tud_descriptor_configuration_cb(uint8_t instance)
// {
//   (void) instance; // for multiple configurations
//   return hid_configuration_descriptor;
// }

// Invoked when received GET_REPORT control request
// Application must fill buffer report's content and return its length.
// Return zero will cause the stack to STALL request
uint16_t tud_hid_get_report_cb(uint8_t instance, uint8_t report_id, hid_report_type_t report_type, uint8_t *buffer, uint16_t reqlen)
{
    (void) instance;
    (void) report_id;
    (void) report_type;
    (void) buffer;
    (void) reqlen;

    return 0;
}

uint8_t const * tud_hid_descriptor_report_cb(uint8_t itf)
{
  if (itf == 0)
  {
    return desc_hid_report1;
  }
  else if (itf == 1)
  {
    return desc_hid_report2;
  }

  return NULL;
}

// Invoked when received SET_REPORT control request or
// received data on OUT endpoint ( Report ID = 0, Type = 0 )
void tud_hid_set_report_cb(uint8_t instance, uint8_t report_id, hid_report_type_t report_type, uint8_t const *buffer, uint16_t bufsize)
{
}