#ifndef NEOPIXELRMT_H
#define NEOPIXELRMT_H

#include "esp32-hal.h"

class NeoPixelRMT {
public:
    NeoPixelRMT(gpio_num_t pin);
    void begin();
    void setColor(uint8_t r, uint8_t g, uint8_t b);
    void show();

private:
    rmt_obj_t* rmt = nullptr;
    rmt_data_t led_data[24];
    gpio_num_t dataPin;

    void encodeBit(bool bitVal, rmt_data_t& item);
};

#endif
