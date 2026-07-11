#include QMK_KEYBOARD_H

const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
    /*
     * Base Layer (Layer 0)
     * All keys mapped to '0' for now.
     */
    [0] = LAYOUT(
        // LEFT HALF                                // RIGHT HALF
        KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0,
        KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0,
        KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0, KC_0,
        KC_0)};
