// ============================================================
// OLED Designer — Procesador de GIFs, Videos e Imágenes con Dithering
// renderer/gifDecoder.js
// ============================================================

const MediaImporter = {
  activeFile: null,
  extractedFrames: [], // Array de { canvas, bitmap, delayMs }
  threshold: 128,
  useDithering: true,
  autoContrast: true,
  invertColors: false,
  targetFps: 10,
  maxVideoFrames: 60
};

// Algoritmo de Dithering Floyd-Steinberg para Monocromo 1-bit
function floydSteinbergDither(ctx, width, height, threshold = 128, autoContrast = false, invert = false) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = width * height;
  const gray = new Float32Array(len);

  // 1. Extraer escala de grises
  let minG = 255, maxG = 0;
  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    const g = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    gray[i] = g;
    if (g < minG) minG = g;
    if (g > maxG) maxG = g;
  }

  // 2. Estiramiento de contraste automático (si está habilitado)
  if (autoContrast && maxG > minG) {
    const range = maxG - minG;
    for (let i = 0; i < len; i++) {
      gray[i] = ((gray[i] - minG) / range) * 255;
    }
  }

  // 3. Inversión si se solicita
  if (invert) {
    for (let i = 0; i < len; i++) {
      gray[i] = 255 - gray[i];
    }
  }

  const bitmap = new Uint8Array(len);

  // 4. Difusión de error Floyd-Steinberg
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldVal = gray[idx];
      const newVal = oldVal >= threshold ? 255 : 0;
      bitmap[idx] = newVal === 255 ? 1 : 0;
      const err = oldVal - newVal;

      if (x + 1 < width) gray[idx + 1] += err * (7 / 16);
      if (y + 1 < height) {
        if (x > 0) gray[(y + 1) * width + (x - 1)] += err * (3 / 16);
        gray[(y + 1) * width + x] += err * (5 / 16);
        if (x + 1 < width) gray[(y + 1) * width + (x + 1)] += err * (1 / 16);
      }
    }
  }

  return bitmap;
}

// Binarización simple por umbral (Global Thresholding)
function simpleThreshold(ctx, width, height, threshold = 128, autoContrast = false, invert = false) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = width * height;
  const bitmap = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    const idx = i * 4;
    let g = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    if (invert) g = 255 - g;
    bitmap[i] = g >= threshold ? 1 : 0;
  }
  return bitmap;
}

// Extraer fotogramas de un GIF usando canvas dinámico
async function processGifFile(file, targetW, targetH, options) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const img = new Image();
        img.src = reader.result;
        await img.decode();

        // Para imágenes GIF / APNG
        const frames = [];
        // Intentar parsear frames si ImageDecoder está disponible (Chrome / Edge / Electron moderno)
        if (typeof ImageDecoder !== 'undefined') {
          try {
            const response = await fetch(reader.result);
            const decoder = new ImageDecoder({ data: response.body, type: 'image/gif' });
            const frameCount = decoder.tracks.selectedTrack.frameCount;

            for (let i = 0; i < frameCount; i++) {
              const frame = await decoder.decode({ frameIndex: i });
              const c = document.createElement('canvas');
              c.width = targetW;
              c.height = targetH;
              const ctx = c.getContext('2d');
              ctx.drawImage(frame.image, 0, 0, targetW, targetH);

              const bitmap = options.useDithering
                ? floydSteinbergDither(ctx, targetW, targetH, options.threshold, options.autoContrast, options.invert)
                : simpleThreshold(ctx, targetW, targetH, options.threshold, options.autoContrast, options.invert);

              const duration = frame.duration ? Math.round(frame.duration / 1000) : 100;
              frames.push({ canvas: c, bitmap, durationMs: duration });
            }
            return resolve(frames);
          } catch (e) {
            console.warn('[GIF] ImageDecoder fallback:', e);
          }
        }

        // Fallback: 1 frame estático escalado
        const c = document.createElement('canvas');
        c.width = targetW;
        c.height = targetH;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const bitmap = options.useDithering
          ? floydSteinbergDither(ctx, targetW, targetH, options.threshold, options.autoContrast, options.invert)
          : simpleThreshold(ctx, targetW, targetH, options.threshold, options.autoContrast, options.invert);

        frames.push({ canvas: c, bitmap, durationMs: 100 });
        resolve(frames);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Extraer fotogramas de un archivo de Video (MP4, WebM)
async function processVideoFile(file, targetW, targetH, options) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration || 1;
        const fps = options.fps || 10;
        const totalFrames = Math.min(options.maxFrames || 60, Math.max(2, Math.floor(duration * fps)));
        const interval = duration / totalFrames;
        const frames = [];

        const c = document.createElement('canvas');
        c.width = targetW;
        c.height = targetH;
        const ctx = c.getContext('2d');

        for (let i = 0; i < totalFrames; i++) {
          video.currentTime = i * interval;
          await new Promise(r => { video.onseeked = r; });

          ctx.drawImage(video, 0, 0, targetW, targetH);

          const bitmap = options.useDithering
            ? floydSteinbergDither(ctx, targetW, targetH, options.threshold, options.autoContrast, options.invert)
            : simpleThreshold(ctx, targetW, targetH, options.threshold, options.autoContrast, options.invert);

          const fc = document.createElement('canvas');
          fc.width = targetW;
          fc.height = targetH;
          fc.getContext('2d').drawImage(c, 0, 0);

          frames.push({ canvas: fc, bitmap, durationMs: Math.round(interval * 1000) });
        }

        URL.revokeObjectURL(url);
        resolve(frames);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    video.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
  });
}

// Controlador del Modal de Importación
function openMediaImportModal() {
  openModal('modal-gif-import');
  initMediaImportUI();
}

function initMediaImportUI() {
  const fileInput = document.getElementById('gif-file-input');
  const dropZone = document.getElementById('gif-drop-zone');
  const thresholdSlider = document.getElementById('gif-threshold-range');
  const thresholdVal = document.getElementById('gif-threshold-val');
  const ditherCheck = document.getElementById('gif-dither-check');
  const contrastCheck = document.getElementById('gif-contrast-check');
  const invertCheck = document.getElementById('gif-invert-check');
  const applyBtn = document.getElementById('btn-apply-imported-frames');

  if (dropZone) {
    dropZone.onclick = () => fileInput?.click();
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); };
    dropZone.ondragleave = () => dropZone.classList.remove('drag-over');
    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) handleSelectedMediaFile(e.dataTransfer.files[0]);
    };
  }

  if (fileInput) {
    fileInput.onchange = (e) => {
      if (e.target.files.length) handleSelectedMediaFile(e.target.files[0]);
    };
  }

  if (thresholdSlider) {
    thresholdSlider.oninput = (e) => {
      MediaImporter.threshold = parseInt(e.target.value);
      if (thresholdVal) thresholdVal.textContent = MediaImporter.threshold;
      reprocessCurrentMedia();
    };
  }

  if (ditherCheck) {
    ditherCheck.onchange = (e) => {
      MediaImporter.useDithering = e.target.checked;
      reprocessCurrentMedia();
    };
  }

  if (contrastCheck) {
    contrastCheck.onchange = (e) => {
      MediaImporter.autoContrast = e.target.checked;
      reprocessCurrentMedia();
    };
  }

  if (invertCheck) {
    invertCheck.onchange = (e) => {
      MediaImporter.invertColors = e.target.checked;
      reprocessCurrentMedia();
    };
  }

  if (applyBtn) {
    applyBtn.onclick = applyImportedFramesToTimeline;
  }
}

async function handleSelectedMediaFile(file) {
  MediaImporter.activeFile = file;
  const statusEl = document.getElementById('gif-import-status');
  if (statusEl) statusEl.textContent = `Procesando: ${file.name}...`;

  await reprocessCurrentMedia();
}

async function reprocessCurrentMedia() {
  if (!MediaImporter.activeFile) return;

  const file = MediaImporter.activeFile;
  const statusEl = document.getElementById('gif-import-status');
  const previewCanvas = document.getElementById('gif-preview-canvas');

  const options = {
    threshold: MediaImporter.threshold,
    useDithering: MediaImporter.useDithering,
    autoContrast: MediaImporter.autoContrast,
    invert: MediaImporter.invertColors,
    fps: MediaImporter.targetFps,
    maxFrames: MediaImporter.maxVideoFrames
  };

  try {
    let frames = [];
    if (file.type.includes('video')) {
      frames = await processVideoFile(file, State.width, State.height, options);
    } else {
      frames = await processGifFile(file, State.width, State.height, options);
    }

    MediaImporter.extractedFrames = frames;
    if (statusEl) statusEl.textContent = `✓ ${frames.length} fotogramas extraídos (${file.name})`;

    // Previsualizar primer fotograma
    if (previewCanvas && frames.length > 0) {
      previewCanvas.width = State.width;
      previewCanvas.height = State.height;
      const pctx = previewCanvas.getContext('2d');
      pctx.fillStyle = '#020305';
      pctx.fillRect(0, 0, State.width, State.height);
      const colors = DISPLAY_COLORS[State.displayColor] || DISPLAY_COLORS.white;
      pctx.fillStyle = colors.pixel;

      const bm = frames[0].bitmap;
      for (let y = 0; y < State.height; y++) {
        for (let x = 0; x < State.width; x++) {
          if (bm[y * State.width + x]) {
            pctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = `Error: ${err.message}`;
    showToast(`Error al procesar archivo: ${err.message}`, 'error');
  }
}

function applyImportedFramesToTimeline() {
  if (!MediaImporter.extractedFrames || MediaImporter.extractedFrames.length === 0) {
    showToast('Selecciona primero un archivo de video o GIF', 'warning');
    return;
  }

  pushHistory();
  State.frames = MediaImporter.extractedFrames.map((f, idx) => ({
    id: Date.now() + idx,
    name: `Frame ${idx + 1}`,
    bitmap: new Uint8Array(f.bitmap),
    durationMs: f.durationMs
  }));

  State.currentFrameIndex = 0;
  State.bitmap.set(State.frames[0].bitmap);
  toggleTimeline(true);

  renderCanvas();
  renderPreview();
  updateTimelineUI();
  closeModal('modal-gif-import');
  showToast(`¡${State.frames.length} fotogramas importados en la Línea de Tiempo!`, 'success');
}

if (typeof window !== 'undefined') {
  window.openMediaImportModal = openMediaImportModal;
  window.MediaImporter = MediaImporter;
}
