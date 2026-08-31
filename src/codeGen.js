/**
 * OLED Designer — Módulo de Generación de Código
 * src/codeGen.js
 *
 * Genera código limpio y listo para usar para múltiples plataformas.
 * Analiza el bitmap y la configuración del proyecto para producir código optimizado.
 */

'use strict';

const db = require('./db');

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

async function generate(config) {
  const {
    platform, driver, width, height, interface: iface,
    i2cAddress, displayColor, bitmap, includeInit, includeComments
  } = config;

  // Procesar bitmap
  const bitmapBytes = bitmapToBytes(bitmap, width, height);
  const elements = detectElements(bitmap, width, height);

  // Obtener plantilla de DB si existe
  let template = null;
  try {
    const tplResult = await db.query(
      `SELECT ct.* FROM code_templates ct
       LEFT JOIN drivers d ON ct.driver_id = d.id
       WHERE ct.platform = $1 AND (d.name = $2 OR ct.driver_id IS NULL)
       LIMIT 1`,
      [platform, driver]
    );
    if (tplResult.rows.length) template = tplResult.rows[0];
  } catch {
    // Sin DB — usar generadores locales
  }

  // Modo Doble Pantalla OLED (Dual Screen)
  if (config.isDualScreen) {
    return generateDualOLEDArduino(config, includeComments);
  }

  // Generar código
  switch (platform) {
    case 'arduino_adafruit':
      return generateArduinoAdafruit(config, bitmapBytes, elements, template, includeInit, includeComments);
    case 'u8g2':
      return generateU8g2(config, bitmapBytes, elements, template, includeInit, includeComments);
    case 'c_array':
      return generateCArray(config, bitmapBytes, includeComments);
    case 'micropython':
      return generateMicroPython(config, bitmapBytes, includeComments);
    case 'circuitpython':
      return generateCircuitPython(config, bitmapBytes, includeComments);
    case 'javascript':
      return generateJavaScript(config, bitmap, includeComments);
    case 'rust':
      return generateRust(config, bitmapBytes, includeComments);
    default:
      return generateCArray(config, bitmapBytes, includeComments);
  }
}

// ============================================================
// UTILIDADES DE BITMAP
// ============================================================

function bitmapToBytes(bitmap, width, height) {
  const bytes = [];
  const totalBits = width * height;

  for (let i = 0; i < totalBits; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8 && (i + b) < totalBits; b++) {
      if (bitmap[i + b]) byte |= (1 << (7 - b));
    }
    bytes.push(byte);
  }
  return bytes;
}

function formatBytes(bytes, bytesPerRow = 16) {
  const rows = [];
  for (let i = 0; i < bytes.length; i += bytesPerRow) {
    const row = bytes.slice(i, i + bytesPerRow)
      .map(b => `0x${b.toString(16).padStart(2, '0')}`)
      .join(', ');
    rows.push(`  ${row}`);
  }
  return rows.join(',\n');
}

// ============================================================
// DETECCIÓN DE ELEMENTOS EN EL BITMAP
// ============================================================

function detectElements(bitmap, width, height) {
  const elements = [];
  const onPixelCount = bitmap.filter(v => v === 1).length;
  const density = onPixelCount / (width * height);

  // Detectar regiones densas (posibles bloques de texto o imágenes)
  const BLOCK = 8;
  for (let by = 0; by < Math.floor(height / BLOCK); by++) {
    for (let bx = 0; bx < Math.floor(width / BLOCK); bx++) {
      let blockPixels = 0;
      for (let dy = 0; dy < BLOCK; dy++) {
        for (let dx = 0; dx < BLOCK; dx++) {
          const px = bx * BLOCK + dx;
          const py = by * BLOCK + dy;
          if (bitmap[py * width + px]) blockPixels++;
        }
      }
      if (blockPixels > BLOCK * BLOCK * 0.15) { // 15% densidad mínima
        elements.push({
          type: blockPixels > BLOCK * BLOCK * 0.6 ? 'filled_region' : 'sparse_region',
          x: bx * BLOCK, y: by * BLOCK,
          w: BLOCK, h: BLOCK,
          density: blockPixels / (BLOCK * BLOCK)
        });
      }
    }
  }

  return { elements, density, onPixelCount };
}

// ============================================================
// GENERADORES POR PLATAFORMA
// ============================================================

// ---- Arduino + Adafruit GFX ----
function generateArduinoAdafruit(cfg, bytes, elemInfo, template, includeInit, includeComments) {
  const { driver, width, height, interface: iface, i2cAddress } = cfg;
  const addr = i2cAddress || '0x3C';
  const comment = includeComments;
  const byteCount = bytes.length;
  const bitmapHex = formatBytes(bytes);
  const date = new Date().toLocaleDateString('es');

  const lines = [];

  if (comment) {
    lines.push(`// ============================================================`);
    lines.push(`// OLED Designer — Código Generado Automáticamente`);
    lines.push(`// Driver:      ${driver}`);
    lines.push(`// Resolución:  ${width}x${height} píxeles`);
    lines.push(`// Interfaz:    ${iface}${iface === 'I2C' ? ` (${addr})` : ''}`);
    lines.push(`// Generado:    ${date}`);
    lines.push(`// Bitmap:      ${byteCount} bytes`);
    lines.push(`// Densidad:    ${Math.round(elemInfo.density * 100)}% píxeles activos`);
    lines.push(`// ============================================================`);
    lines.push(``);
  }

  // Includes
  lines.push(`#include <SPI.h>`);
  lines.push(`#include <Wire.h>`);
  lines.push(`#include <Adafruit_GFX.h>`);
  if (driver.startsWith('SSD1306') || driver === 'SH1106' || driver === 'SSD1309') {
    lines.push(`#include <Adafruit_SSD1306.h>`);
  } else if (driver === 'SSD1331') {
    lines.push(`#include <Adafruit_SSD1331.h>`);
  } else if (driver === 'SSD1351') {
    lines.push(`#include <Adafruit_SSD1351.h>`);
  } else {
    lines.push(`#include <Adafruit_SSD1306.h>`);
  }
  lines.push(``);

  // Defines
  // Defines y comentarios de Pinout completo
  if (iface === 'I2C') {
    lines.push(`// ============================================================`);
    lines.push(`// CONEXIÓN DE PINES I2C (${driver}):`);
    lines.push(`//   GND -> Tierra (GND)`);
    lines.push(`//   VCC -> Alimentación 3.3V o 5V (según módulo)`);
    lines.push(`//   SCL -> Pin 21 (Arduino Mega 2560) | A5 (Arduino Uno/Nano) | GPIO 22 (ESP32)`);
    lines.push(`//   SDA -> Pin 20 (Arduino Mega 2560) | A4 (Arduino Uno/Nano) | GPIO 21 (ESP32)`);
    lines.push(`//   ¡ATENCIÓN ARDUINO MEGA!: En el MEGA los pines son Pin 20 (SDA) y Pin 21 (SCL). ¡NO usar A4 y A5!`);
    lines.push(`// ============================================================`);
    lines.push(``);
    lines.push(`#define SCREEN_WIDTH   ${width}`);
    lines.push(`#define SCREEN_HEIGHT  ${height}`);
    lines.push(`#define OLED_RESET     -1      // Reset compartido con MCU (-1)`);
    lines.push(`#define SCREEN_ADDRESS ${addr} // Dirección I2C típica: 0x3C o 0x3D`);
    lines.push(``);
    lines.push(`// Instancia del display (Hardware I2C)`);
    lines.push(`Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);`);
  } else {
    lines.push(`// ============================================================`);
    lines.push(`// CONEXIÓN DE PINES SPI (${driver} - 7 pines):`);
    lines.push(`//   GND -> Tierra (GND)`);
    lines.push(`//   VCC -> Alimentación 3.3V / 5V`);
    lines.push(`//   D0 (SCLK/CLK) -> Pin 13 (Arduino Uno/Nano) | GPIO 18 (ESP32)`);
    lines.push(`//   D1 (MOSI/DIN) -> Pin 11 (Arduino Uno/Nano) | GPIO 23 (ESP32)`);
    lines.push(`//   RES (RESET)   -> Pin 9  (Arduino Uno/Nano) | GPIO 4  (ESP32)`);
    lines.push(`//   DC (DATA/CMD) -> Pin 8  (Arduino Uno/Nano) | GPIO 2  (ESP32)`);
    lines.push(`//   CS (CHIP SEL) -> Pin 10 (Arduino Uno/Nano) | GPIO 5  (ESP32)`);
    lines.push(`// ============================================================`);
    lines.push(``);
    lines.push(`#define SCREEN_WIDTH   ${width}`);
    lines.push(`#define SCREEN_HEIGHT  ${height}`);
    lines.push(``);
    lines.push(`// Pines de control SPI`);
    lines.push(`#define OLED_MOSI  11  // D1 / DIN`);
    lines.push(`#define OLED_CLK   13  // D0 / SCK`);
    lines.push(`#define OLED_DC     8  // Data / Command`);
    lines.push(`#define OLED_CS    10  // Chip Select`);
    lines.push(`#define OLED_RESET  9  // Reset hardware`);
    lines.push(``);
    lines.push(`// Opción A: Hardware SPI (Rendimiento óptimo)`);
    lines.push(`Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &SPI, OLED_DC, OLED_RESET, OLED_CS);`);
    lines.push(``);
    lines.push(`// Opción B: Software SPI (Permite usar cualquier pin GPIO arbitrario)`);
    lines.push(`// Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, OLED_MOSI, OLED_CLK, OLED_DC, OLED_RESET, OLED_CS);`);
  }
  lines.push(``);

  // Bitmap
  if (comment) {
    lines.push(`// ---- Bitmap del diseño OLED (${byteCount} bytes) ----`);
    lines.push(`// Pantalla de ${width}x${height} píxeles (Monocromo 1-bit)`);
  }
  if (cfg.frames && cfg.frames.length > 1) {
    const fps = cfg.fps || 10;
    const delayMs = Math.max(20, Math.round(1000 / fps));
    lines.push(`// ============================================================`);
    lines.push(`// ANIMACIÓN: ${cfg.frames.length} FOTOGRAMAS A ${fps} FPS`);
    lines.push(`// ============================================================`);
    lines.push(`#define TOTAL_FRAMES    ${cfg.frames.length}`);
    lines.push(`#define FRAME_DELAY_MS  ${delayMs}`);
    lines.push(``);

    cfg.frames.forEach((frameBm, fIdx) => {
      const fBytes = bitmapToBytes(frameBm, width, height);
      lines.push(`static const uint8_t PROGMEM frame_${fIdx}[${byteCount}] = {`);
      lines.push(formatBytes(fBytes));
      lines.push(`};`);
      lines.push(``);
    });

    lines.push(`static const uint8_t* const PROGMEM oled_animation_frames[TOTAL_FRAMES] = {`);
    for (let f = 0; f < cfg.frames.length; f++) {
      lines.push(`  frame_${f}${f < cfg.frames.length - 1 ? ',' : ''}`);
    }
    lines.push(`};`);
    lines.push(``);
  } else {
    lines.push(`static const uint8_t PROGMEM oled_bitmap[${byteCount}] = {`);
    lines.push(bitmapHex);
    lines.push(`};`);
    lines.push(``);
  }

  const isDynamicAnalog = !!cfg.dynamicAnalog;
  const analogPin = cfg.analogPin || 'A0';
  const widgets = Array.isArray(cfg.widgets) ? cfg.widgets : [];
  const progBarWidget = widgets.find(w => w.id === 'prog_bar' || /barra|progress/i.test(w.name || ''));
  const gaugeWidget = widgets.find(w => w.id === 'gauge_dial' || /tac|gauge/i.test(w.name || ''));

  const pbX = progBarWidget ? Math.round(progBarWidget.x) : Math.max(0, Math.round((width - 64) / 2));
  const pbY = progBarWidget ? Math.round(progBarWidget.y) : Math.max(0, height - 12);
  const pbW = progBarWidget ? Math.max(16, Math.round(progBarWidget.w)) : 64;
  const pbH = progBarWidget ? Math.max(6, Math.round(progBarWidget.h)) : 8;

  const gCX = gaugeWidget ? Math.round(gaugeWidget.x + gaugeWidget.w / 2) : Math.round(width / 2);
  const gCY = gaugeWidget ? Math.round(gaugeWidget.y + gaugeWidget.h) : Math.round(height - 4);
  const gRadius = gaugeWidget ? Math.max(10, Math.round(gaugeWidget.w / 2)) : 16;

  if (isDynamicAnalog) {
    lines.push(`// ============================================================`);
    lines.push(`// ENTRADA ANALÓGICA: LECTURA DE SENSOR / POTENCIÓMETRO`);
    lines.push(`// ============================================================`);
    lines.push(`#define SENSOR_ANALOG_PIN  ${analogPin}  // Pin analógico asignado para lectura en vivo`);
    lines.push(``);

    if (gaugeWidget) {
      lines.push(`// Dibuja un Tacómetro / Medidor Dial según porcentaje (0 - 100%)`);
      lines.push(`void drawGauge(int cx, int cy, int radius, int percent) {`);
      lines.push(`  percent = constrain(percent, 0, 100);`);
      lines.push(`  for (int a = 180; a <= 360; a += 6) {`);
      lines.push(`    float rad = a * 0.0174533;`);
      lines.push(`    display.drawPixel(cx + cos(rad) * radius, cy + sin(rad) * radius, SSD1306_WHITE);`);
      lines.push(`  }`);
      lines.push(`  float needleRad = (180.0 + (percent / 100.0) * 180.0) * 0.0174533;`);
      lines.push(`  int nx = cx + cos(needleRad) * (radius - 3);`);
      lines.push(`  int ny = cy + sin(needleRad) * (radius - 3);`);
      lines.push(`  display.drawLine(cx, cy, nx, ny, SSD1306_WHITE);`);
      lines.push(`  display.fillCircle(cx, cy, 2, SSD1306_WHITE);`);
      lines.push(`}`);
      lines.push(``);
    } else {
      lines.push(`// Dibuja una Barra de Progreso dinámica según porcentaje (0 - 100%)`);
      lines.push(`void drawProgressBar(int x, int y, int w, int h, int percent) {`);
      lines.push(`  percent = constrain(percent, 0, 100);`);
      lines.push(`  display.drawRect(x, y, w, h, SSD1306_WHITE);`);
      lines.push(`  int innerW = w - 4;`);
      lines.push(`  int innerH = h - 4;`);
      lines.push(`  display.fillRect(x + 2, y + 2, innerW, innerH, SSD1306_BLACK);`);
      lines.push(`  int fillW = map(percent, 0, 100, 0, innerW);`);
      lines.push(`  if (fillW > 0) {`);
      lines.push(`    display.fillRect(x + 2, y + 2, fillW, innerH, SSD1306_WHITE);`);
      lines.push(`  }`);
      lines.push(`}`);
      lines.push(``);
    }
  }

  if (includeInit) {
    lines.push(`void setup() {`);
    lines.push(`  Serial.begin(115200);`);
    lines.push(`  delay(100);`);
    lines.push(``);
    if (isDynamicAnalog) {
      lines.push(`  pinMode(SENSOR_ANALOG_PIN, INPUT);`);
      lines.push(``);
    }
    if (comment) lines.push(`  // Inicialización de la interfaz física`);
    if (iface === 'I2C') {
      lines.push(`  Wire.begin();`);
      lines.push(`  Wire.setClock(100000); // 100kHz modo seguro y estable`);
      lines.push(``);
      lines.push(`  // Iniciar display OLED con auto-detección de dirección (0x3C o 0x3D)`);
      lines.push(`  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {`);
      lines.push(`    if (!display.begin(SSD1306_SWITCHCAPVCC, (SCREEN_ADDRESS == 0x3C) ? 0x3D : 0x3C)) {`);
      lines.push(`      Serial.println(F("[ERROR] Display OLED no detectado en 0x3C ni 0x3D."));`);
      lines.push(`      Serial.println(F("-> Arduino MEGA: Conecta SDA al Pin 20 y SCL al Pin 21 (NO usar A4/A5)."));`);
      lines.push(`      Serial.println(F("-> Arduino UNO: Conecta SDA a A4 y SCL a A5."));`);
      lines.push(`      pinMode(13, OUTPUT);`);
      lines.push(`      while (1) { digitalWrite(13, HIGH); delay(200); digitalWrite(13, LOW); delay(200); }`);
      lines.push(`    }`);
      lines.push(`  }`);
    } else {
      lines.push(`  SPI.begin();`);
      lines.push(``);
      lines.push(`  // Iniciar display OLED por SPI`);
      lines.push(`  if (!display.begin(SSD1306_SWITCHCAPVCC)) {`);
      lines.push(`    Serial.println(F("[ERROR] No se pudo inicializar display por SPI."));`);
      lines.push(`    Serial.println(F("-> Revisa los pines CS, DC, RST, CLK y MOSI."));`);
      lines.push(`    for (;;); // Detener`);
      lines.push(`  }`);
    }
    lines.push(``);

    if (cfg.frames && cfg.frames.length > 1) {
      lines.push(`  Serial.println(F("[OK] Animación lista para reproducir."));`);
      lines.push(`}`);
      lines.push(``);
      lines.push(`void loop() {`);
      lines.push(`  // Reproducir ciclo continuo de animación`);
      lines.push(`  for (int f = 0; f < TOTAL_FRAMES; f++) {`);
      lines.push(`    display.clearDisplay();`);
      lines.push(`    const uint8_t* ptr = (const uint8_t*)pgm_read_ptr(&(oled_animation_frames[f]));`);
      lines.push(`    display.drawBitmap(0, 0, ptr, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);`);
      lines.push(`    display.display();`);
      lines.push(`    delay(FRAME_DELAY_MS);`);
      lines.push(`  }`);
      lines.push(`}`);
    } else if (isDynamicAnalog) {
      lines.push(`  Serial.println(F("[OK] Display inicializado en modo dinámico con sensor analógico."));`);
      lines.push(`}`);
      lines.push(``);
      lines.push(`void loop() {`);
      lines.push(`  // 1. Leer el pin analógico (${analogPin})`);
      lines.push(`  int rawValue = analogRead(SENSOR_ANALOG_PIN);`);
      lines.push(``);
      lines.push(`  // 2. Mapear lectura analógica a porcentaje (0% - 100%)`);
      lines.push(`  int maxAdc = 1023; // Ajusta a 4095 si usas ESP32`);
      lines.push(`  int percent = map(rawValue, 0, maxAdc, 0, 100);`);
      lines.push(`  percent = constrain(percent, 0, 100);`);
      lines.push(``);
      lines.push(`  // 3. Monitoreo por consola serial`);
      lines.push(`  Serial.print(F("Sensor [${analogPin}]: "));`);
      lines.push(`  Serial.print(rawValue);`);
      lines.push(`  Serial.print(F(" -> "));`);
      lines.push(`  Serial.print(percent);`);
      lines.push(`  Serial.println(F("%"));`);
      lines.push(``);
      lines.push(`  // 4. Actualizar pantalla OLED con el widget dinámico`);
      lines.push(`  display.clearDisplay();`);
      lines.push(`  display.drawBitmap(0, 0, oled_bitmap, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);`);
      if (gaugeWidget) {
        lines.push(`  drawGauge(${gCX}, ${gCY}, ${gRadius}, percent);`);
      } else {
        lines.push(`  drawProgressBar(${pbX}, ${pbY}, ${pbW}, ${pbH}, percent);`);
      }
      lines.push(`  display.display();`);
      lines.push(`  delay(30); // Frecuencia de muestreo (~33 FPS)`);
      lines.push(`}`);
    } else {
      if (comment) lines.push(`  // Limpiar buffer y dibujar diseño`);
      lines.push(`  display.clearDisplay();`);
      lines.push(`  display.drawBitmap(`);
      lines.push(`    0, 0,              // Posición X, Y`);
      lines.push(`    oled_bitmap,       // Datos del bitmap PROGMEM`);
      lines.push(`    SCREEN_WIDTH,      // Ancho (${width} px)`);
      lines.push(`    SCREEN_HEIGHT,     // Alto (${height} px)`);
      lines.push(`    SSD1306_WHITE      // Píxeles ON`);
      lines.push(`  );`);
      lines.push(`  display.display();   // Enviar buffer al display físico`);
      lines.push(`  Serial.println(F("[OK] Pantalla inicializada y renderizada."));`);
      lines.push(`}`);
      lines.push(``);
      lines.push(`void loop() {`);
      if (comment) lines.push(`  // El diseño ya está activo en pantalla`);
      lines.push(`  delay(1000);`);
      lines.push(`}`);
    }
  }

  return lines.join('\n');
}

// ---- U8g2 ----
function generateU8g2(cfg, bytes, elemInfo, template, includeInit, includeComments) {
  const { driver, width, height, interface: iface } = cfg;
  const byteCount = bytes.length;
  const bitmapHex = formatBytes(bytes);
  const comment = includeComments;

  // Mapeo de driver a clase U8g2
  const u8g2Classes = {
    'SSD1306': `U8G2_SSD1306_${width}X${height}_NONAME_F_HW_I2C`,
    'SH1106':  `U8G2_SH1106_${width}X${height}_NONAME_F_HW_I2C`,
    'SSD1309': `U8G2_SSD1309_${width}X${height}_NONAME_F_HW_I2C`,
    'SH1107':  `U8G2_SH1107_${width}X${height}_PIMORONI_F_HW_I2C`,
    'SSD1327': `U8G2_SSD1327_${width}X${height}_NONAME_F_HW_I2C`,
  };
  const u8g2Class = u8g2Classes[driver] || `U8G2_SSD1306_${width}X${height}_NONAME_F_HW_I2C`;
  const ifaceStr = iface === 'SPI' ? 'SPI' : 'I2C';
  const isSPI = iface === 'SPI';

  const lines = [];

  if (comment) {
    lines.push(`// ============================================================`);
    lines.push(`// OLED Designer — U8g2 Graphics Library`);
    lines.push(`// Driver:      ${driver}`);
    lines.push(`// Resolución:  ${width}x${height} píxeles`);
    lines.push(`// Interfaz:    ${ifaceStr}`);
    if (isSPI) {
      lines.push(`// Conexiones SPI (4-wire):`);
      lines.push(`//   SCK/D0 -> Pin 13 | MOSI/D1 -> Pin 11 | CS -> Pin 10 | DC -> Pin 8 | RST -> Pin 9`);
    } else {
      lines.push(`// Conexiones I2C:`);
      lines.push(`//   SCL -> Pin A5 (Uno) / GPIO 22 (ESP32) | SDA -> Pin A4 (Uno) / GPIO 21 (ESP32)`);
    }
    lines.push(`// ============================================================`);
    lines.push(``);
  }

  lines.push(`#include <U8g2lib.h>`);
  if (isSPI) {
    lines.push(`#include <SPI.h>`);
    lines.push(``);
    lines.push(`// Opción A: Hardware SPI (Rápido)`);
    lines.push(`U8G2_SSD1306_${width}X${height}_NONAME_F_4W_HW_SPI u8g2(U8G2_R0, /* cs=*/ 10, /* dc=*/ 8, /* reset=*/ 9);`);
    lines.push(``);
    lines.push(`// Opción B: Software SPI (Cualquier pin digital)`);
    lines.push(`// U8G2_SSD1306_${width}X${height}_NONAME_F_4W_SW_SPI u8g2(U8G2_R0, /* clock=*/ 13, /* data=*/ 11, /* cs=*/ 10, /* dc=*/ 8, /* reset=*/ 9);`);
  } else {
    lines.push(`#include <Wire.h>`);
    lines.push(``);
    lines.push(`// Opción A: Hardware I2C (Bus I2C nativo del MCU)`);
    lines.push(`${u8g2Class} u8g2(U8G2_R0, /* reset=*/ U8X8_PIN_NONE);`);
    lines.push(``);
    lines.push(`// Opción B: Software I2C (Pines arbitrarios)`);
    lines.push(`// U8G2_SSD1306_${width}X${height}_NONAME_F_SW_I2C u8g2(U8G2_R0, /* clock/SCL=*/ A5, /* data/SDA=*/ A4, /* reset=*/ U8X8_PIN_NONE);`);
  }
  lines.push(``);

  if (comment) lines.push(`// Bitmap en formato XBM (compatible con u8g2.drawXBMP)`);
  lines.push(`static const uint8_t bitmap[${byteCount}] PROGMEM = {`);
  lines.push(bitmapHex);
  lines.push(`};`);
  lines.push(``);

  const isDynamicAnalog = !!cfg.dynamicAnalog;
  const analogPin = cfg.analogPin || 'A0';
  const widgets = Array.isArray(cfg.widgets) ? cfg.widgets : [];
  const progBarWidget = widgets.find(w => w.id === 'prog_bar' || /barra|progress/i.test(w.name || ''));
  const pbX = progBarWidget ? Math.round(progBarWidget.x) : Math.max(0, Math.round((width - 64) / 2));
  const pbY = progBarWidget ? Math.round(progBarWidget.y) : Math.max(0, height - 12);
  const pbW = progBarWidget ? Math.max(16, Math.round(progBarWidget.w)) : 64;
  const pbH = progBarWidget ? Math.max(6, Math.round(progBarWidget.h)) : 8;

  if (includeInit) {
    lines.push(`void setup() {`);
    lines.push(`  u8g2.begin();`);
    lines.push(`  u8g2.setBusClock(400000); // 400kHz para I2C`);
    if (isDynamicAnalog) {
      lines.push(`  pinMode(${analogPin}, INPUT);`);
    }
    lines.push(`}`);
    lines.push(``);
    if (isDynamicAnalog) {
      lines.push(`void loop() {`);
      lines.push(`  int raw = analogRead(${analogPin});`);
      lines.push(`  int percent = map(raw, 0, 1023, 0, 100);`);
      lines.push(`  percent = constrain(percent, 0, 100);`);
      lines.push(``);
      lines.push(`  u8g2.clearBuffer();`);
      lines.push(`  u8g2.drawXBMP(0, 0, ${width}, ${height}, bitmap);`);
      lines.push(`  // Barra de progreso dinámica`);
      lines.push(`  u8g2.drawFrame(${pbX}, ${pbY}, ${pbW}, ${pbH});`);
      lines.push(`  int fillW = map(percent, 0, 100, 0, ${pbW} - 4);`);
      lines.push(`  if (fillW > 0) u8g2.drawBox(${pbX} + 2, ${pbY} + 2, fillW, ${pbH} - 4);`);
      lines.push(`  u8g2.sendBuffer();`);
      lines.push(`  delay(30);`);
      lines.push(`}`);
    } else {
      lines.push(`void loop() {`);
      lines.push(`  u8g2.clearBuffer();`);
      lines.push(`  u8g2.drawXBMP(0, 0, ${width}, ${height}, bitmap);`);
      lines.push(`  u8g2.sendBuffer();`);
      lines.push(`  delay(1000);`);
      lines.push(`}`);
    }
  }

  return lines.join('\n');
}

// ---- C Array ----
function generateCArray(cfg, bytes, includeComments) {
  const { driver, width, height } = cfg;
  const byteCount = bytes.length;
  const bitmapHex = formatBytes(bytes, 8);

  const lines = [];

  if (includeComments) {
    lines.push(`/**`);
    lines.push(` * OLED Designer — C Array (Bitmap Monocromo)`);
    lines.push(` * Driver:     ${driver}`);
    lines.push(` * Resolución: ${width}x${height} px`);
    lines.push(` * Bytes:      ${byteCount} (${Math.ceil(byteCount/1024*100)/100} KB)`);
    lines.push(` * Formato:    MSB first, row-major`);
    lines.push(` *`);
    lines.push(` * Uso (Adafruit GFX):`);
    lines.push(` *   display.drawBitmap(0, 0, oled_bitmap_${width}x${height}, ${width}, ${height}, SSD1306_WHITE);`);
    lines.push(` *`);
    lines.push(` * Uso (U8g2):`);
    lines.push(` *   u8g2.drawXBMP(0, 0, ${width}, ${height}, oled_bitmap_${width}x${height});`);
    lines.push(` */`);
    lines.push(``);
  }

  lines.push(`#ifndef OLED_BITMAP_${width}X${height}_H`);
  lines.push(`#define OLED_BITMAP_${width}X${height}_H`);
  lines.push(``);
  lines.push(`#include <stdint.h>`);
  lines.push(`#include <avr/pgmspace.h>  // Para PROGMEM (Arduino). Omitir en otros sistemas.`);
  lines.push(``);
  lines.push(`#define OLED_BITMAP_WIDTH  ${width}`);
  lines.push(`#define OLED_BITMAP_HEIGHT ${height}`);
  lines.push(`#define OLED_BITMAP_BYTES  ${byteCount}`);
  lines.push(``);
  lines.push(`static const uint8_t oled_bitmap_${width}x${height}[${byteCount}] PROGMEM = {`);
  lines.push(bitmapHex);
  lines.push(`};`);
  lines.push(``);
  lines.push(`#endif // OLED_BITMAP_${width}X${height}_H`);

  return lines.join('\n');
}

// ---- MicroPython ----
function generateMicroPython(cfg, bytes, includeComments) {
  const { driver, width, height, interface: iface, i2cAddress } = cfg;
  const addr = i2cAddress || '0x3C';
  const isSPI = iface === 'SPI';

  const lines = [];

  if (includeComments) {
    lines.push(`# ============================================================`);
    lines.push(`# OLED Designer — MicroPython`);
    lines.push(`# Driver:      ${driver} (${width}x${height})`);
    lines.push(`# Interfaz:    ${iface}`);
    lines.push(`# `);
    lines.push(`# Requisitos: Copiar ssd1306.py a la memoria del microcontrolador`);
    lines.push(`# ============================================================`);
    lines.push(``);
  }

  lines.push(`from machine import Pin, ${isSPI ? 'SPI' : 'I2C'}`);
  lines.push(`import ssd1306`);
  lines.push(`import framebuf`);
  lines.push(``);

  if (isSPI) {
    lines.push(`# ---- Configuración de Pines SPI (Ejemplo ESP32) ----`);
    lines.push(`SPI_SCK_PIN  = 18  # Reloj SPI`);
    lines.push(`SPI_MOSI_PIN = 23  # Datos SPI`);
    lines.push(`OLED_DC_PIN  = 2   # Data / Command`);
    lines.push(`OLED_RES_PIN = 4   # Reset`);
    lines.push(`OLED_CS_PIN  = 5   # Chip Select`);
    lines.push(``);
    lines.push(`spi = SPI(1, baudrate=8_000_000, polarity=0, phase=0,`);
    lines.push(`          sck=Pin(SPI_SCK_PIN), mosi=Pin(SPI_MOSI_PIN))`);
    lines.push(`oled = ssd1306.SSD1306_SPI(${width}, ${height}, spi,`);
    lines.push(`                           dc=Pin(OLED_DC_PIN),`);
    lines.push(`                           res=Pin(OLED_RES_PIN),`);
    lines.push(`                           cs=Pin(OLED_CS_PIN))`);
  } else {
    lines.push(`# ---- Configuración de Pines I2C (Ejemplo ESP32 / Pico) ----`);
    lines.push(`I2C_SCL_PIN = 22  # GPIO22 (ESP32) | Pin GP5 (Raspberry Pi Pico)`);
    lines.push(`I2C_SDA_PIN = 21  # GPIO21 (ESP32) | Pin GP4 (Raspberry Pi Pico)`);
    lines.push(`I2C_FREQ    = 400_000`);
    lines.push(`OLED_ADDR   = ${addr}`);
    lines.push(``);
    lines.push(`i2c = I2C(0, scl=Pin(I2C_SCL_PIN), sda=Pin(I2C_SDA_PIN), freq=I2C_FREQ)`);
    lines.push(`oled = ssd1306.SSD1306_I2C(${width}, ${height}, i2c, addr=OLED_ADDR)`);
  }
  if (cfg.frames && cfg.frames.length > 1) {
    const fps = cfg.fps || 10;
    const delayMs = Math.max(20, Math.round(1000 / fps));
    lines.push(`import time`);
    lines.push(``);
    lines.push(`# ---- Animación: ${cfg.frames.length} Fotogramas a ${fps} FPS ----`);
    lines.push(`FRAME_DELAY_MS = ${delayMs}`);
    lines.push(`frames = [`);
    cfg.frames.forEach((frameBm, fIdx) => {
      const fBytes = bitmapToBytes(frameBm, width, height);
      lines.push(`    # Fotograma ${fIdx + 1}`);
      lines.push(`    framebuf.FrameBuffer(bytearray([${fBytes.join(', ')}]), ${width}, ${height}, framebuf.MONO_HLSB),`);
    });
    lines.push(`]`);
    lines.push(``);
    lines.push(`# ---- Bucle de Reproducción de Animación ----`);
    lines.push(`print("Reproduciendo animación de ${cfg.frames.length} frames...")`);
    lines.push(`while True:`);
    lines.push(`    for fb in frames:`);
    lines.push(`        oled.fill(0)`);
    lines.push(`        oled.blit(fb, 0, 0)`);
    lines.push(`        oled.show()`);
    lines.push(`        time.sleep_ms(FRAME_DELAY_MS)`);
  } else {
    if (includeComments) lines.push(`# ---- Bitmap (${bytes.length} bytes) ----`);
    lines.push(`bitmap_data = bytearray([`);
    for (let i = 0; i < bytes.length; i += 16) {
      const row = bytes.slice(i, i + 16).join(', ');
      lines.push(`    ${row},`);
    }
    lines.push(`])`);
    lines.push(``);
    if (includeComments) lines.push(`# ---- Mostrar en pantalla ----`);
    lines.push(`fb = framebuf.FrameBuffer(bitmap_data, ${width}, ${height}, framebuf.MONO_HLSB)`);
    lines.push(`oled.fill(0)         # Limpiar pantalla`);
    lines.push(`oled.blit(fb, 0, 0)  # Copiar bitmap`);
    lines.push(`oled.show()          # Actualizar display`);
  }

  return lines.join('\n');
}

// ---- CircuitPython ----
function generateCircuitPython(cfg, bytes, includeComments) {
  const { driver, width, height } = cfg;

  const lines = [];

  if (includeComments) {
    lines.push(`# OLED Designer — CircuitPython`);
    lines.push(`# Driver: ${driver} | ${width}x${height}`);
    lines.push(`# `);
    lines.push(`# Requisitos (lib/):`);
    lines.push(`#   - adafruit_ssd1306.mpy`);
    lines.push(`#   - adafruit_framebuf.mpy`);
    lines.push(``);
  }

  lines.push(`import board, busio`);
  lines.push(`import adafruit_ssd1306`);
  lines.push(`import framebuf`);
  lines.push(``);
  lines.push(`i2c = busio.I2C(board.SCL, board.SDA)`);
  lines.push(`oled = adafruit_ssd1306.SSD1306_I2C(${width}, ${height}, i2c)`);
  lines.push(``);
  lines.push(`bitmap_data = bytearray([`);
  for (let i = 0; i < bytes.length; i += 16) {
    lines.push(`    ${bytes.slice(i, i + 16).join(', ')},`);
  }
  lines.push(`])`);
  lines.push(``);
  lines.push(`fb = framebuf.FrameBuffer(bitmap_data, ${width}, ${height}, framebuf.MONO_HLSB)`);
  lines.push(`oled.fill(0)`);
  lines.push(`oled.blit(fb, 0, 0)`);
  lines.push(`oled.show()`);

  return lines.join('\n');
}

// ---- JavaScript / TypeScript ----
function generateJavaScript(cfg, bitmap, includeComments) {
  const { driver, width, height } = cfg;
  const pixels = Array.from(bitmap).map(v => v ? '1' : '0').join('');

  const lines = [];

  if (includeComments) {
    lines.push(`/**`);
    lines.push(` * OLED Designer — JavaScript Canvas Simulator`);
    lines.push(` * Driver: ${driver} | ${width}x${height}`);
    lines.push(` *`);
    lines.push(` * Uso: pegar en un archivo .js y referenciar un <canvas id="oled">`);
    lines.push(` */`);
    lines.push(``);
  }

  lines.push(`// Datos del bitmap (${width}x${height} = ${width * height} píxeles)`);
  lines.push(`const OLED_WIDTH  = ${width};`);
  lines.push(`const OLED_HEIGHT = ${height};`);
  lines.push(`const OLED_SCALE  = 4;  // Píxeles por celda (zoom visual)`);
  lines.push(``);
  lines.push(`// String de bits: '1' = píxel ON, '0' = píxel OFF`);
  // Dividir en filas para legibilidad
  lines.push(`const OLED_PIXELS = (`);
  for (let y = 0; y < height; y++) {
    const row = pixels.slice(y * width, (y + 1) * width);
    lines.push(`  '${row}' +  // fila ${y}`);
  }
  lines.push(`  ''`);
  lines.push(`);`);
  lines.push(``);
  lines.push(`function renderOLED(canvasId = 'oled') {`);
  lines.push(`  const canvas = document.getElementById(canvasId);`);
  lines.push(`  canvas.width  = OLED_WIDTH  * OLED_SCALE;`);
  lines.push(`  canvas.height = OLED_HEIGHT * OLED_SCALE;`);
  lines.push(`  const ctx = canvas.getContext('2d');`);
  lines.push(``);
  lines.push(`  // Fondo (pantalla OLED apagada)`);
  lines.push(`  ctx.fillStyle = '#101010';`);
  lines.push(`  ctx.fillRect(0, 0, canvas.width, canvas.height);`);
  lines.push(``);
  lines.push(`  // Píxeles ON`);
  lines.push(`  ctx.fillStyle = '#ffffff';`);
  lines.push(`  for (let i = 0; i < OLED_PIXELS.length; i++) {`);
  lines.push(`    if (OLED_PIXELS[i] === '1') {`);
  lines.push(`      const x = i % OLED_WIDTH;`);
  lines.push(`      const y = Math.floor(i / OLED_WIDTH);`);
  lines.push(`      ctx.fillRect(x * OLED_SCALE, y * OLED_SCALE, OLED_SCALE, OLED_SCALE);`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`// Llamar cuando el DOM esté listo`);
  lines.push(`document.addEventListener('DOMContentLoaded', () => renderOLED());`);

  return lines.join('\n');
}

// ---- Rust (embedded-graphics) ----
function generateRust(cfg, bytes, includeComments) {
  const { driver, width, height } = cfg;
  const byteCount = bytes.length;
  const bitmapHex = bytes.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', ');

  const lines = [];

  if (includeComments) {
    lines.push(`//! OLED Designer — Rust (embedded-graphics)`);
    lines.push(`//! Driver: ${driver} | ${width}x${height}`);
    lines.push(`//!`);
    lines.push(`//! Cargo.toml:`);
    lines.push(`//! [dependencies]`);
    lines.push(`//! embedded-graphics = "0.8"`);
    lines.push(`//! ssd1306 = "0.8"  # o tu crate de driver`);
    lines.push(``);
  }

  lines.push(`use embedded_graphics::{`);
  lines.push(`    image::{Image, ImageRaw},`);
  lines.push(`    pixelcolor::BinaryColor,`);
  lines.push(`    prelude::*,`);
  lines.push(`    primitives::{Circle, Line, Rectangle, PrimitiveStyleBuilder},`);
  lines.push(`    text::{Text, TextStyle},`);
  lines.push(`    mono_font::{ascii::FONT_6X10, MonoTextStyle},`);
  lines.push(`};`);
  lines.push(``);
  lines.push(`/// Bitmap del diseño OLED (${byteCount} bytes, ${width}x${height})`);
  lines.push(`pub const OLED_BITMAP: &[u8] = &[`);

  // Formatear en filas de 16
  for (let i = 0; i < bytes.length; i += 16) {
    const row = bytes.slice(i, i + 16)
      .map(b => `0x${b.toString(16).padStart(2, '0')}`)
      .join(', ');
    lines.push(`    ${row},`);
  }

  lines.push(`];`);
  lines.push(``);
  lines.push(`/// Dibuja el bitmap en el display`);
  lines.push(`pub fn draw_oled_bitmap<D>(display: &mut D) -> Result<(), D::Error>`);
  lines.push(`where`);
  lines.push(`    D: DrawTarget<Color = BinaryColor>,`);
  lines.push(`{`);
  lines.push(`    let raw: ImageRaw<BinaryColor> = ImageRaw::new(OLED_BITMAP, ${width});`);
  lines.push(`    let image = Image::new(&raw, Point::zero());`);
    lines.push(`    image.draw(display)?;`);
    lines.push(`    Ok(())`);
    lines.push(`}`);
    lines.push(``);
    lines.push(`/// Ejemplo de uso en main.rs:`);
    lines.push('/// ```rust');
    lines.push(`/// let mut display = /* inicializar tu display */;`);
    lines.push(`/// draw_oled_bitmap(&mut display).unwrap();`);
    lines.push(`/// display.flush().unwrap();`);
    lines.push('/// ```');

    return lines.join('\n');
}

// ============================================================
// GENERADOR DOBLE PANTALLA OLED (DUAL SCREEN)
// ============================================================

function generateDualOLEDArduino(cfg, includeComments) {
  const { width, height } = cfg;
  const bytesA = bitmapToBytes(cfg.bitmapA || cfg.bitmap, width, height);
  const bytesB = bitmapToBytes(cfg.bitmapB || cfg.bitmap, width, height);
  const hexA = formatBytes(bytesA);
  const hexB = formatBytes(bytesB);

  const lines = [
    `// ============================================================`,
    `// OLED Designer — Control Dual de 2 Pantallas OLED (SSD1306)`,
    `// Pantalla A: Dirección 0x3C`,
    `// Pantalla B: Dirección 0x3D`,
    `// ============================================================`,
    `#include <Wire.h>`,
    `#include <Adafruit_GFX.h>`,
    `#include <Adafruit_SSD1306.h>`,
    ``,
    `#define SCREEN_WIDTH  ${width}`,
    `#define SCREEN_HEIGHT ${height}`,
    `#define OLED_ADDR_A   0x3C`,
    `#define OLED_ADDR_B   0x3D`,
    ``,
    `Adafruit_SSD1306 displayA(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);`,
    `Adafruit_SSD1306 displayB(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);`,
    ``,
    `// Bitmap Pantalla A (0x3C) — ${bytesA.length} bytes`,
    `static const uint8_t PROGMEM bitmap_A[] = {`,
    hexA,
    `};`,
    ``,
    `// Bitmap Pantalla B (0x3D) — ${bytesB.length} bytes`,
    `static const uint8_t PROGMEM bitmap_B[] = {`,
    hexB,
    `};`,
    ``,
    `void setup() {`,
    `  Serial.begin(115200);`,
    `  Wire.begin();`,
    `  Wire.setClock(400000); // 400kHz Fast-mode I2C`,
    ``,
    `  // Inicializar Pantalla A (0x3C)`,
    `  if (!displayA.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR_A)) {`,
    `    Serial.println(F("[ERROR] Display A (0x3C) no responde"));`,
    `  }`,
    `  // Inicializar Pantalla B (0x3D)`,
    `  if (!displayB.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR_B)) {`,
    `    Serial.println(F("[ERROR] Display B (0x3D) no responde. Revisa el puente de dirección."));`,
    `  }`,
    ``,
    `  // Dibujar en Pantalla A`,
    `  displayA.clearDisplay();`,
    `  displayA.drawBitmap(0, 0, bitmap_A, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);`,
    `  displayA.display();`,
    ``,
    `  // Dibujar en Pantalla B`,
    `  displayB.clearDisplay();`,
    `  displayB.drawBitmap(0, 0, bitmap_B, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);`,
    `  displayB.display();`,
    `  Serial.println(F("[OK] Ambas pantallas OLED inicializadas y renderizadas."));`,
    `}`,
    ``,
    `void loop() {`,
    `  // Bucle principal para sincronización`,
    `  delay(1000);`,
    `}`
  ];

  return lines.join('\n');
}

module.exports = { generate };
