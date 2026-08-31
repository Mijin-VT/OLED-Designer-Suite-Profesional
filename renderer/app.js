/**
 * OLED Designer — Renderer / Canvas Logic
 * renderer/app.js
 *
 * Motor completo del editor visual:
 * - Canvas de edición con zoom y pan
 * - Herramientas: lápiz, borrador, línea, rect, círculo, relleno, texto, imagen
 * - Conversión de imágenes a 1-bit
 * - Undo / Redo
 * - Vista previa en tiempo real con color de display
 * - Integración con IPC de Electron
 */

'use strict';

// ============================================================
// ESTADO GLOBAL
// ============================================================

const State = {
  // Canvas
  width: 128,
  height: 64,
  zoom: 4,
  panX: 0,
  panY: 0,
  showGrid: true,
  showPreview: true,

  // Herramienta activa
  tool: 'pencil',
  brushSize: 1,
  eraserSize: 2,
  isRightClick: false,
  pixelValue: 1,  // 1=ON, 0=OFF

  // Texto y Capas de Texto
  textContent: 'Hola OLED',
  textSize: 1,
  textAlign: 'left', // 'left', 'center', 'right'
  textElements: [],  // Capas de texto: [{ id, text, x, y, size, align }]
  selectedTextId: null,
  isDraggingText: false,
  dragTextOffsetX: 0,
  dragTextOffsetY: 0,

  // Widgets & Iconos
  activeWidget: null,

  // Animación / Múltiples Fotogramas (Timeline)
  frames: [],
  currentFrameIndex: 0,
  fps: 10,
  isPlaying: false,
  playInterval: null,
  onionSkin: false,
  playLoop: true,
  timelineVisible: false,

  // Display
  driverName: 'SSD1306',
  driverId: null,
  interfaceType: 'I2C',
  displayColor: 'white',
  i2cAddress: '0x3C',

  // Modo Doble Pantalla OLED (Dual Screen 0x3C / 0x3D)
  isDualScreen: false,
  activeScreen: 'A',
  screenA_bitmap: null,
  screenB_bitmap: null,

  // Proyecto
  projectId: null,
  projectName: 'Sin título',
  isDirty: false,

  // Bitmap — Uint8Array de width*height valores 0/1
  bitmap: null,

  // Historial de Undo/Redo
  history: [],
  historyIndex: -1,
  MAX_HISTORY: 50,

  // Interacción del canvas
  isDrawing: false,
  startX: 0,
  startY: 0,
  lastX: -1,
  lastY: -1,
  snapshotBeforeDraw: null,

  // Selección, Capas de Figuras y Transformación interactiva (Re-selección con ratón)
  selection: null,
  elements: [],
  baseBitmap: null,
  transformObject: null,
  transformDrag: null,

  // DB
  dbConnected: false,
  drivers: [],
  resolutions: []
};

// ============================================================
// REFERENCIAS DOM
// ============================================================

const mainCanvas = document.getElementById('main-canvas');
const overlayCanvas = document.getElementById('overlay-canvas');
const previewCanvas = document.getElementById('preview-canvas');
const ctx = mainCanvas.getContext('2d');
const octx = overlayCanvas.getContext('2d');
const pctx = previewCanvas.getContext('2d');

// ============================================================
// COLORES POR TIPO DE DISPLAY
// ============================================================

const DISPLAY_COLORS = {
  white:  { bg: '#101010', pixel: '#ffffff', glow: 'rgba(255,255,255,0.15)' },
  blue:   { bg: '#000818', pixel: '#4499ff', glow: 'rgba(68,153,255,0.2)'  },
  yellow: { bg: '#0a0800', pixel: '#ffdd00', glow: 'rgba(255,221,0,0.2)'   },
  green:  { bg: '#000a00', pixel: '#00ff44', glow: 'rgba(0,255,68,0.2)'    },
  rgb:    { bg: '#050508', pixel: '#ff6644', glow: 'rgba(255,102,68,0.2)'  }
};

// ============================================================
// INICIALIZACIÓN
// ============================================================

async function init() {
  console.log('[App] Iniciando OLED Designer...');

  // Crear bitmap inicial
  resetBitmap();

  // Configurar canvas
  resizeCanvases();

  // Listeners de UI
  bindToolButtons();
  bindToolbarButtons();
  bindRightPanel();
  bindModalButtons();
  bindKeyboard();
  bindCanvasEvents();
  bindMenuEvents();
  bindWindowResize();

  window.addEventListener('appLanguageChanged', () => {
    renderCanvas();
    if (typeof updateTransformHUD === 'function') updateTransformHUD();
    const zoomLabel = (window.I18N && window.I18N.t('zoom_status_label')) || 'Zoom: ';
    const zoomEl = document.getElementById('zoom-status');
    if (zoomEl) zoomEl.textContent = `${zoomLabel}${State.zoom}×`;
    const wModal = document.getElementById('modal-widgets');
    if (wModal && !wModal.classList.contains('hidden') && typeof renderWidgetList === 'function') {
      renderWidgetList();
    }
  });

  // Cargar datos desde DB
  await loadDriversFromDB();
  await loadResolutionsFromDB();
  checkDBStatus();

  // Primer render
  pushHistory();
  renderCanvas();
  renderPreview();

  console.log('[App] ¡Listo!');
  showToast('OLED Designer cargado', 'success');
}

// ============================================================
// BITMAP HELPERS
// ============================================================

function resetBitmap() {
  State.bitmap = new Uint8Array(State.width * State.height);
  State.baseBitmap = new Uint8Array(State.width * State.height);
  State.elements = [];
}

function getPixel(x, y) {
  if (x < 0 || y < 0 || x >= State.width || y >= State.height) return 0;
  return State.bitmap[y * State.width + x];
}

function setPixel(x, y, value) {
  if (x < 0 || y < 0 || x >= State.width || y >= State.height) return;
  State.bitmap[y * State.width + x] = value;
}

function countONPixels() {
  let count = 0;
  for (let i = 0; i < State.bitmap.length; i++) {
    if (State.bitmap[i]) count++;
  }
  return count;
}

// ============================================================
// MONITOR DE MÉTRICAS EN TOOLBAR (RAM, Flash, Consumo y Píxeles)
// ============================================================

function updateToolbarMetrics() {
  const ramValEl = document.getElementById('metric-ram-val');
  const flashValEl = document.getElementById('metric-flash-val');
  const powerValEl = document.getElementById('metric-power-val');
  const pixelsValEl = document.getElementById('metric-pixels-val');
  const memChipEl = document.getElementById('metric-chip-memory');
  const pwrChipEl = document.getElementById('metric-chip-power');

  if (!ramValEl || !powerValEl) return;

  const w = State.width || 128;
  const h = State.height || 64;
  const totalPixels = w * h;
  const onPixels = countONPixels();
  const onPercent = totalPixels > 0 ? ((onPixels / totalPixels) * 100).toFixed(1) : '0.0';

  // 1. Cálculo de Memoria (RAM y Flash)
  const ramBytes = Math.ceil(totalPixels / 8);
  const unoRamTotal = 2048; // 2 KB de RAM en Arduino Uno / Nano (ATmega328P)
  const unoRamPercent = Math.round((ramBytes / unoRamTotal) * 100);

  // Flash PROGMEM = bytes por frame * número de frames
  const numFrames = (State.frames && State.frames.length > 0) ? State.frames.length : 1;
  const flashBytes = ramBytes * numFrames;
  const flashKB = (flashBytes / 1024).toFixed(1);

  // Formato RAM
  let ramText = `RAM: ${ramBytes} B`;
  if (ramBytes >= 1024) {
    ramText = `RAM: ${(ramBytes / 1024).toFixed(1)} KB`;
  }
  ramValEl.innerHTML = `${ramText} <span class="metric-sub">(${unoRamPercent}%)</span>`;

  // Formato Flash
  let flashText = `Flash: ${flashKB} KB`;
  if (numFrames > 1) {
    flashText += ` <span class="metric-sub">(${numFrames}f)</span>`;
  }
  flashValEl.innerHTML = flashText;

  // Alerta visual de memoria si excede capacidad de un Arduino Uno
  if (memChipEl) {
    memChipEl.classList.remove('metric-warning', 'metric-danger');
    if (ramBytes > 1536 || flashBytes > 25000) {
      memChipEl.classList.add('metric-danger');
    } else if (ramBytes > 1024 || flashBytes > 16000) {
      memChipEl.classList.add('metric-warning');
    }
    memChipEl.title = `Monitor de Memoria Embebida:\n• Buffer de pantalla en RAM: ${ramBytes} Bytes (${unoRamPercent}% de Arduino Uno / Nano de 2 KB)\n• Flash de bitmaps (PROGMEM): ${flashBytes} Bytes (${flashKB} KB) en ${numFrames} fotograma(s)\n• En ESP32 / ESP8266 / RP2040: < 1% de uso de RAM`;
  }

  // 2. Cálculo de Consumo Eléctrico Estimado (SSD1306)
  const baseScale = totalPixels / (128 * 64);
  const baseCurrent_mA = 6.0 * Math.max(0.5, Math.min(2.0, baseScale));
  const pixelCurrent_mA = onPixels * 0.023;
  const totalCurrent_mA = (baseCurrent_mA + pixelCurrent_mA).toFixed(1);
  const power_mW = (parseFloat(totalCurrent_mA) * 3.3).toFixed(1);

  powerValEl.textContent = `⚡ ~${totalCurrent_mA} mA`;
  pixelsValEl.textContent = `${onPixels} px (${onPercent}%)`;

  if (pwrChipEl) {
    pwrChipEl.title = `Consumo Eléctrico Estimado (Display OLED a 3.3V):\n• Corriente base del circuito: ~${baseCurrent_mA.toFixed(1)} mA\n• Corriente de emisión OLED: ~${pixelCurrent_mA.toFixed(1)} mA\n• Corriente total estimada: ~${totalCurrent_mA} mA\n• Potencia estimada: ~${power_mW} mW @ 3.3V\n• Píxeles activos: ${onPixels} de ${totalPixels} (${onPercent}%)`;
  }
}

// ============================================================
// COMPOSICIÓN Y RENDERIZADO DE CAPAS DE ELEMENTOS INTERACTIVOS
// ============================================================

function getBresenhamLinePoints(x0, y0, x1, y1) {
  x0 = Math.round(x0); y0 = Math.round(y0);
  x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  const points = [];

  while (true) {
    points.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx)  { err += dx; y0 += sy; }
  }
  return points;
}

function drawLineDirect(targetBm, x0, y0, x1, y1, value) {
  const pts = getBresenhamLinePoints(x0, y0, x1, y1);
  for (const [px, py] of pts) {
    if (px >= 0 && px < State.width && py >= 0 && py < State.height) {
      targetBm[py * State.width + px] = value;
    }
  }
}

function drawRectDirect(targetBm, x0, y0, x1, y1, value, filled = false) {
  const minX = Math.max(0, Math.min(x0, x1));
  const maxX = Math.min(State.width - 1, Math.max(x0, x1));
  const minY = Math.max(0, Math.min(y0, y1));
  const maxY = Math.min(State.height - 1, Math.max(y0, y1));

  if (filled) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        targetBm[y * State.width + x] = value;
      }
    }
  } else {
    for (let x = minX; x <= maxX; x++) {
      targetBm[minY * State.width + x] = value;
      targetBm[maxY * State.width + x] = value;
    }
    for (let y = minY; y <= maxY; y++) {
      targetBm[y * State.width + minX] = value;
      targetBm[y * State.width + maxX] = value;
    }
  }
}

function drawEllipseDirect(targetBm, cx, cy, rx, ry, value, filled = false) {
  cx = Math.round(cx); cy = Math.round(cy);
  rx = Math.abs(Math.round(rx)); ry = Math.abs(Math.round(ry));
  if (rx === 0 && ry === 0) {
    if (cx >= 0 && cx < State.width && cy >= 0 && cy < State.height) targetBm[cy * State.width + cx] = value;
    return;
  }
  if (filled) {
    for (let y = -ry; y <= ry; y++) {
      const py = cy + y;
      if (py < 0 || py >= State.height) continue;
      const xSpan = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      for (let x = -xSpan; x <= xSpan; x++) {
        const px = cx + x;
        if (px >= 0 && px < State.width) targetBm[py * State.width + px] = value;
      }
    }
    return;
  }

  let x = 0;
  let y = ry;
  let d1 = (ry * ry) - (rx * rx * ry) + (0.25 * rx * rx);
  let dx = 2 * ry * ry * x;
  let dy = 2 * rx * rx * y;

  const plot4 = (px, py) => {
    const pts = [
      [cx + px, cy + py], [cx - px, cy + py],
      [cx + px, cy - py], [cx - px, cy - py]
    ];
    for (const [ix, iy] of pts) {
      if (ix >= 0 && ix < State.width && iy >= 0 && iy < State.height) {
        targetBm[iy * State.width + ix] = value;
      }
    }
  };

  while (dx < dy) {
    plot4(x, y);
    if (d1 < 0) {
      x++;
      dx += 2 * ry * ry;
      d1 += dx + (ry * ry);
    } else {
      x++;
      y--;
      dx += 2 * ry * ry;
      dy -= 2 * rx * rx;
      d1 += dx - dy + (ry * ry);
    }
  }

  let d2 = ((ry * ry) * ((x + 0.5) * (x + 0.5))) + ((rx * rx) * ((y - 1) * (y - 1))) - (rx * rx * ry * ry);
  while (y >= 0) {
    plot4(x, y);
    if (d2 > 0) {
      y--;
      dy -= 2 * rx * rx;
      d2 += (rx * rx) - dy;
    } else {
      y--;
      x++;
      dx += 2 * ry * ry;
      dy -= 2 * rx * rx;
      d2 += dx - dy + (rx * rx);
    }
  }
}

function rebuildCanvasBitmap() {
  if (!State.baseBitmap || State.baseBitmap.length !== State.width * State.height) {
    State.baseBitmap = new Uint8Array(State.width * State.height);
  }
  if (!State.bitmap || State.bitmap.length !== State.width * State.height) {
    State.bitmap = new Uint8Array(State.width * State.height);
  }

  // Partir desde la capa base de trazos libres
  State.bitmap.set(State.baseBitmap);

  // Componer encima todas las figuras interactivas del espacio de trabajo
  if (State.elements && State.elements.length > 0) {
    for (const el of State.elements) {
      const curX = Math.round(el.x);
      const curY = Math.round(el.y);
      const curW = Math.max(1, Math.round(el.w));
      const curH = Math.max(1, Math.round(el.h));
      const val = el.value !== undefined ? el.value : 1;

      if (el.type === 'shape') {
        if (el.shapeType === 'rect') {
          drawRectDirect(State.bitmap, curX, curY, curX + curW - 1, curY + curH - 1, val, false);
        } else if (el.shapeType === 'filled-rect') {
          drawRectDirect(State.bitmap, curX, curY, curX + curW - 1, curY + curH - 1, val, true);
        } else if (el.shapeType === 'circle') {
          const rx = curW / 2;
          const ry = curH / 2;
          drawEllipseDirect(State.bitmap, curX + rx, curY + ry, rx, ry, val, false);
        } else if (el.shapeType === 'filled-circle') {
          const rx = curW / 2;
          const ry = curH / 2;
          drawEllipseDirect(State.bitmap, curX + rx, curY + ry, rx, ry, val, true);
        } else if (el.shapeType === 'line') {
          const x0 = el.x0 !== undefined ? el.x0 : curX;
          const y0 = el.y0 !== undefined ? el.y0 : curY;
          const x1 = el.x1 !== undefined ? el.x1 : curX + curW;
          const y1 = el.y1 !== undefined ? el.y1 : curY + curH;
          drawLineDirect(State.bitmap, x0, y0, x1, y1, val);
        }
      } else if (el.origBitmap) {
        for (let dy = 0; dy < curH; dy++) {
          const sy = Math.floor((dy / curH) * el.origH);
          for (let dx = 0; dx < curW; dx++) {
            const sx = Math.floor((dx / curW) * el.origW);
            if (el.origBitmap[sy * el.origW + sx]) {
              const px = curX + dx;
              const py = curY + dy;
              if (px >= 0 && px < State.width && py >= 0 && py < State.height) {
                State.bitmap[py * State.width + px] = val;
              }
            }
          }
        }
      }
    }
  }

  syncActiveFrameBitmap();
  markDirty();
  renderCanvas();
  renderPreview();
}

// ============================================================
// HISTORIAL UNDO/REDO
// ============================================================

function pushHistory() {
  if (State.historyIndex < State.history.length - 1) {
    State.history = State.history.slice(0, State.historyIndex + 1);
  }

  State.history.push({
    bitmap: State.bitmap.slice(),
    baseBitmap: State.baseBitmap ? State.baseBitmap.slice() : null,
    elements: State.elements ? JSON.parse(JSON.stringify(State.elements)) : []
  });
  State.historyIndex = State.history.length - 1;

  if (State.history.length > State.MAX_HISTORY) {
    State.history.shift();
    State.historyIndex--;
  }

  updateUndoRedoButtons();
}

function undo() {
  if (State.historyIndex <= 0) return;
  State.historyIndex--;
  const entry = State.history[State.historyIndex];
  if (entry && entry.bitmap) {
    State.bitmap = entry.bitmap.slice();
    State.baseBitmap = entry.baseBitmap ? entry.baseBitmap.slice() : null;
    State.elements = entry.elements ? JSON.parse(JSON.stringify(entry.elements)) : [];
  } else if (entry) {
    State.bitmap = entry.slice();
  }
  markDirty();
  renderCanvas();
  renderPreview();
  updateUndoRedoButtons();
}

function redo() {
  if (State.historyIndex >= State.history.length - 1) return;
  State.historyIndex++;
  const entry = State.history[State.historyIndex];
  if (entry && entry.bitmap) {
    State.bitmap = entry.bitmap.slice();
    State.baseBitmap = entry.baseBitmap ? entry.baseBitmap.slice() : null;
    State.elements = entry.elements ? JSON.parse(JSON.stringify(entry.elements)) : [];
  } else if (entry) {
    State.bitmap = entry.slice();
  }
  markDirty();
  renderCanvas();
  renderPreview();
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  document.getElementById('btn-undo').disabled = State.historyIndex <= 0;
  document.getElementById('btn-redo').disabled = State.historyIndex >= State.history.length - 1;
}

// ============================================================
// RENDER DEL CANVAS PRINCIPAL
// ============================================================

function resizeCanvases() {
  const wrapper = document.getElementById('canvas-wrapper');
  const wrapW = wrapper.clientWidth;
  const wrapH = wrapper.clientHeight;

  const canvasW = State.width * State.zoom;
  const canvasH = State.height * State.zoom;

  mainCanvas.width = canvasW;
  mainCanvas.height = canvasH;
  overlayCanvas.width = canvasW;
  overlayCanvas.height = canvasH;

  // Centrar en el wrapper
  const left = Math.max(0, (wrapW - canvasW) / 2) + State.panX;
  const top  = Math.max(0, (wrapH - canvasH) / 2) + State.panY;

  mainCanvas.style.left = `${left}px`;
  mainCanvas.style.top  = `${top}px`;
  overlayCanvas.style.left = `${left}px`;
  overlayCanvas.style.top  = `${top}px`;

  // Preview canvas — escala 1:1
  previewCanvas.width = State.width;
  previewCanvas.height = State.height;
  previewCanvas.style.width  = `${State.width}px`;
  previewCanvas.style.height = `${State.height}px`;

  if (State.transformObject && typeof updateTransformHUD === 'function') {
    updateTransformHUD();
  }
}

function renderCanvas() {
  const colors = DISPLAY_COLORS[State.displayColor] || DISPLAY_COLORS.white;
  const z = State.zoom;

  // Fondo
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

  // Papel Cebolla (Onion Skinning) — Fotograma anterior en color ámbar translúcido
  if (State.onionSkin && State.frames && State.frames.length > 1 && State.currentFrameIndex > 0) {
    const prevFrame = State.frames[State.currentFrameIndex - 1];
    if (prevFrame && prevFrame.bitmap) {
      ctx.fillStyle = 'rgba(255, 128, 0, 0.4)';
      for (let y = 0; y < State.height; y++) {
        for (let x = 0; x < State.width; x++) {
          if (prevFrame.bitmap[y * State.width + x]) {
            ctx.fillRect(x * z, y * z, z, z);
          }
        }
      }
    }
  }

  // Píxeles del bitmap actual
  for (let y = 0; y < State.height; y++) {
    for (let x = 0; x < State.width; x++) {
      if (State.bitmap[y * State.width + x]) {
        ctx.fillStyle = colors.pixel;
        ctx.fillRect(x * z, y * z, z, z);

        // Resplandor suave en zoom alto
        if (z >= 6) {
          ctx.fillStyle = colors.glow;
          ctx.fillRect(x * z - 1, y * z - 1, z + 2, z + 2);
          ctx.fillStyle = colors.pixel;
          ctx.fillRect(x * z, y * z, z, z);
        }
      }
    }
  }

  // Capas de texto dinámicas / editables
  if (State.textElements && State.textElements.length > 0) {
    State.textElements.forEach(layer => {
      renderTextLayerDirect(ctx, layer, z, colors.pixel);
    });
  }

  // Cuadrícula
  if (State.showGrid && z >= 3) {
    ctx.strokeStyle = 'rgba(80,80,120,0.4)';
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= State.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * z + 0.5, 0);
      ctx.lineTo(x * z + 0.5, mainCanvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= State.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * z + 0.5);
      ctx.lineTo(mainCanvas.width, y * z + 0.5);
      ctx.stroke();
    }
  }

  // Actualizar statusbar y métricas en toolbar
  const onLabel = (window.I18N && window.I18N.t('pixel_count_label')) || 'Píxeles ON: ';
  document.getElementById('pixel-count').textContent = `${onLabel}${countONPixels()}`;
  document.getElementById('canvas-size-display').textContent = `${State.width} × ${State.height}`;
  updateToolbarMetrics();

  // Notificar streaming a hardware físico si está conectado
  if (typeof notifyCanvasUpdatedForHardware === 'function') {
    notifyCanvasUpdatedForHardware();
  }
}

function renderTextLayerDirect(targetCtx, layer, scale = 1, color = '#ffffff') {
  const bounds = getTextBounds(layer.text, layer.x, layer.y, layer.size, layer.align);
  let curX = bounds.x;
  targetCtx.fillStyle = color;

  for (const char of layer.text) {
    const glyph = FONT_5x7[char] || FONT_5x7[' '];
    for (let col = 0; col < 5; col++) {
      const colData = glyph[col];
      for (let row = 0; row < 7; row++) {
        if (colData & (1 << row)) {
          targetCtx.fillRect(
            (curX + col * layer.size) * scale,
            (layer.y + row * layer.size) * scale,
            layer.size * scale,
            layer.size * scale
          );
        }
      }
    }
    curX += (5 + 1) * layer.size;
  }
}

function renderPreview() {
  if (!State.showPreview) return;
  const colors = DISPLAY_COLORS[State.displayColor] || DISPLAY_COLORS.white;

  pctx.fillStyle = colors.bg;
  pctx.fillRect(0, 0, State.width, State.height);

  for (let y = 0; y < State.height; y++) {
    for (let x = 0; x < State.width; x++) {
      if (State.bitmap[y * State.width + x]) {
        pctx.fillStyle = colors.pixel;
        pctx.fillRect(x, y, 1, 1);
      }
    }
  }

  // Capas de texto en vista previa
  if (State.textElements && State.textElements.length > 0) {
    State.textElements.forEach(layer => {
      renderTextLayerDirect(pctx, layer, 1, colors.pixel);
    });
  }
}

// ============================================================
// CONVERSIÓN DE COORDENADAS PANTALLA → PIXEL
// ============================================================

function screenToPixel(clientX, clientY) {
  const rect = mainCanvas.getBoundingClientRect();
  const rx = (clientX - rect.left) / State.zoom;
  const ry = (clientY - rect.top)  / State.zoom;
  return {
    x: Math.floor(rx),
    y: Math.floor(ry)
  };
}

function pixelInBounds(x, y) {
  return x >= 0 && y >= 0 && x < State.width && y < State.height;
}

// ============================================================
// HERRAMIENTAS DE DIBUJO
// ============================================================

// -- Bresenham Line --
function drawLine(x0, y0, x1, y1, value) {
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    plotBrush(x0, y0, value);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// -- Brush (multi-pixel) --
function plotBrush(x, y, value) {
  const isErase = (State.tool === 'eraser') || (value === 0 && State.isRightClick);
  const s = isErase ? (State.eraserSize || 2) : (State.brushSize || 1);
  const half = Math.floor(s / 2);
  for (let dy = 0; dy < s; dy++) {
    for (let dx = 0; dx < s; dx++) {
      setPixel(x - half + dx, y - half + dy, value);
    }
  }
}

// -- Rectángulo (contorno) --
function drawRect(x0, y0, x1, y1, value, filled = false) {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  if (filled) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        setPixel(x, y, value);
      }
    }
  } else {
    for (let x = minX; x <= maxX; x++) {
      setPixel(x, minY, value);
      setPixel(x, maxY, value);
    }
    for (let y = minY; y <= maxY; y++) {
      setPixel(minX, y, value);
      setPixel(maxX, y, value);
    }
  }
}

// -- Círculo (Bresenham) --
function drawCircle(cx, cy, r, value, filled = false) {
  if (filled) {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) {
          setPixel(cx + x, cy + y, value);
        }
      }
    }
    return;
  }

  let x = 0, y = r, d = 3 - 2 * r;
  const plotCircle = (cx, cy, x, y) => {
    setPixel(cx + x, cy + y, value); setPixel(cx - x, cy + y, value);
    setPixel(cx + x, cy - y, value); setPixel(cx - x, cy - y, value);
    setPixel(cx + y, cy + x, value); setPixel(cx - y, cy + x, value);
    setPixel(cx + y, cy - x, value); setPixel(cx - y, cy - x, value);
  };

  while (y >= x) {
    plotCircle(cx, cy, x, y);
    x++;
    if (d > 0) { y--; d += 4 * (x - y) + 10; }
    else { d += 4 * x + 6; }
  }
}

// -- Elipse / Círculo Escalado (Midpoint Ellipse Algorithm) --
function drawEllipse(cx, cy, rx, ry, value, filled = false) {
  rx = Math.abs(Math.round(rx));
  ry = Math.abs(Math.round(ry));
  if (rx === 0 && ry === 0) {
    setPixel(cx, cy, value);
    return;
  }
  if (rx === 0) {
    for (let y = -ry; y <= ry; y++) setPixel(cx, cy + y, value);
    return;
  }
  if (ry === 0) {
    for (let x = -rx; x <= rx; x++) setPixel(cx + x, cy, value);
    return;
  }

  if (filled) {
    for (let y = -ry; y <= ry; y++) {
      const xSpan = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      for (let x = -xSpan; x <= xSpan; x++) {
        setPixel(cx + x, cy + y, value);
      }
    }
    return;
  }

  let x = 0;
  let y = ry;
  let d1 = (ry * ry) - (rx * rx * ry) + (0.25 * rx * rx);
  let dx = 2 * ry * ry * x;
  let dy = 2 * rx * rx * y;

  const plot4 = (cx, cy, x, y) => {
    setPixel(cx + x, cy + y, value);
    setPixel(cx - x, cy + y, value);
    setPixel(cx + x, cy - y, value);
    setPixel(cx - x, cy - y, value);
  };

  while (dx < dy) {
    plot4(cx, cy, x, y);
    if (d1 < 0) {
      x++;
      dx += 2 * ry * ry;
      d1 += dx + (ry * ry);
    } else {
      x++;
      y--;
      dx += 2 * ry * ry;
      dy -= 2 * rx * rx;
      d1 += dx - dy + (ry * ry);
    }
  }

  let d2 = ((ry * ry) * ((x + 0.5) * (x + 0.5))) + ((rx * rx) * ((y - 1) * (y - 1))) - (rx * rx * ry * ry);
  while (y >= 0) {
    plot4(cx, cy, x, y);
    if (d2 > 0) {
      y--;
      dy -= 2 * rx * rx;
      d2 += (rx * rx) - dy;
    } else {
      y--;
      x++;
      dx += 2 * ry * ry;
      dy -= 2 * rx * rx;
      d2 += dx - dy + (rx * rx);
    }
  }
}

// -- Relleno (Flood Fill) BFS --
function floodFill(startX, startY, fillValue) {
  const targetValue = getPixel(startX, startY);
  if (targetValue === fillValue) return;

  const stack = [[startX, startY]];
  const visited = new Uint8Array(State.width * State.height);

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (!pixelInBounds(x, y)) continue;
    if (visited[y * State.width + x]) continue;
    if (getPixel(x, y) !== targetValue) continue;

    visited[y * State.width + x] = 1;
    setPixel(x, y, fillValue);

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

// -- Texto rasterizado --
// Fuente bitmap 5×7 (96 caracteres ASCII)
const FONT_5x7 = {
  ' ': [0x00,0x00,0x00,0x00,0x00],
  '!': [0x00,0x00,0x5F,0x00,0x00],
  '"': [0x00,0x07,0x00,0x07,0x00],
  '#': [0x14,0x7F,0x14,0x7F,0x14],
  '$': [0x24,0x2A,0x7F,0x2A,0x12],
  '%': [0x23,0x13,0x08,0x64,0x62],
  '&': [0x36,0x49,0x55,0x22,0x50],
  '\'': [0x00,0x05,0x03,0x00,0x00],
  '(': [0x00,0x1C,0x22,0x41,0x00],
  ')': [0x00,0x41,0x22,0x1C,0x00],
  '*': [0x14,0x08,0x3E,0x08,0x14],
  '+': [0x08,0x08,0x3E,0x08,0x08],
  ',': [0x00,0x50,0x30,0x00,0x00],
  '-': [0x08,0x08,0x08,0x08,0x08],
  '.': [0x00,0x60,0x60,0x00,0x00],
  '/': [0x20,0x10,0x08,0x04,0x02],
  '0': [0x3E,0x51,0x49,0x45,0x3E],
  '1': [0x00,0x42,0x7F,0x40,0x00],
  '2': [0x42,0x61,0x51,0x49,0x46],
  '3': [0x21,0x41,0x45,0x4B,0x31],
  '4': [0x18,0x14,0x12,0x7F,0x10],
  '5': [0x27,0x45,0x45,0x45,0x39],
  '6': [0x3C,0x4A,0x49,0x49,0x30],
  '7': [0x01,0x71,0x09,0x05,0x03],
  '8': [0x36,0x49,0x49,0x49,0x36],
  '9': [0x06,0x49,0x49,0x29,0x1E],
  ':': [0x00,0x36,0x36,0x00,0x00],
  ';': [0x00,0x56,0x36,0x00,0x00],
  '<': [0x08,0x14,0x22,0x41,0x00],
  '=': [0x14,0x14,0x14,0x14,0x14],
  '>': [0x00,0x41,0x22,0x14,0x08],
  '?': [0x02,0x01,0x51,0x09,0x06],
  '@': [0x32,0x49,0x79,0x41,0x3E],
  'A': [0x7E,0x11,0x11,0x11,0x7E],
  'B': [0x7F,0x49,0x49,0x49,0x36],
  'C': [0x3E,0x41,0x41,0x41,0x22],
  'D': [0x7F,0x41,0x41,0x22,0x1C],
  'E': [0x7F,0x49,0x49,0x49,0x41],
  'F': [0x7F,0x09,0x09,0x09,0x01],
  'G': [0x3E,0x41,0x49,0x49,0x7A],
  'H': [0x7F,0x08,0x08,0x08,0x7F],
  'I': [0x00,0x41,0x7F,0x41,0x00],
  'J': [0x20,0x40,0x41,0x3F,0x01],
  'K': [0x7F,0x08,0x14,0x22,0x41],
  'L': [0x7F,0x40,0x40,0x40,0x40],
  'M': [0x7F,0x02,0x0C,0x02,0x7F],
  'N': [0x7F,0x04,0x08,0x10,0x7F],
  'O': [0x3E,0x41,0x41,0x41,0x3E],
  'P': [0x7F,0x09,0x09,0x09,0x06],
  'Q': [0x3E,0x41,0x51,0x21,0x5E],
  'R': [0x7F,0x09,0x19,0x29,0x46],
  'S': [0x46,0x49,0x49,0x49,0x31],
  'T': [0x01,0x01,0x7F,0x01,0x01],
  'U': [0x3F,0x40,0x40,0x40,0x3F],
  'V': [0x1F,0x20,0x40,0x20,0x1F],
  'W': [0x3F,0x40,0x38,0x40,0x3F],
  'X': [0x63,0x14,0x08,0x14,0x63],
  'Y': [0x07,0x08,0x70,0x08,0x07],
  'Z': [0x61,0x51,0x49,0x45,0x43],
  '[': [0x00,0x7F,0x41,0x41,0x00],
  '\\': [0x02,0x04,0x08,0x10,0x20],
  ']': [0x00,0x41,0x41,0x7F,0x00],
  '^': [0x04,0x02,0x01,0x02,0x04],
  '_': [0x40,0x40,0x40,0x40,0x40],
  '`': [0x00,0x01,0x02,0x04,0x00],
  'a': [0x20,0x54,0x54,0x54,0x78],
  'b': [0x7F,0x48,0x44,0x44,0x38],
  'c': [0x38,0x44,0x44,0x44,0x20],
  'd': [0x38,0x44,0x44,0x48,0x7F],
  'e': [0x38,0x54,0x54,0x54,0x18],
  'f': [0x08,0x7E,0x09,0x01,0x02],
  'g': [0x0C,0x52,0x52,0x52,0x3E],
  'h': [0x7F,0x08,0x04,0x04,0x78],
  'i': [0x00,0x44,0x7D,0x40,0x00],
  'j': [0x20,0x40,0x44,0x3D,0x00],
  'k': [0x7F,0x10,0x28,0x44,0x00],
  'l': [0x00,0x41,0x7F,0x40,0x00],
  'm': [0x7C,0x04,0x18,0x04,0x78],
  'n': [0x7C,0x08,0x04,0x04,0x78],
  'o': [0x38,0x44,0x44,0x44,0x38],
  'p': [0x7C,0x14,0x14,0x14,0x08],
  'q': [0x08,0x14,0x14,0x18,0x7C],
  'r': [0x7C,0x08,0x04,0x04,0x08],
  's': [0x48,0x54,0x54,0x54,0x20],
  't': [0x04,0x3F,0x44,0x40,0x20],
  'u': [0x3C,0x40,0x40,0x20,0x7C],
  'v': [0x1C,0x20,0x40,0x20,0x1C],
  'w': [0x3C,0x40,0x30,0x40,0x3C],
  'x': [0x44,0x28,0x10,0x28,0x44],
  'y': [0x0C,0x50,0x50,0x50,0x3C],
  'z': [0x44,0x64,0x54,0x4C,0x44],
};

function getTextBounds(text, startX, startY, size = 1, align = 'left') {
  const totalW = text.length > 0 ? (text.length * 6 - 1) * size : 0;
  const totalH = 7 * size;
  let adjustedX = startX;
  if (align === 'center') {
    adjustedX = Math.round(startX - totalW / 2);
  } else if (align === 'right') {
    adjustedX = startX - totalW;
  }
  return { x: adjustedX, y: startY, w: totalW, h: totalH, origX: startX, origY: startY };
}

function drawText(text, startX, startY, size, value, align = 'left') {
  const bounds = getTextBounds(text, startX, startY, size, align);
  let curX = bounds.x;
  for (const char of text) {
    const glyph = FONT_5x7[char] || FONT_5x7[' '];
    for (let col = 0; col < 5; col++) {
      const colData = glyph[col];
      for (let row = 0; row < 7; row++) {
        if (colData & (1 << row)) {
          for (let sy = 0; sy < size; sy++) {
            for (let sx = 0; sx < size; sx++) {
              setPixel(curX + col * size + sx, startY + row * size + sy, value);
            }
          }
        }
      }
    }
    curX += (5 + 1) * size; // 5 ancho + 1 espacio
  }
  return bounds;
}

// ============================================================
// IMPORTACIÓN DE IMAGEN → 1-BIT
// ============================================================

function importImageToBitmap(imageFile, x = 0, y = 0) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      let origW = img.width;
      let origH = img.height;

      // Si es más grande que la pantalla OLED, ajustar inicialmente manteniendo proporción
      if (origW > State.width || origH > State.height) {
        const ratio = Math.min(State.width / origW, State.height / origH);
        origW = Math.max(8, Math.round(origW * ratio));
        origH = Math.max(8, Math.round(origH * ratio));
      }

      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = origW;
      tmpCanvas.height = origH;
      const tmpCtx = tmpCanvas.getContext('2d');
      tmpCtx.drawImage(img, 0, 0, origW, origH);

      const imageData = tmpCtx.getImageData(0, 0, origW, origH);
      const pixels = imageData.data;
      const threshold = getOtsuThreshold(pixels);

      const origBitmap = new Uint8Array(origW * origH);
      for (let py = 0; py < origH; py++) {
        for (let px = 0; px < origW; px++) {
          const idx = (py * origW + px) * 4;
          const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          origBitmap[py * origW + px] = lum > threshold ? 1 : 0;
        }
      }

      const startX = Math.max(0, Math.round((State.width - origW) / 2));
      const startY = Math.max(0, Math.round((State.height - origH) / 2));

      initTransformObject({
        type: 'image',
        x: startX,
        y: startY,
        w: origW,
        h: origH,
        origW: origW,
        origH: origH,
        origBitmap: origBitmap,
        value: 1,
        lockAspectRatio: false
      });

      showToast('Imagen cargada: arrastra los tiradores para estirarla o encogerla (Enter para fijar)', 'info');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(imageFile);
}

// Calcular umbral óptimo con algoritmo de Otsu
function getOtsuThreshold(pixels) {
  const histogram = new Array(256).fill(0);
  const total = pixels.length / 4;

  for (let i = 0; i < pixels.length; i += 4) {
    const lum = Math.round(0.299 * pixels[i] + 0.587 * pixels[i+1] + 0.114 * pixels[i+2]);
    histogram[lum]++;
  }

  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumB = 0, wB = 0, wF = 0;
  let maxVar = 0, threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (!wB) continue;
    wF = total - wB;
    if (!wF) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) ** 2;

    if (variance > maxVar) {
      maxVar = variance;
      threshold = t;
    }
  }

  return threshold;
}

// ============================================================
// CANVAS EVENTS — Mouse
// ============================================================

function bindCanvasEvents() {
  mainCanvas.addEventListener('mousedown', onMouseDown);
  mainCanvas.addEventListener('mousemove', onMouseMove);
  mainCanvas.addEventListener('mouseup',   onMouseUp);
  mainCanvas.addEventListener('mouseleave', onMouseLeave);
  mainCanvas.addEventListener('dblclick',  onCanvasDoubleClick);
  mainCanvas.addEventListener('wheel',     onWheel, { passive: false });
  mainCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Drag de imagen
  mainCanvas.addEventListener('dragover', (e) => e.preventDefault());
  mainCanvas.addEventListener('drop', onDrop);

  // Paste desde portapapeles
  document.addEventListener('paste', onPaste);
}

function onMouseDown(e) {
  // 1. Interacción con transformación activa (tiradores para estirar / encoger o mover)
  if (State.transformObject) {
    const hit = hitTestTransform(e.clientX, e.clientY);
    if (hit.handle) {
      State.transformDrag = {
        handle: hit.handle,
        startClientX: e.clientX,
        startClientY: e.clientY,
        origX: State.transformObject.x,
        origY: State.transformObject.y,
        origW: State.transformObject.w,
        origH: State.transformObject.h,
        origX0: State.transformObject.x0 !== undefined ? State.transformObject.x0 : State.transformObject.x,
        origY0: State.transformObject.y0 !== undefined ? State.transformObject.y0 : State.transformObject.y,
        origX1: State.transformObject.x1 !== undefined ? State.transformObject.x1 : State.transformObject.x + State.transformObject.w,
        origY1: State.transformObject.y1 !== undefined ? State.transformObject.y1 : State.transformObject.y + State.transformObject.h,
        aspectRatio: State.transformObject.w / Math.max(1, State.transformObject.h)
      };
      State.isDrawing = false;
      return;
    } else {
      // Clic fuera de los tiradores: si hace clic sobre otra figura existente, seleccionarla
      const { x: clickPixelX, y: clickPixelY } = screenToPixel(e.clientX, e.clientY);
      const otherElement = findObjectAt(clickPixelX, clickPixelY);
      applyTransformObject();
      if (otherElement) {
        selectElement(otherElement);
        State.transformDrag = {
          handle: 'move',
          startClientX: e.clientX,
          startClientY: e.clientY,
          origX: otherElement.x,
          origY: otherElement.y,
          origW: otherElement.w,
          origH: otherElement.h,
          origX0: otherElement.x0 !== undefined ? otherElement.x0 : otherElement.x,
          origY0: otherElement.y0 !== undefined ? otherElement.y0 : otherElement.y,
          origX1: otherElement.x1 !== undefined ? otherElement.x1 : otherElement.x + otherElement.w,
          origY1: otherElement.y1 !== undefined ? otherElement.y1 : otherElement.y + otherElement.h,
          aspectRatio: otherElement.w / Math.max(1, otherElement.h)
        };
        State.isDrawing = false;
        return;
      }
    }
  }

  const { x, y } = screenToPixel(e.clientX, e.clientY);
  if (!pixelInBounds(x, y) && State.tool !== 'line' && State.tool !== 'rect' && State.tool !== 'circle' && State.tool !== 'filled-rect' && State.tool !== 'filled-circle') return;

  // 2. Re-seleccionar figura existente si se hace clic sobre ella con botón izquierdo
  // (Con herramienta 'select' o cuando no estamos usando lápiz, borrador o relleno)
  if (e.button === 0 && (State.tool === 'select' || !['pencil', 'eraser', 'fill'].includes(State.tool))) {
    const clickedElement = findObjectAt(x, y);
    if (clickedElement) {
      selectElement(clickedElement);
      // Iniciar arrastre de inmediato si el usuario mantiene pulsado
      State.transformDrag = {
        handle: 'move',
        startClientX: e.clientX,
        startClientY: e.clientY,
        origX: clickedElement.x,
        origY: clickedElement.y,
        origW: clickedElement.w,
        origH: clickedElement.h,
        origX0: clickedElement.x0 !== undefined ? clickedElement.x0 : clickedElement.x,
        origY0: clickedElement.y0 !== undefined ? clickedElement.y0 : clickedElement.y,
        origX1: clickedElement.x1 !== undefined ? clickedElement.x1 : clickedElement.x + clickedElement.w,
        origY1: clickedElement.y1 !== undefined ? clickedElement.y1 : clickedElement.y + clickedElement.h,
        aspectRatio: clickedElement.w / Math.max(1, clickedElement.h)
      };
      State.isDrawing = false;
      return;
    }
  }

  // Si la herramienta es texto o selección, revisar si se hizo clic en una capa de texto para arrastrar
  if (State.tool === 'text' || State.tool === 'select') {
    const clickedLayer = findTextLayerAt(x, y);
    if (clickedLayer) {
      selectTextLayer(clickedLayer.id);
      State.isDraggingText = true;
      State.dragTextOffsetX = x - clickedLayer.x;
      State.dragTextOffsetY = y - clickedLayer.y;
      State.isDrawing = false;
      renderCanvas();
      renderOverlay(x, y);
      return;
    } else if (State.tool === 'text' && e.button === 0) {
      // Clic en zona vacía con herramienta texto -> crear capa
      addNewTextLayer(x, y, State.textContent || 'Hola OLED');
      State.isDrawing = false;
      return;
    }
  }

  State.isDrawing = true;
  State.startX = x;
  State.startY = y;
  State.lastX = x;
  State.lastY = y;
  State.snapshotBeforeDraw = State.bitmap.slice();

  if (e.button === 2) {
    // Botón derecho → borrar píxeles directamente
    State.isRightClick = true;
    plotBrush(x, y, 0);
    renderCanvas();
    renderPreview();
    return;
  }

  applyToolAt(x, y, e);
  renderCanvas();
  renderPreview();
}

function onMouseMove(e) {
  // 1. Arrastre activo de tirador (estirar / encoger) o desplazamiento
  if (State.transformDrag && State.transformObject) {
    const drag = State.transformDrag;
    const obj = State.transformObject;
    const dx = (e.clientX - drag.startClientX) / State.zoom;
    const dy = (e.clientY - drag.startClientY) / State.zoom;

    if (drag.handle === 'move') {
      obj.x = Math.round(drag.origX + dx);
      obj.y = Math.round(drag.origY + dy);
      if (obj.shapeType === 'line') {
        obj.x0 = Math.round(drag.origX0 + dx);
        obj.y0 = Math.round(drag.origY0 + dy);
        obj.x1 = Math.round(drag.origX1 + dx);
        obj.y1 = Math.round(drag.origY1 + dy);
      }
    } else {
      let left = drag.origX;
      let right = drag.origX + drag.origW;
      let top = drag.origY;
      let bottom = drag.origY + drag.origH;

      if (drag.handle.includes('e')) right = drag.origX + drag.origW + dx;
      if (drag.handle.includes('w')) left = drag.origX + dx;
      if (drag.handle.includes('s')) bottom = drag.origY + drag.origH + dy;
      if (drag.handle.includes('n')) top = drag.origY + dy;

      let newW = Math.max(1, Math.abs(right - left));
      let newH = Math.max(1, Math.abs(bottom - top));

      // Mantener proporción si está bloqueado o con tecla Shift
      if (obj.lockAspectRatio || e.shiftKey) {
        if (drag.handle === 'e' || drag.handle === 'w') {
          newH = Math.max(1, Math.round(newW / drag.aspectRatio));
        } else if (drag.handle === 'n' || drag.handle === 's') {
          newW = Math.max(1, Math.round(newH * drag.aspectRatio));
        } else {
          const scaledH = Math.round(newW / drag.aspectRatio);
          if (Math.abs(scaledH - drag.origH) > Math.abs(newH - drag.origH)) {
            newH = Math.max(1, scaledH);
          } else {
            newW = Math.max(1, Math.round(newH * drag.aspectRatio));
          }
        }
      }

      let newX = Math.min(left, right);
      let newY = Math.min(top, bottom);
      if (drag.handle.includes('w')) newX = right - newW;
      if (drag.handle.includes('n')) newY = bottom - newH;

      obj.x = Math.round(newX);
      obj.y = Math.round(newY);
      obj.w = Math.round(newW);
      obj.h = Math.round(newH);

      if (obj.shapeType === 'line') {
        const dirX = (drag.origX1 >= drag.origX0) ? 1 : -1;
        const dirY = (drag.origY1 >= drag.origY0) ? 1 : -1;
        obj.x0 = (dirX >= 0) ? obj.x : obj.x + obj.w;
        obj.x1 = (dirX >= 0) ? obj.x + obj.w : obj.x;
        obj.y0 = (dirY >= 0) ? obj.y : obj.y + obj.h;
        obj.y1 = (dirY >= 0) ? obj.y + obj.h : obj.y;
      }
    }

    renderOverlay();
    updateTransformHUD();
    return;
  }

  // 2. Si hay figura activa, actualizar cursor al sobrevolar tiradores
  if (State.transformObject) {
    const hit = hitTestTransform(e.clientX, e.clientY);
    mainCanvas.style.cursor = hit.cursor || 'crosshair';
  } else {
    const { x: px, y: py } = screenToPixel(e.clientX, e.clientY);
    const hoveredObj = findObjectAt(px, py);
    if (hoveredObj && (State.tool === 'select' || !['pencil', 'eraser', 'fill'].includes(State.tool))) {
      mainCanvas.style.cursor = 'pointer';
    } else {
      mainCanvas.style.cursor = (State.tool === 'pencil' || State.tool === 'eraser') ? 'crosshair' : 'default';
    }
  }

  const { x, y } = screenToPixel(e.clientX, e.clientY);

  // Actualizar statusbar
  document.getElementById('cursor-pos').textContent =
    pixelInBounds(x, y) ? `X: ${x}  Y: ${y}` : 'X: —  Y: —';

  // Cursor del overlay
  renderOverlay(x, y);

  // Si estamos arrastrando una capa de texto editable
  if (State.isDraggingText && State.selectedTextId) {
    const layer = State.textElements.find(l => l.id === State.selectedTextId);
    if (layer) {
      layer.x = Math.max(0, Math.min(State.width - 5, x - State.dragTextOffsetX));
      layer.y = Math.max(0, Math.min(State.height - 5, y - State.dragTextOffsetY));
      renderCanvas();
      renderPreview();
      renderOverlay(x, y);
    }
    return;
  }

  if (!State.isDrawing) return;

  if (State.tool === 'pencil' || State.tool === 'eraser' || State.isRightClick) {
    // Interpolación para no perder píxeles
    const eraseMode = (State.tool === 'eraser' || State.isRightClick);
    drawLine(State.lastX, State.lastY, x, y, eraseMode ? 0 : State.pixelValue);
    State.lastX = x;
    State.lastY = y;
    renderCanvas();
    renderPreview();
  } else if (State.tool === 'line' || State.tool === 'rect' || State.tool === 'filled-rect' ||
             State.tool === 'circle' || State.tool === 'filled-circle') {
    // Restaurar snapshot y redibujar preview de la forma
    State.bitmap.set(State.snapshotBeforeDraw);
    applyShapePreview(x, y);
    renderCanvas();
  } else if (State.tool === 'select') {
    // Dibujar rectángulo de selección temporal
    const minX = Math.min(State.startX, x);
    const minY = Math.min(State.startY, y);
    const w = Math.abs(x - State.startX);
    const h = Math.abs(y - State.startY);
    const z = State.zoom;
    octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    octx.save();
    octx.strokeStyle = '#00d4aa';
    octx.lineWidth = 1.5;
    octx.setLineDash([4, 2]);
    octx.strokeRect(minX * z, minY * z, w * z, h * z);
    octx.restore();
  }
}

function onMouseUp(e) {
  if (State.transformDrag) {
    State.transformDrag = null;
    updateTransformHUD();
    renderOverlay();
    return;
  }

  if (State.isDraggingText) {
    State.isDraggingText = false;
    pushHistory();
    markDirty();
    return;
  }

  if (!State.isDrawing) return;
  const { x, y } = screenToPixel(e.clientX, e.clientY);

  // Si se dibujó una selección de área con herramienta 'select'
  if (State.tool === 'select' && !State.isRightClick) {
    const minX = Math.min(State.startX, x);
    const minY = Math.min(State.startY, y);
    const maxX = Math.max(State.startX, x);
    const maxY = Math.max(State.startY, y);
    const w = maxX - minX;
    const h = maxY - minY;

    if (w >= 2 && h >= 2) {
      pushHistory();
      const selBitmap = new Uint8Array(w * h);
      for (let sy = 0; sy < h; sy++) {
        for (let sx = 0; sx < w; sx++) {
          const px = minX + sx;
          const py = minY + sy;
          selBitmap[sy * w + sx] = State.bitmap[py * State.width + px] || 0;
          State.bitmap[py * State.width + px] = 0; // Cortar del fondo
        }
      }

      initTransformObject({
        type: 'selection',
        x: minX,
        y: minY,
        w: w,
        h: h,
        origW: w,
        origH: h,
        origBitmap: selBitmap,
        value: 1,
        lockAspectRatio: false
      });

      State.isDrawing = false;
      renderCanvas();
      renderOverlay();
      showToast('Área seleccionada: usa los tiradores para estirar o encoger (Enter para fijar)', 'info');
      return;
    }
  }

  // Si se dibujó una forma geométrica, activar caja de transformación interactiva
  if (['line','rect','filled-rect','circle','filled-circle'].includes(State.tool) && !State.isRightClick) {
    State.bitmap.set(State.snapshotBeforeDraw); // Mantener el canvas limpio
    const minX = Math.min(State.startX, x);
    const minY = Math.min(State.startY, y);
    const maxX = Math.max(State.startX, x);
    const maxY = Math.max(State.startY, y);
    let w = Math.max(1, maxX - minX);
    let h = Math.max(1, maxY - minY);

    if (State.tool === 'line') {
      initTransformObject({
        type: 'shape',
        shapeType: 'line',
        x0: State.startX,
        y0: State.startY,
        x1: x,
        y1: y,
        x: minX,
        y: minY,
        w: w,
        h: h,
        value: State.pixelValue !== undefined ? State.pixelValue : 1,
        lockAspectRatio: false
      });
    } else {
      if (w <= 1 && h <= 1) {
        w = 16;
        h = 16;
      }
      initTransformObject({
        type: 'shape',
        shapeType: State.tool,
        x: minX,
        y: minY,
        w: w,
        h: h,
        value: State.pixelValue !== undefined ? State.pixelValue : 1,
        lockAspectRatio: false
      });
    }

    State.isDrawing = false;
    renderCanvas();
    renderOverlay();
    return;
  }

  State.isDrawing = false;
  State.isRightClick = false;
  if (['pencil', 'eraser', 'fill'].includes(State.tool)) {
    if (!State.baseBitmap || State.baseBitmap.length !== State.bitmap.length) {
      State.baseBitmap = new Uint8Array(State.bitmap.length);
    }
    State.baseBitmap.set(State.bitmap);
  }
  pushHistory();
  markDirty();
}

function onMouseLeave() {
  octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  if (State.isDrawing) {
    State.isDrawing = false;
    pushHistory();
    markDirty();
  }
}

function onWheel(e) {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 1 : -1;
  changeZoom(delta);
}

function onDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    importImageToBitmap(file);
  }
}

function onPaste(e) {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      importImageToBitmap(file);
      break;
    }
  }
}

// ============================================================
// APLICAR HERRAMIENTA
// ============================================================

function applyToolAt(x, y, e) {
  const val = State.pixelValue;

  switch (State.tool) {
    case 'pencil':
      plotBrush(x, y, val);
      break;
    case 'eraser':
      plotBrush(x, y, 0);
      break;
    case 'fill':
      pushHistory();
      floodFill(x, y, val);
      pushHistory();
      break;
    case 'text':
      showFloatingTextInput(x, y);
      break;
    case 'eyedropper':
      State.pixelValue = getPixel(x, y);
      updateColorButtons();
      break;
    case 'line':
      drawLineDirect(State.bitmap, State.startX, State.startY, x, y, val);
      break;
    case 'rect':
      drawRect(State.startX, State.startY, x, y, val, false);
      break;
    case 'filled-rect':
      drawRect(State.startX, State.startY, x, y, val, true);
      break;
    case 'circle': {
      const r = Math.round(Math.hypot(x - State.startX, y - State.startY));
      drawCircle(State.startX, State.startY, r, val, false);
      break;
    }
    case 'filled-circle': {
      const r = Math.round(Math.hypot(x - State.startX, y - State.startY));
      drawCircle(State.startX, State.startY, r, val, true);
      break;
    }
    case 'widget':
      if (State.activeWidget) {
        stampWidgetAt(x, y, State.activeWidget);
      } else {
        openWidgetsModal();
      }
      break;
  }
}

function applyShapePreview(x, y) {
  const val = State.pixelValue !== undefined ? State.pixelValue : 1;
  switch (State.tool) {
    case 'line':
      drawLineDirect(State.bitmap, State.startX, State.startY, x, y, val);
      break;
    case 'rect':
      drawRect(State.startX, State.startY, x, y, val, false);
      break;
    case 'filled-rect':
      drawRect(State.startX, State.startY, x, y, val, true);
      break;
    case 'circle': {
      const r = Math.round(Math.hypot(x - State.startX, y - State.startY));
      drawCircle(State.startX, State.startY, r, val, false);
      break;
    }
    case 'filled-circle': {
      const r = Math.round(Math.hypot(x - State.startX, y - State.startY));
      drawCircle(State.startX, State.startY, r, val, true);
      break;
    }
  }
}

// ============================================================
// MOTOR DE TRANSFORMACIÓN INTERACTIVA (ESTIRAR / ENCOGER CON RATÓN)
// ============================================================

function initTransformObject(obj) {
  if (obj.shapeType === 'line') {
    obj.x0 = Math.round(obj.x0 !== undefined ? obj.x0 : obj.x);
    obj.y0 = Math.round(obj.y0 !== undefined ? obj.y0 : obj.y);
    obj.x1 = Math.round(obj.x1 !== undefined ? obj.x1 : obj.x + obj.w);
    obj.y1 = Math.round(obj.y1 !== undefined ? obj.y1 : obj.y + obj.h);
    obj.x = Math.min(obj.x0, obj.x1);
    obj.y = Math.min(obj.y0, obj.y1);
    obj.w = Math.max(1, Math.abs(obj.x1 - obj.x0));
    obj.h = Math.max(1, Math.abs(obj.y1 - obj.y0));
  } else {
    obj.w = Math.max(2, Math.round(obj.w !== undefined ? obj.w : 16));
    obj.h = Math.max(2, Math.round(obj.h !== undefined ? obj.h : 16));
    obj.x = Math.round(obj.x);
    obj.y = Math.round(obj.y);
  }
  obj.origW = obj.origW !== undefined ? obj.origW : obj.w;
  obj.origH = obj.origH !== undefined ? obj.origH : obj.h;
  obj.lockAspectRatio = !!obj.lockAspectRatio;

  State.transformObject = obj;
  State.transformDrag = null;

  updateTransformHUD();
  renderOverlay();
}

function getTransformHandles(obj) {
  const x = obj.x;
  const y = obj.y;
  const w = obj.w;
  const h = obj.h;
  const hw = w / 2;
  const hh = h / 2;

  return [
    { id: 'nw', x: x,        y: y,        cursor: 'nwse-resize' },
    { id: 'n',  x: x + hw,   y: y,        cursor: 'ns-resize'   },
    { id: 'ne', x: x + w,    y: y,        cursor: 'nesw-resize' },
    { id: 'e',  x: x + w,    y: y + hh,   cursor: 'ew-resize'   },
    { id: 'se', x: x + w,    y: y + h,    cursor: 'nwse-resize' },
    { id: 's',  x: x + hw,   y: y + h,    cursor: 'ns-resize'   },
    { id: 'sw', x: x,        y: y + h,    cursor: 'nesw-resize' },
    { id: 'w',  x: x,        y: y + hh,   cursor: 'ew-resize'   }
  ];
}

function hitTestTransform(clientX, clientY) {
  if (!State.transformObject) return { handle: null, cursor: null };
  const obj = State.transformObject;
  const z = State.zoom;
  const rect = overlayCanvas.getBoundingClientRect();
  const mouseScreenX = clientX - rect.left;
  const mouseScreenY = clientY - rect.top;

  const hitRadius = Math.max(8, Math.min(14, z * 1.2));

  // 1. Revisar los 8 tiradores
  const handles = getTransformHandles(obj);
  for (const h of handles) {
    const handleScreenX = h.x * z;
    const handleScreenY = h.y * z;
    const dist = Math.hypot(mouseScreenX - handleScreenX, mouseScreenY - handleScreenY);
    if (dist <= hitRadius) {
      return { handle: h.id, cursor: h.cursor };
    }
  }

  // 2. Revisar si está dentro de la caja para mover (con tolerancia de 3px para líneas finas)
  const { x: oledX, y: oledY } = screenToPixel(clientX, clientY);
  const pad = (obj.shapeType === 'line' || obj.w <= 2 || obj.h <= 2) ? 3 : 1;
  if (oledX >= obj.x - pad && oledX <= obj.x + obj.w + pad && oledY >= obj.y - pad && oledY <= obj.y + obj.h + pad) {
    return { handle: 'move', cursor: 'move' };
  }

  return { handle: null, cursor: null };
}

function updateTransformHUD() {
  const hud = document.getElementById('transform-hud');
  if (!hud) return;

  if (!State.transformObject) {
    hud.classList.add('hidden');
    return;
  }

  const obj = State.transformObject;
  const z = State.zoom;
  const wrapper = document.getElementById('canvas-wrapper');
  if (!wrapper) return;

  const rect = overlayCanvas.getBoundingClientRect();
  const wrapRect = wrapper.getBoundingClientRect();

  const screenLeft = (rect.left - wrapRect.left) + obj.x * z;
  const screenTop  = (rect.top - wrapRect.top)  + obj.y * z;
  const screenW    = obj.w * z;
  const screenH    = obj.h * z;

  const dimEl = document.getElementById('transform-dim');
  if (dimEl) {
    dimEl.textContent = `${Math.round(obj.w)} × ${Math.round(obj.h)} px`;
  }

  const ratioBtn = document.getElementById('btn-transform-ratio');
  if (ratioBtn) {
    ratioBtn.classList.toggle('active', !!obj.lockAspectRatio);
    ratioBtn.title = obj.lockAspectRatio ? 'Proporción bloqueada (clic para desbloquear)' : 'Proporción libre (clic para bloquear)';
  }

  hud.classList.remove('hidden');
  const hudW = hud.offsetWidth || 180;
  const hudH = hud.offsetHeight || 30;

  let targetX = screenLeft + (screenW / 2) - (hudW / 2);
  let targetY = screenTop - hudH - 10;

  if (targetY < 8) {
    targetY = screenTop + screenH + 10;
  }

  targetX = Math.max(10, Math.min(wrapper.clientWidth - hudW - 10, targetX));
  targetY = Math.max(10, Math.min(wrapper.clientHeight - hudH - 10, targetY));

  hud.style.left = `${Math.round(targetX)}px`;
  hud.style.top  = `${Math.round(targetY)}px`;
}

function drawTransformPreview(targetCtx) {
  if (!State.transformObject) return;
  const obj = State.transformObject;
  const z = State.zoom;
  const colors = DISPLAY_COLORS[State.displayColor] || DISPLAY_COLORS.white;

  const curX = Math.round(obj.x);
  const curY = Math.round(obj.y);
  const curW = Math.max(1, Math.round(obj.w));
  const curH = Math.max(1, Math.round(obj.h));

  targetCtx.save();

  // 1. Dibujar contenido escalado (vectorial o bitmap con Nearest-Neighbor)
  if (obj.type === 'shape') {
    targetCtx.fillStyle = colors.pixel;
    targetCtx.strokeStyle = colors.pixel;

    if (obj.shapeType === 'rect') {
      for (let dx = 0; dx < curW; dx++) {
        targetCtx.fillRect((curX + dx) * z, curY * z, z, z);
        targetCtx.fillRect((curX + dx) * z, (curY + curH - 1) * z, z, z);
      }
      for (let dy = 0; dy < curH; dy++) {
        targetCtx.fillRect(curX * z, (curY + dy) * z, z, z);
        targetCtx.fillRect((curX + curW - 1) * z, (curY + dy) * z, z, z);
      }
    } else if (obj.shapeType === 'filled-rect') {
      targetCtx.fillRect(curX * z, curY * z, curW * z, curH * z);
    } else if (obj.shapeType === 'circle') {
      const rx = curW / 2;
      const ry = curH / 2;
      targetCtx.lineWidth = Math.max(1, z);
      targetCtx.beginPath();
      targetCtx.ellipse((curX + rx) * z, (curY + ry) * z, Math.max(1, rx * z), Math.max(1, ry * z), 0, 0, Math.PI * 2);
      targetCtx.stroke();
    } else if (obj.shapeType === 'filled-circle') {
      const rx = curW / 2;
      const ry = curH / 2;
      targetCtx.beginPath();
      targetCtx.ellipse((curX + rx) * z, (curY + ry) * z, Math.max(1, rx * z), Math.max(1, ry * z), 0, 0, Math.PI * 2);
      targetCtx.fill();
    } else if (obj.shapeType === 'line') {
      const x0 = obj.x0 !== undefined ? obj.x0 : curX;
      const y0 = obj.y0 !== undefined ? obj.y0 : curY;
      const x1 = obj.x1 !== undefined ? obj.x1 : curX + curW;
      const y1 = obj.y1 !== undefined ? obj.y1 : curY + curH;
      const pts = getBresenhamLinePoints(x0, y0, x1, y1);
      targetCtx.fillStyle = colors.pixel;
      for (const [px, py] of pts) {
        targetCtx.fillRect(px * z, py * z, z, z);
      }
    }
  } else if (obj.origBitmap) {
    // Nearest-Neighbor para OLED 1-bit nítido y preciso
    targetCtx.fillStyle = colors.pixel;
    for (let dy = 0; dy < curH; dy++) {
      const sy = Math.floor((dy / curH) * obj.origH);
      for (let dx = 0; dx < curW; dx++) {
        const sx = Math.floor((dx / curW) * obj.origW);
        if (obj.origBitmap[sy * obj.origW + sx]) {
          targetCtx.fillRect((curX + dx) * z, (curY + dy) * z, z, z);
        }
      }
    }
  }

  // 2. Caja delimitadora con línea discontinua índigo
  const bx = curX * z;
  const by = curY * z;
  const bw = curW * z;
  const bh = curH * z;

  targetCtx.strokeStyle = '#6366f1';
  targetCtx.lineWidth = 1.5;
  targetCtx.setLineDash([5, 3]);
  targetCtx.strokeRect(bx, by, bw, bh);
  targetCtx.setLineDash([]);

  // 3. Los 8 Tiradores interactivos
  const handles = getTransformHandles(obj);
  const hr = Math.max(3.5, Math.min(5.5, z * 0.55));

  for (const h of handles) {
    const hx = h.x * z;
    const hy = h.y * z;

    targetCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    targetCtx.fillRect(hx - hr + 1, hy - hr + 1, hr * 2, hr * 2);

    targetCtx.fillStyle = '#ffffff';
    targetCtx.fillRect(hx - hr, hy - hr, hr * 2, hr * 2);
    targetCtx.strokeStyle = '#4f46e5';
    targetCtx.lineWidth = 1.5;
    targetCtx.strokeRect(hx - hr, hy - hr, hr * 2, hr * 2);
  }

  targetCtx.restore();
}

function applyTransformObject() {
  if (!State.transformObject) return;
  const obj = State.transformObject;
  pushHistory();

  obj.x = Math.round(obj.x);
  obj.y = Math.round(obj.y);
  obj.w = Math.max(1, Math.round(obj.w));
  obj.h = Math.max(1, Math.round(obj.h));

  if (!obj.id) {
    obj.id = 'elem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  // Guardar en State.elements para que pueda volver a seleccionarse
  if (!State.elements) State.elements = [];
  const cleanObj = { ...obj };
  delete cleanObj._originalState;

  if (obj.shapeType === 'line') {
    cleanObj.x0 = Math.round(obj.x0 !== undefined ? obj.x0 : obj.x);
    cleanObj.y0 = Math.round(obj.y0 !== undefined ? obj.y0 : obj.y);
    cleanObj.x1 = Math.round(obj.x1 !== undefined ? obj.x1 : obj.x + obj.w);
    cleanObj.y1 = Math.round(obj.y1 !== undefined ? obj.y1 : obj.y + obj.h);
  }

  const existingIdx = State.elements.findIndex(e => e.id === obj.id);
  if (existingIdx >= 0) {
    State.elements[existingIdx] = cleanObj;
  } else {
    State.elements.push(cleanObj);
  }

  State.transformObject = null;
  State.transformDrag = null;
  document.getElementById('transform-hud')?.classList.add('hidden');
  mainCanvas.style.cursor = (State.tool === 'select') ? 'default' : 'crosshair';

  rebuildCanvasBitmap();
  octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  showToast('Figura fijada ✓ (puedes volver a seleccionarla con un clic)', 'success');
}

function deleteTransformObject() {
  if (!State.transformObject) return;
  const obj = State.transformObject;
  pushHistory();

  if (obj.id && State.elements) {
    State.elements = State.elements.filter(e => e.id !== obj.id);
  }

  State.transformObject = null;
  State.transformDrag = null;
  document.getElementById('transform-hud')?.classList.add('hidden');
  mainCanvas.style.cursor = (State.tool === 'select') ? 'default' : 'crosshair';

  rebuildCanvasBitmap();
  octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  showToast('Figura eliminada del espacio de trabajo 🗑', 'info');
}

function cancelTransformObject() {
  if (!State.transformObject) return;
  const obj = State.transformObject;

  // Si venía de una figura ya colocada en State.elements, restaurarla intacta
  if (obj._originalState) {
    if (!State.elements) State.elements = [];
    State.elements.push(obj._originalState);
  } else if (obj.type === 'selection' && obj.origBitmap) {
    // Si era un corte de selección libre, restaurar píxeles originales
    for (let sy = 0; sy < obj.origH; sy++) {
      for (let sx = 0; sx < obj.origW; sx++) {
        const px = Math.round(obj.x) + sx;
        const py = Math.round(obj.y) + sy;
        if (px >= 0 && px < State.width && py >= 0 && py < State.height) {
          State.bitmap[py * State.width + px] = obj.origBitmap[sy * obj.origW + sx];
        }
      }
    }
  }

  State.transformObject = null;
  State.transformDrag = null;
  document.getElementById('transform-hud')?.classList.add('hidden');
  mainCanvas.style.cursor = (State.tool === 'select') ? 'default' : 'crosshair';

  rebuildCanvasBitmap();
  octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
}

function findObjectAt(px, py) {
  if (!State.elements || State.elements.length === 0) return null;

  // Buscar desde la figura superior a la inferior
  for (let i = State.elements.length - 1; i >= 0; i--) {
    const el = State.elements[i];
    const curX = el.x;
    const curY = el.y;
    const curW = el.w;
    const curH = el.h;

    if (el.type === 'shape') {
      if (el.shapeType === 'line') {
        const x0 = el.x0 !== undefined ? el.x0 : curX;
        const y0 = el.y0 !== undefined ? el.y0 : curY;
        const x1 = el.x1 !== undefined ? el.x1 : curX + curW;
        const y1 = el.y1 !== undefined ? el.y1 : curY + curH;
        const l2 = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);
        let dist;
        if (l2 === 0) {
          dist = Math.hypot(px - x0, py - y0);
        } else {
          let t = ((px - x0) * (x1 - x0) + (py - y0) * (y1 - y0)) / l2;
          t = Math.max(0, Math.min(1, t));
          dist = Math.hypot(px - (x0 + t * (x1 - x0)), py - (y0 + t * (y1 - y0)));
        }
        if (dist <= 4) return el;
      } else if (el.shapeType === 'circle' || el.shapeType === 'filled-circle') {
        const rx = Math.max(1, curW / 2);
        const ry = Math.max(1, curH / 2);
        const cx = curX + rx;
        const cy = curY + ry;
        const normDist = ((px - cx) * (px - cx)) / (rx * rx) + ((py - cy) * (py - cy)) / (ry * ry);
        if (normDist <= 1.35) return el;
      } else {
        // rect, filled-rect (con margen de 2px)
        if (px >= curX - 2 && px <= curX + curW + 2 && py >= curY - 2 && py <= curY + curH + 2) {
          return el;
        }
      }
    } else {
      // widget, image, selection (con margen de 2px)
      if (px >= curX - 2 && px <= curX + curW + 2 && py >= curY - 2 && py <= curY + curH + 2) {
        return el;
      }
    }
  }

  return null;
}

function selectElement(element) {
  if (State.transformObject) {
    applyTransformObject();
  }

  const originalState = JSON.parse(JSON.stringify(element));

  // Retirar temporalmente de State.elements para que no se duplique durante la manipulación
  State.elements = State.elements.filter(e => e.id !== element.id);
  rebuildCanvasBitmap();

  initTransformObject({
    ...element,
    _originalState: originalState
  });

  showToast(`Figura seleccionada: arrastra los tiradores para estirarla o encogerla`, 'info');
}

if (typeof window !== 'undefined') {
  window.initTransformObject = initTransformObject;
  window.applyTransformObject = applyTransformObject;
  window.deleteTransformObject = deleteTransformObject;
  window.cancelTransformObject = cancelTransformObject;
  window.findObjectAt = findObjectAt;
  window.selectElement = selectElement;
}

// ============================================================
// OVERLAY (cursor, guías)
// ============================================================

function renderOverlay(x, y) {
  octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  // Si hay figura activa en transformación (estirar / encoger)
  if (State.transformObject) {
    drawTransformPreview(octx);
    return;
  }

  if (x === undefined || y === undefined || !pixelInBounds(x, y)) return;

  const z = State.zoom;

  // Cursor de lápiz/borrador — destacar celda
  if (State.tool === 'pencil' || State.tool === 'eraser' || State.isRightClick) {
    const isErase = State.tool === 'eraser' || State.isRightClick;
    const s = isErase ? (State.eraserSize || 2) : (State.brushSize || 1);
    const half = Math.floor(s / 2);
    octx.strokeStyle = isErase ? '#ff4466' : '#6c63ff';
    octx.lineWidth = 1.5;
    octx.strokeRect(
      (x - half) * z + 0.5,
      (y - half) * z + 0.5,
      s * z, s * z
    );
  } else {
    // Cruz de mira
    octx.strokeStyle = 'rgba(108,99,255,0.6)';
    octx.lineWidth = 0.5;
    octx.beginPath();
    octx.moveTo(x * z, 0); octx.lineTo(x * z, overlayCanvas.height);
    octx.moveTo(0, y * z); octx.lineTo(overlayCanvas.width, y * z);
    octx.stroke();
  }

  // Resaltar capa de texto seleccionada con marco cyan y tiradores
  if (State.selectedTextId && State.textElements) {
    const selectedLayer = State.textElements.find(l => l.id === State.selectedTextId);
    if (selectedLayer) {
      const b = getTextBounds(selectedLayer.text, selectedLayer.x, selectedLayer.y, selectedLayer.size, selectedLayer.align);
      octx.save();
      octx.strokeStyle = '#00d4aa';
      octx.lineWidth = 1;
      octx.setLineDash([4, 2]);
      octx.strokeRect((b.x - 1) * z, (b.y - 1) * z, (b.w + 2) * z, (b.h + 2) * z);
      octx.setLineDash([]);

      // Puntos de esquina
      octx.fillStyle = '#00d4aa';
      octx.fillRect((b.x - 2) * z, (b.y - 2) * z, 4, 4);
      octx.fillRect((b.x + b.w - 1) * z, (b.y - 2) * z, 4, 4);
      octx.fillRect((b.x - 2) * z, (b.y + b.h - 1) * z, 4, 4);
      octx.fillRect((b.x + b.w - 1) * z, (b.y + b.h - 1) * z, 4, 4);
      octx.restore();
    }
  }

  // Previsualización de colocación de widget
  if (State.tool === 'widget' && State.activeWidget) {
    const w = State.activeWidget.width;
    const h = State.activeWidget.height;
    octx.save();
    octx.strokeStyle = '#a79eff';
    octx.lineWidth = 1.5;
    octx.setLineDash([3, 2]);
    octx.strokeRect(x * z, y * z, w * z, h * z);
    octx.fillStyle = 'rgba(108, 99, 255, 0.2)';
    octx.fillRect(x * z, y * z, w * z, h * z);
    octx.restore();
  }
}

// ============================================================
// GESTIÓN DE CAPAS DE TEXTO (Doble clic para editar)
// ============================================================

function findTextLayerAt(px, py) {
  if (!State.textElements) return null;
  for (let i = State.textElements.length - 1; i >= 0; i--) {
    const layer = State.textElements[i];
    const b = getTextBounds(layer.text, layer.x, layer.y, layer.size, layer.align);
    if (px >= b.x - 1 && px <= b.x + b.w + 1 && py >= b.y - 1 && py <= b.y + b.h + 1) {
      return layer;
    }
  }
  return null;
}

function selectTextLayer(layerId) {
  State.selectedTextId = layerId;
  const layer = State.textElements.find(l => l.id === layerId);
  if (layer) {
    // Actualizar campos del panel izquierdo
    const textInput = document.getElementById('text-content');
    if (textInput) textInput.value = layer.text;

    document.querySelectorAll('.align-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.talign === layer.align);
    });

    document.querySelectorAll('.size-btn[data-tsize]').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.tsize) === layer.size);
    });

    State.textAlign = layer.align;
    State.textSize = layer.size;
    State.textContent = layer.text;
  }
  renderCanvas();
  renderOverlay(State.lastX, State.lastY);
}

function addNewTextLayer(x, y, text = 'Hola OLED') {
  const newLayer = {
    id: Date.now(),
    text: text || 'Hola OLED',
    x: Math.max(2, Math.min(State.width - 20, x)),
    y: Math.max(2, Math.min(State.height - 10, y)),
    size: State.textSize || 1,
    align: State.textAlign || 'left',
    value: State.pixelValue !== undefined ? State.pixelValue : 1
  };
  State.textElements.push(newLayer);
  selectTextLayer(newLayer.id);
  pushHistory();
  markDirty();
  renderCanvas();
  renderPreview();
  showToast('Capa de texto creada (doble clic para editar)', 'info');
}

function rasterizeTextLayers() {
  if (!State.textElements || State.textElements.length === 0) {
    showToast('No hay capas de texto para fijar', 'info');
    return;
  }
  pushHistory();
  State.textElements.forEach(layer => {
    drawText(layer.text, layer.x, layer.y, layer.size, layer.value !== undefined ? layer.value : 1, layer.align);
  });
  const count = State.textElements.length;
  State.textElements = [];
  State.selectedTextId = null;
  markDirty();
  renderCanvas();
  renderPreview();
  showToast(`${count} capa(s) de texto fijada(s) permanentemente al canvas`, 'success');
}

function deleteSelectedTextLayer() {
  if (!State.selectedTextId) {
    showToast('Selecciona primero una capa de texto', 'info');
    return;
  }
  pushHistory();
  State.textElements = State.textElements.filter(l => l.id !== State.selectedTextId);
  State.selectedTextId = null;
  markDirty();
  renderCanvas();
  renderPreview();
  showToast('Capa de texto eliminada', 'info');
}

function onCanvasDoubleClick(e) {
  if (State.transformObject) {
    applyTransformObject();
    return;
  }

  const { x, y } = screenToPixel(e.clientX, e.clientY);
  if (!pixelInBounds(x, y)) return;

  // Doble clic sobre figura existente la selecciona de inmediato
  const clickedObj = findObjectAt(x, y);
  if (clickedObj) {
    selectElement(clickedObj);
    return;
  }

  const layer = findTextLayerAt(x, y);
  if (layer) {
    // Editar capa de texto existente directamente
    selectTextLayer(layer.id);
    showFloatingTextInput(layer.x, layer.y, layer);
  } else {
    // Crear nueva capa de texto editable
    selectTool('text');
    showFloatingTextInput(x, y, null);
  }
}

function showFloatingTextInput(pixelX, pixelY, existingLayer = null) {
  const rect = mainCanvas.getBoundingClientRect();
  const screenX = rect.left + pixelX * State.zoom;
  const screenY = rect.top + pixelY * State.zoom;

  const el = document.getElementById('floating-text-input');
  el.style.left = `${Math.max(10, Math.min(window.innerWidth - 220, screenX))}px`;
  el.style.top  = `${Math.max(40, screenY - 35)}px`;
  el.classList.remove('hidden');

  const field = document.getElementById('floating-text-field');
  field.value = existingLayer ? existingLayer.text : (State.textContent || 'Hola OLED');
  field.focus();
  field.select();

  const onConfirm = () => {
    const text = field.value.trim();
    if (text) {
      pushHistory();
      if (existingLayer) {
        existingLayer.text = text;
      } else {
        addNewTextLayer(pixelX, pixelY, text);
      }
      State.textContent = text;
      const textInput = document.getElementById('text-content');
      if (textInput) textInput.value = text;
      markDirty();
      renderCanvas();
      renderPreview();
    }
    el.classList.add('hidden');
    field.removeEventListener('keydown', onKey);
    field.removeEventListener('blur', onConfirm);
  };

  const onKey = (e) => {
    if (e.key === 'Enter') onConfirm();
    if (e.key === 'Escape') {
      el.classList.add('hidden');
      field.removeEventListener('keydown', onKey);
      field.removeEventListener('blur', onConfirm);
    }
  };

  field.addEventListener('keydown', onKey);
  field.addEventListener('blur', onConfirm);
}

// ============================================================
// OPERACIONES DE CANVAS
// ============================================================

function clearCanvas() {
  pushHistory();
  if (State.transformObject) cancelTransformObject();
  State.elements = [];
  if (State.baseBitmap) State.baseBitmap.fill(0);
  State.bitmap.fill(0);
  markDirty();
  renderCanvas();
  renderPreview();
}

function invertCanvas() {
  pushHistory();
  for (let i = 0; i < State.bitmap.length; i++) {
    State.bitmap[i] = State.bitmap[i] ? 0 : 1;
  }
  markDirty();
  renderCanvas();
  renderPreview();
}

function flipHorizontal() {
  pushHistory();
  const { width, height } = State;
  const newBitmap = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      newBitmap[y * width + (width - 1 - x)] = State.bitmap[y * width + x];
    }
  }
  State.bitmap = newBitmap;
  markDirty(); renderCanvas(); renderPreview();
}

function flipVertical() {
  pushHistory();
  const { width, height } = State;
  const newBitmap = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      newBitmap[(height - 1 - y) * width + x] = State.bitmap[y * width + x];
    }
  }
  State.bitmap = newBitmap;
  markDirty(); renderCanvas(); renderPreview();
}

function shiftCanvas(dx, dy) {
  pushHistory();
  const { width, height } = State;
  const newBitmap = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = (x - dx + width) % width;
      const ny = (y - dy + height) % height;
      newBitmap[y * width + x] = State.bitmap[ny * width + nx];
    }
  }
  State.bitmap = newBitmap;
  markDirty(); renderCanvas(); renderPreview();
}

// ============================================================
// ZOOM
// ============================================================

function changeZoom(delta) {
  const zooms = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
  const idx = zooms.indexOf(State.zoom);
  const newIdx = Math.max(0, Math.min(zooms.length - 1, idx + delta));
  State.zoom = zooms[newIdx];
  document.getElementById('zoom-display').textContent = `${State.zoom}×`;
  const zoomLabel = (window.I18N && window.I18N.t('zoom_status_label')) || 'Zoom: ';
  document.getElementById('zoom-status').textContent = `${zoomLabel}${State.zoom}×`;
  resizeCanvases();
  renderCanvas();
}

// ============================================================
// CAMBIO DE RESOLUCIÓN
// ============================================================

function applyResolution(w, h) {
  if (w === State.width && h === State.height) return;

  // Preservar datos existentes en nueva dimensión
  const oldBitmap = State.bitmap;
  const oldW = State.width;
  const oldH = State.height;

  State.width = w;
  State.height = h;
  State.bitmap = new Uint8Array(w * h);

  const copyW = Math.min(w, oldW);
  const copyH = Math.min(h, oldH);
  for (let y = 0; y < copyH; y++) {
    for (let x = 0; x < copyW; x++) {
      State.bitmap[y * w + x] = oldBitmap[y * oldW + x];
    }
  }

  pushHistory();
  resizeCanvases();
  renderCanvas();
  renderPreview();
  showToast(`Resolución cambiada a ${w}×${h}`, 'info');
}

// ============================================================
// MARK DIRTY (cambios sin guardar)
// ============================================================

function markDirty() {
  State.isDirty = true;
  document.getElementById('unsaved-indicator').classList.remove('hidden');
}

function markClean() {
  State.isDirty = false;
  document.getElementById('unsaved-indicator').classList.add('hidden');
}

// ============================================================
// UI — BIND DE CONTROLES
// ============================================================

function bindToolButtons() {
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.tool = btn.dataset.tool;
      updateToolOptions();

      if (State.tool === 'image') {
        document.getElementById('file-image-input').click();
      }
    });
  });

  // Color ON/OFF
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.pixelValue = parseInt(btn.dataset.color);
    });
  });

  // Tamaño de pincel
  document.querySelectorAll('.size-btn[data-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn[data-size]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.brushSize = parseInt(btn.dataset.size);
    });
  });

  // Tamaño de borrador
  document.querySelectorAll('.size-btn[data-esize]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn[data-esize]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.eraserSize = parseInt(btn.dataset.esize);
    });
  });

  // Tamaño de texto
  document.querySelectorAll('.size-btn[data-tsize]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn[data-tsize]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.textSize = parseInt(btn.dataset.tsize);
      if (State.selectedTextId) {
        const layer = State.textElements.find(l => l.id === State.selectedTextId);
        if (layer) layer.size = State.textSize;
        renderCanvas();
        renderPreview();
      }
      updateTextPreview();
    });
  });

  // Alineación de texto (izquierda, centro, derecha)
  document.querySelectorAll('.align-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.textAlign = btn.dataset.talign;
      if (State.selectedTextId) {
        const layer = State.textElements.find(l => l.id === State.selectedTextId);
        if (layer) layer.align = State.textAlign;
        renderCanvas();
        renderPreview();
      }
      updateTextPreview();
    });
  });

  // Acciones de capas de texto
  document.getElementById('btn-add-text-layer')?.addEventListener('click', () => {
    addNewTextLayer(Math.round(State.width / 2), Math.round(State.height / 2), State.textContent || 'Texto');
  });
  document.getElementById('btn-rasterize-text')?.addEventListener('click', rasterizeTextLayers);
  document.getElementById('btn-delete-text-layer')?.addEventListener('click', deleteSelectedTextLayer);

  // Texto input
  document.getElementById('text-content').addEventListener('input', (e) => {
    State.textContent = e.target.value;
    if (State.selectedTextId) {
      const layer = State.textElements.find(l => l.id === State.selectedTextId);
      if (layer) layer.text = State.textContent;
      renderCanvas();
      renderPreview();
    }
    updateTextPreview();
  });

  // Import imagen
  document.getElementById('file-image-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) importImageToBitmap(file);
    e.target.value = '';
  });
}

function updateToolOptions() {
  const brushOpt  = document.getElementById('opt-brush');
  const eraserOpt = document.getElementById('opt-eraser');
  const textOpt   = document.getElementById('opt-text');
  const colorOpt  = document.getElementById('opt-color');

  brushOpt.classList.toggle('hidden', State.tool === 'text' || State.tool === 'eraser');
  if (eraserOpt) eraserOpt.classList.toggle('hidden', State.tool !== 'eraser');
  textOpt.classList.toggle('hidden', State.tool !== 'text');
  if (colorOpt) colorOpt.classList.toggle('hidden', State.tool === 'eraser');

  // Sincronizar botones de la barra superior
  const tbPencil = document.getElementById('tb-pencil');
  const tbEraser = document.getElementById('tb-eraser');
  if (tbPencil) tbPencil.classList.toggle('active', State.tool === 'pencil');
  if (tbEraser) tbEraser.classList.toggle('active', State.tool === 'eraser');

  if (State.tool === 'text') updateTextPreview();
}

function updateTextPreview() {
  const c = document.getElementById('text-preview-canvas');
  if (!c) return;
  const tc = c.getContext('2d');
  tc.fillStyle = '#000';
  tc.fillRect(0, 0, c.width, c.height);

  const tmp = new Uint8Array(120 * 30);
  const origBitmap = State.bitmap;
  const origW = State.width;
  const origH = State.height;
  State.bitmap = tmp;
  State.width = 120;
  State.height = 30;
  const startX = State.textAlign === 'center' ? 60 : State.textAlign === 'right' ? 116 : 4;
  drawText(State.textContent || 'Hola!', startX, 8, State.textSize, 1, State.textAlign);
  State.bitmap = origBitmap;
  State.width = origW;
  State.height = origH;

  tc.fillStyle = '#fff';
  for (let y = 0; y < 30; y++) {
    for (let x = 0; x < 120; x++) {
      if (tmp[y * 120 + x]) tc.fillRect(x, y, 1, 1);
    }
  }
}

function updateColorButtons() {
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.color) === State.pixelValue);
  });
}

function bindToolbarButtons() {
  document.getElementById('btn-new').addEventListener('click', newProject);
  document.getElementById('btn-open').addEventListener('click', () => openModal('modal-open'));
  document.getElementById('btn-save').addEventListener('click', saveProject);
  document.getElementById('btn-export').addEventListener('click', () => openModal('modal-export'));
  document.getElementById('btn-ai-gen').addEventListener('click', aiGenerateCode);
  document.getElementById('btn-open-widgets')?.addEventListener('click', openWidgetsModal);
  document.getElementById('btn-toggle-timeline')?.addEventListener('click', () => toggleTimeline());
  document.getElementById('btn-open-menu-designer')?.addEventListener('click', () => openMenuDesigner());
  document.getElementById('btn-open-gif-import')?.addEventListener('click', () => openMediaImportModal());
  document.getElementById('btn-open-qr')?.addEventListener('click', () => openQRCodeModal());
  document.getElementById('btn-open-anim-templates')?.addEventListener('click', () => openAnimTemplatesModal());
  document.getElementById('btn-toggle-dual-screen')?.addEventListener('click', () => toggleDualScreen());
  document.getElementById('btn-open-live-hardware')?.addEventListener('click', () => openLiveHardwareModal());
  document.getElementById('btn-open-help')?.addEventListener('click', () => openModal('modal-help'));
  document.getElementById('btn-sidebar-help')?.addEventListener('click', () => openModal('modal-help'));
  document.getElementById('btn-hw-preview')?.addEventListener('click', openHardwarePreview);
  document.getElementById('btn-export-png1bit')?.addEventListener('click', exportCanvasToPng1Bit);
  document.getElementById('tb-pencil')?.addEventListener('click', () => selectTool('pencil'));
  document.getElementById('tb-eraser')?.addEventListener('click', () => selectTool('eraser'));
  document.getElementById('tb-clear')?.addEventListener('click', clearCanvas);
  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);
  document.getElementById('btn-zoom-in').addEventListener('click', () => changeZoom(1));
  document.getElementById('btn-zoom-out').addEventListener('click', () => changeZoom(-1));
  document.getElementById('btn-zoom-fit').addEventListener('click', fitZoom);
  document.getElementById('btn-grid').addEventListener('click', () => {
    State.showGrid = !State.showGrid;
    document.getElementById('btn-grid').classList.toggle('active', State.showGrid);
    renderCanvas();
  });
  document.getElementById('btn-preview').addEventListener('click', togglePreview);
  document.getElementById('btn-clear').addEventListener('click', clearCanvas);
  document.getElementById('btn-invert').addEventListener('click', invertCanvas);
  document.getElementById('btn-flip-h').addEventListener('click', flipHorizontal);
  document.getElementById('btn-flip-v').addEventListener('click', flipVertical);
  document.getElementById('btn-shift-up').addEventListener('click',    () => shiftCanvas(0, -1));
  document.getElementById('btn-shift-down').addEventListener('click',  () => shiftCanvas(0, 1));
  document.getElementById('btn-shift-left').addEventListener('click',  () => shiftCanvas(-1, 0));
  document.getElementById('btn-shift-right').addEventListener('click', () => shiftCanvas(1, 0));

  // Controles de Vista Previa de Hardware
  document.querySelectorAll('.hw-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.hw-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderHardwareDisplay();
    });
  });

  document.getElementById('hw-pcb-style')?.addEventListener('change', (e) => {
    const moduleEl = document.getElementById('oled-physical-module');
    if (moduleEl) moduleEl.className = `oled-physical-module pcb-${e.target.value}`;
  });

  document.getElementById('btn-download-hw-photo')?.addEventListener('click', downloadHardwarePhoto);
  document.getElementById('btn-copy-hw-photo')?.addEventListener('click', async () => {
    const hwCanvas = document.getElementById('hardware-canvas');
    if (!hwCanvas) return;
    hwCanvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('Imagen de hardware copiada al portapapeles ✓', 'success');
      } catch {
        showToast('Error al copiar al portapapeles', 'error');
      }
    });
  });

  // Controles de Línea de Tiempo / Animación
  document.getElementById('tl-btn-first')?.addEventListener('click', () => selectFrame(0));
  document.getElementById('tl-btn-prev')?.addEventListener('click', () => stepFrame(-1));
  document.getElementById('tl-btn-play')?.addEventListener('click', togglePlayAnimation);
  document.getElementById('tl-btn-next')?.addEventListener('click', () => stepFrame(1));
  document.getElementById('tl-btn-last')?.addEventListener('click', () => selectFrame(State.frames.length - 1));
  document.getElementById('tl-fps-select')?.addEventListener('change', (e) => {
    State.fps = parseInt(e.target.value);
    if (State.isPlaying) {
      stopAnimation();
      startAnimation();
    }
  });
  document.getElementById('tl-btn-onion')?.addEventListener('click', toggleOnionSkin);
  document.getElementById('tl-btn-loop')?.addEventListener('click', (e) => {
    State.playLoop = !State.playLoop;
    e.currentTarget.classList.toggle('active', State.playLoop);
    showToast(State.playLoop ? 'Bucle activado' : 'Bucle desactivado', 'info');
  });
  document.getElementById('tl-btn-add')?.addEventListener('click', () => addFrame(false));
  document.getElementById('tl-btn-dup')?.addEventListener('click', () => addFrame(true));
  document.getElementById('tl-btn-del')?.addEventListener('click', deleteCurrentFrame);
  document.getElementById('tl-btn-close')?.addEventListener('click', () => toggleTimeline(false));
  document.getElementById('tl-btn-export-anim')?.addEventListener('click', () => {
    openModal('modal-export');
    generateAndShowCode();
  });

  // Botones de la barra flotante de Transformación interactiva (Estirar / Encoger figuras)
  document.getElementById('btn-transform-apply')?.addEventListener('click', () => {
    applyTransformObject();
  });
  document.getElementById('btn-transform-delete')?.addEventListener('click', () => {
    deleteTransformObject();
  });
  document.getElementById('btn-transform-cancel')?.addEventListener('click', () => {
    cancelTransformObject();
  });
  document.getElementById('btn-transform-ratio')?.addEventListener('click', () => {
    if (State.transformObject) {
      State.transformObject.lockAspectRatio = !State.transformObject.lockAspectRatio;
      updateTransformHUD();
    }
  });
}

function bindRightPanel() {
  // Resolución
  document.getElementById('resolution-select').addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      document.getElementById('custom-res-group').classList.remove('hidden');
    } else {
      document.getElementById('custom-res-group').classList.add('hidden');
      const [w, h] = e.target.value.split('x').map(Number);
      applyResolution(w, h);
    }
  });

  document.getElementById('btn-apply-res').addEventListener('click', () => {
    const w = parseInt(document.getElementById('custom-width').value) || 128;
    const h = parseInt(document.getElementById('custom-height').value) || 64;
    applyResolution(Math.min(256, Math.max(8, w)), Math.min(256, Math.max(8, h)));
  });

  // Driver
  document.getElementById('driver-select').addEventListener('change', (e) => {
    State.driverName = e.target.value;
    updateDriverInfo();
    loadPinout();
  });

  // Interfaz I2C/SPI
  document.querySelectorAll('.iface-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.iface-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.interfaceType = btn.dataset.iface;
      document.getElementById('i2c-detail').classList.toggle('hidden', State.interfaceType !== 'I2C');
      document.getElementById('spi-detail').classList.toggle('hidden', State.interfaceType !== 'SPI');
      loadPinout();
    });
  });

  // Color de display
  document.querySelectorAll('.display-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.display-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.displayColor = btn.dataset.dcolor;
      renderCanvas();
      renderPreview();
    });
  });

  // Preview color override
  document.getElementById('preview-color-override').addEventListener('change', (e) => {
    if (e.target.value) {
      State.displayColor = e.target.value;
      renderCanvas();
      renderPreview();
    }
  });

  // Nombre del proyecto
  document.getElementById('project-name-input').addEventListener('input', (e) => {
    State.projectName = e.target.value;
    document.getElementById('project-name-display').textContent = e.target.value || 'Sin título';
    markDirty();
  });

  // Recargar pinout
  document.getElementById('btn-reload-pinout').addEventListener('click', loadPinout);

  // Cerrar preview
  document.getElementById('btn-close-preview').addEventListener('click', () => {
    document.getElementById('preview-panel').classList.add('hidden');
    State.showPreview = false;
    document.getElementById('btn-preview').classList.remove('active');
  });
}

function bindModalButtons() {
  // Cerrar modales
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.close;
      closeModal(modalId);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Tabs del modal de abrir
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
    });
  });

  // Exportar código
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      generateAndShowCode();
    });
  });

  document.getElementById('export-dynamic-analog')?.addEventListener('change', (e) => {
    const wrap = document.getElementById('export-analog-pin-wrapper');
    if (wrap) wrap.style.display = e.target.checked ? 'inline-flex' : 'none';
    generateAndShowCode();
  });

  document.getElementById('export-analog-pin-select')?.addEventListener('change', () => {
    generateAndShowCode();
  });

  document.getElementById('export-include-init')?.addEventListener('change', generateAndShowCode);
  document.getElementById('export-include-comments')?.addEventListener('change', generateAndShowCode);

  document.getElementById('btn-generate-code').addEventListener('click', generateAndShowCode);
  document.getElementById('btn-copy-code').addEventListener('click', copyCode);
  document.getElementById('btn-save-code').addEventListener('click', saveCodeToFile);
  document.getElementById('btn-browse-file').addEventListener('click', browseProjectFile);
  document.getElementById('btn-refresh-arduino-ports')?.addEventListener('click', refreshArduinoPorts);
  document.getElementById('btn-upload-arduino')?.addEventListener('click', uploadCodeToArduino);
  document.getElementById('btn-open-arduino-ide')?.addEventListener('click', openInArduinoIDE);
  document.getElementById('btn-hw-refresh-ports')?.addEventListener('click', refreshArduinoPorts);

  document.getElementById('arduino-port-select')?.addEventListener('change', (e) => {
    const port = e.target.value;
    const matched = detectedArduinoPorts.find(p => p.port === port);
    if (matched) {
      if (matched.fqbn) {
        const bSel = document.getElementById('arduino-board-select');
        if (bSel) bSel.value = matched.fqbn;
      }
      updateI2CPinoutDisplay(matched);
    }
  });

  document.getElementById('hw-serial-port-select')?.addEventListener('change', (e) => {
    const port = e.target.value;
    const matched = detectedArduinoPorts.find(p => p.port === port);
    if (matched) {
      updateI2CPinoutDisplay(matched);
    }
  });

  document.getElementById('arduino-board-select')?.addEventListener('change', (e) => {
    updateI2CPinoutDisplay(e.target.value);
  });
}

function bindKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Atajos para la figura en transformación (Enter para fijar, Esc para cancelar, Supr para eliminar, Flechas para mover)
    if (State.transformObject) {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyTransformObject();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteTransformObject();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelTransformObject();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        State.transformObject.x--;
        renderOverlay();
        updateTransformHUD();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        State.transformObject.x++;
        renderOverlay();
        updateTransformHUD();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        State.transformObject.y--;
        renderOverlay();
        updateTransformHUD();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        State.transformObject.y++;
        renderOverlay();
        updateTransformHUD();
        return;
      }
    }

    // Atajos de herramientas
    const toolKeys = {
      'p': 'pencil', 'e': 'eraser', 'l': 'line',
      'r': 'rect',   'c': 'circle', 'f': 'fill',
      't': 'text',   's': 'select', 'i': 'image',
      'd': 'eyedropper', 'w': 'widget'
    };

    const key = e.key.toLowerCase();

    // Espacio para Play/Pausa de animación
    if (e.code === 'Space' && State.timelineVisible && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      togglePlayAnimation();
      return;
    }

    // Shift+A para abrir o cerrar Línea de Tiempo de animación
    if (e.shiftKey && key === 'a' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      toggleTimeline();
      return;
    }

    // Tecla M para Diseñador y Simulador de Menús
    if (key === 'm' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      openMenuDesigner();
      return;
    }

    // Tecla F1 para abrir el Manual de Ayuda y Documentación
    if (e.key === 'F1') {
      e.preventDefault();
      openModal('modal-help');
      return;
    }

    if (!e.ctrlKey && !e.metaKey && toolKeys[key]) {
      selectTool(toolKeys[key]);
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      switch (key) {
        case 'z': e.preventDefault(); e.shiftKey ? redo() : undo(); break;
        case 'y': e.preventDefault(); redo(); break;
        case 's': e.preventDefault(); saveProject(); break;
        case 'n': e.preventDefault(); newProject(); break;
        case 'e': e.preventDefault(); openModal('modal-export'); break;
        case 'g': e.preventDefault();
          State.showGrid = !State.showGrid;
          document.getElementById('btn-grid').classList.toggle('active', State.showGrid);
          renderCanvas();
          break;
        case '+': case '=': e.preventDefault(); changeZoom(1); break;
        case '-': e.preventDefault(); changeZoom(-1); break;
        case '0': e.preventDefault(); fitZoom(); break;
        case 'i': e.preventDefault(); aiGenerateCode(); break;
      }
    }
  });
}

function bindMenuEvents() {
  if (!window.electronAPI) return;

  window.electronAPI.onMenuEvent((event) => {
    switch (event) {
      case 'menu:new-project':     newProject(); break;
      case 'menu:open-project':    openModal('modal-open'); break;
      case 'menu:save-project':    saveProject(); break;
      case 'menu:save-project-as': saveProjectAs(); break;
      case 'menu:export-code':     openModal('modal-export'); break;
      case 'menu:export-image':    exportImage(); break;
      case 'menu:undo':            undo(); break;
      case 'menu:redo':            redo(); break;
      case 'menu:clear-canvas':    clearCanvas(); break;
      case 'menu:zoom-in':         changeZoom(1); break;
      case 'menu:zoom-out':        changeZoom(-1); break;
      case 'menu:zoom-reset':      fitZoom(); break;
      case 'menu:toggle-grid':
        State.showGrid = !State.showGrid;
        document.getElementById('btn-grid').classList.toggle('active', State.showGrid);
        renderCanvas();
        break;
      case 'menu:toggle-preview':  togglePreview(); break;
      case 'menu:ai-generate':     aiGenerateCode(); break;
      case 'menu:import-image':    document.getElementById('file-image-input').click(); break;
      case 'menu:version-history': openVersionHistory(); break;
      case 'menu:open-help':       openModal('modal-help'); break;
    }
  });
}

function bindWindowResize() {
  window.addEventListener('resize', () => {
    resizeCanvases();
    renderCanvas();
  });
}

// ============================================================
// SELECCIÓN DE HERRAMIENTA
// ============================================================

function selectTool(toolName) {
  if (State.transformObject) {
    applyTransformObject();
  }

  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === toolName);
  });
  const tbPencil = document.getElementById('tb-pencil');
  const tbEraser = document.getElementById('tb-eraser');
  if (tbPencil) tbPencil.classList.toggle('active', toolName === 'pencil');
  if (tbEraser) tbEraser.classList.toggle('active', toolName === 'eraser');
  State.tool = toolName;
  updateToolOptions();

  if (toolName === 'widget') {
    if (!State.activeWidget) {
      openWidgetsModal();
    } else {
      showToast(`Widget activo: ${State.activeWidget.name} (haz clic en el canvas para estampar)`, 'info');
    }
  }
}

// ============================================================
// MODALES
// ============================================================

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');

  if (id === 'modal-open') loadProjectList();
  if (id === 'modal-widgets') initWidgetsModal();
  if (id === 'modal-export') {
    const hasWidget = (State.elements && State.elements.some(e => e.type === 'widget')) ||
                      (State.transformObject && State.transformObject.type === 'widget') ||
                      State.activeWidget;
    const chk = document.getElementById('export-dynamic-analog');
    if (chk) {
      if (hasWidget) chk.checked = true;
      const wrap = document.getElementById('export-analog-pin-wrapper');
      if (wrap) wrap.style.display = chk.checked ? 'inline-flex' : 'none';
    }
    refreshArduinoPorts();
    generateAndShowCode();
  }
  if (id === 'modal-live-hardware') refreshArduinoPorts();
}

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

// ============================================================
// BIBLIOTECA DE WIDGETS E ICONOS (Controlador)
// ============================================================

let currentWidgetCategory = 'all';
let currentWidgetSearch = '';
let currentSelectedWidgetObj = null;

function openWidgetsModal() {
  openModal('modal-widgets');
}

function stampWidgetAt(atX, atY, widgetObj) {
  if (!widgetObj || !widgetObj.bitmap) return;
  initTransformObject({
    type: 'widget',
    widgetId: widgetObj.id,
    widgetType: widgetObj.type,
    name: widgetObj.name,
    params: widgetObj.params ? { ...widgetObj.params } : null,
    x: atX,
    y: atY,
    w: widgetObj.width,
    h: widgetObj.height,
    origW: widgetObj.width,
    origH: widgetObj.height,
    origBitmap: widgetObj.bitmap.slice(),
    value: State.pixelValue !== undefined ? State.pixelValue : 1,
    lockAspectRatio: false
  });
  showToast(`Widget "${widgetObj.name}": arrastra los tiradores para estirar o encoger (Enter para fijar)`, 'info');
}

function initWidgetsModal() {
  // Inicializar pestañas de categorías
  document.querySelectorAll('.wcat-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.wcat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentWidgetCategory = btn.dataset.cat;
      renderWidgetList();
    };
  });

  // Buscador en tiempo real
  const searchInput = document.getElementById('widget-search-input');
  if (searchInput) {
    searchInput.value = currentWidgetSearch;
    searchInput.oninput = (e) => {
      currentWidgetSearch = e.target.value.toLowerCase().trim();
      renderWidgetList();
    };
  }

  // Sliders de parámetros
  const valSlider = document.getElementById('rng-widget-val');
  if (valSlider) {
    valSlider.oninput = (e) => {
      document.getElementById('lbl-param-val').textContent = e.target.value;
      if (currentSelectedWidgetObj && currentSelectedWidgetObj.type === 'parametric') {
        currentSelectedWidgetObj.params.percent = parseInt(e.target.value);
        regenerateParametricWidget(currentSelectedWidgetObj);
        updateWidgetPreviewPanel(currentSelectedWidgetObj);
      }
    };
  }

  const styleSelect = document.getElementById('sel-widget-style');
  if (styleSelect) {
    styleSelect.onchange = (e) => {
      if (currentSelectedWidgetObj && currentSelectedWidgetObj.type === 'parametric') {
        currentSelectedWidgetObj.params.style = e.target.value;
        regenerateParametricWidget(currentSelectedWidgetObj);
        updateWidgetPreviewPanel(currentSelectedWidgetObj);
      }
    };
  }

  // Botón insertar
  const insertBtn = document.getElementById('btn-insert-widget');
  if (insertBtn) {
    insertBtn.onclick = () => {
      if (!currentSelectedWidgetObj) return;
      State.activeWidget = currentSelectedWidgetObj;
      selectTool('widget');

      // Centrar en el canvas
      const centerX = Math.max(0, Math.round((State.width - currentSelectedWidgetObj.width) / 2));
      const centerY = Math.max(0, Math.round((State.height - currentSelectedWidgetObj.height) / 2));
      stampWidgetAt(centerX, centerY, currentSelectedWidgetObj);

      closeModal('modal-widgets');
    };
  }

  renderWidgetList();
}

function regenerateParametricWidget(item) {
  if (!window.WIDGET_GENERATORS) return;
  if (item.id === 'prog_bar') {
    const res = window.WIDGET_GENERATORS.progressBar(64, 8, item.params.percent, item.params.style);
    item.width = res.width;
    item.height = res.height;
    item.bitmap = res.bitmap;
    item.name = res.name;
  } else if (item.id === 'gauge_dial') {
    const res = window.WIDGET_GENERATORS.gaugeDial(16, item.params.percent);
    item.width = res.width;
    item.height = res.height;
    item.bitmap = res.bitmap;
    item.name = res.name;
  }
}

function getAllWidgetItems() {
  const items = [];

  // Widgets Paramétricos
  if (window.WIDGET_GENERATORS) {
    items.push({
      id: 'prog_bar',
      name: 'Barra de Progreso',
      category: 'parametric',
      type: 'parametric',
      params: { percent: 65, style: 'solid' },
      generate: () => window.WIDGET_GENERATORS.progressBar(64, 8, 65, 'solid')
    });

    items.push({
      id: 'gauge_dial',
      name: 'Tacómetro Gauge',
      category: 'parametric',
      type: 'parametric',
      params: { percent: 70 },
      generate: () => window.WIDGET_GENERATORS.gaugeDial(16, 70)
    });

    items.push({
      id: 'header_bar',
      name: 'Barra Estado Header',
      category: 'parametric',
      type: 'parametric',
      params: {},
      generate: () => window.WIDGET_GENERATORS.headerBar(Math.min(128, State.width))
    });

    items.push({
      id: 'sparkline',
      name: 'Mini Gráfica Sparkline',
      category: 'parametric',
      type: 'parametric',
      params: {},
      generate: () => window.WIDGET_GENERATORS.sparkline(48, 16)
    });

    items.push({
      id: 'metric_card',
      name: 'Tarjeta Sensor Temp',
      category: 'parametric',
      type: 'parametric',
      params: {},
      generate: () => window.WIDGET_GENERATORS.metricCard(56, 26, 'TEMP')
    });
  }

  // Iconos de la biblioteca
  if (typeof window.ICON_LIBRARY !== 'undefined' && window.decodeIconToBitmap) {
    for (const [key, iconDef] of Object.entries(window.ICON_LIBRARY)) {
      items.push({
        id: key,
        name: iconDef.name,
        category: iconDef.category,
        type: 'icon',
        width: iconDef.width,
        height: iconDef.height,
        bitmap: window.decodeIconToBitmap(iconDef)
      });
    }
  }

  return items;
}

function renderWidgetList() {
  const container = document.getElementById('widget-items-grid');
  if (!container) return;
  container.innerHTML = '';

  const allItems = getAllWidgetItems();
  const filtered = allItems.filter(item => {
    const matchesCat = (currentWidgetCategory === 'all') || (item.category === currentWidgetCategory);
    const matchesSearch = !currentWidgetSearch ||
      item.name.toLowerCase().includes(currentWidgetSearch) ||
      item.id.toLowerCase().includes(currentWidgetSearch);
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted); font-size:12px;">No se encontraron iconos o widgets con ese filtro.</div>';
    return;
  }

  filtered.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'widget-card';
    if (currentSelectedWidgetObj && currentSelectedWidgetObj.id === item.id) {
      card.classList.add('selected');
    }

    if (item.type === 'parametric' && !item.bitmap) {
      const generated = item.generate();
      item.bitmap = generated.bitmap;
      item.width = generated.width;
      item.height = generated.height;
    }

    const bm = item.bitmap;
    const w = item.width;
    const h = item.height;

    // Miniatura
    const miniCanvas = document.createElement('canvas');
    const scale = Math.max(1, Math.min(4, Math.floor(40 / Math.max(w, h))));
    miniCanvas.width = w * scale;
    miniCanvas.height = h * scale;
    const mctx = miniCanvas.getContext('2d');
    mctx.fillStyle = '#05070a';
    mctx.fillRect(0, 0, miniCanvas.width, miniCanvas.height);
    mctx.fillStyle = '#00d4aa';

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (bm && bm[y * w + x]) {
          mctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }

    card.appendChild(miniCanvas);

    const nameEl = document.createElement('div');
    nameEl.className = 'wcard-name';
    nameEl.textContent = item.name;
    nameEl.title = item.name;
    card.appendChild(nameEl);

    const dimsEl = document.createElement('div');
    dimsEl.className = 'wcard-dims';
    dimsEl.textContent = `${w}×${h} px`;
    card.appendChild(dimsEl);

    card.onclick = () => {
      document.querySelectorAll('.widget-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      currentSelectedWidgetObj = item;
      updateWidgetPreviewPanel(item);
    };

    container.appendChild(card);

    // Auto-seleccionar primer elemento
    if (index === 0 && !currentSelectedWidgetObj) {
      card.classList.add('selected');
      currentSelectedWidgetObj = item;
      updateWidgetPreviewPanel(item);
    }
  });
}

function updateWidgetPreviewPanel(item) {
  if (!item) return;

  const titleEl = document.getElementById('wpreview-title');
  const dimsEl = document.getElementById('wpreview-dims');
  const previewCanvas = document.getElementById('widget-preview-canvas');
  const paramControls = document.getElementById('widget-param-controls');
  const styleRow = document.getElementById('row-param-style');

  if (titleEl) titleEl.textContent = item.name;
  if (dimsEl) dimsEl.textContent = `Dimensiones: ${item.width} × ${item.height} píxeles (${item.category})`;

  // Controles paramétricos
  if (paramControls) {
    if (item.type === 'parametric' && item.params && item.params.percent !== undefined) {
      paramControls.classList.remove('hidden');
      if (styleRow) styleRow.classList.toggle('hidden', item.id !== 'prog_bar');
    } else {
      paramControls.classList.add('hidden');
    }
  }

  // Dibujar en el canvas de preview
  if (previewCanvas) {
    const pctx2 = previewCanvas.getContext('2d');
    pctx2.fillStyle = '#020305';
    pctx2.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

    const scale = Math.max(1, Math.min(6, Math.floor(Math.min((previewCanvas.width - 8) / item.width, (previewCanvas.height - 8) / item.height))));
    const drawW = item.width * scale;
    const drawH = item.height * scale;
    const offX = Math.round((previewCanvas.width - drawW) / 2);
    const offY = Math.round((previewCanvas.height - drawH) / 2);

    const colors = DISPLAY_COLORS[State.displayColor] || DISPLAY_COLORS.white;
    pctx2.fillStyle = colors.pixel;

    for (let y = 0; y < item.height; y++) {
      for (let x = 0; x < item.width; x++) {
        if (item.bitmap && item.bitmap[y * item.width + x]) {
          pctx2.fillRect(offX + x * scale, offY + y * scale, scale, scale);
        }
      }
    }
  }
}

// ============================================================
// SISTEMA DE ANIMACIONES / FOTOGRAMAS MÚLTIPLES (TIMELINE)
// ============================================================

function initAnimationSystem() {
  if (!State.frames || State.frames.length === 0) {
    State.frames = [{
      id: Date.now(),
      name: 'Frame 1',
      bitmap: State.bitmap ? State.bitmap.slice() : new Uint8Array(State.width * State.height)
    }];
    State.currentFrameIndex = 0;
  }
  updateTimelineUI();
}

function syncActiveFrameBitmap() {
  if (State.frames && State.frames[State.currentFrameIndex] && State.bitmap) {
    State.frames[State.currentFrameIndex].bitmap.set(State.bitmap);
  }
}

function toggleTimeline(forceState = null) {
  State.timelineVisible = (forceState !== null) ? forceState : !State.timelineVisible;
  const container = document.getElementById('timeline-container');
  const btn = document.getElementById('btn-toggle-timeline');

  if (container) container.classList.toggle('hidden', !State.timelineVisible);
  if (btn) btn.classList.toggle('active', State.timelineVisible);

  if (State.timelineVisible) {
    initAnimationSystem();
  } else if (State.isPlaying) {
    stopAnimation();
  }
}

function addFrame(duplicate = false) {
  syncActiveFrameBitmap();
  pushHistory();

  const newBitmap = duplicate ?
    State.bitmap.slice() :
    new Uint8Array(State.width * State.height);

  const newIndex = State.frames.length;
  State.frames.push({
    id: Date.now(),
    name: `Frame ${newIndex + 1}`,
    bitmap: newBitmap
  });

  selectFrame(newIndex);
  showToast(duplicate ? `Fotograma ${newIndex + 1} duplicado` : `Fotograma ${newIndex + 1} creado`, 'info');
}

function deleteCurrentFrame() {
  if (State.frames.length <= 1) {
    showToast('Debe existir al menos 1 fotograma', 'warning');
    return;
  }

  pushHistory();
  State.frames.splice(State.currentFrameIndex, 1);
  State.currentFrameIndex = Math.max(0, State.currentFrameIndex - 1);
  State.bitmap.set(State.frames[State.currentFrameIndex].bitmap);

  State.frames.forEach((f, idx) => { f.name = `Frame ${idx + 1}`; });

  markDirty();
  renderCanvas();
  renderPreview();
  updateTimelineUI();
  showToast('Fotograma eliminado', 'info');
}

function selectFrame(index) {
  if (index < 0 || index >= State.frames.length) return;

  syncActiveFrameBitmap();
  State.currentFrameIndex = index;
  State.bitmap.set(State.frames[index].bitmap);

  renderCanvas();
  renderPreview();
  updateTimelineUI();
}

function stepFrame(delta) {
  syncActiveFrameBitmap();
  let next = State.currentFrameIndex + delta;
  if (next >= State.frames.length) {
    next = State.playLoop ? 0 : State.frames.length - 1;
    if (!State.playLoop && delta > 0) {
      stopAnimation();
      return;
    }
  } else if (next < 0) {
    next = State.playLoop ? State.frames.length - 1 : 0;
  }
  selectFrame(next);
}

function togglePlayAnimation() {
  if (State.isPlaying) {
    stopAnimation();
  } else {
    startAnimation();
  }
}

function startAnimation() {
  if (State.frames.length <= 1) {
    showToast('Agrega más fotogramas para animar (+ Frame)', 'info');
    return;
  }
  State.isPlaying = true;
  const playBtn = document.getElementById('tl-btn-play');
  if (playBtn) {
    playBtn.textContent = '⏸';
    playBtn.title = 'Pausar (Espacio)';
  }

  const intervalMs = Math.max(20, Math.round(1000 / State.fps));
  State.playInterval = setInterval(() => {
    stepFrame(1);
  }, intervalMs);
}

function stopAnimation() {
  State.isPlaying = false;
  if (State.playInterval) {
    clearInterval(State.playInterval);
    State.playInterval = null;
  }
  const playBtn = document.getElementById('tl-btn-play');
  if (playBtn) {
    playBtn.textContent = '▶';
    playBtn.title = 'Reproducir (Espacio)';
  }
}

function toggleOnionSkin() {
  State.onionSkin = !State.onionSkin;
  const btn = document.getElementById('tl-btn-onion');
  if (btn) btn.classList.toggle('active', State.onionSkin);
  renderCanvas();
  showToast(State.onionSkin ? '🧅 Papel cebolla activado' : 'Papel cebolla desactivado', 'info');
}

function updateTimelineUI() {
  const badge = document.getElementById('tl-frame-badge');
  if (badge) {
    badge.textContent = `Frame ${State.currentFrameIndex + 1} / ${State.frames.length}`;
  }

  updateToolbarMetrics();

  const filmstrip = document.getElementById('timeline-filmstrip');
  if (!filmstrip) return;
  filmstrip.innerHTML = '';

  State.frames.forEach((frame, idx) => {
    const card = document.createElement('div');
    card.className = `tl-frame-card ${idx === State.currentFrameIndex ? 'active' : ''}`;

    const mini = document.createElement('canvas');
    const scale = Math.max(1, Math.min(2, Math.floor(40 / State.width)));
    mini.width = State.width * scale;
    mini.height = State.height * scale;
    const mctx = mini.getContext('2d');
    mctx.fillStyle = '#05070a';
    mctx.fillRect(0, 0, mini.width, mini.height);
    mctx.fillStyle = (idx === State.currentFrameIndex) ? '#ffaa55' : '#00d4aa';

    const bm = (idx === State.currentFrameIndex) ? State.bitmap : frame.bitmap;
    for (let y = 0; y < State.height; y++) {
      for (let x = 0; x < State.width; x++) {
        if (bm && bm[y * State.width + x]) {
          mctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }

    card.appendChild(mini);

    const num = document.createElement('span');
    num.className = 'tl-frame-num';
    num.textContent = `${idx + 1}`;
    card.appendChild(num);

    card.onclick = () => {
      if (State.isPlaying) stopAnimation();
      selectFrame(idx);
    };

    filmstrip.appendChild(card);
  });

  const activeCard = filmstrip.querySelector('.tl-frame-card.active');
  if (activeCard) {
    activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

// ============================================================
// MODO DOBLE PANTALLA OLED (DUAL SCREEN 0x3C / 0x3D)
// ============================================================

function toggleDualScreen() {
  State.isDualScreen = !State.isDualScreen;
  const btn = document.getElementById('btn-toggle-dual-screen');
  if (btn) btn.classList.toggle('active', State.isDualScreen);

  if (State.isDualScreen) {
    if (!State.screenA_bitmap) State.screenA_bitmap = State.bitmap.slice();
    if (!State.screenB_bitmap) State.screenB_bitmap = new Uint8Array(State.width * State.height);
    State.activeScreen = 'A';
    showToast('Modo Doble Pantalla OLED activado (0x3C y 0x3D)', 'info');
  } else {
    showToast('Modo Pantalla Única activado', 'info');
  }

  renderCanvas();
  renderPreview();
}

function switchActiveScreen(screen) {
  if (!State.isDualScreen) return;
  if (screen === State.activeScreen) return;

  if (State.activeScreen === 'A') {
    State.screenA_bitmap.set(State.bitmap);
  } else {
    State.screenB_bitmap.set(State.bitmap);
  }

  State.activeScreen = screen;
  if (screen === 'A') {
    State.bitmap.set(State.screenA_bitmap);
  } else {
    State.bitmap.set(State.screenB_bitmap);
  }

  renderCanvas();
  renderPreview();
  showToast(`Editando Pantalla ${screen} (${screen === 'A' ? '0x3C' : '0x3D'})`, 'info');
}

// ============================================================
// GESTION DE PROYECTOS
// ============================================================

function newProject() {
  if (State.isDirty) {
    if (!confirm('¿Descartar cambios sin guardar y crear nuevo proyecto?')) return;
  }

  State.projectId = null;
  State.projectName = 'Sin título';
  State.bitmap.fill(0);
  State.history = [];
  State.historyIndex = -1;

  // Reiniciar fotogramas de animación
  State.frames = [{
    id: Date.now(),
    name: 'Frame 1',
    bitmap: new Uint8Array(State.width * State.height)
  }];
  State.currentFrameIndex = 0;
  if (State.isPlaying) stopAnimation();
  updateTimelineUI();

  document.getElementById('project-name-input').value = 'Sin título';
  document.getElementById('project-name-display').textContent = 'Sin título';
  document.getElementById('project-desc-input').value = '';

  markClean();
  pushHistory();
  renderCanvas();
  renderPreview();
  showToast('Nuevo proyecto creado', 'info');
}

async function saveProject() {
  syncActiveFrameBitmap();
  const canvasData = bitmapToBase64();
  const thumbnail = mainCanvas.toDataURL('image/png', 0.5);

  const projectData = {
    id: State.projectId,
    name: State.projectName || 'Sin título',
    description: document.getElementById('project-desc-input').value,
    driver_name: State.driverName,
    width: State.width,
    height: State.height,
    interface: State.interfaceType,
    display_color: State.displayColor,
    canvas_data: canvasData,
    frames: (State.frames && State.frames.length > 1) ? State.frames.map(f => Array.from(f.bitmap)) : null,
    fps: State.fps || 10,
    thumbnail
  };

  try {
    if (window.electronAPI) {
      const result = await window.electronAPI.saveProject(projectData);
      if (result.success) {
        State.projectId = result.data?.id || State.projectId;
        markClean();
        showToast(`Proyecto "${projectData.name}" guardado ✓`, 'success');
      } else {
        saveToLocalStorage(projectData);
      }
    } else {
      saveToLocalStorage(projectData);
    }
  } catch (err) {
    saveToLocalStorage(projectData);
    showToast(`Guardado en local: ${err.message}`, 'info');
  }
}

async function saveProjectAs() {
  State.projectId = null;
  await saveProject();
}

function bitmapToBase64() {
  // Convertir bitmap a formato compacto (RLE básico o base64 de bytes)
  const bytes = new Uint8Array(Math.ceil(State.width * State.height / 8));
  for (let i = 0; i < State.width * State.height; i++) {
    if (State.bitmap[i]) {
      bytes[Math.floor(i / 8)] |= (1 << (7 - (i % 8)));
    }
  }
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBitmap(b64, width, height) {
  const bytes = atob(b64).split('').map(c => c.charCodeAt(0));
  const bitmap = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    bitmap[i] = (bytes[Math.floor(i / 8)] >> (7 - (i % 8))) & 1;
  }
  return bitmap;
}

function saveToLocalStorage(data) {
  const projects = JSON.parse(localStorage.getItem('oled_projects') || '[]');
  const idx = projects.findIndex(p => p.id === data.id);
  data.id = data.id || `local_${Date.now()}`;
  data.updated_at = new Date().toISOString();
  if (idx >= 0) projects[idx] = data;
  else projects.unshift(data);
  localStorage.setItem('oled_projects', JSON.stringify(projects.slice(0, 50)));
}

async function loadProjectList() {
  const listEl = document.getElementById('project-list');
  listEl.innerHTML = '<div class="loading-spinner">Cargando...</div>';

  let projectsData = [];

  try {
    if (window.electronAPI) {
      const result = await window.electronAPI.listProjects();
      if (result.success) projectsData = result.data;
    }
  } catch {}

  // Merge con localStorage
  const local = JSON.parse(localStorage.getItem('oled_projects') || '[]');
  const allProjects = [...projectsData, ...local.filter(lp =>
    !projectsData.some(p => p.id === lp.id)
  )];

  if (allProjects.length === 0) {
    listEl.innerHTML = '<div class="pinout-loading">No hay proyectos guardados</div>';
    return;
  }

  listEl.innerHTML = '';
  allProjects.forEach(p => {
    const item = document.createElement('div');
    item.className = 'project-item';
    item.innerHTML = `
      <div class="project-thumb">
        <canvas width="64" height="32"></canvas>
      </div>
      <div class="project-details">
        <div class="project-name">${escapeHtml(p.name)}</div>
        <div class="project-meta">${p.width}×${p.height} · ${p.driver_name || '?'} · ${formatDate(p.updated_at)}</div>
      </div>
      <div class="project-actions">
        <button class="project-btn">Abrir</button>
        <button class="project-btn danger">✕</button>
      </div>
    `;

    // Thumbnail
    if (p.canvas_data) {
      const thumb = item.querySelector('canvas');
      renderThumbnail(thumb, p.canvas_data, p.width, p.height, p.display_color);
    }

    item.querySelector('.project-btn:first-child').addEventListener('click', () => {
      loadProject(p);
    });

    item.querySelector('.project-btn.danger').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm(`¿Eliminar "${p.name}"?`)) {
        item.remove();
        if (window.electronAPI) await window.electronAPI.deleteProject(p.id);
        // También de localStorage
        const lp = JSON.parse(localStorage.getItem('oled_projects') || '[]');
        localStorage.setItem('oled_projects', JSON.stringify(lp.filter(x => x.id !== p.id)));
      }
    });

    listEl.appendChild(item);
  });
}

function loadProject(p) {
  if (State.isDirty) {
    if (!confirm('¿Descartar cambios sin guardar?')) return;
  }

  State.projectId = p.id;
  State.projectName = p.name;
  State.width = p.width || 128;
  State.height = p.height || 64;
  State.driverName = p.driver_name || 'SSD1306';
  State.interfaceType = p.interface || 'I2C';
  State.displayColor = p.display_color || 'white';

  // Restaurar bitmap y fotogramas de animación
  if (p.canvas_data) {
    State.bitmap = base64ToBitmap(p.canvas_data, State.width, State.height);
  } else {
    resetBitmap();
  }

  if (p.frames && p.frames.length > 0) {
    State.frames = p.frames.map((bmArray, idx) => ({
      id: Date.now() + idx,
      name: `Frame ${idx + 1}`,
      bitmap: new Uint8Array(bmArray)
    }));
    State.currentFrameIndex = 0;
    State.fps = p.fps || 10;
    toggleTimeline(true);
  } else {
    State.frames = [{
      id: Date.now(),
      name: 'Frame 1',
      bitmap: State.bitmap.slice()
    }];
    State.currentFrameIndex = 0;
  }

  // Actualizar UI
  document.getElementById('project-name-input').value = p.name;
  document.getElementById('project-name-display').textContent = p.name;
  document.getElementById('driver-select').value = p.driver_name || 'SSD1306';
  document.getElementById('resolution-select').value = `${State.width}x${State.height}`;

  // Color de display
  document.querySelectorAll('.display-color-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.dcolor === State.displayColor);
  });

  markClean();
  closeModal('modal-open');
  resizeCanvases();
  renderCanvas();
  renderPreview();
  pushHistory();
  showToast(`Proyecto "${p.name}" cargado`, 'success');
}

function renderThumbnail(canvas, b64, w, h, color) {
  try {
    const bitmap = base64ToBitmap(b64, w, h);
    const colors = DISPLAY_COLORS[color] || DISPLAY_COLORS.white;
    const tc = canvas.getContext('2d');
    tc.fillStyle = colors.bg;
    tc.fillRect(0, 0, 64, 32);

    const scaleX = 64 / w;
    const scaleY = 32 / h;
    tc.fillStyle = colors.pixel;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (bitmap[y * w + x]) {
          tc.fillRect(
            Math.floor(x * scaleX),
            Math.floor(y * scaleY),
            Math.max(1, Math.floor(scaleX)),
            Math.max(1, Math.floor(scaleY))
          );
        }
      }
    }
  } catch {}
}

async function browseProjectFile() {
  try {
    if (window.electronAPI) {
      const result = await window.electronAPI.openFileDialog({
        title: 'Abrir Proyecto OLED',
        filters: [
          { name: 'Proyecto OLED', extensions: ['oled', 'json'] },
          { name: 'Todos los archivos', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePaths[0]) {
        const fileResult = await window.electronAPI.readFile(result.filePaths[0]);
        if (fileResult.success) {
          const content = atob(fileResult.data);
          const project = JSON.parse(content);
          loadProject(project);
        }
      }
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

// ============================================================
// GENERACIÓN DE CÓDIGO
// ============================================================

async function generateAndShowCode() {
  const activePlatformBtn = document.querySelector('.platform-btn.active');
  const platform = activePlatformBtn?.dataset.platform || 'arduino_adafruit';
  const includeInit = document.getElementById('export-include-init').checked;
  const includeComments = document.getElementById('export-include-comments').checked;
  const useAI = document.getElementById('export-ai-mode').checked;

  document.getElementById('code-content').textContent = '// Generando código...';

  const dynamicAnalog = document.getElementById('export-dynamic-analog')?.checked || false;
  const analogPin = document.getElementById('export-analog-pin-select')?.value || 'A0';

  const placedWidgets = (State.elements || [])
    .filter(e => e.type === 'widget')
    .map(e => ({
      id: e.widgetId || e.id,
      name: e.name,
      x: e.x,
      y: e.y,
      w: e.w,
      h: e.h,
      params: e.params || {}
    }));

  if (State.transformObject && State.transformObject.type === 'widget') {
    placedWidgets.push({
      id: State.transformObject.widgetId || 'widget',
      name: State.transformObject.name,
      x: State.transformObject.x,
      y: State.transformObject.y,
      w: State.transformObject.w,
      h: State.transformObject.h,
      params: State.transformObject.params || {}
    });
  }

  const config = {
    platform,
    driver: State.driverName,
    width: State.width,
    height: State.height,
    interface: State.interfaceType,
    i2cAddress: State.i2cAddress,
    displayColor: State.displayColor,
    bitmap: Array.from(State.bitmap),
    isDualScreen: State.isDualScreen,
    bitmapA: State.isDualScreen ? (State.activeScreen === 'A' ? Array.from(State.bitmap) : Array.from(State.screenA_bitmap)) : null,
    bitmapB: State.isDualScreen ? (State.activeScreen === 'B' ? Array.from(State.bitmap) : Array.from(State.screenB_bitmap || State.bitmap)) : null,
    frames: (State.frames && State.frames.length > 1) ? State.frames.map(f => Array.from(f.bitmap)) : null,
    fps: State.fps || 10,
    includeInit,
    includeComments,
    dynamicAnalog,
    analogPin,
    widgets: placedWidgets
  };

  try {
    let code;
    if (useAI && window.electronAPI) {
      const result = await window.electronAPI.aiGenerateCode(config);
      code = result.success ? result.data : `// Error: ${result.error}`;
    } else if (window.electronAPI) {
      const result = await window.electronAPI.generateCode(config);
      code = result.success ? result.data : `// Error: ${result.error}`;
    } else {
      // Generación local básica
      code = generateCodeLocally(config);
    }

    document.getElementById('code-content').textContent = code;
    document.getElementById('export-platform-label').textContent = activePlatformBtn?.textContent || platform;
  } catch (err) {
    document.getElementById('code-content').textContent = `// Error al generar código: ${err.message}`;
  }
}

function generateCodeLocally(config) {
  const { platform, driver, width, height, interface: iface, i2cAddress, includeInit, includeComments, bitmap } = config;

  // Generar array de bytes del bitmap
  const bytes = [];
  const totalBits = width * height;
  for (let i = 0; i < totalBits; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8 && i + b < totalBits; b++) {
      if (bitmap[i + b]) byte |= (1 << (7 - b));
    }
    bytes.push(byte);
  }

  const hexBytes = bytes.map(b => `0x${b.toString(16).padStart(2,'0')}`);
  const bytesPerRow = 16;
  const byteRows = [];
  for (let i = 0; i < hexBytes.length; i += bytesPerRow) {
    byteRows.push('  ' + hexBytes.slice(i, i + bytesPerRow).join(', '));
  }
  const bitmapStr = byteRows.join(',\n');

  switch (platform) {
    case 'arduino_adafruit':
      return generateArduinoAdafruit(config, bitmapStr, bytes.length);
    case 'u8g2':
      return generateU8g2(config, bitmapStr, bytes.length);
    case 'c_array':
      return generateCArray(config, bitmapStr, bytes.length);
    case 'micropython':
      return generateMicroPython(config, bytes);
    case 'circuitpython':
      return generateCircuitPython(config, bytes);
    case 'javascript':
      return generateJavaScript(config, bitmap);
    case 'rust':
      return generateRust(config, bitmapStr, bytes.length);
    default:
      return generateCArray(config, bitmapStr, bytes.length);
  }
}

function generateArduinoAdafruit(cfg, bitmapStr, byteCount) {
  const addr = cfg.i2cAddress || '0x3C';
  const iface = cfg.interface === 'SPI' ? 'SPI' : 'I2C';
  const isDynamicAnalog = !!cfg.dynamicAnalog;
  const analogPin = cfg.analogPin || 'A0';
  const widgets = Array.isArray(cfg.widgets) ? cfg.widgets : [];
  const progBarWidget = widgets.find(w => w.id === 'prog_bar' || /barra|progress/i.test(w.name || ''));
  const gaugeWidget = widgets.find(w => w.id === 'gauge_dial' || /tac|gauge/i.test(w.name || ''));

  const pbX = progBarWidget ? Math.round(progBarWidget.x) : Math.max(0, Math.round((cfg.width - 64) / 2));
  const pbY = progBarWidget ? Math.round(progBarWidget.y) : Math.max(0, cfg.height - 12);
  const pbW = progBarWidget ? Math.max(16, Math.round(progBarWidget.w)) : 64;
  const pbH = progBarWidget ? Math.max(6, Math.round(progBarWidget.h)) : 8;

  const gCX = gaugeWidget ? Math.round(gaugeWidget.x + gaugeWidget.w / 2) : Math.round(cfg.width / 2);
  const gCY = gaugeWidget ? Math.round(gaugeWidget.y + gaugeWidget.h) : Math.round(cfg.height - 4);
  const gRadius = gaugeWidget ? Math.max(10, Math.round(gaugeWidget.w / 2)) : 16;

  const lines = [
    `// OLED Designer — Arduino + Adafruit GFX`,
    `// Driver: ${cfg.driver} | ${cfg.width}x${cfg.height} | ${iface}`,
    `// Generado: ${new Date().toLocaleDateString()}`,
    ``,
    `#include <Wire.h>`,
    `#include <Adafruit_GFX.h>`,
    `#include <Adafruit_SSD1306.h>`,
    ``,
    `#define SCREEN_WIDTH  ${cfg.width}`,
    `#define SCREEN_HEIGHT ${cfg.height}`,
    `#define OLED_RESET    -1`,
    `#define SCREEN_ADDRESS ${addr}`
  ];

  if (isDynamicAnalog) {
    lines.push(
      `#define SENSOR_ANALOG_PIN  ${analogPin}  // Pin analógico asignado para lectura en vivo`,
      ``,
      `Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);`,
      ``,
      gaugeWidget ?
        `// Dibuja un Tacómetro Dial según porcentaje (0% - 100%)
void drawGauge(int cx, int cy, int radius, int percent) {
  percent = constrain(percent, 0, 100);
  for (int a = 180; a <= 360; a += 6) {
    float rad = a * 0.0174533;
    display.drawPixel(cx + cos(rad) * radius, cy + sin(rad) * radius, SSD1306_WHITE);
  }
  float needleRad = (180.0 + (percent / 100.0) * 180.0) * 0.0174533;
  int nx = cx + cos(needleRad) * (radius - 3);
  int ny = cy + sin(needleRad) * (radius - 3);
  display.drawLine(cx, cy, nx, ny, SSD1306_WHITE);
  display.fillCircle(cx, cy, 2, SSD1306_WHITE);
}`
        :
        `// Dibuja una Barra de Progreso dinámica según porcentaje (0% - 100%)
void drawProgressBar(int x, int y, int w, int h, int percent) {
  percent = constrain(percent, 0, 100);
  display.drawRect(x, y, w, h, SSD1306_WHITE); // Borde exterior
  int innerW = w - 4;
  int innerH = h - 4;
  display.fillRect(x + 2, y + 2, innerW, innerH, SSD1306_BLACK); // Limpiar interior
  int fillW = map(percent, 0, 100, 0, innerW);
  if (fillW > 0) {
    display.fillRect(x + 2, y + 2, fillW, innerH, SSD1306_WHITE); // Llenado proporcional
  }
}`
    );
  } else {
    lines.push(
      ``,
      `Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);`
    );
  }

  lines.push(
    ``,
    `// Bitmap generado — ${byteCount} bytes (${cfg.width}x${cfg.height})`,
    `static const uint8_t PROGMEM oled_bitmap[] = {`,
    bitmapStr,
    `};`,
    ``,
    `void setup() {`,
    `  Serial.begin(115200);`,
    isDynamicAnalog ? `  pinMode(SENSOR_ANALOG_PIN, INPUT);` : ``,
    `  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {`,
    `    Serial.println(F("Error: SSD1306 no encontrado"));`,
    `    for (;;);`,
    `  }`,
    ``,
    `  display.clearDisplay();`,
    `  display.drawBitmap(0, 0, oled_bitmap, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);`,
    `  display.display();`,
    `}`,
    ``,
    isDynamicAnalog ?
      `void loop() {
  // 1. Leer el pin analógico (${analogPin})
  int rawValue = analogRead(SENSOR_ANALOG_PIN);

  // 2. Mapear lectura analógica a porcentaje (0% - 100%)
  int maxAdc = 1023; // Ajusta a 4095 si usas ESP32
  int percent = map(rawValue, 0, maxAdc, 0, 100);
  percent = constrain(percent, 0, 100);

  // 3. Monitoreo por consola serial
  Serial.print(F("Sensor [${analogPin}]: "));
  Serial.print(rawValue);
  Serial.print(F(" -> "));
  Serial.print(percent);
  Serial.println(F("%"));

  // 4. Actualizar pantalla OLED con el widget dinámico
  display.clearDisplay();
  display.drawBitmap(0, 0, oled_bitmap, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);
  ${gaugeWidget ? `drawGauge(${gCX}, ${gCY}, ${gRadius}, percent);` : `drawProgressBar(${pbX}, ${pbY}, ${pbW}, ${pbH}, percent);`}
  display.display();

  delay(30); // Frecuencia de actualización (~33 FPS)
}`
      :
      `void loop() {
  // El diseño ya está activo en pantalla
  delay(1000);
}`
  );

  return lines.filter(Boolean).join('\n');
}

function generateU8g2(cfg, bitmapStr, byteCount) {
  return [
    `// OLED Designer — U8g2`,
    `// Driver: ${cfg.driver} | ${cfg.width}x${cfg.height}`,
    ``,
    `#include <U8g2lib.h>`,
    `#include <Wire.h>`,
    ``,
    `U8G2_SSD1306_${cfg.width}X${cfg.height}_NONAME_F_HW_I2C u8g2(U8G2_R0, U8X8_PIN_NONE);`,
    ``,
    `static const uint8_t bitmap[] PROGMEM = {`,
    bitmapStr,
    `};`,
    ``,
    `void setup() {`,
    `  u8g2.begin();`,
    `}`,
    ``,
    `void loop() {`,
    `  u8g2.clearBuffer();`,
    `  u8g2.drawXBMP(0, 0, ${cfg.width}, ${cfg.height}, bitmap);`,
    `  u8g2.sendBuffer();`,
    `  delay(1000);`,
    `}`
  ].join('\n');
}

function generateCArray(cfg, bitmapStr, byteCount) {
  return [
    `// OLED Designer — C Array (${cfg.width}x${cfg.height})`,
    `// Total: ${byteCount} bytes`,
    `// Uso: display.drawBitmap(0, 0, oled_bitmap, ${cfg.width}, ${cfg.height}, 1);`,
    ``,
    `#include <stdint.h>`,
    ``,
    `static const uint8_t oled_bitmap[${byteCount}] PROGMEM = {`,
    bitmapStr,
    `};`
  ].join('\n');
}

function generateMicroPython(cfg, bytes) {
  const byteStr = bytes.map(b => b.toString()).join(', ');
  return [
    `# OLED Designer — MicroPython`,
    `# Driver: ${cfg.driver} | ${cfg.width}x${cfg.height} | I2C`,
    ``,
    `from machine import Pin, I2C`,
    `import ssd1306`,
    `import framebuf`,
    ``,
    `i2c = I2C(0, scl=Pin(22), sda=Pin(21), freq=400000)`,
    `oled = ssd1306.SSD1306_I2C(${cfg.width}, ${cfg.height}, i2c)`,
    ``,
    `# Bitmap ${cfg.width}x${cfg.height} — ${bytes.length} bytes`,
    `bitmap_data = bytearray([${byteStr}])`,
    `fb = framebuf.FrameBuffer(bitmap_data, ${cfg.width}, ${cfg.height}, framebuf.MONO_HLSB)`,
    ``,
    `oled.fill(0)`,
    `oled.blit(fb, 0, 0)`,
    `oled.show()`
  ].join('\n');
}

function generateCircuitPython(cfg, bytes) {
  const byteStr = bytes.join(', ');
  return [
    `# OLED Designer — CircuitPython`,
    `# Driver: ${cfg.driver} | ${cfg.width}x${cfg.height}`,
    ``,
    `import board, busio, framebuf`,
    `import adafruit_ssd1306`,
    ``,
    `i2c = busio.I2C(board.SCL, board.SDA)`,
    `oled = adafruit_ssd1306.SSD1306_I2C(${cfg.width}, ${cfg.height}, i2c)`,
    ``,
    `bitmap_data = bytearray([${byteStr}])`,
    `fb = framebuf.FrameBuffer(bitmap_data, ${cfg.width}, ${cfg.height}, framebuf.MONO_HLSB)`,
    ``,
    `oled.fill(0)`,
    `oled.blit(fb, 0, 0)`,
    `oled.show()`
  ].join('\n');
}

function generateJavaScript(cfg, bitmap) {
  const pixels = bitmap.map(v => v ? '1' : '0').join('');
  return [
    `// OLED Designer — JavaScript/Canvas Simulator`,
    `// ${cfg.width}x${cfg.height} display`,
    ``,
    `const canvas = document.getElementById('oled');`,
    `const ctx = canvas.getContext('2d');`,
    `const W = ${cfg.width}, H = ${cfg.height}, SCALE = 4;`,
    `canvas.width = W * SCALE; canvas.height = H * SCALE;`,
    ``,
    `const pixels = '${pixels}';`,
    ``,
    `ctx.fillStyle = '#000';`,
    `ctx.fillRect(0, 0, canvas.width, canvas.height);`,
    `ctx.fillStyle = '#fff';`,
    `for (let i = 0; i < pixels.length; i++) {`,
    `  if (pixels[i] === '1') {`,
    `    const x = i % W, y = Math.floor(i / W);`,
    `    ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);`,
    `  }`,
    `}`
  ].join('\n');
}

function generateRust(cfg, bitmapStr, byteCount) {
  return [
    `// OLED Designer — Rust (embedded-graphics)`,
    `// Driver: ${cfg.driver} | ${cfg.width}x${cfg.height}`,
    `// Cargo.toml: embedded-graphics = "0.8"`,
    ``,
    `use embedded_graphics::{`,
    `    image::{Image, ImageRaw},`,
    `    pixelcolor::BinaryColor,`,
    `    prelude::*,`,
    `};`,
    ``,
    `const OLED_BITMAP: &[u8] = &[`,
    bitmapStr,
    `];`,
    ``,
    `fn draw_oled<D: DrawTarget<Color = BinaryColor>>(display: &mut D) {`,
    `    let raw = ImageRaw::<BinaryColor>::new(OLED_BITMAP, ${cfg.width});`,
    `    let image = Image::new(&raw, Point::zero());`,
    `    image.draw(display).unwrap();`,
    `}`
  ].join('\n');
}

function copyCode() {
  const code = document.getElementById('code-content').textContent;
  navigator.clipboard.writeText(code).then(() => {
    showToast('Código copiado al portapapeles', 'success');
  });
}

async function saveCodeToFile() {
  const code = document.getElementById('code-content').textContent;
  const platform = document.querySelector('.platform-btn.active')?.dataset.platform || 'code';

  const extensions = {
    arduino_adafruit: 'ino', u8g2: 'ino', c_array: 'h',
    micropython: 'py', circuitpython: 'py', javascript: 'js', rust: 'rs'
  };
  const ext = extensions[platform] || 'txt';

  if (window.electronAPI) {
    const result = await window.electronAPI.saveFileDialog({
      title: 'Guardar Código',
      defaultPath: `oled_${State.width}x${State.height}.${ext}`,
      filters: [{ name: `Archivo .${ext}`, extensions: [ext] }]
    });

    if (!result.canceled) {
      await window.electronAPI.writeFile(result.filePath, code);
      showToast(`Código guardado: ${result.filePath.split(/[\\/]/).pop()}`, 'success');
    }
  } else {
    // Fallback navegador
    const blob = new Blob([code], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `oled_code.${ext}`;
    a.click();
  }
}

async function aiGenerateCode() {
  openModal('modal-export');
  document.getElementById('export-ai-mode').checked = true;
  await generateAndShowCode();
}

// ============================================================
// GESTIÓN DE ARDUINO & SUBIDA DE CÓDIGO A HARDWARE
// ============================================================

let detectedArduinoPorts = [];

async function refreshArduinoPorts() {
  const portSelect = document.getElementById('arduino-port-select');
  const hwPortSelect = document.getElementById('hw-serial-port-select');
  const statusBadge = document.getElementById('arduino-detected-label');

  if (portSelect) portSelect.innerHTML = '<option value="">Detectando puertos...</option>';
  if (hwPortSelect) hwPortSelect.innerHTML = '<option value="">Detectando puertos...</option>';
  if (statusBadge) statusBadge.textContent = 'Buscando placas...';

  if (!window.electronAPI?.listArduinoPorts) {
    if (statusBadge) statusBadge.textContent = 'Modo Web (sin acceso a USB)';
    return;
  }

  try {
    const res = await window.electronAPI.listArduinoPorts();
    detectedArduinoPorts = (res && res.success && res.ports) ? res.ports : [];

    const populate = (sel) => {
      if (!sel) return;
      sel.innerHTML = '';
      if (detectedArduinoPorts.length === 0) {
        sel.innerHTML = '<option value="">No se detectaron puertos COM</option>';
        return;
      }

      let selectedAny = false;
      for (const p of detectedArduinoPorts) {
        const opt = document.createElement('option');
        opt.value = p.port;
        opt.textContent = `${p.port} — ${p.name || 'Dispositivo Serial'}`;
        if (p.isArduino && !selectedAny) {
          opt.selected = true;
          selectedAny = true;
          if (p.fqbn) {
            const boardSel = document.getElementById('arduino-board-select');
            if (boardSel) boardSel.value = p.fqbn;
          }
        }
        sel.appendChild(opt);
      }
    };

    populate(portSelect);
    populate(hwPortSelect);

    const primaryArduino = detectedArduinoPorts.find(p => p.isArduino) || detectedArduinoPorts[0];
    if (primaryArduino) {
      updateI2CPinoutDisplay(primaryArduino);
    } else {
      updateI2CPinoutDisplay('arduino:avr:mega');
    }

    if (statusBadge) {
      if (primaryArduino && primaryArduino.isArduino) {
        statusBadge.textContent = `Placa: ${primaryArduino.name} (${primaryArduino.port})`;
        statusBadge.style.color = '#34d399';
        statusBadge.style.borderColor = '#10b981';
      } else if (detectedArduinoPorts.length > 0) {
        statusBadge.textContent = `${detectedArduinoPorts.length} puerto(s) COM detectado(s)`;
        statusBadge.style.color = '#a5b4fc';
        statusBadge.style.borderColor = 'rgba(99, 102, 241, 0.3)';
      } else {
        statusBadge.textContent = 'Sin conexión (conecta tu Arduino por USB)';
        statusBadge.style.color = '#f87171';
        statusBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      }
    }
  } catch (err) {
    console.error('[refreshArduinoPorts error]:', err);
    if (statusBadge) statusBadge.textContent = 'Error al escanear puertos';
  }
}

function updateI2CPinoutDisplay(target) {
  let pinInfo = null;

  if (typeof target === 'string') {
    const matched = detectedArduinoPorts.find(p => p.port === target || p.fqbn === target);
    if (matched && matched.i2cPins) {
      pinInfo = matched.i2cPins;
    }
  } else if (target && target.i2cPins) {
    pinInfo = target.i2cPins;
  }

  if (!pinInfo) {
    const fqbn = (typeof target === 'string' && target.includes(':'))
      ? target
      : (document.getElementById('arduino-board-select')?.value || 'arduino:avr:mega');

    if (fqbn.includes('mega')) {
      pinInfo = {
        board: 'Arduino Mega 2560',
        sda: 'Pin 20',
        scl: 'Pin 21',
        vcc: '5V',
        gnd: 'GND',
        note: '¡En Arduino MEGA los pines I2C son el Pin 20 (SDA) y Pin 21 (SCL)! NO usar A4 y A5.'
      };
    } else if (fqbn.includes('uno')) {
      pinInfo = {
        board: 'Arduino Uno',
        sda: 'Pin A4',
        scl: 'Pin A5',
        vcc: '5V',
        gnd: 'GND',
        note: 'En Arduino UNO los pines I2C son Pin A4 (SDA) y Pin A5 (SCL).'
      };
    } else if (fqbn.includes('nano')) {
      pinInfo = {
        board: 'Arduino Nano',
        sda: 'Pin A4',
        scl: 'Pin A5',
        vcc: '5V',
        gnd: 'GND',
        note: 'En Arduino Nano los pines I2C son Pin A4 (SDA) y Pin A5 (SCL).'
      };
    } else if (fqbn.includes('esp32')) {
      pinInfo = {
        board: 'ESP32 Dev Module',
        sda: 'GPIO 21',
        scl: 'GPIO 22',
        vcc: '3.3V',
        gnd: 'GND',
        note: 'En ESP32 los pines I2C predeterminados son GPIO 21 (SDA) y GPIO 22 (SCL).'
      };
    }
  }

  if (!pinInfo) return;

  const updateCard = (prefix) => {
    const boardEl = document.getElementById(`${prefix}-board-name`);
    const sdaEl = document.getElementById(`${prefix}-pin-sda`);
    const sclEl = document.getElementById(`${prefix}-pin-scl`);
    const vccEl = document.getElementById(`${prefix}-pin-vcc`);
    const gndEl = document.getElementById(`${prefix}-pin-gnd`);
    const noteEl = document.getElementById(`${prefix}-pin-note`);

    if (boardEl) boardEl.textContent = pinInfo.board || 'Placa Detectada';
    if (sdaEl) sdaEl.textContent = pinInfo.sda || 'Pin 20';
    if (sclEl) sclEl.textContent = pinInfo.scl || 'Pin 21';
    if (vccEl) vccEl.textContent = pinInfo.vcc || '5V';
    if (gndEl) gndEl.textContent = pinInfo.gnd || 'GND';
    if (noteEl) noteEl.innerHTML = pinInfo.note ? `⚡ ${pinInfo.note}` : '';
  };

  updateCard('hw-i2c');
  updateCard('export-i2c');
}

async function uploadCodeToArduino() {
  const port = document.getElementById('arduino-port-select')?.value;
  const fqbn = document.getElementById('arduino-board-select')?.value || 'arduino:avr:mega';
  const logBox = document.getElementById('arduino-upload-log');
  const btnUpload = document.getElementById('btn-upload-arduino');

  if (!port) {
    showToast('Selecciona un puerto COM válido para subir el código', 'warning');
    return;
  }

  let code = document.getElementById('code-content')?.textContent;
  if (!code || code.includes('Haz clic en "Generar"')) {
    showToast('Generando código para el display...', 'info');
    await generateAndShowCode();
    code = document.getElementById('code-content')?.textContent;
  }

  if (logBox) {
    logBox.classList.remove('hidden', 'success', 'error');
    logBox.textContent = `Compilando y subiendo a ${port} (${fqbn})...\nPor favor espera unos segundos...`;
  }
  if (btnUpload) {
    btnUpload.disabled = true;
    btnUpload.textContent = '⏳ Subiendo...';
  }

  if (typeof disconnectHardware === 'function') {
    await disconnectHardware();
  }

  try {
    const res = await window.electronAPI.uploadArduinoCode({
      code,
      port,
      fqbn
    });

    if (res && res.success) {
      if (logBox) {
        logBox.classList.add('success');
        logBox.textContent = `✓ ¡Éxito! Código compilado y subido correctamente a ${port}.\n\n${res.output || ''}`;
      }
      showToast(`¡Código subido exitosamente a ${port}! ✓`, 'success');
    } else {
      if (logBox) {
        logBox.classList.add('error');
        logBox.textContent = `✖ Error al subir a ${port}:\n\n${res.error || res.output || 'Error desconocido'}`;
      }
      showToast(`Error de subida a ${port}`, 'error');
    }
  } catch (err) {
    if (logBox) {
      logBox.classList.add('error');
      logBox.textContent = `Error: ${err.message}`;
    }
    showToast(`Fallo en la comunicación: ${err.message}`, 'error');
  } finally {
    if (btnUpload) {
      btnUpload.disabled = false;
      btnUpload.textContent = '⚡ Subir a Placa';
    }
  }
}

async function openInArduinoIDE() {
  let code = document.getElementById('code-content')?.textContent;
  if (!code || code.includes('Haz clic en "Generar"')) {
    await generateAndShowCode();
    code = document.getElementById('code-content')?.textContent;
  }

  try {
    const res = await window.electronAPI.openInArduinoIDE({
      code,
      projectName: State.projectName || 'OLED_Display_Project'
    });

    if (res && res.success) {
      showToast(`Sketch creado y abierto: ${res.path}`, 'success');
    } else {
      showToast(`No se pudo abrir el IDE: ${res.error}`, 'warning');
    }
  } catch (e) {
    showToast(`Error: ${e.message}`, 'error');
  }
}

// ============================================================
// EXPORTAR IMAGEN (PNG Estándar y PNG 1-Bit Monocromo Real)
// ============================================================

// Tabla CRC32 para codificación PNG
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(buf) {
  let s1 = 1, s2 = 0;
  for (let i = 0; i < buf.length; i++) {
    s1 = (s1 + buf[i]) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  return ((s2 << 16) | s1) >>> 0;
}

// Codificador nativo PNG 1-bit monocromo puro (W3C standard)
function build1BitPNG(width, height, getPixelFn) {
  const sig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

  function makeChunk(name, data) {
    const len = data.length;
    const chunk = new Uint8Array(12 + len);
    chunk[0] = (len >>> 24) & 0xff;
    chunk[1] = (len >>> 16) & 0xff;
    chunk[2] = (len >>> 8) & 0xff;
    chunk[3] = len & 0xff;
    for (let i = 0; i < 4; i++) chunk[4 + i] = name.charCodeAt(i);
    chunk.set(data, 8);
    const crcVal = crc32(chunk.subarray(4, 8 + len));
    const off = 8 + len;
    chunk[off]     = (crcVal >>> 24) & 0xff;
    chunk[off + 1] = (crcVal >>> 16) & 0xff;
    chunk[off + 2] = (crcVal >>> 8) & 0xff;
    chunk[off + 3] = crcVal & 0xff;
    return chunk;
  }

  // IHDR: depth 1, colorType 0 (grayscale: 0=black, 1=white)
  const ihdr = new Uint8Array(13);
  ihdr[0] = (width >>> 24) & 0xff; ihdr[1] = (width >>> 16) & 0xff; ihdr[2] = (width >>> 8) & 0xff; ihdr[3] = width & 0xff;
  ihdr[4] = (height >>> 24) & 0xff; ihdr[5] = (height >>> 16) & 0xff; ihdr[6] = (height >>> 8) & 0xff; ihdr[7] = height & 0xff;
  ihdr[8] = 1;  // 1-bit por píxel
  ihdr[9] = 0;  // Grayscale monocromo
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  const rowBytes = Math.ceil(width / 8);
  const rawData = new Uint8Array(height * (1 + rowBytes));
  let idx = 0;
  for (let y = 0; y < height; y++) {
    rawData[idx++] = 0; // Filter 0 (None)
    let cur = 0, bits = 0;
    for (let x = 0; x < width; x++) {
      cur = (cur << 1) | (getPixelFn(x, y) ? 1 : 0);
      bits++;
      if (bits === 8) {
        rawData[idx++] = cur;
        cur = 0;
        bits = 0;
      }
    }
    if (bits > 0) {
      cur <<= (8 - bits);
      rawData[idx++] = cur;
    }
  }

  // Encapsular en bloques zlib sin compresión (RFC 1950 / RFC 1951)
  const MAX_BLOCK = 65535;
  const numBlocks = Math.ceil(rawData.length / MAX_BLOCK) || 1;
  const zlibLen = 2 + (numBlocks * 5) + rawData.length + 4;
  const zlibBuf = new Uint8Array(zlibLen);
  let zp = 0;
  zlibBuf[zp++] = 0x78;
  zlibBuf[zp++] = 0x01;

  for (let i = 0; i < rawData.length; i += MAX_BLOCK) {
    const chunkLen = Math.min(MAX_BLOCK, rawData.length - i);
    const isFinal = (i + chunkLen >= rawData.length) ? 1 : 0;
    zlibBuf[zp++] = isFinal;
    zlibBuf[zp++] = chunkLen & 0xff;
    zlibBuf[zp++] = (chunkLen >>> 8) & 0xff;
    const nlen = (~chunkLen) & 0xffff;
    zlibBuf[zp++] = nlen & 0xff;
    zlibBuf[zp++] = (nlen >>> 8) & 0xff;
    zlibBuf.set(rawData.subarray(i, i + chunkLen), zp);
    zp += chunkLen;
  }

  const adler = adler32(rawData);
  zlibBuf[zp++] = (adler >>> 24) & 0xff;
  zlibBuf[zp++] = (adler >>> 16) & 0xff;
  zlibBuf[zp++] = (adler >>> 8) & 0xff;
  zlibBuf[zp++] = adler & 0xff;

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', zlibBuf.subarray(0, zp));
  const iendChunk = makeChunk('IEND', new Uint8Array(0));

  const totalBytes = sig.length + ihdrChunk.length + idatChunk.length + iendChunk.length;
  const pngResult = new Uint8Array(totalBytes);
  let p = 0;
  pngResult.set(sig, p); p += sig.length;
  pngResult.set(ihdrChunk, p); p += ihdrChunk.length;
  pngResult.set(idatChunk, p); p += idatChunk.length;
  pngResult.set(iendChunk, p); p += iendChunk.length;
  return pngResult;
}

// Función auxiliar para obtener píxel compuesto (bitmap base + capas de texto)
function getComposedPixel(x, y) {
  if (State.bitmap[y * State.width + x]) return 1;
  if (State.textElements && State.textElements.length > 0) {
    for (const layer of State.textElements) {
      const b = getTextBounds(layer.text, layer.x, layer.y, layer.size, layer.align);
      if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) {
        const relX = x - b.x;
        const relY = y - b.y;
        const charIdx = Math.floor(relX / (6 * layer.size));
        const char = layer.text[charIdx] || ' ';
        const glyph = FONT_5x7[char] || FONT_5x7[' '];
        const col = Math.floor((relX % (6 * layer.size)) / layer.size);
        const row = Math.floor(relY / layer.size);
        if (col < 5 && row < 7 && (glyph[col] & (1 << row))) return 1;
      }
    }
  }
  return 0;
}

async function exportCanvasToPng1Bit() {
  const pngBytes = build1BitPNG(State.width, State.height, getComposedPixel);

  if (window.electronAPI) {
    const result = await window.electronAPI.saveFileDialog({
      title: 'Exportar Imagen PNG 1-Bit Monocromo',
      defaultPath: `oled_${State.width}x${State.height}_1bit.png`,
      filters: [{ name: 'PNG 1-bit Monocromo (*.png)', extensions: ['png'] }]
    });

    if (!result.canceled && result.filePath) {
      let binaryStr = '';
      for (let i = 0; i < pngBytes.length; i++) binaryStr += String.fromCharCode(pngBytes[i]);
      const b64 = btoa(binaryStr);
      await window.electronAPI.writeBinary(result.filePath, b64);
      showToast(`PNG 1-bit guardado: ${result.filePath.split(/[\\/]/).pop()}`, 'success');
    }
  } else {
    const blob = new Blob([pngBytes], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oled_${State.width}x${State.height}_1bit.png`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('PNG 1-bit descargado ✓', 'success');
  }
}

async function exportImage() {
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = State.width;
  tmpCanvas.height = State.height;
  const tmpCtx = tmpCanvas.getContext('2d');

  const colors = DISPLAY_COLORS[State.displayColor];
  tmpCtx.fillStyle = colors.bg;
  tmpCtx.fillRect(0, 0, State.width, State.height);
  tmpCtx.fillStyle = colors.pixel;

  for (let y = 0; y < State.height; y++) {
    for (let x = 0; x < State.width; x++) {
      if (getComposedPixel(x, y)) {
        tmpCtx.fillRect(x, y, 1, 1);
      }
    }
  }

  const dataURL = tmpCanvas.toDataURL('image/png');

  if (window.electronAPI) {
    const result = await window.electronAPI.saveFileDialog({
      title: 'Exportar Imagen PNG',
      defaultPath: `oled_${State.width}x${State.height}.png`,
      filters: [{ name: 'PNG', extensions: ['png'] }]
    });

    if (!result.canceled) {
      const base64 = dataURL.replace(/^data:image\/png;base64,/, '');
      await window.electronAPI.writeBinary(result.filePath, base64);
      showToast('Imagen exportada ✓', 'success');
    }
  } else {
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `oled_${State.width}x${State.height}.png`;
    a.click();
  }
}

// ============================================================
// SIMULACIÓN DE HARDWARE FÍSICO (OLED Físico con PCB y Cristal)
// ============================================================

function openHardwarePreview() {
  openModal('modal-hardware');
  renderHardwareDisplay();
}

function renderHardwareDisplay() {
  const hwCanvas = document.getElementById('hardware-canvas');
  if (!hwCanvas) return;
  hwCanvas.width = State.width;
  hwCanvas.height = State.height;
  const hwCtx = hwCanvas.getContext('2d');

  // Fondo cristal OLED apagado (casi negro con sutil profundidad)
  hwCtx.fillStyle = '#020305';
  hwCtx.fillRect(0, 0, State.width, State.height);

  const activePill = document.querySelector('.hw-pill.active');
  const hwColorMode = activePill ? activePill.dataset.hwcolor : State.displayColor;

  for (let y = 0; y < State.height; y++) {
    for (let x = 0; x < State.width; x++) {
      if (getComposedPixel(x, y)) {
        let pixelColor = '#ffffff';

        if (hwColorMode === 'blue') {
          pixelColor = '#29b6f6';
        } else if (hwColorMode === 'yellow') {
          pixelColor = '#ffca28';
        } else if (hwColorMode === 'yellow_blue') {
          // Clásico OLED dual: 16 filas amarillas arriba, resto azul abajo
          pixelColor = (y < 16) ? '#ffca28' : '#29b6f6';
        } else if (hwColorMode === 'green') {
          pixelColor = '#00e676';
        } else if (hwColorMode === 'rgb') {
          const hue = Math.floor((x / State.width) * 360);
          pixelColor = `hsl(${hue}, 100%, 65%)`;
        }

        hwCtx.fillStyle = pixelColor;
        hwCtx.fillRect(x, y, 1, 1);
      }
    }
  }

  // Actualizar serigrafía PCB
  const label = document.getElementById('hw-pcb-label');
  if (label) {
    label.textContent = `${State.width}x${State.height} · ${State.driverName} · ${State.interfaceType}`;
  }
}

async function downloadHardwarePhoto() {
  const hwCanvas = document.getElementById('hardware-canvas');
  if (!hwCanvas) return;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = 680;
  outCanvas.height = 480;
  const octx2 = outCanvas.getContext('2d');

  // Fondo mesa de trabajo
  const grad = octx2.createRadialGradient(340, 240, 50, 340, 240, 350);
  grad.addColorStop(0, '#1c2230');
  grad.addColorStop(1, '#0c0e14');
  octx2.fillStyle = grad;
  octx2.fillRect(0, 0, 680, 480);

  // Dibujar PCB
  const pcbStyle = document.getElementById('hw-pcb-style')?.value || 'blue';
  octx2.fillStyle = pcbStyle === 'black' ? '#1c1c22' : pcbStyle === 'purple' ? '#3b1050' : '#103366';
  octx2.strokeStyle = pcbStyle === 'black' ? '#33333d' : pcbStyle === 'purple' ? '#641c86' : '#1a4d94';
  octx2.lineWidth = 2;
  octx2.beginPath();
  octx2.roundRect(170, 120, 340, 240, 10);
  octx2.fill();
  octx2.stroke();

  // Orificios
  octx2.fillStyle = '#0a0b0e';
  octx2.strokeStyle = '#d4af37';
  octx2.lineWidth = 2;
  [[180, 130], [490, 130], [180, 340], [490, 340]].forEach(([hx, hy]) => {
    octx2.beginPath();
    octx2.arc(hx, hy, 6, 0, Math.PI * 2);
    octx2.fill();
    octx2.stroke();
  });

  // Pines de cabecera
  octx2.fillStyle = 'rgba(0,0,0,0.3)';
  octx2.fillRect(260, 126, 160, 20);
  octx2.fillStyle = '#ffdf78';
  octx2.strokeStyle = '#b8860b';
  octx2.lineWidth = 1;
  const pinLabels = ['GND', 'VCC', 'SCL', 'SDA'];
  pinLabels.forEach((pin, i) => {
    const px = 280 + i * 40;
    octx2.beginPath();
    octx2.arc(px, 136, 4, 0, Math.PI * 2);
    octx2.fill();
    octx2.stroke();
    octx2.fillStyle = '#ffffff';
    octx2.font = 'bold 8px monospace';
    octx2.textAlign = 'center';
    octx2.fillText(pin, px, 153);
    octx2.fillStyle = '#ffdf78';
  });

  // Cristal OLED
  octx2.fillStyle = '#020305';
  octx2.strokeStyle = '#222';
  octx2.lineWidth = 4;
  octx2.beginPath();
  octx2.roundRect(200, 170, 280, 144, 4);
  octx2.fill();
  octx2.stroke();

  // Dibujar pantalla escalada
  octx2.imageSmoothingEnabled = false;
  octx2.drawImage(hwCanvas, 206, 176, 268, 132);

  // Serigrafía PCB
  octx2.fillStyle = 'rgba(255,255,255,0.7)';
  octx2.font = '10px monospace';
  octx2.textAlign = 'center';
  octx2.fillText(`${State.width}x${State.height} OLED · ${State.driverName} · ${State.interfaceType}`, 340, 342);

  const dataURL = outCanvas.toDataURL('image/png');
  if (window.electronAPI) {
    const res = await window.electronAPI.saveFileDialog({
      title: 'Guardar Foto de Simulación de Hardware',
      defaultPath: `oled_hardware_${State.width}x${State.height}.png`,
      filters: [{ name: 'PNG Image (*.png)', extensions: ['png'] }]
    });
    if (!res.canceled && res.filePath) {
      const b64 = dataURL.replace(/^data:image\/png;base64,/, '');
      await window.electronAPI.writeBinary(res.filePath, b64);
      showToast('Foto de hardware guardada ✓', 'success');
    }
  } else {
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `oled_hardware_${State.width}x${State.height}.png`;
    a.click();
    showToast('Foto descargada ✓', 'success');
  }
}

// ============================================================
// VERSIONES
// ============================================================

async function openVersionHistory() {
  openModal('modal-versions');
  const list = document.getElementById('version-list');
  list.innerHTML = '<div class="loading-spinner">Cargando...</div>';

  if (!State.projectId) {
    list.innerHTML = '<div class="pinout-loading">Guarda el proyecto primero</div>';
    return;
  }

  try {
    const result = await window.electronAPI?.getVersionHistory(State.projectId);
    if (!result?.success || !result.data?.length) {
      list.innerHTML = '<div class="pinout-loading">Sin versiones guardadas</div>';
      return;
    }

    list.innerHTML = '';
    result.data.forEach(v => {
      const item = document.createElement('div');
      item.className = 'version-item';
      item.innerHTML = `
        <span class="version-num">v${v.version_number}</span>
        <span class="version-date">${formatDate(v.created_at)}</span>
        <button class="project-btn">Restaurar</button>
      `;
      item.querySelector('button').addEventListener('click', async () => {
        if (confirm(`¿Restaurar versión ${v.version_number}?`)) {
          const r = await window.electronAPI.restoreVersion(State.projectId, v.id);
          if (r.success) {
            State.bitmap = base64ToBitmap(v.canvas_data, State.width, State.height);
            markDirty();
            renderCanvas();
            renderPreview();
            closeModal('modal-versions');
            showToast(`Versión ${v.version_number} restaurada`, 'success');
          }
        }
      });
      list.appendChild(item);
    });
  } catch (err) {
    list.innerHTML = `<div class="pinout-loading">Error: ${err.message}</div>`;
  }
}

// ============================================================
// PINOUT
// ============================================================

async function loadPinout() {
  const container = document.getElementById('pinout-table');
  container.innerHTML = '<div class="pinout-loading">Cargando...</div>';

  try {
    let pinouts = [];

    if (window.electronAPI && State.driverId) {
      const result = await window.electronAPI.getPinouts(State.driverId, State.interfaceType);
      if (result.success) pinouts = result.data;
    }

    if (!pinouts.length) {
      // Pinout hardcoded de respaldo
      pinouts = getDefaultPinout(State.driverName, State.interfaceType);
    }

    if (!pinouts.length) {
      container.innerHTML = '<div class="pinout-loading">Sin datos para este driver/interfaz</div>';
      return;
    }

    container.innerHTML = '';
    pinouts.forEach(pin => {
      const row = document.createElement('div');
      row.className = 'pinout-row';
      row.innerHTML = `
        <div class="pinout-dot" style="background:${pin.color || '#888'}"></div>
        <div class="pinout-name">${pin.pin_name}</div>
        <div class="pinout-arduino">${pin.arduino_pin || '—'}</div>
      `;
      row.title = pin.description || '';
      container.appendChild(row);
    });
  } catch (err) {
    container.innerHTML = `<div class="pinout-loading">Error: ${err.message}</div>`;
  }
}

function getDefaultPinout(driver, iface) {
  const i2c = [
    { pin_name: 'VCC', arduino_pin: '3.3V / 5V', color: '#FF4444', description: 'Alimentación' },
    { pin_name: 'GND', arduino_pin: 'GND',        color: '#444444', description: 'Tierra' },
    { pin_name: 'SCL', arduino_pin: 'A5 / SCL',   color: '#4488FF', description: 'Reloj I2C' },
    { pin_name: 'SDA', arduino_pin: 'A4 / SDA',   color: '#44FF88', description: 'Datos I2C' }
  ];
  const spi = [
    { pin_name: 'VCC', arduino_pin: '3.3V / 5V', color: '#FF4444', description: 'Alimentación' },
    { pin_name: 'GND', arduino_pin: 'GND',        color: '#444444', description: 'Tierra' },
    { pin_name: 'D0',  arduino_pin: 'D13 (SCK)',  color: '#4488FF', description: 'Reloj SPI' },
    { pin_name: 'D1',  arduino_pin: 'D11 (MOSI)', color: '#44FF88', description: 'Datos SPI' },
    { pin_name: 'RST', arduino_pin: 'D9',          color: '#FFAA44', description: 'Reset' },
    { pin_name: 'DC',  arduino_pin: 'D8',          color: '#AA44FF', description: 'Data/Command' },
    { pin_name: 'CS',  arduino_pin: 'D10 (SS)',    color: '#FF44AA', description: 'Chip Select' }
  ];
  return iface === 'I2C' ? i2c : spi;
}

// ============================================================
// CARGA DE DATOS DESDE DB
// ============================================================

async function loadDriversFromDB() {
  try {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.getDrivers();
    if (result.success && result.data.length) {
      State.drivers = result.data;
      // Actualizar selector de drivers
      const select = document.getElementById('driver-select');
      select.innerHTML = '';
      result.data.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.name;
        opt.textContent = `${d.name} — ${d.description?.substring(0, 40)}...`;
        if (d.name === State.driverName) opt.selected = true;
        select.appendChild(opt);
      });
      // Guardar driver id actual
      const driver = result.data.find(d => d.name === State.driverName);
      if (driver) State.driverId = driver.id;
    }
  } catch {}
}

async function loadResolutionsFromDB() {
  try {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.getResolutions();
    if (result.success) State.resolutions = result.data;
  } catch {}
}

function updateDriverInfo() {
  const driver = State.drivers.find(d => d.name === State.driverName);
  if (driver) {
    State.driverId = driver.id;
    document.getElementById('driver-voltage').textContent = driver.voltage || '3.3V';
    document.getElementById('driver-color-support').textContent =
      driver.color_support === 'rgb' ? 'Color RGB' :
      driver.color_support === 'grayscale' ? 'Escala de grises' : 'Monocromo';
  }
}

// ============================================================
// DB STATUS
// ============================================================

async function checkDBStatus() {
  const indicator = document.getElementById('db-status-indicator');
  try {
    if (!window.electronAPI) {
      indicator.className = 'status-dot status-disconnected';
      indicator.title = 'Sin conexión a DB (modo local)';
      return;
    }
    const result = await window.electronAPI.getDBStatus();
    if (result.connected) {
      State.dbConnected = true;
      indicator.className = 'status-dot status-connected';
      indicator.title = 'PostgreSQL conectado';
    } else {
      throw new Error(result.error);
    }
  } catch {
    indicator.className = 'status-dot status-disconnected';
    indicator.title = 'Sin conexión a PostgreSQL (modo offline)';
  }
}

// ============================================================
// FIT ZOOM
// ============================================================

function fitZoom() {
  const wrapper = document.getElementById('canvas-wrapper');
  const zoomW = Math.floor(wrapper.clientWidth / State.width);
  const zoomH = Math.floor(wrapper.clientHeight / State.height);
  const fit = Math.min(zoomW, zoomH, 16);
  State.zoom = Math.max(1, fit);
  document.getElementById('zoom-display').textContent = `${State.zoom}×`;
  document.getElementById('zoom-status').textContent = `Zoom: ${State.zoom}×`;
  State.panX = 0;
  State.panY = 0;
  resizeCanvases();
  renderCanvas();
}

// ============================================================
// TOGGLE PREVIEW
// ============================================================

function togglePreview() {
  State.showPreview = !State.showPreview;
  const panel = document.getElementById('preview-panel');
  const btn = document.getElementById('btn-preview');
  panel.classList.toggle('hidden', !State.showPreview);
  btn.classList.toggle('active', State.showPreview);
  if (State.showPreview) renderPreview();
}

// ============================================================
// TOASTS
// ============================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 300ms';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// UTILS
// ============================================================

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
}

// ============================================================
// ARRANQUE
// ============================================================

window.updateI2CPinoutDisplay = updateI2CPinoutDisplay;
document.addEventListener('DOMContentLoaded', init);
