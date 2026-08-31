// ============================================================
// OLED-Designer-Suite-Professional — Sistema de Internacionalización (i18n)
// renderer/i18n.js
// ============================================================

(function () {
  'use strict';

  const DICTIONARY = {
    es: {
      // Titlebar
      app_title: "OLED-Designer-Suite-Professional",
      untitled_project: "Sin título",

      // Barra superior / Toolbar
      btn_new: "Nuevo",
      btn_new_title: "Nuevo Proyecto (Ctrl+N)",
      btn_open: "Abrir",
      btn_open_title: "Abrir Proyecto (Ctrl+O)",
      btn_save: "Guardar",
      btn_save_title: "Guardar Proyecto (Ctrl+S)",
      btn_export: "Exportar",
      btn_export_title: "Exportar Código (Ctrl+E)",
      btn_ai: "IA",
      btn_ai_title: "Asistente Inteligente de Código (Ctrl+I)",
      btn_widgets: "Widgets",
      btn_widgets_title: "Biblioteca de Widgets e Iconos 1-Bit (W)",
      btn_animation: "Animación",
      btn_animation_title: "Línea de Tiempo de Animación (Shift+A)",
      btn_menus: "Menús",
      btn_menus_title: "Diseñador y Simulador de Menús OLED (M)",
      btn_gif_video: "GIF/Video",
      btn_gif_video_title: "Importador de GIFs y Videos con Dithering",
      btn_qr: "QR",
      btn_qr_title: "Generador de Códigos QR 1-Bit Reed-Solomon",
      btn_templates: "Plantillas",
      btn_templates_title: "Plantillas y Diseños Animados (Ojos, Pac-Man, Relojes)",
      btn_dual_oled: "Dual OLED",
      btn_dual_oled_title: "Modo Doble Pantalla OLED (0x3C / 0x3D)",
      btn_hardware: "Hardware",
      btn_hardware_title: "Transmisión en Vivo a Hardware Real (Serial / WiFi)",
      btn_eraser: "Borrador",
      btn_eraser_title: "Borrador (E)",
      btn_clear_canvas: "Borrar Todo",
      btn_clear_canvas_title: "Limpiar Lienzo Completo",
      btn_hw_preview: "Vista Hardware",
      btn_hw_preview_title: "Simulador de Módulo OLED Físico con PCB",
      btn_png1bit: "PNG 1-bit",
      btn_png1bit_title: "Exportar Imagen PNG Monocromática de 1 bit por píxel",
      btn_grid: "Grid",
      btn_grid_title: "Alternar Cuadrícula (Ctrl+G)",
      btn_preview: "Preview",
      btn_preview_title: "Alternar Ventana de Vista Previa OLED",
      btn_pencil: "Lápiz",

      // Panel izquierdo — Herramientas
      tool_rect: "Rect",
      tool_rect_title: "Rectángulo hueco (R)",
      tool_rect_fill: "Rect•",
      tool_rect_fill_title: "Rectángulo relleno",
      tool_circle: "Círculo",
      tool_circle_title: "Círculo hueco (C)",
      tool_circle_fill: "Círc•",
      tool_circle_fill_title: "Círculo relleno",
      tool_fill: "Relleno",
      tool_fill_title: "Bote de pintura / Relleno (F)",
      tool_text: "Texto",
      tool_text_title: "Capa de Texto Editable (T)",
      tool_select: "Selec.",
      tool_select_title: "Seleccionar y Mover Objetos (S)",
      tool_image: "Imagen",
      tool_image_title: "Importar Imagen",
      tool_eyedropper: "Cuentag.",
      tool_eyedropper_title: "Cuentagotas de Muestreo (D)",
      tool_widgets_btn: "Widgets",
      tool_widgets_title: "Biblioteca de Widgets (W)",

      // Panel izquierdo — Opciones
      section_options: "Opciones",
      label_pencil_size: "Tamaño del Lápiz",
      label_eraser_size: "Tamaño del Borrador",
      label_text_content: "Contenido del Texto",
      btn_add_text_layer: "+ Nueva Capa de Texto",
      btn_rasterize_text: "Fijar al Canvas",
      btn_delete_text: "Eliminar Capa",
      label_text_size: "Tamaño de Fuente",
      label_text_align: "Alineación",
      align_left: "Izq",
      align_center: "Cen",
      align_right: "Der",
      label_pixel_state: "Píxel",
      pixel_on: "ON",
      pixel_off: "OFF",

      // Panel izquierdo — Canvas
      section_canvas: "Canvas",
      btn_clear_all: "Limpiar Todo",
      btn_invert: "Invertir",
      btn_flip_h: "Voltear H",
      btn_flip_v: "Voltear V",
      btn_shift_up: "↑ Mover",
      btn_shift_down: "↓ Mover",
      btn_shift_left: "← Mover",
      btn_shift_right: "→ Mover",

      // Panel izquierdo — Ayuda
      section_help: "Ayuda",
      help_card_title: "Manual de Ayuda",
      help_card_sub: "Guía & Atajos (F1)",

      // Panel derecho — Propiedades
      section_resolution: "Resolución",
      res_128x64: "128×64 (Estándar)",
      res_128x32: "128×32 (Compacto)",
      res_96x16: "96×16 (Mini)",
      res_64x48: "64×48 (Micro)",
      res_64x32: "64×32 (Tiny)",
      res_96x64: "96×64 (Color)",
      res_128x128: "128×128 (Cuadrado)",
      res_custom: "Personalizada...",
      label_custom_width: "Ancho (px)",
      label_custom_height: "Alto (px)",
      btn_apply_res: "Aplicar Resolución",

      section_driver: "Controlador (Driver)",
      driver_voltage: "3.3V / 5V",
      driver_mono: "Monocromo",

      section_interface: "Interfaz",
      i2c_addr_label: "Dirección I2C",
      i2c_addr_default: "0x3C (predeterminado)",
      i2c_addr_alt: "0x3D (alt / secundario)",
      spi_cs_label: "Pin CS (Chip Select)",

      section_display_color: "Color de Display",
      color_white: "Blanco",
      color_blue: "Azul",
      color_yellow: "Amarillo",
      color_green: "Verde",
      color_rgb: "RGB",

      section_pinout: "Pinout",
      pinout_reload_title: "Recargar desde DB",
      pinout_loading_msg: "Selecciona un driver e interfaz",

      section_project: "Proyecto",
      project_name_placeholder: "Nombre del proyecto",
      project_desc_placeholder: "Descripción (opcional)",

      // Idioma / Language (El recuadro rojo)
      section_language: "IDIOMA / LANGUAGE",
      lang_es: "Español",
      lang_en: "English",

      // Ventana flotante de Vista Previa
      preview_window_title: "Vista Previa",
      panel_color_override: "Color del panel →",
      color_opt_white: "Blanco",
      color_opt_blue: "Azul",
      color_opt_yellow: "Amarillo",
      color_opt_green: "Verde",
      color_opt_split: "Split (Amarillo/Azul)",
      color_opt_rgb: "Color RGB (16-bit)",

      // Modales — Exportar Código
      modal_export_title: "Exportar Código",
      modal_export_tabs_arduino: "Arduino (Adafruit GFX)",
      modal_export_tabs_u8g2: "U8g2",
      modal_export_tabs_micropython: "MicroPython",
      modal_export_tabs_circuitpython: "CircuitPython",
      modal_export_tabs_carray: "C Array (.h)",
      modal_export_tabs_rust: "Rust",
      modal_export_tabs_js: "JavaScript",
      modal_export_format_label: "Formato de Exportación",
      modal_export_var_label: "Nombre de Variable",
      modal_export_code_label: "Código Generado",
      btn_generate_code: "⚡ Generar Código",
      btn_copy_code: "📋 Copiar Código",
      btn_save_code: "💾 Guardar Archivo",
      btn_open_ide: "Abrir en Arduino IDE",
      label_serial_port: "Puerto Serial:",
      label_board: "Placa:",
      btn_upload_code: "⚡ Subir a la Placa",
      i2c_card_title: "Diagrama de Pines I2C Detectado:",

      // Modales — Hardware Streaming
      modal_hw_title: "🔌 Transmisión en Vivo a Display Físico",
      hw_status_disconnected: "Desconectado",
      hw_status_connected: "Conectado a",
      hw_conn_usb_label: "Conexión USB Serial (Nativa):",
      btn_hw_connect: "Conectar Serial",
      btn_hw_disconnect: "Desconectar",
      hw_wifi_label: "Streaming WiFi (ESP8266 / ESP32):",
      btn_hw_wifi_connect: "Conectar WiFi",
      hw_upload_box_title: "Sketch Receptor para Arduino / ESP32",
      btn_copy_sketch: "📋 Copiar Sketch",
      btn_hw_upload_sketch: "⚡ Subir a la Placa",

      // Modales — Plantillas de Animaciones
      modal_anim_title: "📦 Plantillas y Diseños Animados para OLED",
      anim_search_placeholder: "Buscar animación (ej: reloj, pacman, matrix, wifi, corazon, ojos, lluvia)...",
      cat_all: "Todos",
      cat_robot: "🤖 Ojos & Caras",
      cat_dashboard: "⌚ Relojes & Dash",
      cat_fx: "✨ Efectos & FX",
      cat_hardware: "🔋 Hardware & Señal",
      cat_games: "🎮 Juegos & Retro",
      btn_load_timeline: "Cargar en Timeline",

      // Modales — Widgets
      modal_widgets_title: "🧩 Biblioteca de Widgets e Iconos 1-Bit",
      widget_search_placeholder: "Buscar icono o widget (ej: wifi, bateria, reloj, termometro)...",
      btn_insert_widget: "Insertar Widget en Canvas",

      // Modales — Menús
      modal_menu_title: "📑 Diseñador y Simulador de Menús OLED",
      btn_stamp_menu: "Estampar en Canvas",
      btn_export_menu_code: "Generar Código C++",

      // Barra de Línea de Tiempo (Timeline)
      tl_first_title: "Primer Fotograma",
      tl_prev_title: "Fotograma Anterior",
      tl_play_title: "Reproducir / Pausar (Espacio)",
      tl_next_title: "Fotograma Siguiente",
      tl_last_title: "Último Fotograma",
      tl_onion_title: "Alternar Papel Cebolla (Onion Skin)",
      tl_loop_title: "Alternar Bucle Continuo",
      tl_add_btn: "+ Frame",
      tl_add_title: "Agregar Nuevo Fotograma en Blanco",
      tl_dup_btn: "⧉ Duplicar",
      tl_dup_title: "Duplicar Fotograma Actual",
      tl_del_btn: "🗑 Borrar",
      tl_del_title: "Eliminar Fotograma Actual",
      tl_export_anim_btn: "Exportar Animación",

      // Toasts & Notificaciones
      toast_lang_changed: "Idioma cambiado a Español ✓",
      toast_saved: "Proyecto guardado ✓",
      toast_copied: "Copiado al portapapeles ✓",
      toast_exported: "Código exportado ✓"
    },

    en: {
      // Titlebar
      app_title: "OLED-Designer-Suite-Professional",
      untitled_project: "Untitled",

      // Barra superior / Toolbar
      btn_new: "New",
      btn_new_title: "New Project (Ctrl+N)",
      btn_open: "Open",
      btn_open_title: "Open Project (Ctrl+O)",
      btn_save: "Save",
      btn_save_title: "Save Project (Ctrl+S)",
      btn_export: "Export",
      btn_export_title: "Export Code (Ctrl+E)",
      btn_ai: "AI",
      btn_ai_title: "Intelligent Code Assistant (Ctrl+I)",
      btn_widgets: "Widgets",
      btn_widgets_title: "1-Bit Widget & Icon Library (W)",
      btn_animation: "Animation",
      btn_animation_title: "Animation Timeline (Shift+A)",
      btn_menus: "Menus",
      btn_menus_title: "OLED Menu Designer & Simulator (M)",
      btn_gif_video: "GIF/Video",
      btn_gif_video_title: "Import GIF or Video with Dithering",
      btn_qr: "QR",
      btn_qr_title: "1-Bit Reed-Solomon QR Code Generator",
      btn_templates: "Templates",
      btn_templates_title: "Animation Presets & Templates (Eyes, Pac-Man, Clocks)",
      btn_dual_oled: "Dual OLED",
      btn_dual_oled_title: "Dual OLED Screen Mode (0x3C / 0x3D)",
      btn_hardware: "Hardware",
      btn_hardware_title: "Live Stream to Real Hardware (Serial / WiFi)",
      btn_eraser: "Eraser",
      btn_eraser_title: "Eraser (E)",
      btn_clear_canvas: "Clear All",
      btn_clear_canvas_title: "Clear Entire Canvas",
      btn_hw_preview: "Hardware View",
      btn_hw_preview_title: "Physical OLED Module Simulator with PCB",
      btn_png1bit: "PNG 1-bit",
      btn_png1bit_title: "Export 1-bit per pixel Monochrome PNG Image",
      btn_grid: "Grid",
      btn_grid_title: "Toggle Grid (Ctrl+G)",
      btn_preview: "Preview",
      btn_preview_title: "Toggle OLED Preview Window",
      btn_pencil: "Pencil",

      // Panel izquierdo — Herramientas
      tool_rect: "Rect",
      tool_rect_title: "Hollow Rectangle (R)",
      tool_rect_fill: "Rect•",
      tool_rect_fill_title: "Filled Rectangle",
      tool_circle: "Circle",
      tool_circle_title: "Hollow Circle (C)",
      tool_circle_fill: "Circ•",
      tool_circle_fill_title: "Filled Circle",
      tool_fill: "Fill",
      tool_fill_title: "Paint Bucket / Fill (F)",
      tool_text: "Text",
      tool_text_title: "Editable Text Layer (T)",
      tool_select: "Select",
      tool_select_title: "Select and Move Objects (S)",
      tool_image: "Image",
      tool_image_title: "Import Image",
      tool_eyedropper: "Dropper",
      tool_eyedropper_title: "Color Eyedropper (D)",
      tool_widgets_btn: "Widgets",
      tool_widgets_title: "Widget Library (W)",

      // Panel izquierdo — Opciones
      section_options: "Options",
      label_pencil_size: "Pencil Size",
      label_eraser_size: "Eraser Size",
      label_text_content: "Text Content",
      btn_add_text_layer: "+ New Text Layer",
      btn_rasterize_text: "Bake to Canvas",
      btn_delete_text: "Delete Layer",
      label_text_size: "Font Size",
      label_text_align: "Alignment",
      align_left: "Left",
      align_center: "Center",
      align_right: "Right",
      label_pixel_state: "Pixel",
      pixel_on: "ON",
      pixel_off: "OFF",

      // Panel izquierdo — Canvas
      section_canvas: "Canvas",
      btn_clear_all: "Clear All",
      btn_invert: "Invert",
      btn_flip_h: "Flip H",
      btn_flip_v: "Flip V",
      btn_shift_up: "↑ Shift",
      btn_shift_down: "↓ Shift",
      btn_shift_left: "← Shift",
      btn_shift_right: "→ Shift",

      // Panel izquierdo — Ayuda
      section_help: "Help",
      help_card_title: "User Manual",
      help_card_sub: "Guide & Shortcuts (F1)",

      // Panel derecho — Propiedades
      section_resolution: "Resolution",
      res_128x64: "128×64 (Standard)",
      res_128x32: "128×32 (Compact)",
      res_96x16: "96×16 (Mini)",
      res_64x48: "64×48 (Micro)",
      res_64x32: "64×32 (Tiny)",
      res_96x64: "96×64 (Color)",
      res_128x128: "128×128 (Square)",
      res_custom: "Custom...",
      label_custom_width: "Width (px)",
      label_custom_height: "Height (px)",
      btn_apply_res: "Apply Resolution",

      section_driver: "Driver Controller",
      driver_voltage: "3.3V / 5V",
      driver_mono: "Monochrome",

      section_interface: "Interface",
      i2c_addr_label: "I2C Address",
      i2c_addr_default: "0x3C (default)",
      i2c_addr_alt: "0x3D (alt / secondary)",
      spi_cs_label: "CS Pin (Chip Select)",

      section_display_color: "Display Color",
      color_white: "White",
      color_blue: "Blue",
      color_yellow: "Yellow",
      color_green: "Green",
      color_rgb: "RGB",

      section_pinout: "Pinout",
      pinout_reload_title: "Reload from DB",
      pinout_loading_msg: "Select a driver and interface",

      section_project: "Project",
      project_name_placeholder: "Project name",
      project_desc_placeholder: "Description (optional)",

      // Idioma / Language (Red Box Area)
      section_language: "IDIOMA / LANGUAGE",
      lang_es: "Español",
      lang_en: "English",

      // Ventana flotante de Vista Previa
      preview_window_title: "Live Preview",
      panel_color_override: "Panel color →",
      color_opt_white: "White",
      color_opt_blue: "Blue",
      color_opt_yellow: "Yellow",
      color_opt_green: "Green",
      color_opt_split: "Split (Yellow/Blue)",
      color_opt_rgb: "RGB Color (16-bit)",

      // Modales — Exportar Código
      modal_export_title: "Export Code",
      modal_export_tabs_arduino: "Arduino (Adafruit GFX)",
      modal_export_tabs_u8g2: "U8g2",
      modal_export_tabs_micropython: "MicroPython",
      modal_export_tabs_circuitpython: "CircuitPython",
      modal_export_tabs_carray: "C Array (.h)",
      modal_export_tabs_rust: "Rust",
      modal_export_tabs_js: "JavaScript",
      modal_export_format_label: "Export Format",
      modal_export_var_label: "Variable Name",
      modal_export_code_label: "Generated Code",
      btn_generate_code: "⚡ Generate Code",
      btn_copy_code: "📋 Copy Code",
      btn_save_code: "💾 Save File",
      btn_open_ide: "Open in Arduino IDE",
      label_serial_port: "Serial Port:",
      label_board: "Board:",
      btn_upload_code: "⚡ Upload to Board",
      i2c_card_title: "Detected I2C Pinout Diagram:",

      // Modales — Hardware Streaming
      modal_hw_title: "🔌 Live Stream to Physical Display",
      hw_status_disconnected: "Disconnected",
      hw_status_connected: "Connected to",
      hw_conn_usb_label: "USB Serial Connection (Native):",
      btn_hw_connect: "Connect Serial",
      btn_hw_disconnect: "Disconnect",
      hw_wifi_label: "WiFi Streaming (ESP8266 / ESP32):",
      btn_hw_wifi_connect: "Connect WiFi",
      hw_upload_box_title: "Receiver Sketch for Arduino / ESP32",
      btn_copy_sketch: "📋 Copy Sketch",
      btn_hw_upload_sketch: "⚡ Upload to Board",

      // Modales — Plantillas de Animaciones
      modal_anim_title: "📦 OLED Animation Presets & Templates",
      anim_search_placeholder: "Search animation (e.g. clock, pacman, matrix, wifi, heart, eyes, rain)...",
      cat_all: "All",
      cat_robot: "🤖 Eyes & Faces",
      cat_dashboard: "⌚ Clocks & Dash",
      cat_fx: "✨ Effects & FX",
      cat_hardware: "🔋 Hardware & Signal",
      cat_games: "🎮 Games & Retro",
      btn_load_timeline: "Load into Timeline",

      // Modales — Widgets
      modal_widgets_title: "🧩 1-Bit Widget & Icon Library",
      widget_search_placeholder: "Search icon or widget (e.g. wifi, battery, clock, temp)...",
      btn_insert_widget: "Insert Widget into Canvas",

      // Modales — Menús
      modal_menu_title: "📑 OLED Menu Designer & Simulator",
      btn_stamp_menu: "Bake to Canvas",
      btn_export_menu_code: "Generate C++ Code",

      // Barra de Línea de Tiempo (Timeline)
      tl_first_title: "First Frame",
      tl_prev_title: "Previous Frame",
      tl_play_title: "Play / Pause (Spacebar)",
      tl_next_title: "Next Frame",
      tl_last_title: "Last Frame",
      tl_onion_title: "Toggle Onion Skin",
      tl_loop_title: "Toggle Continuous Loop",
      tl_add_btn: "+ Frame",
      tl_add_title: "Add New Blank Frame",
      tl_dup_btn: "⧉ Duplicate",
      tl_dup_title: "Duplicate Current Frame",
      tl_del_btn: "🗑 Delete",
      tl_del_title: "Delete Current Frame",
      tl_export_anim_btn: "Export Animation",

      // Toasts & Notificaciones
      toast_lang_changed: "Language changed to English ✓",
      toast_saved: "Project saved ✓",
      toast_copied: "Copied to clipboard ✓",
      toast_exported: "Code exported ✓"
    }
  };

  let currentLang = 'es';

  function getLanguage() {
    return currentLang;
  }

  function t(key, fallback = '') {
    if (DICTIONARY[currentLang] && DICTIONARY[currentLang][key]) {
      return DICTIONARY[currentLang][key];
    }
    if (DICTIONARY['es'] && DICTIONARY['es'][key]) {
      return DICTIONARY['es'][key];
    }
    return fallback || key;
  }

  function setLanguage(lang, silent = false) {
    if (!DICTIONARY[lang]) lang = 'es';
    currentLang = lang;

    try {
      localStorage.setItem('oled_app_language', lang);
    } catch (_) {}

    document.documentElement.lang = lang;

    // Actualizar elementos con data-i18n (texto interno)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && DICTIONARY[lang][key]) {
        el.textContent = DICTIONARY[lang][key];
      }
    });

    // Actualizar elementos con data-i18n-title (atributo title)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key && DICTIONARY[lang][key]) {
        el.title = DICTIONARY[lang][key];
      }
    });

    // Actualizar elementos con data-i18n-placeholder (input placeholder)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key && DICTIONARY[lang][key]) {
        el.placeholder = DICTIONARY[lang][key];
      }
    });

    // Actualizar botones de selección de idioma
    const btnEs = document.getElementById('btn-lang-es');
    const btnEn = document.getElementById('btn-lang-en');
    if (btnEs) btnEs.classList.toggle('active', lang === 'es');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');

    // Actualizar placeholder o nombre de proyecto por defecto
    const projInput = document.getElementById('project-name-input');
    const projDisplay = document.getElementById('project-name-display');
    if (projInput && (!projInput.value || projInput.value === 'Sin título' || projInput.value === 'Untitled')) {
      const defName = DICTIONARY[lang].untitled_project;
      projInput.value = defName;
      if (projDisplay) projDisplay.textContent = defName;
    }

    if (window.electronAPI && typeof window.electronAPI.setLanguage === 'function') {
      window.electronAPI.setLanguage(lang);
    }

    if (!silent && typeof showToast === 'function') {
      showToast(DICTIONARY[lang].toast_lang_changed, 'success');
    }
  }

  function initI18n() {
    let savedLang = 'es';
    try {
      savedLang = localStorage.getItem('oled_app_language') || 'es';
    } catch (_) {}

    // Asignar listeners a los botones de idioma
    const btnEs = document.getElementById('btn-lang-es');
    const btnEn = document.getElementById('btn-lang-en');

    if (btnEs) {
      btnEs.addEventListener('click', () => setLanguage('es'));
    }
    if (btnEn) {
      btnEn.addEventListener('click', () => setLanguage('en'));
    }

    setLanguage(savedLang, true);
  }

  window.I18N = {
    setLanguage,
    getLanguage,
    t,
    initI18n,
    dictionary: DICTIONARY
  };

  document.addEventListener('DOMContentLoaded', initI18n);
})();
