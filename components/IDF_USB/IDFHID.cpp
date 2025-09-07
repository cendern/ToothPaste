// Copyright 2015-2020 Espressif Systems (Shanghai) PTE LTD
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.



#include "IDFHID.h"
#define USB_HID_DEVICES_MAX 10

namespace idfusb { 
typedef struct {
  IDFHIDDevice *device;
  uint8_t reports_num;
  uint8_t *report_ids;
} tinyusb_hid_device_t;

static tinyusb_hid_device_t tinyusb_hid_devices[USB_HID_DEVICES_MAX];

static SemaphoreHandle_t tinyusb_hid_device_input_sem = NULL;
static SemaphoreHandle_t tinyusb_hid_device_input_mutex = NULL;

static bool tinyusb_hid_is_initialized = false;
static hid_interface_protocol_enum_t tinyusb_interface_protocol = HID_ITF_PROTOCOL_NONE;
#if ARDUHAL_LOG_LEVEL >= ARDUHAL_LOG_LEVEL_DEBUG
static const char *tinyusb_hid_device_report_types[4] = {"INVALID", "INPUT", "OUTPUT", "FEATURE"};
#endif


// IDFHID::IDFHID(hid_interface_protocol_enum_t itf_protocol) {
//   if (!tinyusb_hid_devices_is_initialized) {
//     tinyusb_hid_devices_is_initialized = true;
//     for (uint8_t i = 0; i < USB_HID_DEVICES_MAX; i++) {
//       memset(&tinyusb_hid_devices[i], 0, sizeof(tinyusb_hid_device_t));
//     }
//     tinyusb_hid_devices_num = 0;
//     tinyusb_interface_protocol = itf_protocol;
//     tinyusb_enable_interface2(USB_INTERFACE_HID, TUD_HID_INOUT_DESC_LEN, tusb_hid_load_descriptor, itf_protocol == HID_ITF_PROTOCOL_KEYBOARD);
//   }
// }

IDFHID::IDFHID(uint8_t itf) {
  this->itf = itf;

  //Temp setting for BOOT keyboard
  if(itf == 0){
    tinyusb_interface_protocol = HID_ITF_PROTOCOL_KEYBOARD;
  }
}


void IDFHID::begin() {
  if (tinyusb_hid_device_input_sem == NULL) {
    tinyusb_hid_device_input_sem = xSemaphoreCreateBinary();
  }
  if (tinyusb_hid_device_input_mutex == NULL) {
    tinyusb_hid_device_input_mutex = xSemaphoreCreateMutex();
  }
}

void IDFHID::end() {
  if (tinyusb_hid_device_input_sem != NULL) {
    vSemaphoreDelete(tinyusb_hid_device_input_sem);
    tinyusb_hid_device_input_sem = NULL;
  }
  if (tinyusb_hid_device_input_mutex != NULL) {
    vSemaphoreDelete(tinyusb_hid_device_input_mutex);
    tinyusb_hid_device_input_mutex = NULL;
  }
}

bool IDFHID::ready(void) {
  return tud_hid_n_ready(itf);
}

void tud_hid_report_complete_cb(uint8_t instance, uint8_t const *report, size_t len) {
  if (tinyusb_hid_device_input_sem) {
    xSemaphoreGive(tinyusb_hid_device_input_sem);
  }
}

bool IDFHID::SendReport(uint8_t id, const void *data, size_t len, uint32_t timeout_ms) {
  if (!tinyusb_hid_device_input_sem || !tinyusb_hid_device_input_mutex) {
    printf("TX Semaphore is NULL. You must call IDFHID::begin() before you can send reports");
    return false;
  }

  if (xSemaphoreTake(tinyusb_hid_device_input_mutex, timeout_ms / portTICK_PERIOD_MS) != pdTRUE) {
    printf("report %u mutex failed", id);
    return false;
  }

  // If we're configured to support boot protocol, and the host has requested boot protocol, prevent
  // sending of report ID, by passing report ID of 0 to tud_hid_n_report().
  uint8_t effective_id = ((tinyusb_interface_protocol != HID_ITF_PROTOCOL_NONE) && (tud_hid_n_get_protocol(0) == HID_PROTOCOL_BOOT)) ? 0 : id;

  bool res = ready();
  if (!res) {
    printf("not ready");
  } else {
    // The semaphore may be given if the last SendReport() timed out waiting for the report to
    // be sent. Or, tud_hid_report_complete_cb() may be called an extra time, causing the
    // semaphore to be given. In these cases, take the semaphore to clear its state so that
    // we can wait for it to be given after calling tud_hid_n_report().
    xSemaphoreTake(tinyusb_hid_device_input_sem, 0);

    res = tud_hid_n_report(itf, effective_id, data, len);
    if (!res) {
      printf("report %u failed", id);
    } else {
      if (xSemaphoreTake(tinyusb_hid_device_input_sem, timeout_ms / portTICK_PERIOD_MS) != pdTRUE) {
        printf("report %u wait failed", id);
        res = false;
      }
    }
  }

  xSemaphoreGive(tinyusb_hid_device_input_mutex);
  return res;
}
};