#ifndef NEOPIXELRMT_H
#define NEOPIXELRMT_H

#include "esp32-hal.h"

class NeoPixelRMT {
public:
    explicit NeoPixelRMT(gpio_num_t pin);

    void show();
    void setColor(uint8_t r, uint8_t g, uint8_t b);
    void begin();
    void set(uint8_t r, uint8_t g, uint8_t b);
    void blinkStart(int intervalMs, uint8_t r, uint8_t g, uint8_t b);
    void blinkEnd();
    void blinkUpdate();    // Call this repeatedly in loop()
    bool isBlinking() { return blinking; }

private:
    rmt_obj_t* rmt;
    rmt_data_t led_data[24];
    gpio_num_t dataPin;

    // Color for blinking
    uint8_t blinkR, blinkG, blinkB;
    unsigned long blinkInterval;
    int blinkCount;           // how many ON+OFF cycles remain
    unsigned long lastToggle;
    bool ledOn;
    bool blinking;

    void encodeBit(bool bitVal, rmt_data_t& item);
};

#endif // NEOPIXELRMT_H
