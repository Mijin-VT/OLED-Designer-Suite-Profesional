-- ============================================================
-- OLED Designer — Datos Iniciales
-- base_de_datos_pg.sql
-- Ejecutar DESPUÉS de Base De Datos.sql
-- ============================================================

-- ============================================================
-- DRIVERS (Controladores de pantalla)
-- ============================================================
INSERT INTO drivers (name, description, manufacturer, max_width, max_height, color_support, interfaces, i2c_addresses, voltage, notes) VALUES

-- SSD1306 — El más popular
('SSD1306',
 'Controlador OLED monocromo más popular. Compatible con pantallas 128x64 y 128x32.',
 'Solomon Systech',
 128, 64, 'monochrome',
 ARRAY['I2C', 'SPI'],
 ARRAY['0x3C', '0x3D'],
 '3.3V / 5V',
 'Pull-up resistors necesarios para I2C. Muy bien soportado por Adafruit GFX y U8g2.'),

-- SH1106 — Alternativa al SSD1306
('SH1106',
 'Controlador OLED similar al SSD1306, con buffer de 132x64 (pantalla 128x64).',
 'Sino Wealth',
 128, 64, 'monochrome',
 ARRAY['I2C', 'SPI'],
 ARRAY['0x3C', '0x3D'],
 '3.3V / 5V',
 'Requiere offset de columna de 2 píxeles. Diferente método de actualización de pantalla.'),

-- SSD1309 — Versión mejorada del SSD1306
('SSD1309',
 'Versión mejorada del SSD1306, compatible con voltaje más alto.',
 'Solomon Systech',
 128, 64, 'monochrome',
 ARRAY['I2C', 'SPI'],
 ARRAY['0x3C', '0x3D'],
 '3.3V / 5V',
 'Compatible con código para SSD1306. Soporta voltaje 5V directamente.'),

-- SSD1331 — Color OLED
('SSD1331',
 'Controlador OLED a color (96x64, 65K colores RGB565).',
 'Solomon Systech',
 96, 64, 'rgb',
 ARRAY['SPI'],
 ARRAY[]::TEXT[],
 '3.3V',
 'Solo SPI. Pantalla a color 16-bit RGB565. Consume más energía que monocromo.'),

-- SSD1351 — Color OLED grande
('SSD1351',
 'Controlador OLED a color 128x128, resolución alta, 65K colores.',
 'Solomon Systech',
 128, 128, 'rgb',
 ARRAY['SPI'],
 ARRAY[]::TEXT[],
 '3.3V',
 'Solo SPI. Para pantallas cuadradas 128x128. Alta calidad de imagen.'),

-- SH1107 — Cuadrado monocromo
('SH1107',
 'Controlador OLED monocromo para pantallas cuadradas 64x128 o 128x128.',
 'Sino Wealth',
 128, 128, 'monochrome',
 ARRAY['I2C', 'SPI'],
 ARRAY['0x3C', '0x3D'],
 '3.3V / 5V',
 'Orientación de pantalla configurable. Usado en Adafruit 1.12" OLED.'),

-- SSD1607 — E-Paper compatible
('SSD1607',
 'Controlador para e-paper/e-ink (no OLED), monocromo 200x200.',
 'Solomon Systech',
 200, 200, 'monochrome',
 ARRAY['SPI'],
 ARRAY[]::TEXT[],
 '3.3V',
 'E-Paper, no OLED. Actualización lenta. Sin backlight.'),

-- IL9341 — TFT Color
('ILI9341',
 'Controlador TFT color popular, 240x320, 16-bit RGB. No es OLED.',
 'ILITEK',
 240, 320, 'rgb',
 ARRAY['SPI', 'Parallel'],
 ARRAY[]::TEXT[],
 '3.3V / 5V',
 'TFT LCD, no OLED. Muy popular en proyectos Arduino con pantalla a color.'),

-- SSD1322 — Alta resolución
('SSD1322',
 'Controlador OLED de alta resolución 256x64, escala de grises 4-bit.',
 'Solomon Systech',
 256, 64, 'grayscale',
 ARRAY['SPI'],
 ARRAY[]::TEXT[],
 '3.3V',
 'Soporte de escala de grises 4-bit. Resolución panorámica 256x64.'),

-- SSD1327 — Escala de grises cuadrado
('SSD1327',
 'Controlador OLED 128x128 con escala de grises 4-bit (16 niveles).',
 'Solomon Systech',
 128, 128, 'grayscale',
 ARRAY['I2C', 'SPI'],
 ARRAY['0x3C', '0x3D'],
 '3.3V',
 'Pantalla cuadrada con soporte de grises. Usado en Adafruit 1.5" OLED.')

ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- RESOLUCIONES ESTÁNDAR
-- ============================================================
INSERT INTO resolutions (width, height, label, is_custom, description, common_drivers) VALUES

(128, 64,  '128×64 (Estándar)',       FALSE, 'Resolución más común. Módulos de 0.96" a 1.3".',         ARRAY['SSD1306', 'SH1106', 'SSD1309', 'SH1107']),
(128, 32,  '128×32 (Mini)',           FALSE, 'Módulos pequeños de 0.91". Mitad de altura.',             ARRAY['SSD1306', 'SH1106']),
(96,  16,  '96×16 (Ultra-mini)',      FALSE, 'Pantallas muy pequeñas, generalmente de texto.',           ARRAY['SSD1306']),
(128, 128, '128×128 (Cuadrado)',      FALSE, 'Pantallas cuadradas 1.12" a 1.5".',                        ARRAY['SSD1351', 'SH1107', 'SSD1327']),
(96,  64,  '96×64 (Color mini)',      FALSE, 'Pantallas OLED color pequeñas.',                          ARRAY['SSD1331']),
(64,  48,  '64×48 (Mini color)',      FALSE, 'Pantallas muy pequeñas, tipo Wemos OLED shield.',          ARRAY['SSD1306']),
(256, 64,  '256×64 (Panorámico)',     FALSE, 'Pantallas anchas de resolución alta.',                    ARRAY['SSD1322']),
(240, 320, '240×320 (TFT)',           FALSE, 'Pantallas TFT color estándar.',                            ARRAY['ILI9341']),
(64,  128, '64×128 (Vertical)',       FALSE, 'Pantallas verticales. Rotar 90° del SH1107.',              ARRAY['SH1107']),
(200, 200, '200×200 (E-Paper)',       FALSE, 'Pantallas e-ink / e-paper.',                               ARRAY['SSD1607']),
(0,   0,   'Personalizado',           TRUE,  'Ingresar dimensiones manualmente (máx. 256×256).',        ARRAY[]::TEXT[])

ON CONFLICT (width, height, label) DO NOTHING;

-- ============================================================
-- PINOUTS — I2C (común para todos los drivers monocromo)
-- ============================================================

-- SSD1306 — I2C
INSERT INTO pinouts (driver_id, interface, pin_name, pin_number, description, arduino_pin, color, sort_order)
SELECT d.id, 'I2C', p.pin_name, p.pin_number, p.description, p.arduino_pin, p.color, p.sort_order
FROM drivers d
CROSS JOIN (VALUES
    ('VCC',  1, 'Alimentación 3.3V o 5V',                  '3.3V o 5V',         '#FF4444', 1),
    ('GND',  2, 'Tierra / Ground',                          'GND',               '#444444', 2),
    ('SCL',  3, 'Serial Clock (reloj I2C)',                  'A5 (Uno) / 21 (Mega) / SCL', '#4488FF', 3),
    ('SDA',  4, 'Serial Data (datos I2C)',                   'A4 (Uno) / 20 (Mega) / SDA', '#44FF88', 4),
    ('RST',  5, 'Reset (opcional, puede omitirse)',          'Pin digital (ej. D4)', '#FFAA44', 5)
) AS p(pin_name, pin_number, description, arduino_pin, color, sort_order)
WHERE d.name = 'SSD1306';

-- SSD1306 — SPI
INSERT INTO pinouts (driver_id, interface, pin_name, pin_number, description, arduino_pin, color, sort_order)
SELECT d.id, 'SPI', p.pin_name, p.pin_number, p.description, p.arduino_pin, p.color, p.sort_order
FROM drivers d
CROSS JOIN (VALUES
    ('VCC',  1, 'Alimentación 3.3V o 5V',     '3.3V o 5V',         '#FF4444', 1),
    ('GND',  2, 'Tierra / Ground',             'GND',               '#444444', 2),
    ('D0',   3, 'Serial Clock (SCLK)',          'D13 (SCK)',         '#4488FF', 3),
    ('D1',   4, 'Serial Data (MOSI)',           'D11 (MOSI)',        '#44FF88', 4),
    ('RST',  5, 'Reset',                       'D9',                '#FFAA44', 5),
    ('DC',   6, 'Data/Command select',          'D8',                '#AA44FF', 6),
    ('CS',   7, 'Chip Select',                 'D10 (SS)',          '#FF44AA', 7)
) AS p(pin_name, pin_number, description, arduino_pin, color, sort_order)
WHERE d.name = 'SSD1306';

-- SH1106 — I2C (igual que SSD1306)
INSERT INTO pinouts (driver_id, interface, pin_name, pin_number, description, arduino_pin, color, sort_order)
SELECT d.id, 'I2C', p.pin_name, p.pin_number, p.description, p.arduino_pin, p.color, p.sort_order
FROM drivers d
CROSS JOIN (VALUES
    ('VCC',  1, 'Alimentación 3.3V o 5V',                  '3.3V o 5V',                    '#FF4444', 1),
    ('GND',  2, 'Tierra / Ground',                          'GND',                          '#444444', 2),
    ('SCL',  3, 'Serial Clock (reloj I2C)',                  'A5 (Uno) / SCL',               '#4488FF', 3),
    ('SDA',  4, 'Serial Data (datos I2C)',                   'A4 (Uno) / SDA',               '#44FF88', 4),
    ('RST',  5, 'Reset (opcional)',                          'Pin digital (ej. D4)',          '#FFAA44', 5)
) AS p(pin_name, pin_number, description, arduino_pin, color, sort_order)
WHERE d.name = 'SH1106';

-- SSD1331 — SPI (solo SPI, color)
INSERT INTO pinouts (driver_id, interface, pin_name, pin_number, description, arduino_pin, color, sort_order)
SELECT d.id, 'SPI', p.pin_name, p.pin_number, p.description, p.arduino_pin, p.color, p.sort_order
FROM drivers d
CROSS JOIN (VALUES
    ('VCC',  1, 'Alimentación 3.3V',           '3.3V',              '#FF4444', 1),
    ('GND',  2, 'Tierra / Ground',             'GND',               '#444444', 2),
    ('SCLK', 3, 'Serial Clock',                'D13 (SCK)',         '#4488FF', 3),
    ('MOSI', 4, 'Serial Data In (MOSI)',        'D11 (MOSI)',        '#44FF88', 4),
    ('CS',   5, 'Chip Select',                 'D10 (SS)',          '#FF44AA', 5),
    ('RST',  6, 'Reset',                       'D9',                '#FFAA44', 6),
    ('DC',   7, 'Data/Command',                'D8',                '#AA44FF', 7)
) AS p(pin_name, pin_number, description, arduino_pin, color, sort_order)
WHERE d.name = 'SSD1331';

-- SSD1351 — SPI (color 128x128)
INSERT INTO pinouts (driver_id, interface, pin_name, pin_number, description, arduino_pin, color, sort_order)
SELECT d.id, 'SPI', p.pin_name, p.pin_number, p.description, p.arduino_pin, p.color, p.sort_order
FROM drivers d
CROSS JOIN (VALUES
    ('VIN',  1, 'Alimentación 3.3V a 5V',      '3.3V o 5V',         '#FF4444', 1),
    ('3V3',  2, 'Salida regulada 3.3V',         '—',                 '#FF8888', 2),
    ('GND',  3, 'Tierra / Ground',              'GND',               '#444444', 3),
    ('SCK',  4, 'Serial Clock',                 'D13 (SCK)',         '#4488FF', 4),
    ('SI',   5, 'Serial Data In (MOSI)',         'D11 (MOSI)',        '#44FF88', 5),
    ('CS',   6, 'Chip Select',                  'D10 (SS)',          '#FF44AA', 6),
    ('RST',  7, 'Reset',                        'D9',                '#FFAA44', 7),
    ('DC',   8, 'Data/Command',                 'D8',                '#AA44FF', 8)
) AS p(pin_name, pin_number, description, arduino_pin, color, sort_order)
WHERE d.name = 'SSD1351';

-- ============================================================
-- PLANTILLAS DE CÓDIGO
-- ============================================================

-- Arduino + Adafruit GFX — SSD1306
INSERT INTO code_templates (platform, driver_id, template_name, header_code, init_code, draw_pixel, draw_text, draw_line, draw_rect, draw_circle, draw_bitmap, display_update, clear_display) VALUES (
'arduino_adafruit',
(SELECT id FROM drivers WHERE name = 'SSD1306'),
'Arduino Adafruit GFX (SSD1306 I2C)',
'#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH {WIDTH}
#define SCREEN_HEIGHT {HEIGHT}
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);',

'void setup() {
  Serial.begin(115200);
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for (;;);
  }
  display.clearDisplay();
  display.display();
}',

'display.drawPixel({X}, {Y}, SSD1306_WHITE);',
'display.setTextSize({SIZE});
display.setTextColor(SSD1306_WHITE);
display.setCursor({X}, {Y});
display.println(F("{TEXT}"));',
'display.drawLine({X0}, {Y0}, {X1}, {Y1}, SSD1306_WHITE);',
'display.drawRect({X}, {Y}, {W}, {H}, SSD1306_WHITE);',
'display.drawCircle({X}, {Y}, {R}, SSD1306_WHITE);',
'static const uint8_t PROGMEM bitmap[] = {
  {BITMAP_DATA}
};
display.drawBitmap({X}, {Y}, bitmap, {W}, {H}, SSD1306_WHITE);',
'display.display();',
'display.clearDisplay();'
);

-- U8g2 — SSD1306 I2C
INSERT INTO code_templates (platform, driver_id, template_name, header_code, init_code, draw_pixel, draw_text, draw_line, draw_rect, draw_circle, draw_bitmap, display_update, clear_display) VALUES (
'u8g2',
(SELECT id FROM drivers WHERE name = 'SSD1306'),
'U8g2 (SSD1306 I2C)',
'#include <U8g2lib.h>
#include <Wire.h>

U8G2_SSD1306_{WIDTH}X{HEIGHT}_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE);',

'void setup() {
  u8g2.begin();
  u8g2.setFont(u8g2_font_ncenB08_tr);
}',

'u8g2.drawPixel({X}, {Y});',
'u8g2.setFont(u8g2_font_ncenB{SIZE}_tr);
u8g2.drawStr({X}, {Y}, "{TEXT}");',
'u8g2.drawLine({X0}, {Y0}, {X1}, {Y1});',
'u8g2.drawFrame({X}, {Y}, {W}, {H});',
'u8g2.drawCircle({X}, {Y}, {R});',
'static const uint8_t bitmap[] PROGMEM = {
  {BITMAP_DATA}
};
u8g2.drawXBMP({X}, {Y}, {W}, {H}, bitmap);',
'u8g2.sendBuffer();',
'u8g2.clearBuffer();'
);

-- MicroPython — SSD1306 I2C
INSERT INTO code_templates (platform, driver_id, template_name, header_code, init_code, draw_pixel, draw_text, draw_line, draw_rect, draw_circle, draw_bitmap, display_update, clear_display) VALUES (
'micropython',
(SELECT id FROM drivers WHERE name = 'SSD1306'),
'MicroPython (SSD1306 I2C)',
'from machine import Pin, I2C
import ssd1306
import framebuf

i2c = I2C(0, scl=Pin(22), sda=Pin(21), freq=400000)
oled = ssd1306.SSD1306_I2C({WIDTH}, {HEIGHT}, i2c)',

'# No hay setup() en MicroPython, el código corre directamente
oled.fill(0)
oled.show()',

'oled.pixel({X}, {Y}, 1)',
'oled.text("{TEXT}", {X}, {Y})',
'oled.line({X0}, {Y0}, {X1}, {Y1}, 1)',
'oled.rect({X}, {Y}, {W}, {H}, 1)',
'# MicroPython no tiene drawCircle nativo, usar framebuf
# oled.ellipse({X}, {Y}, {R}, {R}, 1)  # MicroPython 1.20+',
'# Convertir bitmap a framebuf
bitmap_data = bytearray({BITMAP_BYTES})
fb = framebuf.FrameBuffer(bitmap_data, {W}, {H}, framebuf.MONO_HLSB)
oled.blit(fb, {X}, {Y})',
'oled.show()',
'oled.fill(0)'
);

-- C Array (bitmap)
INSERT INTO code_templates (platform, driver_id, template_name, header_code, init_code, draw_pixel, draw_text, draw_bitmap, display_update, clear_display) VALUES (
'c_array',
NULL,
'C Array / Bitmap',
'#include <stdint.h>

// OLED Bitmap — {WIDTH}x{HEIGHT}
// Generated by OLED Designer
// Total bytes: {TOTAL_BYTES}

const uint8_t oled_bitmap_{WIDTH}x{HEIGHT}[] PROGMEM = {',

'// Paste this array in your project
// Usage with Adafruit GFX:
// display.drawBitmap(0, 0, oled_bitmap_{WIDTH}x{HEIGHT}, {WIDTH}, {HEIGHT}, SSD1306_WHITE);',

'// Pixel at ({X}, {Y}) → byte index: {BYTE_IDX}, bit: {BIT_IDX}',
'// Text is rasterized into the bitmap',
'// Bitmap data (row-major, MSB first):
  {BITMAP_DATA}
};',
'display.display(); // or: u8g2.sendBuffer();',
'display.clearDisplay(); // or: u8g2.clearBuffer();'
);

-- CircuitPython
INSERT INTO code_templates (platform, driver_id, template_name, header_code, init_code, draw_pixel, draw_text, draw_bitmap, display_update, clear_display) VALUES (
'circuitpython',
(SELECT id FROM drivers WHERE name = 'SSD1306'),
'CircuitPython (SSD1306 I2C)',
'import board
import busio
import adafruit_ssd1306
import displayio
from adafruit_display_text import label
import terminalio

i2c = busio.I2C(board.SCL, board.SDA)
display = adafruit_ssd1306.SSD1306_I2C({WIDTH}, {HEIGHT}, i2c)',

'display.fill(0)
display.show()',

'display.pixel({X}, {Y}, 1)',
'# CircuitPython usa displayio para texto avanzado
text_area = label.Label(terminalio.FONT, text="{TEXT}", color=0xFFFFFF)
text_area.x = {X}
text_area.y = {Y}',
'# Bitmap como bytearray
bitmap_bytes = bytes({BITMAP_BYTES})
fb = framebuf.FrameBuffer(bytearray(bitmap_bytes), {W}, {H}, framebuf.MONO_HLSB)
display.blit(fb, {X}, {Y})',
'display.show()',
'display.fill(0)'
);

-- Rust (embedded-graphics)
INSERT INTO code_templates (platform, driver_id, template_name, header_code, init_code, draw_pixel, draw_text, draw_line, draw_rect, draw_circle, draw_bitmap, display_update, clear_display) VALUES (
'rust',
NULL,
'Rust (embedded-graphics)',
'use embedded_graphics::{
    mono_font::{ascii::FONT_6X10, MonoTextStyle},
    pixelcolor::BinaryColor,
    prelude::*,
    primitives::{Circle, Line, PrimitiveStyleBuilder, Rectangle},
    text::Text,
    image::{Image, ImageRaw},
};
// Add to Cargo.toml:
// embedded-graphics = "0.8"
// ssd1306 = "0.8" (or your display driver crate)',

'let display_interface = /* your interface setup */;
let mut display = Ssd1306::new(display_interface, DisplaySize128x64, DisplayRotation::Rotate0)
    .into_buffered_graphics_mode();
display.init().unwrap();',

'Pixel(Point::new({X}, {Y}), BinaryColor::On)
    .draw(&mut display).unwrap();',
'let style = MonoTextStyle::new(&FONT_6X10, BinaryColor::On);
Text::new("{TEXT}", Point::new({X}, {Y}), style)
    .draw(&mut display).unwrap();',
'Line::new(Point::new({X0}, {Y0}), Point::new({X1}, {Y1}))
    .into_styled(PrimitiveStyleBuilder::new().stroke_color(BinaryColor::On).stroke_width(1).build())
    .draw(&mut display).unwrap();',
'Rectangle::new(Point::new({X}, {Y}), Size::new({W}, {H}))
    .into_styled(PrimitiveStyleBuilder::new().stroke_color(BinaryColor::On).stroke_width(1).build())
    .draw(&mut display).unwrap();',
'Circle::new(Point::new({X} - {R}, {Y} - {R}), ({R} * 2) as u32)
    .into_styled(PrimitiveStyleBuilder::new().stroke_color(BinaryColor::On).stroke_width(1).build())
    .draw(&mut display).unwrap();',
'let raw: ImageRaw<BinaryColor> = ImageRaw::new(&[{BITMAP_DATA}], {W});
let image = Image::new(&raw, Point::new({X}, {Y}));
image.draw(&mut display).unwrap();',
'display.flush().unwrap();',
'display.clear(BinaryColor::Off).unwrap();'
);

-- JavaScript / TypeScript
INSERT INTO code_templates (platform, driver_id, template_name, header_code, init_code, draw_pixel, draw_text, draw_line, draw_rect, draw_circle, draw_bitmap, display_update, clear_display) VALUES (
'javascript',
NULL,
'JavaScript / TypeScript (Canvas / Node)',
'// OLED Simulator — JavaScript
// Uses HTML5 Canvas to simulate OLED display

const canvas = document.getElementById("oled-preview");
const ctx = canvas.getContext("2d");
const DISPLAY_WIDTH = {WIDTH};
const DISPLAY_HEIGHT = {HEIGHT};
const PIXEL_SIZE = 4; // Scale factor for display

canvas.width = DISPLAY_WIDTH * PIXEL_SIZE;
canvas.height = DISPLAY_HEIGHT * PIXEL_SIZE;',

'function initDisplay() {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
initDisplay();',

'function drawPixel(x, y, on = true) {
  ctx.fillStyle = on ? "#FFFFFF" : "#000000";
  ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
}
drawPixel({X}, {Y});',
'function drawText(text, x, y, size = 1) {
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `${size * 8}px monospace`;
  ctx.fillText(text, x * PIXEL_SIZE, (y + size * 8) * PIXEL_SIZE);
}
drawText("{TEXT}", {X}, {Y}, {SIZE});',
'function drawLine(x0, y0, x1, y1) {
  // Bresenham line algorithm
  let dx = Math.abs(x1-x0), sx = x0<x1 ? 1 : -1;
  let dy = -Math.abs(y1-y0), sy = y0<y1 ? 1 : -1;
  let err = dx+dy;
  while(true) {
    drawPixel(x0, y0);
    if (x0===x1 && y0===y1) break;
    let e2 = 2*err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
drawLine({X0}, {Y0}, {X1}, {Y1});',
'function drawRect(x, y, w, h) {
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1;
  ctx.strokeRect(x * PIXEL_SIZE, y * PIXEL_SIZE, w * PIXEL_SIZE, h * PIXEL_SIZE);
}
drawRect({X}, {Y}, {W}, {H});',
'function drawCircle(cx, cy, r) {
  for(let a = 0; a < 360; a++) {
    let x = Math.round(cx + r * Math.cos(a * Math.PI/180));
    let y = Math.round(cy + r * Math.sin(a * Math.PI/180));
    drawPixel(x, y);
  }
}
drawCircle({X}, {Y}, {R});',
'const bitmapData = [{BITMAP_DATA}];
for(let y = 0; y < {H}; y++) {
  for(let x = 0; x < {W}; x++) {
    const byteIdx = Math.floor((y * {W} + x) / 8);
    const bitIdx = 7 - ((y * {W} + x) % 8);
    const on = (bitmapData[byteIdx] >> bitIdx) & 1;
    drawPixel({X} + x, {Y} + y, on);
  }
}',
'// Canvas updates automatically',
'ctx.fillStyle = "#000000";
ctx.fillRect(0, 0, canvas.width, canvas.height);'
);

-- ============================================================
-- USUARIO POR DEFECTO (local, sin autenticación)
-- ============================================================
INSERT INTO users (username, email, preferences) VALUES
('local_user', 'local@oleddesigner.app', '{"theme": "dark", "defaultDriver": "SSD1306", "defaultResolution": "128x64", "recentProjectsLimit": 10}'::JSONB)
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- FIN DE DATOS INICIALES
-- ============================================================
