// ============================================================
// OLED Designer — Transmisión en Vivo a Hardware Físico (USB Serial & WiFi)
// renderer/liveHardware.js
// ============================================================

const LiveHardwareStreamer = {
  port: null,
  writer: null,
  isConnected: false,
  streamMode: 'serial', // 'serial' o 'wifi'
  wifiIp: '192.168.1.100',
  autoSync: false,
  isSending: false
};

function openLiveHardwareModal() {
  openModal('modal-live-hardware');
  initLiveHardwareUI();
}

function initLiveHardwareUI() {
  const btnConnectSerial = document.getElementById('btn-hw-connect-serial');
  const btnConnectWifi = document.getElementById('btn-hw-connect-wifi');
  const statusLabel = document.getElementById('hw-stream-status');
  const autoSyncCheck = document.getElementById('hw-auto-sync-check');
  const btnSendOnce = document.getElementById('btn-hw-send-frame');
  const wifiInput = document.getElementById('hw-wifi-ip');
  const btnCopySketch = document.getElementById('btn-copy-receiver-sketch');

  if (wifiInput) wifiInput.value = LiveHardwareStreamer.wifiIp;

  if (typeof updateI2CPinoutDisplay === 'function') {
    const port = document.getElementById('hw-serial-port-select')?.value;
    updateI2CPinoutDisplay(port || 'arduino:avr:mega');
  }

  if (btnConnectSerial) {
    btnConnectSerial.onclick = async () => {
      if (LiveHardwareStreamer.isConnected) {
        await disconnectHardware();
      } else {
        await connectSerialHardware();
      }
    };
  }

  if (btnConnectWifi) {
    btnConnectWifi.onclick = () => {
      LiveHardwareStreamer.wifiIp = wifiInput.value.trim();
      testWiFiConnection();
    };
  }

  if (autoSyncCheck) {
    autoSyncCheck.checked = LiveHardwareStreamer.autoSync;
    autoSyncCheck.onchange = (e) => {
      LiveHardwareStreamer.autoSync = e.target.checked;
      showToast(LiveHardwareStreamer.autoSync ? 'Auto-sincronización con hardware activa' : 'Auto-sincronización desactivada', 'info');
    };
  }

  if (btnSendOnce) {
    btnSendOnce.onclick = () => sendCurrentBitmapToHardware();
  }

  if (btnCopySketch) {
    btnCopySketch.onclick = () => {
      const code = document.getElementById('hw-receiver-sketch-code').textContent;
      navigator.clipboard.writeText(code).then(() => {
        showToast('Sketch receptor copiado al portapapeles ✓', 'success');
      });
    };
  }

  const btnUploadSketch = document.getElementById('btn-hw-upload-sketch');
  if (btnUploadSketch) {
    btnUploadSketch.onclick = async () => {
      await uploadReceiverSketchToHardware();
    };
  }

  updateHardwareStatusUI();
}

async function uploadReceiverSketchToHardware() {
  const btn = document.getElementById('btn-hw-upload-sketch');
  const logBox = document.getElementById('hw-upload-log');
  const portSelect = document.getElementById('hw-serial-port-select');
  const port = portSelect?.value;

  if (!port) {
    showToast('Selecciona un puerto COM detectado para subir el sketch', 'warning');
    return;
  }

  // Detectar FQBN: si es COM6 o en la lista se reconoció como Arduino Mega, usar arduino:avr:mega
  let fqbn = 'arduino:avr:mega';
  if (typeof detectedArduinoPorts !== 'undefined' && Array.isArray(detectedArduinoPorts)) {
    const matched = detectedArduinoPorts.find(p => p.port === port);
    if (matched && matched.fqbn) {
      fqbn = matched.fqbn;
    }
  }

  const code = document.getElementById('hw-receiver-sketch-code')?.textContent;
  if (!code) {
    showToast('No se encontró el código del sketch receptor', 'error');
    return;
  }

  // Liberar SIEMPRE el puerto COM antes de compilar y subir
  await disconnectHardware();
  await new Promise(r => setTimeout(r, 400));

  if (logBox) {
    logBox.classList.remove('hidden', 'success', 'error');
    logBox.textContent = `Compilando y subiendo sketch receptor a ${port} (${fqbn})...\nPor favor espera unos segundos...`;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Subiendo...';
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
        logBox.textContent = `✓ ¡Éxito! Sketch receptor subido correctamente a ${port}.\n\n${res.output || ''}`;
      }
      showToast(`¡Sketch receptor subido a ${port}! ✓`, 'success');

      // Reconectar automáticamente para streaming en vivo
      setTimeout(async () => {
        try {
          await connectSerialHardware();
        } catch (_) {}
      }, 1200);
    } else {
      if (logBox) {
        logBox.classList.add('error');
        logBox.textContent = `✖ Error al subir sketch a ${port}:\n\n${res.error || res.output || 'Error desconocido'}`;
      }
      showToast(`Error al subir sketch a ${port}`, 'error');
    }
  } catch (err) {
    if (logBox) {
      logBox.classList.add('error');
      logBox.textContent = `Error: ${err.message}`;
    }
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⚡ Subir a la Placa';
    }
  }
}

async function connectSerialHardware() {
  const portSelect = document.getElementById('hw-serial-port-select');
  const targetPort = portSelect?.value || 'COM6';

  // 1. Usar comunicación nativa de Electron IPC (no bloqueante)
  if (window.electronAPI?.connectSerial) {
    try {
      const res = await window.electronAPI.connectSerial({ port: targetPort, baudRate: 115200 });
      if (res && res.success) {
        LiveHardwareStreamer.isConnected = true;
        LiveHardwareStreamer.streamMode = 'serial';
        LiveHardwareStreamer.selectedPort = targetPort;
        updateHardwareStatusUI();
        showToast(`¡Conectado a ${targetPort}! (Esperando inicio de placa...) ✓`, 'success');

        // Esperar 1.5s a que el bootloader del microcontrolador finalice su auto-reset
        setTimeout(() => {
          if (LiveHardwareStreamer.isConnected) {
            sendCurrentBitmapToHardware();
          }
        }, 1500);
        return;
      } else {
        throw new Error(res.error || 'No se pudo abrir el puerto');
      }
    } catch (err) {
      console.warn('[IPC Serial Connect Error, trying WebSerial fallback]:', err);
    }
  }

  // 2. Fallback WebSerial nativo del navegador Chromium
  if (navigator.serial) {
    try {
      if (window.electronAPI?.setTargetSerialPort) {
        await window.electronAPI.setTargetSerialPort(targetPort);
      }
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });

      LiveHardwareStreamer.port = port;
      LiveHardwareStreamer.writer = port.writable.getWriter();
      LiveHardwareStreamer.isConnected = true;
      LiveHardwareStreamer.streamMode = 'serial';
      LiveHardwareStreamer.selectedPort = targetPort;

      updateHardwareStatusUI();
      showToast(`¡Conectado por puerto USB Serial a 115200 baudios! ✓`, 'success');

      // Esperar 1.5s a que el bootloader finalice el auto-reset
      setTimeout(() => {
        if (LiveHardwareStreamer.isConnected) {
          sendCurrentBitmapToHardware();
        }
      }, 1500);
      return;
    } catch (err) {
      showToast(`Error de conexión serie: ${err.message}`, 'error');
      return;
    }
  }

  showToast('No se pudo conectar al puerto COM seleccionado', 'error');
}

async function disconnectHardware() {
  if (window.electronAPI?.disconnectSerial) {
    try {
      await window.electronAPI.disconnectSerial();
    } catch (_) {}
  }

  if (LiveHardwareStreamer.writer) {
    try { await LiveHardwareStreamer.writer.cancel(); } catch (_) {}
    try { LiveHardwareStreamer.writer.releaseLock(); } catch (_) {}
    LiveHardwareStreamer.writer = null;
  }

  if (LiveHardwareStreamer.port) {
    try {
      await LiveHardwareStreamer.port.close();
    } catch (e) {
      console.warn('[Port close error]:', e);
    }
    LiveHardwareStreamer.port = null;
  }

  LiveHardwareStreamer.isConnected = false;
  updateHardwareStatusUI();

  // Pausa obligatoria para que el kernel de Windows libere el puerto COM completamente
  await new Promise(r => setTimeout(r, 600));
}

async function testWiFiConnection() {
  const ip = LiveHardwareStreamer.wifiIp;
  try {
    showToast(`Probando conexión con http://${ip}:80/oled/ping...`, 'info');
    const res = await fetch(`http://${ip}:80/oled/ping`, { method: 'GET', signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      LiveHardwareStreamer.isConnected = true;
      LiveHardwareStreamer.streamMode = 'wifi';
      updateHardwareStatusUI();
      showToast('¡ESP32/ESP8266 detectado por WiFi! ✓', 'success');
      sendCurrentBitmapToHardware();
    } else {
      throw new Error(`Respuesta HTTP ${res.status}`);
    }
  } catch (err) {
    showToast(`No se pudo conectar con ${ip}: ${err.message}`, 'warning');
  }
}

async function sendCurrentBitmapToHardware() {
  if (!LiveHardwareStreamer.isConnected || LiveHardwareStreamer.isSending) return;
  LiveHardwareStreamer.isSending = true;

  try {
    const W = State.width;
    const H = State.height;
    const totalBits = W * H;
    const bytes = new Uint8Array(Math.ceil(totalBits / 8));

    for (let i = 0; i < totalBits; i += 8) {
      let b = 0;
      for (let bit = 0; bit < 8 && i + bit < totalBits; bit++) {
        if (State.bitmap[i + bit]) b |= (1 << (7 - bit));
      }
      bytes[Math.floor(i / 8)] = b;
    }

    if (LiveHardwareStreamer.streamMode === 'serial') {
      const packet = new Uint8Array(4 + bytes.length);
      packet[0] = 0xAA;
      packet[1] = 0x55;
      packet[2] = W;
      packet[3] = H;
      packet.set(bytes, 4);

      if (LiveHardwareStreamer.writer) {
        await Promise.race([
          LiveHardwareStreamer.writer.write(packet),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de transmisión')), 1200))
        ]);
      } else if (window.electronAPI?.writeSerial) {
        const res = await Promise.race([
          window.electronAPI.writeSerial({ data: Array.from(packet) }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de transmisión')), 1200))
        ]);
        if (res && !res.success) {
          console.warn('[Stream write]:', res.error);
        }
      }
    } else if (LiveHardwareStreamer.streamMode === 'wifi') {
      const ip = LiveHardwareStreamer.wifiIp;
      await fetch(`http://${ip}:80/oled/frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: bytes,
        signal: AbortSignal.timeout(2000)
      });
    }
  } catch (err) {
    console.error('[Stream error]:', err);
  } finally {
    LiveHardwareStreamer.isSending = false;
  }
}

function notifyCanvasUpdatedForHardware() {
  if (LiveHardwareStreamer.isConnected && LiveHardwareStreamer.autoSync) {
    sendCurrentBitmapToHardware();
  }
}

function updateHardwareStatusUI() {
  const dot = document.getElementById('hw-stream-dot');
  const label = document.getElementById('hw-stream-status');
  const connectBtn = document.getElementById('btn-hw-connect-serial');
  const headerIndicator = document.getElementById('tb-hw-indicator');

  if (LiveHardwareStreamer.isConnected) {
    if (dot) dot.className = 'hw-dot online';
    if (label) label.textContent = `En línea (${LiveHardwareStreamer.streamMode.toUpperCase()})`;
    if (connectBtn) connectBtn.textContent = 'Desconectar USB';
    if (headerIndicator) headerIndicator.classList.add('online');
  } else {
    if (dot) dot.className = 'hw-dot offline';
    if (label) label.textContent = 'Desconectado';
    if (connectBtn) connectBtn.textContent = 'Conectar USB (Serial)';
    if (headerIndicator) headerIndicator.classList.remove('online');
  }
}

if (typeof window !== 'undefined') {
  window.openLiveHardwareModal = openLiveHardwareModal;
  window.LiveHardwareStreamer = LiveHardwareStreamer;
  window.notifyCanvasUpdatedForHardware = notifyCanvasUpdatedForHardware;
}
