// ============================================================
// OLED Designer — Biblioteca de Widgets e Iconos Monocromo 1-Bit
// renderer/widgets.js
// ============================================================

/**
 * Biblioteca de iconos monocromo de 8x8 y 16x16 píxeles.
 * Formato: arreglo de números binarios o strings de filas de 8/16 bits.
 */
const ICON_LIBRARY = {
  // ---- HARDWARE & BATERÍA ----
  'battery_full': {
    name: 'Batería 100%',
    category: 'hardware',
    width: 16, height: 8,
    data: [
      0x7F, 0xFE, // .#############..
      0x80, 0x01, // #.............#
      0xBF, 0xF5, // #.###########.#.#
      0xBF, 0xF5, // #.###########.#.#
      0xBF, 0xF5, // #.###########.#.#
      0xBF, 0xF5, // #.###########.#.#
      0x80, 0x01, // #.............#
      0x7F, 0xFE  // .#############..
    ]
  },
  'battery_75': {
    name: 'Batería 75%',
    category: 'hardware',
    width: 16, height: 8,
    data: [
      0x7F, 0xFE,
      0x80, 0x01,
      0xBF, 0xC1,
      0xBF, 0xC1,
      0xBF, 0xC1,
      0xBF, 0xC1,
      0x80, 0x01,
      0x7F, 0xFE
    ]
  },
  'battery_50': {
    name: 'Batería 50%',
    category: 'hardware',
    width: 16, height: 8,
    data: [
      0x7F, 0xFE,
      0x80, 0x01,
      0xBE, 0x01,
      0xBE, 0x01,
      0xBE, 0x01,
      0xBE, 0x01,
      0x80, 0x01,
      0x7F, 0xFE
    ]
  },
  'battery_25': {
    name: 'Batería 25%',
    category: 'hardware',
    width: 16, height: 8,
    data: [
      0x7F, 0xFE,
      0x80, 0x01,
      0xB8, 0x01,
      0xB8, 0x01,
      0xB8, 0x01,
      0xB8, 0x01,
      0x80, 0x01,
      0x7F, 0xFE
    ]
  },
  'battery_charging': {
    name: 'Batería Cargando ⚡',
    category: 'hardware',
    width: 16, height: 8,
    data: [
      0x7F, 0xFE,
      0x81, 0x81,
      0x83, 0x01,
      0x87, 0xF1,
      0x80, 0xE1,
      0x80, 0xC1,
      0x81, 0x81,
      0x7F, 0xFE
    ]
  },
  'wifi_high': {
    name: 'WiFi Señal Alta',
    category: 'hardware',
    width: 8, height: 8,
    data: [0x3C, 0x42, 0x99, 0x24, 0x42, 0x18, 0x00, 0x18]
  },
  'wifi_med': {
    name: 'WiFi Señal Media',
    category: 'hardware',
    width: 8, height: 8,
    data: [0x00, 0x00, 0x00, 0x24, 0x42, 0x18, 0x00, 0x18]
  },
  'wifi_low': {
    name: 'WiFi Señal Baja',
    category: 'hardware',
    width: 8, height: 8,
    data: [0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x00, 0x18]
  },
  'bluetooth': {
    name: 'Bluetooth',
    category: 'hardware',
    width: 8, height: 8,
    data: [0x12, 0x15, 0x19, 0x2E, 0x2E, 0x19, 0x15, 0x12]
  },
  'usb': {
    name: 'Conexión USB',
    category: 'hardware',
    width: 8, height: 8,
    data: [0x10, 0x38, 0x54, 0x10, 0x10, 0x10, 0x28, 0x38]
  },

  // ---- SENSORES Y SISTEMA ----
  'thermometer': {
    name: 'Termómetro / Temp',
    category: 'sensores',
    width: 8, height: 8,
    data: [0x18, 0x24, 0x24, 0x24, 0x24, 0x42, 0x7E, 0x3C]
  },
  'droplet': {
    name: 'Gota / Humedad',
    category: 'sensores',
    width: 8, height: 8,
    data: [0x10, 0x28, 0x44, 0x44, 0x82, 0x82, 0x44, 0x38]
  },
  'sun': {
    name: 'Sol / Luminosidad',
    category: 'sensores',
    width: 8, height: 8,
    data: [0x24, 0x00, 0x5A, 0x3C, 0x3C, 0x5A, 0x00, 0x24]
  },
  'lightning': {
    name: 'Rayo / Voltaje',
    category: 'sensores',
    width: 8, height: 8,
    data: [0x08, 0x18, 0x30, 0x7E, 0x0C, 0x18, 0x30, 0x20]
  },
  'heart': {
    name: 'Corazón / Pulso',
    category: 'sensores',
    width: 8, height: 8,
    data: [0x66, 0xFF, 0xFF, 0xFF, 0x7E, 0x3C, 0x18, 0x00]
  },
  'speedometer': {
    name: 'Velocímetro / RPM',
    category: 'sensores',
    width: 8, height: 8,
    data: [0x3C, 0x42, 0x85, 0x8A, 0x90, 0x80, 0x42, 0x3C]
  },

  // ---- ESTADO Y CONTROL ----
  'gear': {
    name: 'Configuración / Ajustes',
    category: 'sistema',
    width: 8, height: 8,
    data: [0x24, 0x7E, 0xDB, 0xC3, 0xC3, 0xDB, 0x7E, 0x24]
  },
  'lock': {
    name: 'Candado / Seguridad',
    category: 'sistema',
    width: 8, height: 8,
    data: [0x18, 0x24, 0x24, 0x7E, 0x7E, 0x7E, 0x7E, 0x7E]
  },
  'bell': {
    name: 'Campana / Alarma',
    category: 'sistema',
    width: 8, height: 8,
    data: [0x18, 0x3C, 0x7E, 0x7E, 0x7E, 0xFF, 0x18, 0x00]
  },
  'warning': {
    name: 'Alerta / Peligro',
    category: 'sistema',
    width: 8, height: 8,
    data: [0x18, 0x18, 0x24, 0x24, 0x42, 0x5A, 0x42, 0x7E]
  },
  'check': {
    name: 'Completado / OK',
    category: 'sistema',
    width: 8, height: 8,
    data: [0x00, 0x01, 0x03, 0x86, 0xCC, 0x78, 0x30, 0x00]
  },
  'cross': {
    name: 'Cancelar / Error',
    category: 'sistema',
    width: 8, height: 8,
    data: [0x81, 0x42, 0x24, 0x18, 0x18, 0x24, 0x42, 0x81]
  },
  'clock': {
    name: 'Reloj / Cronómetro',
    category: 'sistema',
    width: 8, height: 8,
    data: [0x3C, 0x42, 0x85, 0x85, 0x87, 0x81, 0x42, 0x3C]
  },

  // ---- NAVEGACIÓN Y FLECHAS ----
  'arrow_up': {
    name: 'Flecha Arriba',
    category: 'navegacion',
    width: 8, height: 8,
    data: [0x18, 0x3C, 0x7E, 0x18, 0x18, 0x18, 0x18, 0x00]
  },
  'arrow_down': {
    name: 'Flecha Abajo',
    category: 'navegacion',
    width: 8, height: 8,
    data: [0x18, 0x18, 0x18, 0x18, 0x7E, 0x3C, 0x18, 0x00]
  },
  'arrow_left': {
    name: 'Flecha Izquierda',
    category: 'navegacion',
    width: 8, height: 8,
    data: [0x10, 0x30, 0x7F, 0xFF, 0x7F, 0x30, 0x10, 0x00]
  },
  'arrow_right': {
    name: 'Flecha Derecha',
    category: 'navegacion',
    width: 8, height: 8,
    data: [0x08, 0x0C, 0xFE, 0xFF, 0xFE, 0x0C, 0x08, 0x00]
  },
  'play': {
    name: 'Play / Iniciar',
    category: 'navegacion',
    width: 8, height: 8,
    data: [0x30, 0x38, 0x3C, 0x3E, 0x3C, 0x38, 0x30, 0x00]
  },
  'pause': {
    name: 'Pausa',
    category: 'navegacion',
    width: 8, height: 8,
    data: [0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x00]
  },
  'stop': {
    name: 'Detener',
    category: 'navegacion',
    width: 8, height: 8,
    data: [0x7E, 0x7E, 0x7E, 0x7E, 0x7E, 0x7E, 0x7E, 0x00]
  },
  'volume_high': {
    name: 'Altavoz / Audio',
    category: 'navegacion',
    width: 8, height: 8,
    data: [0x04, 0x0E, 0x7F, 0x7F, 0x7F, 0x0E, 0x04, 0x00]
  }
};

/**
 * Convierte los datos hexadecimales de un icono en un bitmap Uint8Array (0 o 1).
 */
function decodeIconToBitmap(iconDef) {
  const { width, height, data } = iconDef;
  const bytesPerRow = Math.ceil(width / 8);
  const bitmap = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let bx = 0; bx < bytesPerRow; bx++) {
      const byte = data[y * bytesPerRow + bx];
      for (let bit = 0; bit < 8; bit++) {
        const x = bx * 8 + bit;
        if (x < width) {
          const isSet = (byte & (1 << (7 - bit))) ? 1 : 0;
          bitmap[y * width + x] = isSet;
        }
      }
    }
  }
  return bitmap;
}

// ============================================================
// GENERADORES DE WIDGETS PARAMÉTRICOS
// ============================================================

const WIDGET_GENERATORS = {
  /**
   * Barra de progreso horizontal configurable.
   */
  progressBar: (width = 64, height = 8, percent = 65, style = 'solid') => {
    const bitmap = new Uint8Array(width * height);
    const setPx = (x, y, v) => { if (x >= 0 && x < width && y >= 0 && y < height) bitmap[y * width + x] = v; };

    // Borde exterior
    for (let x = 0; x < width; x++) {
      setPx(x, 0, 1);
      setPx(x, height - 1, 1);
    }
    for (let y = 0; y < height; y++) {
      setPx(0, y, 1);
      setPx(width - 1, y, 1);
    }

    // Relleno interior
    const innerW = width - 4;
    const innerH = height - 4;
    const filledW = Math.round((innerW * Math.max(0, Math.min(100, percent))) / 100);

    for (let y = 2; y < 2 + innerH; y++) {
      for (let x = 2; x < 2 + filledW; x++) {
        if (style === 'segmented' && (x % 3 === 0)) continue;
        setPx(x, y, 1);
      }
    }
    return { width, height, bitmap, name: `Barra Progreso (${percent}%)` };
  },

  /**
   * Tacómetro / Medidor Dial (Gauge).
   */
  gaugeDial: (radius = 16, percent = 70) => {
    const size = radius * 2 + 1;
    const width = size;
    const height = radius + 4;
    const bitmap = new Uint8Array(width * height);
    const setPx = (x, y, v) => { if (x >= 0 && x < width && y >= 0 && y < height) bitmap[y * width + x] = v; };

    const cx = radius;
    const cy = radius;

    // Arco exterior
    for (let angle = 180; angle <= 360; angle += 2) {
      const rad = (angle * Math.PI) / 180;
      const x = Math.round(cx + Math.cos(rad) * radius);
      const y = Math.round(cy + Math.sin(rad) * radius);
      setPx(x, y, 1);
    }

    // Marcas de división
    [180, 225, 270, 315, 360].forEach(deg => {
      const rad = (deg * Math.PI) / 180;
      const x1 = Math.round(cx + Math.cos(rad) * (radius - 1));
      const y1 = Math.round(cy + Math.sin(rad) * (radius - 1));
      const x2 = Math.round(cx + Math.cos(rad) * (radius - 3));
      const y2 = Math.round(cy + Math.sin(rad) * (radius - 3));
      setPx(x1, y1, 1);
      setPx(x2, y2, 1);
    });

    // Aguja según porcentaje (0% -> 180°, 100% -> 360°)
    const needleDeg = 180 + (percent / 100) * 180;
    const needleRad = (needleDeg * Math.PI) / 180;
    const needleLen = radius - 4;

    for (let r = 0; r <= needleLen; r++) {
      const nx = Math.round(cx + Math.cos(needleRad) * r);
      const ny = Math.round(cy + Math.sin(needleRad) * r);
      setPx(nx, ny, 1);
    }

    // Centro
    setPx(cx, cy, 1);
    setPx(cx - 1, cy, 1);
    setPx(cx + 1, cy, 1);

    return { width, height, bitmap, name: `Tacómetro Gauge (${percent}%)` };
  },

  /**
   * Barra de estado superior completa (Header Bar) con reloj, WiFi y batería.
   */
  headerBar: (width = 128) => {
    const height = 10;
    const bitmap = new Uint8Array(width * height);
    const setPx = (x, y, v) => { if (x >= 0 && x < width && y >= 0 && y < height) bitmap[y * width + x] = v; };

    // Línea inferior divisoria
    for (let x = 0; x < width; x++) setPx(x, height - 1, 1);

    // Estampar icono WiFi a la derecha
    const wifi = ICON_LIBRARY['wifi_high'];
    const wifiBm = decodeIconToBitmap(wifi);
    for (let y = 0; y < wifi.height; y++) {
      for (let x = 0; x < wifi.width; x++) {
        if (wifiBm[y * wifi.width + x]) {
          setPx(width - 28 + x, y + 1, 1);
        }
      }
    }

    // Estampar batería a la derecha extrema
    const bat = ICON_LIBRARY['battery_full'];
    const batBm = decodeIconToBitmap(bat);
    for (let y = 0; y < bat.height; y++) {
      for (let x = 0; x < bat.width; x++) {
        if (batBm[y * bat.width + x]) {
          setPx(width - 18 + x, y + 1, 1);
        }
      }
    }

    return { width, height, bitmap, name: 'Barra de Estado Header (128px)' };
  },

  /**
   * Mini gráfica de sensor (Sparkline / Historial).
   */
  sparkline: (width = 48, height = 16) => {
    const bitmap = new Uint8Array(width * height);
    const setPx = (x, y, v) => { if (x >= 0 && x < width && y >= 0 && y < height) bitmap[y * width + x] = v; };

    // Marco
    for (let x = 0; x < width; x++) { setPx(x, 0, 1); setPx(x, height - 1, 1); }
    for (let y = 0; y < height; y++) { setPx(0, y, 1); setPx(width - 1, y, 1); }

    // Curva de datos senoidal simulada
    let prevY = Math.round(height / 2);
    for (let x = 2; x < width - 2; x++) {
      const val = Math.sin((x / 6)) * 0.4 + Math.cos((x / 4)) * 0.3;
      const py = Math.round((height / 2) + val * (height / 2 - 2));
      const clampedY = Math.max(2, Math.min(height - 3, py));

      // Dibujar línea conectada
      const minY = Math.min(prevY, clampedY);
      const maxY = Math.max(prevY, clampedY);
      for (let y = minY; y <= maxY; y++) setPx(x, y, 1);
      prevY = clampedY;
    }

    return { width, height, bitmap, name: 'Mini Gráfica Sparkline' };
  },

  /**
   * Tarjeta con marco redondeado para métricas (Sensor Card).
   */
  metricCard: (width = 60, height = 28, title = 'TEMP') => {
    const bitmap = new Uint8Array(width * height);
    const setPx = (x, y, v) => { if (x >= 0 && x < width && y >= 0 && y < height) bitmap[y * width + x] = v; };

    // Caja redondeada
    for (let x = 2; x < width - 2; x++) { setPx(x, 0, 1); setPx(x, height - 1, 1); }
    for (let y = 2; y < height - 2; y++) { setPx(0, y, 1); setPx(width - 1, y, 1); }
    setPx(1, 1, 1); setPx(width - 2, 1, 1); setPx(1, height - 2, 1); setPx(width - 2, height - 2, 1);

    // Línea divisoria de título
    for (let x = 2; x < width - 2; x++) setPx(x, 8, 1);

    // Termómetro decorativo dentro
    const thermo = ICON_LIBRARY['thermometer'];
    const thermoBm = decodeIconToBitmap(thermo);
    for (let y = 0; y < thermo.height; y++) {
      for (let x = 0; x < thermo.width; x++) {
        if (thermoBm[y * thermo.width + x]) {
          setPx(4 + x, 12 + y, 1);
        }
      }
    }

    return { width, height, bitmap, name: `Tarjeta Sensor (${title})` };
  }
};

// Exportar globalmente para el navegador
if (typeof window !== 'undefined') {
  window.ICON_LIBRARY = ICON_LIBRARY;
  window.WIDGET_GENERATORS = WIDGET_GENERATORS;
  window.decodeIconToBitmap = decodeIconToBitmap;
}
