// ============================================================
// OLED-Designer-Suite-Professional — Sistema de Internacionalización (i18n)
// renderer/i18n.js
// ============================================================

(function () {
  'use strict';

  const DICTIONARY = {
    es: {
      // Titlebar & Window
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
      tool_rect_fill: "Rect●",
      tool_rect_fill_title: "Rectángulo relleno",
      tool_circle: "Círculo",
      tool_circle_title: "Círculo hueco (C)",
      tool_circle_fill: "Círc●",
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
      label_eraser_size: "Grosor del Borrador",
      tip_eraser: "Consejo: Clic derecho siempre borra.",
      label_text_content: "Contenido",
      text_placeholder: "Escribe aquí...",
      label_text_align: "Alineación",
      align_left: "⯇ Izq",
      align_left_title: "Alinear a la izquierda",
      align_center: "⯈|⯇ Centro",
      align_center_title: "Centrado",
      align_right: "Der ⯈",
      align_right_title: "Alinear a la derecha",
      label_text_size: "Tamaño",
      btn_add_text_layer: "+ Capa de Texto",
      btn_add_text_layer_title: "Crear nueva capa de texto editable",
      btn_rasterize_text: "Fijar al Canvas",
      btn_rasterize_text_title: "Fundir texto en el bitmap de píxeles",
      btn_delete_text_layer: "Eliminar",
      btn_delete_text_layer_title: "Eliminar capa de texto seleccionada",
      tip_text: "💡 Doble clic en el canvas sobre el texto para editarlo o arrastrarlo.",
      label_preview: "Vista Previa",
      label_pixel: "Píxel",
      pixel_on_title: "Píxel ON (Encendido / Blanco)",
      pixel_off_title: "Píxel OFF (Apagado / Borrar)",

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

      // Transform HUD
      hud_ratio_title: "Bloquear / Desbloquear proporción",
      hud_apply: "✔ Aplicar",
      hud_apply_title: "Fijar figura al canvas (Enter)",
      hud_delete_title: "Eliminar figura del espacio de trabajo (Supr)",
      hud_cancel_title: "Cancelar cambios (Esc)",

      // Coordenadas y Barra de Estado
      cursor_pos_empty: "X: — Y: —",
      pixel_count_label: "Píxeles ON: ",
      zoom_status_label: "Zoom: ",

      // Timeline
      tl_first_title: "Primer fotograma (Home)",
      tl_prev_title: "Fotograma anterior (←)",
      tl_play_title: "Reproducir / Pausar (Espacio)",
      tl_next_title: "Fotograma siguiente (→)",
      tl_last_title: "Último fotograma (End)",
      tl_onion: "🧅 Cebolla",
      tl_onion_title: "Papel Cebolla: Muestra el fotograma anterior con tenue resplandor naranja",
      tl_loop: "🔁 Bucle",
      tl_loop_title: "Bucle continuo de animación",
      tl_add: "+ Frame",
      tl_add_title: "Agregar fotograma nuevo en blanco",
      tl_dup: "⧉ Duplicar",
      tl_dup_title: "Duplicar fotograma actual para continuar el movimiento",
      tl_del: "🗑 Borrar",
      tl_del_title: "Eliminar fotograma actual",
      tl_export_anim: "🎬 Exportar Animación",
      tl_export_anim_title: "Generar código animado para Arduino / U8g2 / MicroPython",
      tl_close_title: "Ocultar línea de tiempo",
      btn_close_title: "Cerrar",

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
      color_opt_rgb: "RGB",

      // Modales — Exportar Código
      modal_export_title: "Exportar Código",
      modal_export_tabs_arduino: "Arduino / Adafruit GFX",
      modal_export_tabs_u8g2: "U8g2",
      modal_export_tabs_carray: "C Array (Bitmap)",
      modal_export_tabs_micropython: "MicroPython",
      modal_export_tabs_circuitpython: "CircuitPython",
      modal_export_tabs_js: "JavaScript / TS",
      modal_export_tabs_rust: "Rust",
      export_opt_init: "Incluir inicialización",
      export_opt_comments: "Incluir comentarios",
      export_opt_dynamic_analog: "⚡ Pin Analógico (Widget Dinámico)",
      export_analog_pin_label: "Pin:",
      export_opt_ai: "Asistencia IA",
      btn_generate_code: "Generar ↻",
      btn_copy_code: "Copiar",
      btn_save_code: "Guardar .ino",
      arduino_badge: "⚡ Subir a Placa Arduino",
      arduino_detecting: "Buscando placas...",
      label_arduino_port: "Puerto COM Arduino:",
      arduino_detecting_ports: "Detectando puertos...",
      btn_refresh_ports_title: "Volver a escanear puertos COM",
      label_arduino_board: "Modelo de Placa:",
      btn_upload_board: "⚡ Subir a Placa",
      btn_open_ide: "Abrir en Arduino IDE",
      btn_open_ide_title: "Abrir sketch .ino en Arduino IDE",
      i2c_identified_tag: "🔌 Pines I2C Identificados",

      // Modales — Abrir Proyecto & Versiones
      modal_open_title: "Abrir Proyecto",
      tab_db: "Base de Datos",
      tab_file: "Archivo",
      loading_projects: "Cargando proyectos...",
      btn_browse_file: "Explorar archivo (.oled / .json)...",
      modal_versions_title: "Historial de Versiones",
      loading: "Cargando...",

      // Modales — Simulación Física Hardware
      modal_hw_sim_title: "📟 Simulación de Pantalla en Hardware Físico",
      label_oled_color: "Color OLED:",
      hw_color_white: "⚪ Blanco",
      hw_color_blue: "🔵 Azul",
      hw_color_yellow: "🟡 Amarillo",
      hw_color_yellow_blue: "🟡/🔵 Amarillo + Azul",
      hw_color_green: "🟢 Verde",
      hw_color_rgb: "🌈 RGB",
      label_pcb_module: "Módulo PCB:",
      pcb_blue: "PCB Azul (Clásico I2C)",
      pcb_black: "PCB Negro Mate",
      pcb_purple: "PCB Púrpura",
      btn_copy_image: "Copiar Imagen",
      btn_download_photo: "Descargar Foto",

      // Modales — Widgets
      modal_widgets_title: "🧩 Biblioteca de Widgets e Iconos Monocromo",
      widget_search_placeholder: "Buscar icono o widget (ej: wifi, batería, reloj, barra, dial)...",
      wcat_all: "Todos",
      wcat_parametric: "⚡ Widgets Pro",
      wcat_hardware: "Hardware & Bat",
      wcat_sensors: "Sensores",
      wcat_system: "Sistema",
      wcat_navigation: "Navegación",
      wpreview_select_prompt: "Selecciona un elemento",
      label_widget_val: "Valor / Nivel:",
      label_widget_style: "Estilo:",
      widget_style_solid: "Sólido continuo",
      widget_style_segmented: "Segmentado (VU meter)",
      btn_insert_widget: "Insertar en Canvas",

      // Modales — Menús
      modal_menu_title: "📑 Generador y Simulador de Menús OLED",
      menu_config_title: "Configuración del Menú",
      menu_header_label: "Título de Cabecera:",
      menu_header_placeholder: "Ej: MENU, AJUSTES...",
      menu_style_label: "Estilo Visual:",
      menu_style_inverted: "Barra Invertida (Resaltado)",
      menu_style_arrow: "Flecha Cursor ( > Opción )",
      menu_style_dot: "Punto / Bullet ( ● Opción )",
      menu_style_boxed: "Caja con Borde",
      menu_scrollbar_label: "Barra de Scroll lateral",
      menu_items_title: "Ítems del Menú",
      btn_add_item: "+ Ítem",
      sim_keypad_hint: "Navega con ↑ / ↓, activa con Enter, ajusta valores con ← / →.",
      btn_stamp_menu: "Estampar en Canvas",
      btn_export_code: "Exportar Código",
      btn_copy: "Copiar",

      // Modales — GIF / Video Importer
      modal_gif_title: "🖼️ Importar Animación (GIF / Video) con Dithering",
      gif_drop_prompt: "Arrastra un archivo GIF o Video (MP4 / WebM)",
      gif_drop_sub: "Se descompondrá en fotogramas a la resolución activa",
      btn_choose_file: "Seleccionar Archivo",
      gif_status_none: "Ningún archivo seleccionado",
      gif_options_title: "Opciones de Conversión 1-Bit",
      gif_threshold_label: "Umbral de Binarización:",
      gif_dither_label: "Dithering Floyd-Steinberg (Gradientes suaves)",
      gif_contrast_label: "Auto-Contraste de Histograma",
      gif_invert_label: "Invertir Colores (Líneas oscuras en fondo claro)",
      gif_preview_title: "Previsualización OLED",
      btn_apply_gif: "Aplicar Fotogramas a Línea de Tiempo",

      // Modales — Códigos QR
      modal_qr_title: "🏁 Generador de Códigos QR 1-Bit",
      qr_text_label: "Texto, URL o Credenciales WiFi:",
      qr_text_placeholder: "Ej: https://... o WIFI:S:Red;P:pass;;",
      qr_scale_label: "Escala de Módulo:",
      btn_qr_new_frame: "+ Como Nuevo Fotograma",

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

      // Modales — Transmisión en Vivo (Live Hardware)
      modal_hw_title: "🔌 Transmisión en Vivo a Display Físico",
      hw_status_disconnected: "Desconectado",
      hw_status_connected: "Conectado a",
      hw_opt1_title: "Opción 1: Conexión USB Serial (COM)",
      btn_hw_connect: "Conectar USB (Serial)",
      btn_hw_disconnect: "Desconectar USB",
      hw_opt2_title: "Opción 2: Conexión WiFi (ESP8266 / ESP32)",
      hw_ip_label: "Dirección IP de la placa:",
      btn_hw_connect_wifi: "Conectar por WiFi",
      hw_auto_sync_label: "Sincronizar en tiempo real al editar/animar",
      btn_hw_send_frame: "Enviar Fotograma Actual",
      hw_receiver_title: "Sketch Receptor para Arduino / ESP32",
      btn_copy_sketch: "Copiar Sketch",
      btn_hw_upload_btn: "⚡ Subir a la Placa",

      // Modales — Ayuda y Documentación
      help_modal_title: "📖 Manual de Ayuda y Documentación — OLED-Designer-Suite-Professional",
      help_intro_text: "OLED-Designer-Suite-Professional es una aplicación de escritorio integral y de alto rendimiento para diseñar, animar, simular y generar código para pantallas OLED monocromáticas y a color utilizadas en sistemas embebidos (Arduino, ESP32, ESP8266, Raspberry Pi Pico, STM32 y más).",
      help_intro_sub: "Combina un editor de dibujo en tiempo real, un sistema de animación por fotogramas múltiples (Timeline con Onion Skin), un generador y simulador físico de menús interactivos, un importador de GIFs con Dithering Floyd-Steinberg, un generador de códigos QR 1-bit, un catálogo de widgets paramétricos, modo de pantalla dual (Dual Screen 0x3C/0x3D) y streaming en vivo por USB Serial y WiFi directamente a la pantalla real.",
      help_toc_title: "📑 Tabla de Contenidos",
      help_toc_1: "1. Características Principales",
      help_toc_2: "2. Instalación y Requisitos",
      help_toc_3: "3. Guía de Inicio Rápido",
      help_toc_4: "4. Módulos del Sistema",
      help_toc_5: "5. Generación de Código Multi-Plataforma",
      help_toc_6: "6. Inteligencia Artificial Integrada",
      help_toc_7: "7. Atajos de Teclado",
      help_toc_8: "8. Estructura del Proyecto",
      help_toc_9: "9. Base de Datos y Persistencia Local",

      // Toasts & Notificaciones
      toast_lang_changed: "Idioma cambiado a Español ✓",
      toast_saved: "Proyecto guardado ✓",
      toast_copied: "Copiado al portapapeles ✓",
      toast_exported: "Código exportado ✓"
    },

    en: {
      // Titlebar & Window
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
      btn_ai_title: "Smart AI Code Assistant (Ctrl+I)",
      btn_widgets: "Widgets",
      btn_widgets_title: "1-Bit Widget & Icon Library (W)",
      btn_animation: "Animation",
      btn_animation_title: "Animation Timeline (Shift+A)",
      btn_menus: "Menus",
      btn_menus_title: "OLED Menu Designer & Simulator (M)",
      btn_gif_video: "GIF/Video",
      btn_gif_video_title: "GIF & Video Importer with Dithering",
      btn_qr: "QR",
      btn_qr_title: "1-Bit QR Code Generator Reed-Solomon",
      btn_templates: "Templates",
      btn_templates_title: "Animated Presets (Eyes, Pac-Man, Clocks)",
      btn_dual_oled: "Dual OLED",
      btn_dual_oled_title: "Dual Screen OLED Mode (0x3C / 0x3D)",
      btn_hardware: "Hardware",
      btn_hardware_title: "Physical Hardware Live Streaming (Serial / WiFi)",
      btn_eraser: "Eraser",
      btn_eraser_title: "Eraser (E)",
      btn_clear_canvas: "Clear All",
      btn_clear_canvas_title: "Clear Entire Canvas",
      btn_hw_preview: "Hardware View",
      btn_hw_preview_title: "Physical OLED Module Simulator with PCB",
      btn_png1bit: "PNG 1-bit",
      btn_png1bit_title: "Export 1-bit Monochrome PNG Image",
      btn_grid: "Grid",
      btn_grid_title: "Toggle Grid (Ctrl+G)",
      btn_preview: "Preview",
      btn_preview_title: "Toggle OLED Live Preview Window",
      btn_pencil: "Pencil",

      // Panel izquierdo — Herramientas
      tool_rect: "Rect",
      tool_rect_title: "Hollow Rectangle (R)",
      tool_rect_fill: "Rect●",
      tool_rect_fill_title: "Filled Rectangle",
      tool_circle: "Circle",
      tool_circle_title: "Hollow Circle (C)",
      tool_circle_fill: "Circ●",
      tool_circle_fill_title: "Filled Circle",
      tool_fill: "Fill",
      tool_fill_title: "Paint Bucket / Fill (F)",
      tool_text: "Text",
      tool_text_title: "Editable Text Layer (T)",
      tool_select: "Select",
      tool_select_title: "Select & Move Objects (S)",
      tool_image: "Image",
      tool_image_title: "Import Image",
      tool_eyedropper: "Dropper",
      tool_eyedropper_title: "Sample Color Dropper (D)",
      tool_widgets_btn: "Widgets",
      tool_widgets_title: "Widget Library (W)",

      // Panel izquierdo — Opciones
      section_options: "Options",
      label_pencil_size: "Pencil Size",
      label_eraser_size: "Eraser Size",
      tip_eraser: "Tip: Right-click always erases.",
      label_text_content: "Content",
      text_placeholder: "Type here...",
      label_text_align: "Alignment",
      align_left: "⯇ Left",
      align_left_title: "Align Left",
      align_center: "⯈|⯇ Center",
      align_center_title: "Center",
      align_right: "Right ⯈",
      align_right_title: "Align Right",
      label_text_size: "Size",
      btn_add_text_layer: "+ Text Layer",
      btn_add_text_layer_title: "Create new editable text layer",
      btn_rasterize_text: "Bake to Canvas",
      btn_rasterize_text_title: "Merge text into pixel bitmap",
      btn_delete_text_layer: "Delete",
      btn_delete_text_layer_title: "Delete selected text layer",
      tip_text: "💡 Double-click text on the canvas to edit or drag it.",
      label_preview: "Preview",
      label_pixel: "Pixel",
      pixel_on_title: "Pixel ON (Active / White)",
      pixel_off_title: "Pixel OFF (Inactive / Erase)",

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

      // Transform HUD
      hud_ratio_title: "Lock / Unlock Aspect Ratio",
      hud_apply: "✔ Apply",
      hud_apply_title: "Bake shape into canvas (Enter)",
      hud_delete_title: "Delete shape from canvas (Del)",
      hud_cancel_title: "Cancel changes (Esc)",

      // Coordenadas y Barra de Estado
      cursor_pos_empty: "X: — Y: —",
      pixel_count_label: "ON Pixels: ",
      zoom_status_label: "Zoom: ",

      // Timeline
      tl_first_title: "First Frame (Home)",
      tl_prev_title: "Previous Frame (←)",
      tl_play_title: "Play / Pause (Space)",
      tl_next_title: "Next Frame (→)",
      tl_last_title: "Last Frame (End)",
      tl_onion: "🧅 Onion",
      tl_onion_title: "Onion Skin: Displays previous frame with subtle orange glow",
      tl_loop: "🔁 Loop",
      tl_loop_title: "Continuous animation loop",
      tl_add: "+ Frame",
      tl_add_title: "Add new blank frame",
      tl_dup: "⧉ Duplicate",
      tl_dup_title: "Duplicate current frame to continue motion",
      tl_del: "🗑 Delete",
      tl_del_title: "Delete current frame",
      tl_export_anim: "🎬 Export Animation",
      tl_export_anim_title: "Generate animated code for Arduino / U8g2 / MicroPython",
      tl_close_title: "Hide timeline",
      btn_close_title: "Close",

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
      color_opt_rgb: "RGB",

      // Modales — Exportar Código
      modal_export_title: "Export Code",
      modal_export_tabs_arduino: "Arduino / Adafruit GFX",
      modal_export_tabs_u8g2: "U8g2",
      modal_export_tabs_carray: "C Array (Bitmap)",
      modal_export_tabs_micropython: "MicroPython",
      modal_export_tabs_circuitpython: "CircuitPython",
      modal_export_tabs_js: "JavaScript / TS",
      modal_export_tabs_rust: "Rust",
      export_opt_init: "Include initialization",
      export_opt_comments: "Include comments",
      export_opt_dynamic_analog: "⚡ Analog Pin (Dynamic Widget)",
      export_analog_pin_label: "Pin:",
      export_opt_ai: "AI Assistance",
      btn_generate_code: "Generate ↻",
      btn_copy_code: "Copy",
      btn_save_code: "Save .ino",
      arduino_badge: "⚡ Upload to Arduino Board",
      arduino_detecting: "Searching for boards...",
      label_arduino_port: "Arduino COM Port:",
      arduino_detecting_ports: "Detecting ports...",
      btn_refresh_ports_title: "Rescan COM ports",
      label_arduino_board: "Board Model:",
      btn_upload_board: "⚡ Upload to Board",
      btn_open_ide: "Open in Arduino IDE",
      btn_open_ide_title: "Open sketch .ino in Arduino IDE",
      i2c_identified_tag: "🔌 Identified I2C Pins",

      // Modales — Abrir Proyecto & Versiones
      modal_open_title: "Open Project",
      tab_db: "Database",
      tab_file: "File",
      loading_projects: "Loading projects...",
      btn_browse_file: "Browse file (.oled / .json)...",
      modal_versions_title: "Version History",
      loading: "Loading...",

      // Modales — Simulación Física Hardware
      modal_hw_sim_title: "📟 Physical Hardware Display Simulation",
      label_oled_color: "OLED Color:",
      hw_color_white: "⚪ White",
      hw_color_blue: "🔵 Blue",
      hw_color_yellow: "🟡 Yellow",
      hw_color_yellow_blue: "🟡/🔵 Yellow + Blue",
      hw_color_green: "🟢 Green",
      hw_color_rgb: "🌈 RGB",
      label_pcb_module: "PCB Module:",
      pcb_blue: "Blue PCB (Classic I2C)",
      pcb_black: "Matte Black PCB",
      pcb_purple: "Purple PCB",
      btn_copy_image: "Copy Image",
      btn_download_photo: "Download Photo",

      // Modales — Widgets
      modal_widgets_title: "🧩 1-Bit Widget & Icon Library",
      widget_search_placeholder: "Search icon or widget (e.g. wifi, battery, clock, bar, dial)...",
      wcat_all: "All",
      wcat_parametric: "⚡ Pro Widgets",
      wcat_hardware: "Hardware & Bat",
      wcat_sensors: "Sensors",
      wcat_system: "System",
      wcat_navigation: "Navigation",
      wpreview_select_prompt: "Select an item",
      label_widget_val: "Value / Level:",
      label_widget_style: "Style:",
      widget_style_solid: "Solid continuous",
      widget_style_segmented: "Segmented (VU meter)",
      btn_insert_widget: "Insert into Canvas",

      // Modales — Menús
      modal_menu_title: "📑 OLED Menu Designer & Simulator",
      menu_config_title: "Menu Configuration",
      menu_header_label: "Header Title:",
      menu_header_placeholder: "e.g. MENU, SETTINGS...",
      menu_style_label: "Visual Style:",
      menu_style_inverted: "Inverted Bar (Highlight)",
      menu_style_arrow: "Arrow Cursor ( > Option )",
      menu_style_dot: "Bullet Point ( ● Option )",
      menu_style_boxed: "Bordered Box",
      menu_scrollbar_label: "Lateral Scrollbar",
      menu_items_title: "Menu Items",
      btn_add_item: "+ Item",
      sim_keypad_hint: "Navigate with ↑ / ↓, select with Enter, adjust with ← / →.",
      btn_stamp_menu: "Bake to Canvas",
      btn_export_code: "Export Code",
      btn_copy: "Copy",

      // Modales — GIF / Video Importer
      modal_gif_title: "🖼️ Import Animation (GIF / Video) with Dithering",
      gif_drop_prompt: "Drag & drop a GIF or Video file (MP4 / WebM)",
      gif_drop_sub: "Decomposes into frames at active resolution",
      btn_choose_file: "Choose File",
      gif_status_none: "No file selected",
      gif_options_title: "1-Bit Conversion Options",
      gif_threshold_label: "Binarization Threshold:",
      gif_dither_label: "Floyd-Steinberg Dithering (Smooth gradients)",
      gif_contrast_label: "Auto Histogram Contrast",
      gif_invert_label: "Invert Colors (Dark lines on light background)",
      gif_preview_title: "OLED Preview",
      btn_apply_gif: "Apply Frames to Timeline",

      // Modales — Códigos QR
      modal_qr_title: "🏁 1-Bit QR Code Generator",
      qr_text_label: "Text, URL or WiFi Credentials:",
      qr_text_placeholder: "e.g. https://... or WIFI:S:Network;P:pass;;",
      qr_scale_label: "Module Scale:",
      btn_qr_new_frame: "+ As New Frame",

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

      // Modales — Transmisión en Vivo (Live Hardware)
      modal_hw_title: "🔌 Live Stream to Physical Display",
      hw_status_disconnected: "Disconnected",
      hw_status_connected: "Connected to",
      hw_opt1_title: "Option 1: USB Serial Connection (COM)",
      btn_hw_connect: "Connect USB (Serial)",
      btn_hw_disconnect: "Disconnect USB",
      hw_opt2_title: "Option 2: WiFi Connection (ESP8266 / ESP32)",
      hw_ip_label: "Board IP Address:",
      btn_hw_connect_wifi: "Connect via WiFi",
      hw_auto_sync_label: "Real-time sync while editing/animating",
      btn_hw_send_frame: "Send Current Frame",
      hw_receiver_title: "Receiver Sketch for Arduino / ESP32",
      btn_copy_sketch: "Copy Sketch",
      btn_hw_upload_btn: "⚡ Upload to Board",

      // Modales — Ayuda y Documentación
      help_modal_title: "📖 User Manual & Documentation — OLED-Designer-Suite-Professional",
      help_intro_text: "OLED-Designer-Suite-Professional is a high-performance desktop visual IDE for designing, animating, simulating, and generating code for monochrome and color OLED displays used in embedded systems (Arduino, ESP32, ESP8266, Raspberry Pi Pico, STM32, and more).",
      help_intro_sub: "Combines a real-time pixel-perfect drawing editor, multi-frame animation system (Timeline with Onion Skin), interactive menu designer & simulator, GIF importer with Floyd-Steinberg dithering, 1-bit QR code generator, parametric widget library, Dual Screen OLED mode (0x3C/0x3D), and physical hardware live streaming via USB Serial & WiFi.",
      help_toc_title: "📑 Table of Contents",
      help_toc_1: "1. Key Features",
      help_toc_2: "2. Installation & Requirements",
      help_toc_3: "3. Quickstart Guide",
      help_toc_4: "4. System Modules",
      help_toc_5: "5. Cross-Platform Code Generation",
      help_toc_6: "6. Integrated Artificial Intelligence",
      help_toc_7: "7. Keyboard Shortcuts",
      help_toc_8: "8. Project Structure",
      help_toc_9: "9. Local Database & Offline Storage",

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

    // Sincronizar menú nativo de Electron
    if (window.electronAPI && typeof window.electronAPI.setLanguage === 'function') {
      window.electronAPI.setLanguage(lang);
    }

    // Disparar evento global para componentes reactivos (widgets, animaciones, etc.)
    window.dispatchEvent(new CustomEvent('appLanguageChanged', { detail: { lang } }));

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    initI18n();
  }
})();
