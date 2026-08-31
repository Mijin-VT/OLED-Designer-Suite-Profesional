/**
 * OLED Designer — Electron Main Process
 * main.js
 * 
 * Gestiona la ventana principal, menús nativos y comunicación IPC.
 */

'use strict';

const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Importar módulos backend
let db, projects, codeGen, aiModule;

// ============================================================
// CONFIGURACIÓN DE LA VENTANA
// ============================================================

let mainWindow = null;
let desiredSerialPort = 'COM6';

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'OLED-Designer-Suite-Professional',
    icon: path.join(__dirname, 'assets', 'icons', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      sandbox: false
    },
    backgroundColor: '#0f0f1a',
    show: false, // Se muestra al estar lista
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    titleBarOverlay: {
      color: '#1a1a2e',
      symbolColor: '#ffffff',
      height: 32
    }
  });

  // Soporte WebSerial nativo en Electron para hardware (Arduino / ESP32)
  if (mainWindow.webContents.session) {
    mainWindow.webContents.session.on('select-serial-port', (event, portList, webContents, callback) => {
      event.preventDefault();
      if (portList && portList.length > 0) {
        const target = (desiredSerialPort || 'COM6').toUpperCase();
        let selected = portList.find(p => (p.portName && p.portName.toUpperCase() === target) || (p.displayName && p.displayName.toUpperCase().includes(target)));
        if (!selected) {
          selected = portList.find(p => /arduino/i.test(p.displayName || '')) || portList[0];
        }
        callback(selected.portId);
      } else {
        callback('');
      }
    });

    mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
      if (permission === 'serial') return true;
      return false;
    });

    mainWindow.webContents.session.setDevicePermissionHandler((details) => {
      if (details.deviceType === 'serial') return true;
      return false;
    });
  }

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Mostrar cuando esté lista para evitar flash blanco
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (process.argv.includes('--dev')) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================
// MENÚ NATIVO
// ============================================================

function buildMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    // App menu (solo macOS)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),

    // Archivo
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nuevo Proyecto',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:new-project')
        },
        {
          label: 'Abrir Proyecto...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:open-project')
        },
        { type: 'separator' },
        {
          label: 'Guardar',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save-project')
        },
        {
          label: 'Guardar Como...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu:save-project-as')
        },
        { type: 'separator' },
        {
          label: 'Exportar Código...',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow?.webContents.send('menu:export-code')
        },
        {
          label: 'Exportar Imagen...',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => mainWindow?.webContents.send('menu:export-image')
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: 'Salir' }
      ]
    },

    // Editar
    {
      label: 'Editar',
      submenu: [
        {
          label: 'Deshacer',
          accelerator: 'CmdOrCtrl+Z',
          click: () => mainWindow?.webContents.send('menu:undo')
        },
        {
          label: 'Rehacer',
          accelerator: 'CmdOrCtrl+Y',
          click: () => mainWindow?.webContents.send('menu:redo')
        },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar Todo' },
        { type: 'separator' },
        {
          label: 'Limpiar Canvas',
          accelerator: 'CmdOrCtrl+Delete',
          click: () => mainWindow?.webContents.send('menu:clear-canvas')
        }
      ]
    },

    // Ver
    {
      label: 'Ver',
      submenu: [
        {
          label: 'Acercar',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => mainWindow?.webContents.send('menu:zoom-in')
        },
        {
          label: 'Alejar',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow?.webContents.send('menu:zoom-out')
        },
        {
          label: 'Zoom 1:1',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.send('menu:zoom-reset')
        },
        { type: 'separator' },
        {
          label: 'Cuadrícula',
          accelerator: 'CmdOrCtrl+G',
          click: () => mainWindow?.webContents.send('menu:toggle-grid')
        },
        {
          label: 'Vista Previa',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.send('menu:toggle-preview')
        },
        { type: 'separator' },
        { role: 'reload', label: 'Recargar' },
        { role: 'toggleDevTools', label: 'Herramientas de Desarrollador' },
        { role: 'togglefullscreen', label: 'Pantalla Completa' }
      ]
    },

    // Herramientas
    {
      label: 'Herramientas',
      submenu: [
        {
          label: 'Generar Código con IA',
          accelerator: 'CmdOrCtrl+I',
          click: () => mainWindow?.webContents.send('menu:ai-generate')
        },
        { type: 'separator' },
        {
          label: 'Importar Imagen...',
          click: () => mainWindow?.webContents.send('menu:import-image')
        },
        {
          label: 'Convertir a Monocromo',
          click: () => mainWindow?.webContents.send('menu:to-mono')
        },
        { type: 'separator' },
        {
          label: 'Historial de Versiones',
          click: () => mainWindow?.webContents.send('menu:version-history')
        }
      ]
    },

    // Ayuda
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Documentación',
          click: () => shell.openExternal('https://github.com/oled-designer/docs')
        },
        { type: 'separator' },
        {
          label: 'Acerca de OLED Designer',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Acerca de OLED Designer',
              message: 'OLED Designer v1.0.0',
              detail: 'Editor visual para pantallas OLED\nConstruido con Electron + Node.js + PostgreSQL\n\n© 2024 OLED Designer Team'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============================================================
// IPC HANDLERS — Comunicación con el Renderer
// ============================================================

function registerIPCHandlers() {
  // ---- PROYECTOS ----

  ipcMain.handle('project:save', async (event, projectData) => {
    try {
      if (!projects) return { success: false, error: 'Base de datos no conectada (modo local)' };
      const result = await projects.saveProject(projectData);
      return { success: true, data: result };
    } catch (err) {
      console.error('[IPC] project:save error:', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('project:load', async (event, projectId) => {
    try {
      if (!projects) return { success: false, error: 'Base de datos no conectada' };
      const result = await projects.loadProject(projectId);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('project:list', async (event) => {
    try {
      if (!projects) return { success: true, data: [] };
      const result = await projects.listProjects();
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('project:delete', async (event, projectId) => {
    try {
      if (!projects) return { success: true };
      await projects.deleteProject(projectId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('project:versions', async (event, projectId) => {
    try {
      if (!projects) return { success: true, data: [] };
      const result = await projects.getVersionHistory(projectId);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('project:restore-version', async (event, { projectId, versionId }) => {
    try {
      if (!projects) return { success: false, error: 'Base de datos no conectada' };
      const result = await projects.restoreVersion(projectId, versionId);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ---- BASE DE DATOS — DRIVERS / RESOLUCIONES / PINOUTS ----

  ipcMain.handle('db:get-drivers', async () => {
    try {
      if (!db) return { success: false, error: 'DB offline' };
      const result = await db.query('SELECT * FROM drivers WHERE active = TRUE ORDER BY name');
      return { success: true, data: result.rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:get-resolutions', async () => {
    try {
      if (!db) return { success: false, error: 'DB offline' };
      const result = await db.query('SELECT * FROM resolutions ORDER BY width DESC, height DESC');
      return { success: true, data: result.rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:get-pinouts', async (event, { driverId, interfaceType }) => {
    try {
      if (!db) return { success: false, error: 'DB offline' };
      const result = await db.query(
        'SELECT * FROM pinouts WHERE driver_id = $1 AND interface = $2 ORDER BY sort_order',
        [driverId, interfaceType]
      );
      return { success: true, data: result.rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:get-templates', async (event, platform) => {
    try {
      if (!db) return { success: false, error: 'DB offline' };
      const result = await db.query(
        'SELECT * FROM code_templates WHERE platform = $1',
        [platform]
      );
      return { success: true, data: result.rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ---- GENERACIÓN DE CÓDIGO ----

  ipcMain.handle('code:generate', async (event, config) => {
    try {
      const code = await codeGen.generate(config);
      return { success: true, data: code };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('code:ai-generate', async (event, config) => {
    try {
      const code = await aiModule.generateCode(config);
      return { success: true, data: code };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ---- DIÁLOGOS DE ARCHIVO ----

  ipcMain.handle('dialog:open-file', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: options?.title || 'Abrir Archivo',
      filters: options?.filters || [{ name: 'Todos los archivos', extensions: ['*'] }],
      properties: ['openFile']
    });
    return result;
  });

  ipcMain.handle('dialog:save-file', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: options?.title || 'Guardar Archivo',
      defaultPath: options?.defaultPath || 'proyecto',
      filters: options?.filters || [{ name: 'Todos los archivos', extensions: ['*'] }]
    });
    return result;
  });

  // ---- SISTEMA DE ARCHIVOS ----

  ipcMain.handle('fs:read-file', async (event, filePath) => {
    try {
      const data = fs.readFileSync(filePath);
      return { success: true, data: data.toString('base64') };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('fs:write-file', async (event, { filePath, content }) => {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('fs:write-binary', async (event, { filePath, base64Data }) => {
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ---- ARDUINO & PUERTOS SERIE ----

  const BOARD_I2C_PINS = {
    'arduino:avr:mega': {
      board: 'Arduino Mega 2560',
      sda: 'Pin 20',
      scl: 'Pin 21',
      vcc: '5V',
      gnd: 'GND',
      note: '¡En Arduino MEGA los pines I2C son el Pin 20 (SDA) y Pin 21 (SCL)! NO uses A4 y A5.'
    },
    'arduino:avr:uno': {
      board: 'Arduino Uno',
      sda: 'Pin A4',
      scl: 'Pin A5',
      vcc: '5V',
      gnd: 'GND',
      note: 'En Arduino UNO los pines I2C son A4 (SDA) y A5 (SCL).'
    },
    'arduino:avr:nano': {
      board: 'Arduino Nano',
      sda: 'Pin A4',
      scl: 'Pin A5',
      vcc: '5V',
      gnd: 'GND',
      note: 'En Arduino Nano los pines I2C son A4 (SDA) y A5 (SCL).'
    },
    'arduino:avr:leonardo': {
      board: 'Arduino Leonardo / Micro',
      sda: 'Pin 2',
      scl: 'Pin 3',
      vcc: '5V',
      gnd: 'GND',
      note: 'En Arduino Leonardo los pines I2C son Pin 2 (SDA) y Pin 3 (SCL).'
    },
    'esp32:esp32:esp32': {
      board: 'ESP32 Dev Module',
      sda: 'GPIO 21',
      scl: 'GPIO 22',
      vcc: '3.3V / 5V VIN',
      gnd: 'GND',
      note: 'En ESP32 los pines I2C predeterminados son GPIO 21 (SDA) y GPIO 22 (SCL).'
    },
    'esp8266:esp8266:nodemcu': {
      board: 'ESP8266 NodeMCU',
      sda: 'D2 (GPIO 4)',
      scl: 'D1 (GPIO 5)',
      vcc: '3.3V',
      gnd: 'GND',
      note: 'En ESP8266 los pines I2C son D2 (SDA) y D1 (SCL).'
    },
    'rp2040:rp2040:rpipico': {
      board: 'Raspberry Pi Pico (RP2040)',
      sda: 'GP4 (Pin 6)',
      scl: 'GP5 (Pin 7)',
      vcc: '3.3V (Pin 36)',
      gnd: 'GND (Pin 38)',
      note: 'En Raspberry Pi Pico I2C0 usa GP4 (SDA) y GP5 (SCL).'
    }
  };

  function getBoardI2CInfo(fqbn, name = '') {
    if (fqbn && BOARD_I2C_PINS[fqbn]) {
      return BOARD_I2C_PINS[fqbn];
    }
    const str = (fqbn + ' ' + name).toLowerCase();
    if (str.includes('mega')) return BOARD_I2C_PINS['arduino:avr:mega'];
    if (str.includes('uno')) return BOARD_I2C_PINS['arduino:avr:uno'];
    if (str.includes('nano')) return BOARD_I2C_PINS['arduino:avr:nano'];
    if (str.includes('leonardo') || str.includes('micro')) return BOARD_I2C_PINS['arduino:avr:leonardo'];
    if (str.includes('esp32')) return BOARD_I2C_PINS['esp32:esp32:esp32'];
    if (str.includes('esp8266') || str.includes('nodemcu')) return BOARD_I2C_PINS['esp8266:esp8266:nodemcu'];
    if (str.includes('pico') || str.includes('rp2040')) return BOARD_I2C_PINS['rp2040:rp2040:rpipico'];
    return {
      board: name || 'Placa Genérica',
      sda: 'A4 / SDA',
      scl: 'A5 / SCL',
      vcc: '5V / 3.3V',
      gnd: 'GND',
      note: 'Consulta el pinout de tu placa para los pines I2C (SDA y SCL).'
    };
  }

  ipcMain.handle('arduino:list-ports', async () => {
    const cliPath = path.join(__dirname, 'bin', 'arduino-cli.exe');
    return new Promise((resolve) => {
      // 1. Intentar con arduino-cli board list --format json
      if (fs.existsSync(cliPath)) {
        exec(`"${cliPath}" board list --format json`, { timeout: 8000 }, (err, stdout) => {
          if (!err && stdout) {
            try {
              const data = JSON.parse(stdout);
              const ports = [];
              const detectedList = data.detected_ports || data;
              if (Array.isArray(detectedList)) {
                for (const p of detectedList) {
                  const portName = p.port?.address || p.address;
                  const matchingBoards = p.matching_boards || [];
                  const board = matchingBoards[0] || {};
                  const bName = board.name || (p.port?.label || portName);
                  const fqbn = board.fqbn || '';
                  ports.push({
                    port: portName,
                    name: bName,
                    fqbn: fqbn,
                    protocol: p.port?.protocol || 'serial',
                    isArduino: matchingBoards.length > 0,
                    i2cPins: getBoardI2CInfo(fqbn, bName)
                  });
                }
              }
              if (ports.length > 0) {
                return resolve({ success: true, ports });
              }
            } catch (e) {
              console.warn('[Arduino CLI JSON parse error]:', e);
            }
          }
          fallbackListPorts(resolve);
        });
      } else {
        fallbackListPorts(resolve);
      }
    });
  });

  function fallbackListPorts(resolve) {
    const psScript = `Get-CimInstance Win32_SerialPort | ForEach-Object { $_.DeviceID + '|' + $_.Name + '|' + $_.Description + '|' + $_.PNPDeviceID }`;
    exec(`powershell -NoProfile -Command "${psScript}"`, { timeout: 6000 }, (err, stdout) => {
      if (err) {
        return resolve({ success: true, ports: [] });
      }
      const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
      const ports = lines.map(line => {
        const [port, name, description, pnpId] = line.split('|');
        let boardName = name || description || port;
        let fqbn = '';
        let isArduino = false;

        if (/mega/i.test(name) || /mega/i.test(description)) {
          boardName = 'Arduino Mega 2560';
          fqbn = 'arduino:avr:mega';
          isArduino = true;
        } else if (/uno/i.test(name) || /uno/i.test(description)) {
          boardName = 'Arduino Uno';
          fqbn = 'arduino:avr:uno';
          isArduino = true;
        } else if (/nano/i.test(name) || /nano/i.test(description)) {
          boardName = 'Arduino Nano';
          fqbn = 'arduino:avr:nano';
          isArduino = true;
        } else if (/1A86/i.test(pnpId) || /ch340/i.test(name)) {
          boardName = 'Arduino Clone / CH340 (' + port + ')';
          fqbn = 'arduino:avr:uno';
          isArduino = true;
        } else if (/cp210/i.test(name) || /esp/i.test(name)) {
          boardName = 'ESP32 / CP210x (' + port + ')';
          fqbn = 'esp32:esp32:esp32';
          isArduino = true;
        }
        return {
          port,
          name: boardName,
          fqbn,
          protocol: 'serial',
          isArduino,
          i2cPins: getBoardI2CInfo(fqbn, boardName)
        };
      });
      resolve({ success: true, ports });
    });
  }

  ipcMain.handle('arduino:upload-code', async (event, { code, port, fqbn }) => {
    const cliPath = path.join(__dirname, 'bin', 'arduino-cli.exe');
    if (!fs.existsSync(cliPath)) {
      return { success: false, error: 'arduino-cli no encontrado en bin/' };
    }

    if (!port) {
      return { success: false, error: 'Por favor selecciona un puerto COM conectado.' };
    }

    if (activeSerialHandle !== null) {
      try { fs.closeSync(activeSerialHandle); } catch (_) {}
      activeSerialHandle = null;
      activeSerialPortName = null;
    }

    if (!fqbn) {
      fqbn = 'arduino:avr:mega';
    }

    const sketchDir = path.join(app.getPath('temp'), 'oled_sketch_' + Date.now());
    const sketchFile = path.join(sketchDir, path.basename(sketchDir) + '.ino');

    try {
      fs.mkdirSync(sketchDir, { recursive: true });
      fs.writeFileSync(sketchFile, code, 'utf-8');

      return new Promise((resolve) => {
        const cmd = `"${cliPath}" compile --fqbn ${fqbn} --port ${port} --upload "${sketchDir}"`;
        exec(cmd, { timeout: 90000 }, (err, stdout, stderr) => {
          try { fs.rmSync(sketchDir, { recursive: true, force: true }); } catch (_) {}

          if (err) {
            console.error('[Arduino Compile/Upload Error]:', stderr || stdout || err.message);
            return resolve({
              success: false,
              error: stderr || stdout || err.message,
              output: stdout
            });
          }
          resolve({
            success: true,
            output: stdout || '¡Código subido exitosamente a la placa Arduino!'
          });
        });
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('arduino:open-ide', async (event, { code, projectName }) => {
    const name = (projectName || 'OLED_Project').replace(/[^a-zA-Z0-9_-]/g, '_');
    const docsArduino = path.join(app.getPath('documents'), 'Arduino', name);
    const sketchFile = path.join(docsArduino, `${name}.ino`);

    try {
      fs.mkdirSync(docsArduino, { recursive: true });
      fs.writeFileSync(sketchFile, code, 'utf-8');

      const { shell } = require('electron');
      await shell.openPath(sketchFile);

      return { success: true, path: sketchFile };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ---- NATIVE SERIAL STREAMING ----
  let activeSerialHandle = null;
  let activeSerialPortName = null;

  ipcMain.handle('serial:set-target-port', (event, portName) => {
    desiredSerialPort = portName || 'COM6';
    return true;
  });

  ipcMain.handle('serial:connect', async (event, { port, baudRate = 115200 }) => {
    try {
      if (activeSerialHandle !== null) {
        try { fs.closeSync(activeSerialHandle); } catch (_) {}
        activeSerialHandle = null;
      }

      const cleanPort = (port || desiredSerialPort || 'COM6').toUpperCase();
      desiredSerialPort = cleanPort;

      try {
        exec(`mode ${cleanPort}: BAUD=${baudRate} PARITY=N DATA=8 STOP=1`, { timeout: 3000 });
      } catch (_) {}

      const fd = fs.openSync(`\\\\.\\${cleanPort}`, 'r+');
      activeSerialHandle = fd;
      activeSerialPortName = cleanPort;
      return { success: true, port: cleanPort };
    } catch (err) {
      console.error('[Native Serial Connect Error]:', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('serial:write', async (event, { data }) => {
    if (activeSerialHandle === null) return { success: false, error: 'Puerto no conectado' };
    try {
      const buffer = Buffer.from(data);
      fs.writeSync(activeSerialHandle, buffer, 0, buffer.length);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('serial:disconnect', async () => {
    if (activeSerialHandle !== null) {
      try { fs.closeSync(activeSerialHandle); } catch (_) {}
      activeSerialHandle = null;
      activeSerialPortName = null;
    }
    return { success: true };
  });

  // ---- DB STATUS ----
  ipcMain.handle('db:status', async () => {
    try {
      if (!db) return { success: false, connected: false };
      await db.query('SELECT 1');
      return { success: true, connected: true };
    } catch (err) {
      return { success: false, connected: false, error: err.message };
    }
  });
}

// ============================================================
// INICIALIZACIÓN DE LA APP
// ============================================================

async function initModules() {
  // Cargar módulos que no dependen de DB siempre
  codeGen  = require('./src/codeGen');
  aiModule = require('./src/aiModule');

  // Intentar conectar a DB
  try {
    db = require('./src/db');
    await db.connect();
    console.log('[DB] Conectado a PostgreSQL ✓');
    projects = require('./src/projects');
    console.log('[Modules] Todos los módulos cargados');
  } catch (err) {
    db = null;
    projects = null;
  }
}

app.whenReady().then(async () => {
  await initModules();
  buildMenu();
  registerIPCHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (db) {
    try {
      await db.end();
      console.log('[DB] Conexión cerrada');
    } catch (err) {
      console.error('[DB] Error al cerrar conexión:', err.message);
    }
  }
});

// Manejar errores no capturados
process.on('uncaughtException', (err) => {
  console.error('[Main] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Main] Unhandled Rejection:', reason);
});
