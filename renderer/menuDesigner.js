// ============================================================
// OLED Designer — Generador y Simulador de Menús OLED
// renderer/menuDesigner.js
// ============================================================

const MenuState = {
  title: 'AJUSTES',
  style: 'inverted', // 'inverted', 'arrow', 'dot', 'boxed'
  hasScrollbar: true,
  items: [
    { id: 1, title: 'WiFi Red', type: 'toggle', value: true, options: ['OFF', 'ON'] },
    { id: 2, title: 'Brillo', type: 'range', value: 80, min: 0, max: 100, step: 10, unit: '%' },
    { id: 3, title: 'Bluetooth', type: 'toggle', value: false, options: ['OFF', 'ON'] },
    { id: 4, title: 'Sonido', type: 'toggle', value: true, options: ['MUTE', 'ON'] },
    { id: 5, title: 'Batería', type: 'action', value: null },
    { id: 6, title: 'Info Sistema', type: 'action', value: null }
  ],
  selectedIndex: 0,
  scrollOffset: 0,
  codePlatform: 'arduino'
};

function openMenuDesigner() {
  openModal('modal-menu-designer');
  initMenuDesigner();
}

function initMenuDesigner() {
  // Configuración general
  const titleInput = document.getElementById('menu-header-title');
  if (titleInput) {
    titleInput.value = MenuState.title;
    titleInput.oninput = (e) => {
      MenuState.title = e.target.value;
      renderMenuSimulation();
      updateMenuCodePreview();
    };
  }

  const styleSelect = document.getElementById('menu-style-select');
  if (styleSelect) {
    styleSelect.value = MenuState.style;
    styleSelect.onchange = (e) => {
      MenuState.style = e.target.value;
      renderMenuSimulation();
      updateMenuCodePreview();
    };
  }

  const scrollChk = document.getElementById('menu-chk-scrollbar');
  if (scrollChk) {
    scrollChk.checked = MenuState.hasScrollbar;
    scrollChk.onchange = (e) => {
      MenuState.hasScrollbar = e.target.checked;
      renderMenuSimulation();
      updateMenuCodePreview();
    };
  }

  // Botón agregar ítem
  const addBtn = document.getElementById('btn-add-menu-item');
  if (addBtn) {
    addBtn.onclick = () => {
      const newId = Date.now();
      MenuState.items.push({
        id: newId,
        title: `Opción ${MenuState.items.length + 1}`,
        type: 'action',
        value: null
      });
      renderMenuItemsEditor();
      renderMenuSimulation();
      updateMenuCodePreview();
    };
  }

  // D-Pad y botones interactivos
  document.getElementById('sim-btn-up')?.addEventListener('click', () => menuNavigate(-1));
  document.getElementById('sim-btn-down')?.addEventListener('click', () => menuNavigate(1));
  document.getElementById('sim-btn-left')?.addEventListener('click', () => menuAdjustValue(-1));
  document.getElementById('sim-btn-right')?.addEventListener('click', () => menuAdjustValue(1));
  document.getElementById('sim-btn-enter')?.addEventListener('click', () => menuTriggerAction());

  // Botón Estampar
  const stampBtn = document.getElementById('btn-stamp-menu');
  if (stampBtn) {
    stampBtn.onclick = stampMenuOnCanvas;
  }

  // Botón Exportar Código
  const genCodeBtn = document.getElementById('btn-gen-menu-code');
  if (genCodeBtn) {
    genCodeBtn.onclick = () => {
      openModal('modal-export');
      generateAndShowCode();
    };
  }

  // Tabs de plataforma de código
  document.querySelectorAll('.tplat-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tplat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      MenuState.codePlatform = btn.dataset.tplat;
      updateMenuCodePreview();
    };
  });

  // Copiar código
  document.getElementById('btn-copy-menu-code')?.addEventListener('click', () => {
    const code = document.getElementById('menu-code-preview').textContent;
    navigator.clipboard.writeText(code).then(() => {
      showToast('Código de menú copiado ✓', 'success');
    });
  });

  // Teclado cuando el modal está abierto
  window.addEventListener('keydown', onMenuKeydown);

  renderMenuItemsEditor();
  renderMenuSimulation();
  updateMenuCodePreview();
}

function onMenuKeydown(e) {
  const modal = document.getElementById('modal-menu-designer');
  if (!modal || modal.classList.contains('hidden')) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    e.preventDefault();
    menuNavigate(-1);
  } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    e.preventDefault();
    menuNavigate(1);
  } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    e.preventDefault();
    menuAdjustValue(-1);
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    menuAdjustValue(1);
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    menuTriggerAction();
  }
}

function menuNavigate(delta) {
  if (MenuState.items.length === 0) return;
  MenuState.selectedIndex = (MenuState.selectedIndex + delta + MenuState.items.length) % MenuState.items.length;

  // Ajustar scrollOffset
  const visibleRows = 4;
  if (MenuState.selectedIndex < MenuState.scrollOffset) {
    MenuState.scrollOffset = MenuState.selectedIndex;
  } else if (MenuState.selectedIndex >= MenuState.scrollOffset + visibleRows) {
    MenuState.scrollOffset = MenuState.selectedIndex - visibleRows + 1;
  }

  highlightActiveItemInEditor();
  renderMenuSimulation();
}

function menuAdjustValue(direction) {
  const item = MenuState.items[MenuState.selectedIndex];
  if (!item) return;

  if (item.type === 'toggle') {
    item.value = !item.value;
  } else if (item.type === 'range') {
    const step = item.step || 10;
    const min = item.min !== undefined ? item.min : 0;
    const max = item.max !== undefined ? item.max : 100;
    item.value = Math.max(min, Math.min(max, (item.value || 0) + direction * step));
  }
  renderMenuItemsEditor();
  renderMenuSimulation();
  updateMenuCodePreview();
}

function menuTriggerAction() {
  const item = MenuState.items[MenuState.selectedIndex];
  if (!item) return;

  if (item.type === 'toggle') {
    item.value = !item.value;
    showToast(`${item.title}: ${item.value ? 'ON' : 'OFF'}`, 'info');
  } else {
    showToast(`Ejecutando: [${item.title}]`, 'success');
  }
  renderMenuItemsEditor();
  renderMenuSimulation();
  updateMenuCodePreview();
}

function renderMenuItemsEditor() {
  const listEl = document.getElementById('menu-items-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  MenuState.items.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = `menu-item-row ${idx === MenuState.selectedIndex ? 'active-item' : ''}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'menu-item-input';
    input.value = item.title;
    input.oninput = (e) => {
      item.title = e.target.value;
      renderMenuSimulation();
      updateMenuCodePreview();
    };

    const typeSel = document.createElement('select');
    typeSel.className = 'menu-item-type';
    typeSel.innerHTML = `
      <option value="action" ${item.type === 'action' ? 'selected' : ''}>Acción</option>
      <option value="toggle" ${item.type === 'toggle' ? 'selected' : ''}>Toggle</option>
      <option value="range" ${item.type === 'range' ? 'selected' : ''}>Valor</option>
    `;
    typeSel.onchange = (e) => {
      item.type = e.target.value;
      if (item.type === 'toggle') item.value = true;
      if (item.type === 'range') item.value = 50;
      renderMenuItemsEditor();
      renderMenuSimulation();
      updateMenuCodePreview();
    };

    const delBtn = document.createElement('button');
    delBtn.className = 'menu-item-del';
    delBtn.textContent = '✕';
    delBtn.title = 'Eliminar';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      MenuState.items.splice(idx, 1);
      if (MenuState.selectedIndex >= MenuState.items.length) {
        MenuState.selectedIndex = Math.max(0, MenuState.items.length - 1);
      }
      renderMenuItemsEditor();
      renderMenuSimulation();
      updateMenuCodePreview();
    };

    row.onclick = () => {
      MenuState.selectedIndex = idx;
      highlightActiveItemInEditor();
      renderMenuSimulation();
    };

    row.appendChild(input);
    row.appendChild(typeSel);
    row.appendChild(delBtn);
    listEl.appendChild(row);
  });
}

function highlightActiveItemInEditor() {
  document.querySelectorAll('.menu-item-row').forEach((row, idx) => {
    row.classList.toggle('active-item', idx === MenuState.selectedIndex);
  });
}

function renderMenuSimulation() {
  const canvas = document.getElementById('menu-simulator-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 128;
  const H = 64;
  canvas.width = W;
  canvas.height = H;

  // Fondo OLED negro puro
  ctx.fillStyle = '#020305';
  ctx.fillRect(0, 0, W, H);

  // Cabecera
  if (MenuState.title) {
    ctx.fillStyle = '#101520';
    ctx.fillRect(0, 0, W, 12);
    ctx.fillStyle = '#ffffff';
    draw5x7Text(ctx, MenuState.title, 4, 3, 1);
    ctx.strokeStyle = '#3d4760';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 12.5);
    ctx.lineTo(W, 12.5);
    ctx.stroke();
  }

  // Lista de Ítems
  const startY = MenuState.title ? 15 : 2;
  const rowHeight = 11;
  const visibleRows = 4;
  const scrollbarW = MenuState.hasScrollbar ? 4 : 0;
  const contentW = W - scrollbarW;

  for (let i = 0; i < visibleRows; i++) {
    const itemIndex = MenuState.scrollOffset + i;
    if (itemIndex >= MenuState.items.length) break;

    const item = MenuState.items[itemIndex];
    const isSelected = (itemIndex === MenuState.selectedIndex);
    const y = startY + i * rowHeight;

    // Resaltado según estilo
    if (isSelected) {
      if (MenuState.style === 'inverted') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(1, y - 1, contentW - 2, rowHeight);
      } else if (MenuState.style === 'boxed') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(1.5, y - 0.5, contentW - 3, rowHeight - 1);
      }
    }

    // Color del texto
    const textColor = (isSelected && MenuState.style === 'inverted') ? '#000000' : '#ffffff';
    ctx.fillStyle = textColor;

    // Prefijo de cursor
    let textX = 4;
    if (MenuState.style === 'arrow') {
      if (isSelected) draw5x7Text(ctx, '>', textX, y + 1, 1);
      textX += 8;
    } else if (MenuState.style === 'dot') {
      if (isSelected) draw5x7Text(ctx, '*', textX, y + 1, 1);
      textX += 8;
    }

    // Título del ítem
    draw5x7Text(ctx, item.title, textX, y + 1, 1);

    // Valor a la derecha (si aplica)
    if (item.type === 'toggle') {
      const valStr = item.value ? 'ON' : 'OFF';
      draw5x7Text(ctx, `[${valStr}]`, contentW - 32, y + 1, 1);
    } else if (item.type === 'range') {
      const unit = item.unit || '%';
      draw5x7Text(ctx, `${item.value}${unit}`, contentW - 30, y + 1, 1);
    }
  }

  // Barra de Scroll lateral
  if (MenuState.hasScrollbar && MenuState.items.length > visibleRows) {
    const trackX = W - 3;
    const trackY = startY;
    const trackH = H - startY - 2;

    ctx.strokeStyle = '#222838';
    ctx.strokeRect(trackX, trackY, 2, trackH);

    const thumbH = Math.max(4, Math.round((visibleRows / MenuState.items.length) * trackH));
    const thumbY = trackY + Math.round((MenuState.scrollOffset / (MenuState.items.length - visibleRows)) * (trackH - thumbH));

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(trackX, thumbY, 2, thumbH);
  }
}

function draw5x7Text(ctx, text, startX, startY, size = 1) {
  let curX = startX;
  for (const char of String(text)) {
    const glyph = FONT_5x7[char] || FONT_5x7[' '];
    if (glyph) {
      for (let col = 0; col < 5; col++) {
        const colData = glyph[col];
        for (let row = 0; row < 7; row++) {
          if (colData & (1 << row)) {
            ctx.fillRect(curX + col * size, startY + row * size, size, size);
          }
        }
      }
    }
    curX += (5 + 1) * size;
  }
}

function stampMenuOnCanvas() {
  const simCanvas = document.getElementById('menu-simulator-canvas');
  if (!simCanvas) return;

  pushHistory();
  const ctxSim = simCanvas.getContext('2d');
  const imgData = ctxSim.getImageData(0, 0, State.width, State.height).data;

  for (let y = 0; y < State.height; y++) {
    for (let x = 0; x < State.width; x++) {
      const idx = (y * State.width + x) * 4;
      const brightness = (imgData[idx] + imgData[idx + 1] + imgData[idx + 2]) / 3;
      State.bitmap[y * State.width + x] = brightness > 100 ? 1 : 0;
    }
  }

  markDirty();
  renderCanvas();
  renderPreview();
  closeModal('modal-menu-designer');
  showToast('Menú estampado en el canvas ✓', 'success');
}

function updateMenuCodePreview() {
  const codeEl = document.getElementById('menu-code-preview');
  if (!codeEl) return;

  if (MenuState.codePlatform === 'python') {
    codeEl.textContent = generateMenuMicroPython();
  } else {
    codeEl.textContent = generateMenuArduino();
  }
}

function generateMenuArduino() {
  const itemsCount = MenuState.items.length;
  const itemsDef = MenuState.items.map((it, i) => {
    return `  {"${it.title}", ${it.type === 'toggle' ? 1 : it.type === 'range' ? 2 : 0}, ${it.value ? 1 : 0}}`;
  }).join(',\n');

  return `// ============================================================
// OLED Designer — Sistema de Navegación de Menú (Arduino GFX)
// Pantalla: 128x64 SSD1306
// ============================================================
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_ADDR 0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// Pines de botones (con resistencias pull-up internas)
#define BTN_UP     2
#define BTN_DOWN   3
#define BTN_SELECT 4

struct MenuItem {
  const char* title;
  int type; // 0: Acción, 1: Toggle, 2: Rango
  int value;
};

MenuItem menuItems[${itemsCount}] = {
${itemsDef}
};

int selectedIndex = 0;
int scrollOffset  = 0;
const int visibleRows = 4;

void drawMenu() {
  display.clearDisplay();
  
  // Cabecera
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(4, 2);
  display.print("${MenuState.title}");
  display.drawLine(0, 11, 128, 11, SSD1306_WHITE);

  // Filas del menú
  for (int i = 0; i < visibleRows; i++) {
    int idx = scrollOffset + i;
    if (idx >= ${itemsCount}) break;

    int y = 14 + i * 12;
    bool isSel = (idx == selectedIndex);

    if (isSel) {
      display.fillRect(0, y - 1, 124, 11, SSD1306_WHITE);
      display.setTextColor(SSD1306_BLACK);
    } else {
      display.setTextColor(SSD1306_WHITE);
    }

    display.setCursor(4, y + 1);
    display.print(menuItems[idx].title);

    // Estado Toggle / Valor
    if (menuItems[idx].type == 1) {
      display.setCursor(94, y + 1);
      display.print(menuItems[idx].value ? "[ON]" : "[OFF]");
    }
  }

  display.display();
}

void setup() {
  Serial.begin(115200);
  pinMode(BTN_UP, INPUT_PULLUP);
  pinMode(BTN_DOWN, INPUT_PULLUP);
  pinMode(BTN_SELECT, INPUT_PULLUP);

  Wire.begin();
  display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR);
  drawMenu();
}

void loop() {
  if (digitalRead(BTN_UP) == LOW) {
    selectedIndex = (selectedIndex - 1 + ${itemsCount}) % ${itemsCount};
    if (selectedIndex < scrollOffset) scrollOffset = selectedIndex;
    drawMenu();
    delay(200);
  }
  if (digitalRead(BTN_DOWN) == LOW) {
    selectedIndex = (selectedIndex + 1) % ${itemsCount};
    if (selectedIndex >= scrollOffset + visibleRows) scrollOffset = selectedIndex - visibleRows + 1;
    drawMenu();
    delay(200);
  }
  if (digitalRead(BTN_SELECT) == LOW) {
    if (menuItems[selectedIndex].type == 1) {
      menuItems[selectedIndex].value = !menuItems[selectedIndex].value;
    }
    Serial.print("Ejecutado: ");
    Serial.println(menuItems[selectedIndex].title);
    drawMenu();
    delay(250);
  }
}`;
}

function generateMenuMicroPython() {
  return `# OLED Designer — Menú Interactivo en MicroPython
from machine import Pin, I2C
import ssd1306, time

i2c = I2C(0, scl=Pin(22), sda=Pin(21), freq=400000)
oled = ssd1306.SSD1306_I2C(128, 64, i2c)

menu_items = [
${MenuState.items.map(it => `    {"title": "${it.title}", "type": "${it.type}", "value": ${it.value ? 'True' : 'False'}}`).join(',\n')}
]

selected_idx = 0
scroll_offset = 0
visible_rows = 4

def draw_menu():
    oled.fill(0)
    oled.text("${MenuState.title}", 4, 2)
    oled.hline(0, 11, 128, 1)

    for i in range(visible_rows):
        idx = scroll_offset + i
        if idx >= len(menu_items): break
        y = 14 + i * 12
        item = menu_items[idx]
        is_sel = (idx == selected_idx)

        if is_sel:
            oled.fill_rect(0, y - 1, 124, 11, 1)
            oled.text(item["title"], 4, y + 1, 0)
        else:
            oled.text(item["title"], 4, y + 1, 1)

    oled.show()

draw_menu()
print("Menú interactivo listo.")`;
}

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.openMenuDesigner = openMenuDesigner;
}
