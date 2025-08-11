#include <NeoPixelRMT.h>

NeoPixelRMT led(RGB_LED_PIN); // Create a NeoPixelRMT instance with the default pin
NeoPixelRMT::NeoPixelRMT(gpio_num_t pin) : dataPin(pin) {}

// Initialize the RMT RGB led driver for the specified pin
void NeoPixelRMT::begin() {
    rmt_config_t config = {};
    config.rmt_mode = RMT_MODE_TX;
    config.channel = RMT_CHANNEL_0; // choose your channel
    config.gpio_num = dataPin;
    config.mem_block_num = 1; // equivalent to RMT_MEM_64 (64 is 1 block)
    config.clk_div = 8;  // For 100ns tick with 80 MHz APB clock: 80 MHz / 8 = 10 MHz => 1 tick = 100 ns
    config.tx_config.loop_en = false;
    config.tx_config.carrier_en = false;
    config.tx_config.idle_output_en = true;
    config.tx_config.idle_level = RMT_IDLE_LEVEL_LOW;

    rmt_config(&config);
    rmt_driver_install(config.channel, 0, 0);

    // Store the channel number if you want to use it later for writing items
    rmt_channel = config.channel;
}

// Set the color of the LED using r,g,b values without calling show()
void NeoPixelRMT::setColor(uint8_t r, uint8_t g, uint8_t b) {
    uint8_t color[3] = {g, r, b}; // GRB order
    int idx = 0;
    for (int col = 0; col < 3; col++) {
        for (int bit = 0; bit < 8; bit++) {
            bool bitVal = color[col] & (1 << (7 - bit));
            led_data[idx].level0 = 1;
            led_data[idx].duration0 = bitVal ? 8 : 4;
            led_data[idx].level1 = 0;
            led_data[idx].duration1 = bitVal ? 4 : 8;
            idx++;
        }
    }
}

// Set the color of the LED using struct without calling show()
void NeoPixelRMT::setColor(const RGB& color) {
    setColor(color.r, color.g, color.b);
}

// Write LED data to RMT
void NeoPixelRMT::show() {
    // rmt_channel is your stored channel number
    rmt_write_items(rmt_channel, led_data, 24, true);  // 'true' means block until done
}


// Set the color of the LED using r,g,b values and call show()
void NeoPixelRMT::set(uint8_t r, uint8_t g, uint8_t b){
    setColor(r, g, b);
    show();
}

// Set the color of the LED and call show() using RGB struct
void NeoPixelRMT::set(const RGB& color) {
    setColor(color.r, color.g, color.b);
    show();
}

// Start blinking with r,g,b values
void NeoPixelRMT::blinkStart(int intervalMs, uint8_t r, uint8_t g, uint8_t b) {
    blinkInterval = intervalMs;
    blinkR = r;
    blinkG = g;
    blinkB = b;
    lastToggle = millis();
    ledOn = false;
    blinking = true;
    set(0, 0, 0); // Start with LED off
}

// Start blinking with defined RGB color
void NeoPixelRMT::blinkStart(int intervalMs, const RGB& color) {
    blinkStart(intervalMs, color.r, color.g, color.b);
}

// Stop blinking
void NeoPixelRMT::blinkEnd() {
    blinking = false;
    //set(0, 0, 0); // Turn LED off when stopping blink
}

// Update the blink state using millis()
void NeoPixelRMT::blinkUpdate() {
    if (!blinking) return;

    unsigned long now = millis();
    if (now - lastToggle >= (unsigned long)blinkInterval) {
        lastToggle = now;
        ledOn = !ledOn;
        if (ledOn) {
            set(blinkR, blinkG, blinkB);
        } else {
            set(0, 0, 0);
        }
    }
}