/**
 * OLED Designer — Módulo de Generación Asistida por IA
 * src/aiModule.js
 *
 * Analiza el bitmap y la configuración para generar código inteligente
 * con comentarios descriptivos. Soporte para OpenAI API (opcional)
 * y generación local basada en análisis heurístico del canvas.
 */

'use strict';

const codeGen = require('./codeGen');

// ============================================================
// CONFIGURACIÓN
// ============================================================

const AI_CONFIG = {
  useOpenAI: false,        // Cambiar a true si tienes API key
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: 'gpt-4o-mini',
  maxTokens: 2000
};

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

async function generateCode(config) {
  try {
    // Intentar con OpenAI si está configurado
    if (AI_CONFIG.useOpenAI && AI_CONFIG.openaiApiKey) {
      return await generateWithOpenAI(config);
    }

    // Generación local inteligente
    return await generateLocally(config);
  } catch (err) {
    console.error('[AI] Error en generación:', err.message);
    // Fallback a generación básica
    return codeGen.generate({ ...config, includeComments: true });
  }
}

// ============================================================
// GENERACIÓN LOCAL INTELIGENTE (sin API externa)
// ============================================================

async function generateLocally(config) {
  const { platform, driver, width, height, interface: iface, bitmap } = config;

  // Analizar el canvas
  const analysis = analyzeCanvas(bitmap, width, height);

  // Generar código base
  const baseCode = await codeGen.generate({ ...config, includeComments: true });

  // Enriquecer con comentarios IA
  const enriched = enrichCode(baseCode, analysis, config);

  return enriched;
}

// ============================================================
// ANÁLISIS PROFUNDO DEL CANVAS
// ============================================================

function analyzeCanvas(bitmap, width, height) {
  const totalPixels = width * height;
  const onPixels = bitmap.filter(v => v === 1).length;
  const density = onPixels / totalPixels;

  // Detectar regiones de texto (patrones de columnas de 5-6px)
  const textRegions = detectTextRegions(bitmap, width, height);

  // Detectar regiones geométricas (líneas horizontales/verticales)
  const geoRegions = detectGeometricRegions(bitmap, width, height);

  // Detectar si es principalmente texto
  const isTextHeavy = textRegions.length > 2;

  // Detectar si tiene frame/borde
  const hasBorder = detectBorder(bitmap, width, height);

  // Centro de masa de los píxeles
  const centroid = calculateCentroid(bitmap, width, height);

  return {
    totalPixels,
    onPixels,
    density: Math.round(density * 100),
    textRegions,
    geoRegions,
    isTextHeavy,
    hasBorder,
    centroid,
    isEmpty: onPixels === 0,
    isFull: density > 0.8,
    hasContent: onPixels > 10
  };
}

function detectTextRegions(bitmap, width, height) {
  const regions = [];
  const CHAR_H = 8; // Altura típica de carácter OLED

  for (let y = 0; y < height - CHAR_H; y += CHAR_H) {
    let rowHasContent = false;
    let startX = -1;
    let endX = -1;

    for (let x = 0; x < width; x++) {
      let colPixels = 0;
      for (let dy = 0; dy < CHAR_H; dy++) {
        if (bitmap[(y + dy) * width + x]) colPixels++;
      }

      if (colPixels > 0) {
        rowHasContent = true;
        if (startX === -1) startX = x;
        endX = x;
      }
    }

    if (rowHasContent && endX - startX > 4) {
      regions.push({ x: startX, y, w: endX - startX, h: CHAR_H });
    }
  }

  return regions;
}

function detectGeometricRegions(bitmap, width, height) {
  const regions = [];

  // Detectar líneas horizontales
  for (let y = 0; y < height; y++) {
    let count = 0;
    let startX = -1;
    for (let x = 0; x < width; x++) {
      if (bitmap[y * width + x]) {
        if (startX === -1) startX = x;
        count++;
      } else if (count > 10) {
        regions.push({ type: 'hline', x: startX, y, w: count, h: 1 });
        count = 0;
        startX = -1;
      } else {
        count = 0;
        startX = -1;
      }
    }
    if (count > 10) {
      regions.push({ type: 'hline', x: startX, y, w: count, h: 1 });
    }
  }

  // Detectar líneas verticales
  for (let x = 0; x < width; x++) {
    let count = 0;
    let startY = -1;
    for (let y = 0; y < height; y++) {
      if (bitmap[y * width + x]) {
        if (startY === -1) startY = y;
        count++;
      } else if (count > 8) {
        regions.push({ type: 'vline', x, y: startY, w: 1, h: count });
        count = 0;
        startY = -1;
      } else {
        count = 0;
        startY = -1;
      }
    }
  }

  return regions;
}

function detectBorder(bitmap, width, height) {
  // Verificar si los bordes están activos
  let topCount = 0, bottomCount = 0, leftCount = 0, rightCount = 0;

  for (let x = 0; x < width; x++) {
    if (bitmap[x]) topCount++;
    if (bitmap[(height - 1) * width + x]) bottomCount++;
  }
  for (let y = 0; y < height; y++) {
    if (bitmap[y * width]) leftCount++;
    if (bitmap[y * width + (width - 1)]) rightCount++;
  }

  const threshold = 0.8;
  return (
    topCount / width > threshold &&
    bottomCount / width > threshold &&
    leftCount / height > threshold &&
    rightCount / height > threshold
  );
}

function calculateCentroid(bitmap, width, height) {
  let sumX = 0, sumY = 0, count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (bitmap[y * width + x]) {
        sumX += x; sumY += y; count++;
      }
    }
  }
  if (!count) return { x: width / 2, y: height / 2 };
  return { x: Math.round(sumX / count), y: Math.round(sumY / count) };
}

// ============================================================
// ENRIQUECIMIENTO DE CÓDIGO CON COMENTARIOS IA
// ============================================================

function enrichCode(baseCode, analysis, config) {
  const { platform, driver, width, height, interface: iface } = config;
  const { density, textRegions, hasBorder, isEmpty, centroid } = analysis;

  const aiHeader = generateAIHeader(analysis, config);
  const suggestions = generateSuggestions(analysis, config);

  // Insertar header IA al principio
  const enrichedLines = [
    aiHeader,
    '',
    baseCode,
    '',
    suggestions
  ];

  return enrichedLines.join('\n');
}

function generateAIHeader(analysis, config) {
  const { platform, driver, width, height } = config;
  const { density, onPixels, textRegions, hasBorder, isEmpty, centroid, isTextHeavy } = analysis;

  const isArduino = platform.includes('arduino') || platform === 'u8g2';
  const commentChar = platform === 'micropython' || platform === 'circuitpython' || platform === 'rust' ? '#' : '//';
  const blockStart = platform === 'rust' ? '//!' : isArduino ? '/*' : '/*';
  const blockEnd = platform === 'rust' ? '' : isArduino ? ' */' : ' */';

  const contentDesc = isEmpty
    ? 'Canvas vacío'
    : isTextHeavy
    ? `Diseño con ${textRegions.length} región(es) de texto`
    : `Diseño con ${density}% de píxeles activos`;

  const lines = [
    `/* ====================================================================`,
    ` * OLED Designer — Código generado con análisis IA`,
    ` * ====================================================================`,
    ` * Plataforma:  ${platform}`,
    ` * Driver:      ${driver}`,
    ` * Resolución:  ${width}x${height} px`,
    ` * Interfaz:    ${config.interface}`,
    ` * `,
    ` * Análisis del canvas:`,
    ` *   - Contenido:     ${contentDesc}`,
    ` *   - Píxeles ON:    ${analysis.onPixels} de ${analysis.totalPixels} (${density}%)`,
    ` *   - Borde:         ${hasBorder ? 'Detectado ✓' : 'No detectado'}`,
    ` *   - Regiones texto: ${textRegions.length}`,
    ` *   - Centro de masa: X=${centroid.x}, Y=${centroid.y}`,
    ` * `,
    ` * Sugerencias de optimización generadas por IA`,
    ` * ==================================================================== */`
  ];

  return lines.join('\n');
}

function generateSuggestions(analysis, config) {
  const { platform } = config;
  const { density, hasBorder, textRegions, isEmpty } = analysis;

  const isArduino = platform.includes('arduino') || platform === 'u8g2';
  const prefix = (platform === 'micropython' || platform === 'circuitpython') ? '#' : '//';

  const suggestions = [];
  suggestions.push('');
  suggestions.push(`${prefix} ============================================================`);
  suggestions.push(`${prefix} Sugerencias de la IA`);
  suggestions.push(`${prefix} ============================================================`);

  if (isEmpty) {
    suggestions.push(`${prefix} ⚠ El canvas está vacío. Dibuja algo antes de exportar.`);
  }

  if (density < 5 && !isEmpty) {
    suggestions.push(`${prefix} 💡 Baja densidad (${density}%): considera usar drawPixel() en lugar`);
    suggestions.push(`${prefix}    de drawBitmap() para optimizar memoria.`);
  }

  if (density > 60) {
    suggestions.push(`${prefix} 💡 Alta densidad (${density}%): el bitmap es adecuado.`);
    suggestions.push(`${prefix}    Considera fillScreen(SSD1306_BLACK) + drawBitmap() para mejor velocidad.`);
  }

  if (hasBorder && isArduino) {
    suggestions.push(`${prefix} 💡 Borde detectado: alternativamente puedes usar:`);
    suggestions.push(`${prefix}    display.drawRect(0, 0, ${config.width}, ${config.height}, SSD1306_WHITE);`);
  }

  if (textRegions.length > 0 && isArduino) {
    suggestions.push(`${prefix} 💡 ${textRegions.length} región(es) de texto detectada(s).`);
    suggestions.push(`${prefix}    Para texto dinámico usa display.println() en lugar del bitmap.`);
    suggestions.push(`${prefix}    Ejemplo:`);
    textRegions.slice(0, 2).forEach((r, i) => {
      suggestions.push(`${prefix}      display.setCursor(${r.x}, ${r.y});`);
      suggestions.push(`${prefix}      display.println(F("Texto ${i + 1}"));`);
    });
  }

  if (config.interface === 'I2C') {
    suggestions.push(`${prefix} 💡 I2C: velocidad máxima recomendada = 400kHz`);
    suggestions.push(`${prefix}    Wire.setClock(400000);  // Agregar en setup() antes de display.begin()`);
  }

  if (platform === 'micropython') {
    suggestions.push(`${prefix} 💡 MicroPython: para animaciones usa oled.show() solo cuando sea necesario`);
    suggestions.push(`${prefix}    (cada llamada a show() toma ~10ms en I2C a 400kHz)`);
  }

  suggestions.push(`${prefix} ============================================================`);

  return suggestions.join('\n');
}

// ============================================================
// GENERACIÓN CON OPENAI (opcional)
// ============================================================

async function generateWithOpenAI(config) {
  const { platform, driver, width, height, interface: iface, bitmap } = config;

  // Crear descripción del canvas para el prompt
  const onPixels = bitmap.filter(v => v === 1).length;
  const density = Math.round(onPixels / (width * height) * 100);

  const prompt = `
Eres un experto en programación de microcontroladores y pantallas OLED.
Genera código limpio, comentado y listo para usar para la siguiente configuración:

- Plataforma: ${platform}
- Driver: ${driver}
- Resolución: ${width}x${height} píxeles
- Interfaz: ${iface}
- Píxeles activos: ${onPixels} (${density}% del total)

El bitmap del diseño tiene ${density}% de píxeles ON.

Genera:
1. El código completo con includes, inicialización y función de dibujo
2. Comentarios explicativos en español
3. Sugerencias de optimización al final como comentarios
4. Compatible con Arduino IDE o el entorno de la plataforma especificada

Responde SOLO con el código, sin explicaciones fuera del código.
`.trim();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_CONFIG.openaiApiKey}`
    },
    body: JSON.stringify({
      model: AI_CONFIG.openaiModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: AI_CONFIG.maxTokens,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '// Error: respuesta vacía de IA';
}

// ============================================================
// CONFIGURAR API KEY
// ============================================================

function setOpenAIKey(apiKey) {
  AI_CONFIG.openaiApiKey = apiKey;
  AI_CONFIG.useOpenAI = !!apiKey;
}

module.exports = {
  generateCode,
  analyzeCanvas,
  setOpenAIKey
};
