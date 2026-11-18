/**
 * I2C 地址换算器的静态选项与说明文案
 */

/** 输入模式选项 */
export const MODE_OPTIONS: ReadonlyArray<{ label: string; value: '7to8' | '8to7' }> = [
  { label: '7-bit → 8-bit（已知从机地址求读写地址）', value: '7to8' },
  { label: '8-bit → 7-bit（由抓包读写地址反推从机地址）', value: '8to7' },
];

/** 常见 I2C 器件预设，便于一键填充 */
export const DEVICE_PRESETS: ReadonlyArray<{ name: string; address7: string }> = [
  { name: '24Cxx EEPROM', address7: '0x50' },
  { name: 'DS3231 RTC', address7: '0x68' },
  { name: 'SSD1306 OLED', address7: '0x3C' },
  { name: 'BMP280 温压传感器', address7: '0x76' },
  { name: 'PCF8574 IO 扩展', address7: '0x27' },
];
