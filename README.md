# ⚡ OLED-Designer-Suite-Professional

<p align="center">
  <b>🇬🇧 English</b> • <a href="README.es.md">🇪🇸 Español</a>
</p>

<p align="center">
  <img src="IMAGEN.JPG" alt="OLED-Designer-Suite-Professional - OLED Design and Emulation Suite" width="75%">
</p>

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Electron-Desktop-blue.svg)](https://www.electronjs.org/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](#-license)
[![Hardware](https://img.shields.io/badge/OLED-SSD1306%20%7C%20SH1106%20%7C%20SSD1309-orange.svg)]()

**OLED-Designer-Suite-Professional** is a comprehensive, high-performance desktop application to design, animate, simulate, and generate production-ready code for monochrome and color OLED displays in embedded systems (**Arduino, ESP32, ESP8266, Raspberry Pi Pico, STM32**, and more).

It combines a real-time pixel-perfect drawing editor, multi-frame timeline animation system with onion skinning, interactive OLED menu designer & physical D-Pad simulator, Floyd-Steinberg dithering GIF/video importer, standalone 1-bit QR code generator, parametric widget & icon catalog, Dual Screen OLED mode (`0x3C`/`0x3D`), and native ultra-low latency live hardware streaming via USB Serial & WiFi with 1-click firmware upload.

---

## 📑 Table of Contents
1. [Key Features](#-key-features)
2. [Installation & Requirements](#-installation--requirements)
3. [Quick Start Guide](#-quick-start-guide)
4. [System Modules](#-system-modules)
   - [Visual Editor & Drawing Tools](#1-visual-editor--drawing-tools)
   - [Photorealistic Hardware Simulator](#2-photorealistic-hardware-simulator)
   - [1-Bit Widget & Icon Library](#3-1-bit-widget--icon-library)
   - [Animation System & Timeline](#4-animation-system--timeline)
   - [OLED Menu Designer & Interactive D-Pad](#5-oled-menu-designer--interactive-d-pad)
   - [GIF & Video 1-Bit Converter with Dithering](#6-gif--video-1-bit-converter-with-dithering)
   - [1-Bit QR Code Generator](#7-1-bit-qr-code-generator)
   - [Preset Animation Templates Library](#8-preset-animation-templates-library)
   - [Dual Screen OLED Mode](#9-dual-screen-oled-mode)
   - [Live Hardware Streaming & 1-Click Upload](#10-live-hardware-streaming--1-click-upload)
5. [Multi-Platform Code Generation](#-multi-platform-code-generation)
6. [Integrated Artificial Intelligence](#-integrated-artificial-intelligence)
7. [Keyboard Shortcuts](#-keyboard-shortcuts)
8. [Project Structure](#-project-structure)
9. [Database & Local Persistence](#-database--local-persistence)
10. [License](#-license)

---

## 🚀 Key Features

- **Pixel-perfect 1-bit Canvas**: Zoom from 1x up to 16x, automatic centering, customizable grid overlay, and support for standard and custom resolutions (128x64, 128x32, 72x40, 96x16, 64x48, and custom).
- **Comprehensive Drawing Tools**: Pencil, multi-caliber eraser (5 sizes + instant right-click erase), lines, hollow & filled rectangles, circles/ellipses, flood fill bucket, and color picker eyedropper.
- **Interactive Text Layers**: 5×7 pixel font, drag-and-drop placement, alignment (left, center, right), real-time font scaling, inline double-click editing, and one-click rasterization onto the canvas.
- **Pure 1-Bit PNG Export**: Native W3C indexed 1-bit monochrome PNG encoder without lossy compression artifacts.
- **Photorealistic Physical Simulator**: OLED module mockup with customizable PCB silkscreen (Classic Blue, Matte Black, ENIG Purple), labeled hardware pins (`GND`, `VCC`, `SCL`, `SDA`), glass reflection, and 6 display color themes (Pure White, Neon Blue, Amber Yellow, Matrix Green, Split Yellow/Blue 128x64, and RGB).
- **Frame-by-Frame Animation Timeline**: Live thumbnail filmstrip, frame cloning/reordering, Onion Skinning preview with translucent orange glow, 1 to 24 FPS selector, and continuous loop playback.
- **18+ Ready-to-Use Animation Presets**: Curated catalog classified into Games, FX Effects, Clocks & Dashboards, Hardware/Sensors, and Robot Eyes, featuring real-time FPS canvas previews and live search.
- **Interactive Menu Designer with Physical D-Pad**: Complete menu state machine supporting Actions, Toggles (`[ON]/[OFF]`), and Numeric Ranges, navigable via on-screen D-Pad or keyboard arrow keys.
- **1-Bit GIF and Video Importer**: Floyd-Steinberg error diffusion matrix, adaptive thresholding slider, histogram auto-contrast, color inversion, and direct timeline injection.
- **Native 1-Bit QR Code Generator**: Offline, zero-dependency Reed-Solomon QR encoder for URLs, text, and WiFi credentials, with automatic quiet zone and scaling.
- **Automatic Board & I2C Pinout Detection**: Instantly detects connected microcontrollers (Arduino Mega, Uno, Nano, Leonardo, ESP32, ESP8266, RP2040) and displays clear visual wiring diagrams for I2C pins.
- **1-Click Board Flashing (`arduino-cli`)**: Automated compile and flash pipeline that uploads the official receiver sketch to the microcontroller with a single click.
- **Ultra-Low Latency Live Hardware Streaming**: Native Node.js serial port driver bypassing browser WebSerial limits, streaming 115200 baud binary packets or WiFi TCP sockets in milliseconds.
- **Dual OLED Screen Mode**: Independent design and synchronized code export for two OLED screens sharing the same I2C bus (`0x3C` and `0x3D`).
- **Multi-Platform Code Generation**: Production-ready C++, Python, and Rust code with pin diagrams for Arduino Adafruit GFX, U8g2, MicroPython, CircuitPython, raw C header arrays (`.h`), and embedded-graphics Rust.

---

## 📋 Installation & Requirements

### Minimum Requirements
| Component | Recommended Version | Note |
|---|:---:|---|
| **Operating System** | Windows 10/11, Linux (Ubuntu/Debian) | Tested on x64 environments |
| **Node.js** | 18.0 or higher | Main runtime environment |
| **npm** | 9.0 or higher | Package manager |
| **Git LFS** | 3.0 or higher | Required to fetch binary dependencies (`arduino-cli.exe`) |
| **PostgreSQL** | 13.0 or higher | *Optional*: App runs 100% offline with `localStorage` if database is absent |

---

## ⚡ Quick Start Guide

### 1. Clone the Repository (with Git LFS):
```bash
git clone https://github.com/Mijin-VT/OLED-Designer-Suite-Profesional.git
cd OLED-Designer-Suite-Profesional
git lfs pull
```

### 2. Launch the Application:

#### On Windows:

##### Option A — Automated Installer & Launcher:
Double-click:
```bat
INSTALL.bat
```
*(Installs npm dependencies, configures environment, and validates prerequisites).*

Then double-click:
```bat
INICIAR.bat
```

##### Option B — Via Command Prompt / PowerShell:
```powershell
npm install
npm start
```

#### On Linux:
```bash
npm install
npm start

# To build the standalone .deb package:
python3 scripts/build_deb.py
```

---

## 🧩 System Modules

### 1. Visual Editor & Drawing Tools
- **Pencil (`P`)**: Continuous pixel-by-pixel drawing with stroke widths from 1px to 4px.
- **Eraser (`E`)**: Multi-caliber eraser (1px, 2px, 4px, 8px, 12px) featuring a red circular cursor preview. You can also erase instantly by holding down the **right mouse button**.
- **Geometric Shapes**: Straight lines (`L`), hollow & filled rectangles (`R`), circles and ellipses (`C`).
- **Flood Fill Bucket (`F`)**: Fast 4-way flood-fill algorithm for filling closed contiguous areas.
- **Color Picker Eyedropper (`D`)**: Sample pixel values directly under the cursor.
- **Editable Text Layers (`T`)**: Clean 5×7 px font rendering, draggable positioning, horizontal alignment (left, center, right), real-time scaling, inline double-click editing, and a dedicated **"Burn to Canvas"** button.
- **Canvas Transformations**:
  - `Invert`: Inverts all pixels (0 ➔ 1, 1 ➔ 0).
  - `Flip H / V`: Horizontal and vertical mirroring.
  - `Shift / Pan`: Shift entire canvas Up, Down, Left, or Right with wrapping/cropping.
  - `Clear All`: Clears canvas to blank state.
- **Pure 1-Bit PNG Export**: One-click **"PNG 1-bit"** button producing a spec-compliant indexed 1-bit palette PNG image ideal for datasheets, documentation, or laser engraving.

### 2. Photorealistic Hardware Simulator
- Interactive modal accessible via the top-bar **`Simulator`** button.
- **PCB Finishes**:
  - **Classic Blue**: Standard blue soldermask typical of maker modules.
  - **Matte Black**: Stealth industrial finish with high-contrast markings.
  - **ENIG Purple**: Lab-grade purple soldermask with electroplated gold contact pads.
- **Silkscreen Pinout**: Clean physical labels for `GND`, `VCC`, `SCL`, and `SDA`.
- **Realistic Glass Optics**: Dark anti-reflective glass, subtle diagonal glare reflection, display bezel, and emissive pixel bloom.
- **OLED Color Emulation**:
  - Pure White (`#ffffff`)
  - Neon Blue (`#00d4ff`)
  - Amber Yellow (`#ffcc00`)
  - Matrix Green (`#00ff66`)
  - Yellow/Blue Split (exact replica of split 128x64 screens where top 16 rows are yellow and bottom 48 rows are blue).
  - RGB / Full Color mode for SSD1331 / SSD1351 OLED modules.
- **Export Actions**: Copy photo-real mockup snapshot to clipboard or download high-res PNG.

### 3. 1-Bit Widget & Icon Library (`widgets.js`)
- Accessible via the **`🧩 Widgets`** top-bar button or pressing key **`W`**.
- **30+ Vectorized 1-Bit Icons**:
  - *Hardware & Battery*: Battery at 100%, 75%, 50%, 25%, Charging ⚡, WiFi (3 signal levels), Bluetooth, USB.
  - *Sensors & Metrics*: Thermometer, Humidity droplet, Sun/Lux, Lightning/Voltage, Heart pulse, Tachometer/Speedometer.
  - *System & UI*: Gear, Lock, Notification bell, Alert warning, Checkmark OK, Error cross, Clock.
  - *Navigation & Media*: Directional arrows, Play, Pause, Stop, Speaker volume.
- **Pro Parametric Widgets**:
  - **Progress Bar**: Configurable percentage (0% to 100%) with *Solid Continuous* or *Segmented VU Meter* styles.
  - **Analog Tachometer (Gauge Dial)**: Semicircular dial with trigonometrically calculated needle indicator rendered in real time.
  - **Status Header Bar (128px)**: Standard top header line with integrated WiFi status and battery level indicators.
  - **Sparkline Chart**: Smooth sine/metric waveform graph for telemetry visualizers.
  - **Sensor Metric Card**: Rounded bounding frame with header separator, value readout, and thermometer glyph.
- **Search & Filters**: Instant category filtering (*Hardware*, *Sensors*, *System*, *Navigation*, *Pro Widgets*) and text query with pixel preview and one-click center or cursor stamping.

### 4. Animation System & Timeline
- Accessible via the **`🎬 Animation`** button or shortcut **`Shift + A`**.
- **Timeline Dock**: Slides smoothly from the bottom of the workspace without interrupting standard canvas operations.
- **Live Filmstrip**: Visual thumbnail strip showing each frame with sequence numbers and active frame indicators.
- **Frame Management**:
  - `+ Frame`: Adds a fresh blank frame.
  - `⧉ Duplicate`: Clones current frame to continue fluid animations.
  - `🗑 Delete`: Removes active frame (with single-frame protection).
- **🧅 Onion Skinning**: Displays the previous frame as a translucent orange guide (`rgba(255, 128, 0, 0.4)`) beneath the active layer for classic animator workflows.
- **Playback Controls**:
  - `⏮ First`, `◀ Previous`, `▶ / ⏸ Play / Pause` (also via Spacebar), `Next ▶`, `⏭ Last`.
  - Frame rate selector: **1, 2, 5, 10, 15, 20, 24 FPS**.
  - **🔁 Continuous Loop** toggle.
- **Automated Multi-Frame Code Export**: When multiple frames exist, code generators automatically output an array of `PROGMEM` pointers and an optimized cyclic `loop()` routine with calibrated `delay(FRAME_DELAY_MS)`.

### 5. OLED Menu Designer & Interactive D-Pad (`menuDesigner.js`)
- Accessible via the **`📑 Menus`** button or key **`M`**.
- **Menu Architecture**:
  - Configurable header title with physical divider rule.
  - **4 Visual Selection Styles**:
    1. *Inverted Bar*: Solid white rectangular highlight with crisp inverted black text (optimal readability on SSD1306).
    2. *Arrow Cursor*: Classic `> Option` indicator.
    3. *Bullet Point*: Discrete `● Option` marker.
    4. *Framed Box*: Sleek 1px border around active item.
  - Dynamic scrollbar indicator reflecting scroll position.
- **Item Types**:
  - *Action*: Execute callback or navigate screens.
  - *Toggle*: Binary switch displaying `[ON]` / `[OFF]`.
  - *Numeric Value / Range*: Step-based adjustment (e.g., `Brightness: 80%`, `Volume: 5`).
- **Interactive Hardware Simulator**:
  - Emulated OLED glass with tactile D-Pad featuring `▲`, `▼`, `◀`, `▶`, and `● Enter`.
  - Full keyboard mapping: **`↑` / `↓`** to navigate, **`Enter`** to select, and **`←` / `→`** to adjust numeric values.
- **Export & Stamp**:
  - **"Stamp to Canvas"** transfers the current menu snapshot onto the main canvas.
  - Production-ready Arduino C++ generator with non-blocking `INPUT_PULLUP` debounce and flicker-free `drawMenu()` state machine.

### 6. GIF & Video 1-Bit Converter with Dithering (`gifDecoder.js`)
- Accessible via the **`GIF/Video`** button in the header toolbar.
- **Supported Formats**: Animated `.gif`, `.mp4`, `.webm` videos, and standard still images.
- **1-Bit Conversion Engine**:
  - **Floyd-Steinberg Dithering**: High-precision 2D error diffusion matrix converting gradients and photos into organic 1-bit point clouds.
  - **Binarization Threshold**: Real-time interactive slider (1 to 254).
  - **Auto-Contrast**: Dynamic histogram equalization for small display legibility.
  - **Color Inversion**: Toggle dark-on-light drawings to illuminated OLED pixels.
- **Apply to Timeline**: Automatically unpacks all frames, rescales to target display dimensions, and injects them directly into the animation timeline.

### 7. 1-Bit QR Code Generator (`qrGenerator.js`)
- Accessible via the **`QR`** top-bar button.
- **Embedded Reed-Solomon Engine**: Encodes raw text, URLs, and WiFi network configurations entirely offline without external API dependencies.
- **Smart Scaling**: Choose 1x, 2x, or 3x module sizes with automatic white quiet zone inclusion to guarantee immediate smartphone camera recognition.
- **Integration**: Stamp directly onto the current canvas or insert as a distinct animation frame.

### 8. Preset Animation Templates Library (`animTemplates.js`)
- Accessible via the **`Templates`** top-bar button.
- **Curated Catalog of 18+ Ready-to-Flash Animations**:
  - **🎮 Games & Retro**:
    - *👾 Arcade Pac-Man*: Dynamic mouth-opening angle chomping pixels across the display.
    - *❤️ Heartbeat Pulse*: Dual-chamber biological heartbeat with systole and diastole simulation.
    - *⚽ Bouncing Ball*: Physics-based elastic collision simulation with screen-boundary reflection.
  - **✨ Visual FX**:
    - *🚀 Warp Speed (3D Hyperspace)*: 45 stars rendered in 3D perspective accelerating outward from center screen.
    - *💻 Cyberpunk Matrix Rain*: Downward cascading digital glyphs in classic terminal hacker fashion.
    - *🌊 Water Ripple*: Concentric expanding circular wave rings with linear radial attenuation.
    - *🌧️ Weather Rain*: Multi-speed diagonal raindrops falling smoothly.
    - *〰️ Floating Sine Wave*: Continuous trigonometric wave oscillation.
  - **⌚ Clocks & Dashboards**:
    - *🕐 7-Segment Digital Clock*: Clean smartwatch aesthetic with blinking seconds colon and date frame.
    - *🕰️ Analog Clock Dial*: 12-hour dial with perimeter tick marks and continuous 360° sweeping hand.
  - **🔋 Hardware, Networks & Sensors**:
    - *🔋 Charging Battery*: 5-step level gauge with animated central lightning bolt.
    - *📶 Cellular Signal Bars*: 5-bar cellular signal strength meter.
    - *📈 ECG Heart Monitor*: Realistic electrocardiogram waveform trace (P, Q, R, S, T) with pulsing indicator.
    - *📡 Concentric Radar / WiFi*: Electromagnetic radio waves radiating from an emitter source.
    - *🔄 Circular Loading Spinner*: 8-dot rotating spinner with fading orbital trail.
  - **🤖 Robot Eyes & Faces**:
    - *😊 Smiling Emoji*: Cute face with expressive blinks and smile curvature.
    - *🤖 Robot Eyes — Blink*: Rounded rectangular eyes inspired by Cozmo/Wall-E with smooth vertical blinking.
    - *👀 Robot Eyes — Curious Look*: Expressive eyes glancing left, center, and right.
- **Live Search & Categories**: Category tabs (*All*, *Eyes*, *Clocks*, *Effects*, *Hardware*, *Games*) and instant keyword filter.
- **Native FPS Previews**: Every preset card runs on its own isolated canvas at genuine display frame rates.
- **1-Click Timeline Loading**: Imports frames, configures optimal FPS, and allows immediate editing or live hardware streaming.

### 9. Dual Screen OLED Mode
- Accessible via the **`Dual OLED`** top-bar button.
- **Independent Dual-Screen Control**: Design simultaneously for two independent OLED displays sharing the same physical I2C bus at addresses `0x3C` (Screen A) and `0x3D` (Screen B).
- **Instant Canvas Switching**: Seamlessly toggle between Screen A and B with independent undo/redo histories, frames, and bitmaps.
- **Synchronized Arduino Code Generation**: Exports dual `Adafruit_SSD1306 displayA` and `displayB` instances, sets 400 kHz Fast I2C, and renders both displays concurrently inside `loop()`.

### 10. Live Hardware Streaming & 1-Click Upload
- Accessible via the **`Hardware`** top-bar button (equipped with live status LED).
- **Auto-Detection of Connected Boards & I2C Wiring**:
  - Scans system serial ports to detect connected boards.
  - Renders an interactive wiring card showing the exact hardware I2C pinout:
    - **Arduino Mega 2560**: `SDA = Pin 20` | `SCL = Pin 21` | `VCC = 5V` | `GND = GND`
    - **Arduino Uno / Nano**: `SDA = A4` | `SCL = A5` | `VCC = 5V` | `GND = GND`
    - **Arduino Leonardo / Micro**: `SDA = Pin 2` | `SCL = Pin 3` | `VCC = 5V` | `GND = GND`
    - **ESP32 DevKit**: `SDA = GPIO 21` | `SCL = GPIO 22` | `VCC = 3.3V` | `GND = GND`
    - **ESP8266 (NodeMCU / D1 Mini)**: `SDA = D2 (GPIO 4)` | `SCL = D1 (GPIO 5)` | `VCC = 3.3V` | `GND = GND`
    - **Raspberry Pi Pico (RP2040)**: `SDA = GP4` | `SCL = GP5` | `VCC = 3.3V` | `GND = GND`
- **1-Click Board Flash (`⚡ Flash to Board`)**:
  - Integrated compilation and flashing engine powered by `arduino-cli`.
  - Automatically releases the active COM port, builds the official high-speed receiver firmware, and flashes it directly to the microcontroller with terminal log streaming.
- **Ultra-Low Latency Native Serial Streaming**:
  - Native Node.js serial communication bypassing web browser sandboxes.
  - Packed binary protocol `[0xAA, 0x55, W, H, ...bytes]` at 115200 baud.
  - **Live Auto-Sync**: Canvas brush strokes and timeline scrub actions mirror onto the real OLED glass in real time.
- **WiFi Socket Streaming (ESP8266 / ESP32)**:
  - Wireless frame streaming over TCP/IP sockets directly to the board's local IP address.
- **Intelligent Firmware Sketch**:
  - Supports `<Wire.h>`, `<SPI.h>`, `<Adafruit_GFX.h>`, and `<Adafruit_SSD1306.h>`.
  - Automatic `0x3C` vs `0x3D` I2C address detection (handles clone boards).
  - Visual heartbeat blink on Pin 13 if the I2C bus encounters a communication error, accompanied by a graphical startup splash screen.

---

## 💻 Multi-Platform Code Generation

The code generation module in [`src/codeGen.js`](src/codeGen.js) parses canvas bitmaps and outputs optimized, commented code across all major embedded ecosystems:

### Supported Platforms:
1. **Arduino + Adafruit GFX**:
   - Full I2C and SPI hardware setup.
   - Fast I2C configuration (`Wire.setClock(400000)`).
   - Efficient `static const uint8_t PROGMEM oled_bitmap[]` flash storage.
   - Animated multi-frame pointer tables with loop timing.
   - Dual screen simultaneous setup (`0x3C` + `0x3D`).
2. **U8g2**:
   - Hardware and Software I2C / SPI constructors matching chosen display controller.
   - Drawing via high-speed `u8g2.drawXBMP()`.
3. **MicroPython**:
   - Clean code for Raspberry Pi Pico and ESP32 utilizing `ssd1306.py`.
   - Native `framebuf.FrameBuffer` using `MONO_HLSB` format.
   - Animation loops with `time.sleep_ms()`.
4. **CircuitPython**:
   - Uses `adafruit_ssd1306` and `adafruit_framebuf` modules.
5. **Pure C Header Array (`.h`)**:
   - Standard C/C++ byte arrays ready for bare-metal, STM32 HAL, or custom graphics engines.
6. **Rust (embedded-graphics)**:
   - Idiomatic Rust code leveraging `embedded-graphics` and `ImageRaw<BinaryColor>`.
7. **JavaScript / HTML5 Canvas**:
   - Standalone browser emulator script for embedding in web dashboards and documentation.

---

## 🤖 Integrated Artificial Intelligence

OLED Designer includes dual AI-assisted generation modes via [`src/aiModule.js`](src/aiModule.js):

1. **Local Heuristic Optimizer (100% Offline & Free)**:
   - Analyzes pixel density distribution and center of mass.
   - Detects text bounding boxes and geometric rectangular boundaries to recommend native vector calls (`display.println()`, `display.drawRect()`), saving precious flash memory on constrained microcontrollers.
   - Automatically inserts pinout documentation comments tailored to your target board.
2. **OpenAI Cloud Engine (Optional)**:
   - Connect to LLM endpoints (`gpt-4o-mini`) by specifying your API key in the environment:
     ```powershell
     $env:OPENAI_API_KEY = "sk-..."
     ```
   - Generates customized, interactive application sketches based on visual bitmap analysis and maker prompts.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| **P** | Select **Pencil** tool |
| **E** | Select **Eraser** tool |
| **L** | Select **Line** tool |
| **R** | Select **Rectangle** tool |
| **C** | Select **Circle** tool |
| **F** | Select **Flood Fill Bucket** tool |
| **T** | Insert / Edit **Text Layer** |
| **D** | Select **Color Picker / Eyedropper** |
| **W** | Open **Widgets & Icons** library |
| **M** | Open **Menu Designer & Simulator** |
| **Shift + A** | Toggle **Animation Timeline** |
| **Space** | **Play / Pause** animation (when timeline is open) |
| **Ctrl + Z** | **Undo** |
| **Ctrl + Y** / **Ctrl + Shift + Z** | **Redo** |
| **Ctrl + S** | **Save Project** |
| **Ctrl + E** | Open **Export Code** modal |
| **Ctrl + I** | Generate **AI-assisted** code |
| **Ctrl + G** | Toggle **Grid** overlay |
| **Ctrl + +** / **Ctrl + -** | **Zoom In / Zoom Out** |
| **Ctrl + 0** | **Fit to Screen** |
| **Right Mouse Click** | Instant fast erase on canvas |
| **Double Click (Text)** | Edit active text layer |

---

## 📁 Project Structure

```
EMULADOR_OLED/
├── bin/                     # Embedded binaries (tracked via Git LFS)
│   ├── arduino-cli.exe      # Automated compile & flash engine for 1-Click Upload
│   └── LICENSE.txt          # Arduino CLI GPLv3 license notice
├── main.js                  # Electron main process and window lifecycle
├── preload.js               # Secure IPC bridge (Renderer <-> Main)
├── package.json             # App manifest, dependencies, and launch scripts
├── package-lock.json        # Deterministic dependency lockfile
├── db.config.example.json   # Template for optional PostgreSQL configuration
├── db.config.json           # Local database credentials (git-ignored)
├── INSTALL.bat              # One-click automated setup script for Windows
├── INICIAR.bat              # One-click app launcher for Windows
├── INICIAR_OCULTO.vbs       # Silent background launcher without terminal window
├── README.md                # Primary English documentation
├── README.es.md             # Spanish documentation (Documentación en Español)
├── renderer/                # Frontend UI, canvas engine, and simulators
│   ├── index.html           # Core layout, modals, and toolbars
│   ├── style.css            # Dark theme, layout rules, and responsive styling
│   ├── app.js               # Canvas state machine, tools, and events
│   ├── widgets.js           # 1-bit icons and parametric widget library
│   ├── menuDesigner.js      # Menu state machine and interactive D-Pad simulator
│   ├── gifDecoder.js        # Floyd-Steinberg dithering video/GIF decoder
│   ├── qrGenerator.js       # Standalone Reed-Solomon 1-bit QR code generator
│   ├── animTemplates.js     # Curated animation presets (robot eyes, ECG, meters)
│   └── liveHardware.js      # Native serial/WiFi streaming and board detection
├── src/                     # Node.js backend modules
│   ├── codeGen.js           # Multi-platform code generators (C++, Python, Rust)
│   ├── aiModule.js          # Heuristic optimizer and OpenAI integration
│   ├── projects.js          # Project file persistence and CRUD logic
│   └── db.js                # Resilient database connection (with offline fallback)
├── sql/                     # Relational database schemas
│   ├── Base De Datos.sql    # DDL schema for drivers, projects, and versions
│   └── base_de_datos_pg.sql # Seed data with display definitions and resolutions
└── scripts/                 # Auxiliary setup and deployment utilities
    ├── INSTALL.bat          # Secondary installer script
    ├── INICIAR.bat          # Secondary launcher script
    ├── INICIAR_OCULTO.vbs   # Secondary silent launcher
    ├── setup_postgres.ps1   # PowerShell automated PostgreSQL configurator
    └── build_deb.py         # Debian/Ubuntu .deb package builder
```

---

## 🗄️ Database & Local Persistence

OLED Designer implements a **zero-configuration, offline-first persistence model**:

1. **Local Offline Mode (Default)**:
   - If PostgreSQL is not installed or unreachable, the application automatically activates **Offline Mode**.
   - All projects, animation frames, and user preferences persist safely in local storage (Electron `localStorage` and native `.oled` project files), requiring zero database setup.
2. **PostgreSQL Mode (Optional for teams & versioning)**:
   - To enable full relational database storage, run PowerShell as Administrator:
     ```powershell
     powershell -ExecutionPolicy Bypass -File scripts\setup_postgres.ps1
     ```
   - Enables revision history (up to 20 versions per project), custom driver schemas, and relational team project management.

---

## 📄 License

This project is licensed under the **MIT License**. You are free to use, modify, and distribute it for personal, educational, and commercial projects.
