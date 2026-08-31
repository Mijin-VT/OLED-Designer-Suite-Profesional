/**
 * OLED Designer — Preload Script
 * preload.js
 * 
 * Bridge seguro entre el proceso principal (Node.js) y el renderer (browser).
 * Usa contextBridge para exponer únicamente las APIs necesarias.
 */

'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// ============================================================
// API EXPUESTA AL RENDERER
// ============================================================

contextBridge.exposeInMainWorld('electronAPI', {

  // ---- PROYECTOS ----
  saveProject: (projectData) => ipcRenderer.invoke('project:save', projectData),
  loadProject: (projectId) => ipcRenderer.invoke('project:load', projectId),
  listProjects: () => ipcRenderer.invoke('project:list'),
  deleteProject: (projectId) => ipcRenderer.invoke('project:delete', projectId),
  getVersionHistory: (projectId) => ipcRenderer.invoke('project:versions', projectId),
  restoreVersion: (projectId, versionId) => ipcRenderer.invoke('project:restore-version', { projectId, versionId }),

  // ---- BASE DE DATOS ----
  getDrivers: () => ipcRenderer.invoke('db:get-drivers'),
  getResolutions: () => ipcRenderer.invoke('db:get-resolutions'),
  getPinouts: (driverId, interfaceType) => ipcRenderer.invoke('db:get-pinouts', { driverId, interfaceType }),
  getTemplates: (platform) => ipcRenderer.invoke('db:get-templates', platform),
  getDBStatus: () => ipcRenderer.invoke('db:status'),

  // ---- GENERACIÓN DE CÓDIGO & ARDUINO ----
  generateCode: (config) => ipcRenderer.invoke('code:generate', config),
  aiGenerateCode: (config) => ipcRenderer.invoke('code:ai-generate', config),
  listArduinoPorts: () => ipcRenderer.invoke('arduino:list-ports'),
  uploadArduinoCode: (opts) => ipcRenderer.invoke('arduino:upload-code', opts),
  openInArduinoIDE: (opts) => ipcRenderer.invoke('arduino:open-ide', opts),
  connectSerial: (opts) => ipcRenderer.invoke('serial:connect', opts),
  writeSerial: (opts) => ipcRenderer.invoke('serial:write', opts),
  disconnectSerial: () => ipcRenderer.invoke('serial:disconnect'),
  setTargetSerialPort: (port) => ipcRenderer.invoke('serial:set-target-port', port),

  // ---- DIÁLOGOS ----
  openFileDialog: (options) => ipcRenderer.invoke('dialog:open-file', options),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:save-file', options),

  // ---- SISTEMA DE ARCHIVOS ----
  readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:write-file', { filePath, content }),
  writeBinary: (filePath, base64Data) => ipcRenderer.invoke('fs:write-binary', { filePath, base64Data }),

  // ---- IDIOMA / I18N ----
  setLanguage: (lang) => ipcRenderer.invoke('app:set-language', lang),

  // ---- EVENTOS DEL MENÚ (escuchar comandos del menú nativo) ----
  onMenuEvent: (callback) => {
    const events = [
      'menu:new-project',
      'menu:open-project',
      'menu:save-project',
      'menu:save-project-as',
      'menu:export-code',
      'menu:export-image',
      'menu:undo',
      'menu:redo',
      'menu:clear-canvas',
      'menu:zoom-in',
      'menu:zoom-out',
      'menu:zoom-reset',
      'menu:toggle-grid',
      'menu:toggle-preview',
      'menu:ai-generate',
      'menu:import-image',
      'menu:to-mono',
      'menu:version-history'
    ];

    const handlers = events.map(event => {
      const handler = (_, ...args) => callback(event, ...args);
      ipcRenderer.on(event, handler);
      return { event, handler };
    });

    // Retornar función de cleanup
    return () => {
      handlers.forEach(({ event, handler }) => {
        ipcRenderer.removeListener(event, handler);
      });
    };
  },

  // ---- UTILIDADES ----
  platform: process.platform,
  version: process.versions.electron
});
