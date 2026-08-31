// ============================================================
// OLED Designer — Biblioteca de Plantillas de Animaciones Presets
// Importadas y adaptadas de oledanimationmaker.com
// renderer/animTemplates.js
// ============================================================

(function () {
  // Primitivas gráficas en búfer 2D f[y][x]
  const mk = (W, H) => Array.from({ length: H }, () => new Uint8Array(W));
  const px = (f, x, y, W, H, v = 1) => {
    const ix = Math.round(x), iy = Math.round(y);
    if (ix >= 0 && ix < W && iy >= 0 && iy < H) f[iy][ix] = v;
  };

  const ln = (f, x0, y0, x1, y1, W, H) => {
    x0 = Math.round(x0); y0 = Math.round(y0);
    x1 = Math.round(x1); y1 = Math.round(y1);
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1, sy = (y0 < y1) ? 1 : -1;
    let er = dx - dy;
    for (;;) {
      px(f, x0, y0, W, H);
      if (x0 === x1 && y0 === y1) break;
      let e = 2 * er;
      if (e > -dy) { er -= dy; x0 += sx; }
      if (e < dx) { er += dx; y0 += sy; }
    }
  };

  const circ = (f, cx, cy, r, W, H) => {
    cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
    let x = r, y = 0, e = 0;
    while (x >= y) {
      [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]].forEach(([a, b]) => px(f, cx + a, cy + b, W, H));
      y++; e += 2 * y + 1;
      if (2 * (e - x) + 1 > 0) { x--; e += 1 - 2 * x; }
    }
  };

  const fillCirc = (f, cx, cy, r, W, H) => {
    cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) px(f, cx + dx, cy + dy, W, H);
      }
    }
  };

  const outRect = (f, x, y, w, h, W, H) => {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    for (let i = x; i < x + w; i++) { px(f, i, y, W, H); px(f, i, y + h - 1, W, H); }
    for (let i = y; i < y + h; i++) { px(f, x, i, W, H); px(f, x + w - 1, i, W, H); }
  };

  const fillRect = (f, x, y, w, h, W, H) => {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    for (let iy = y; iy < y + h; iy++) {
      for (let ix = x; ix < x + w; ix++) px(f, ix, iy, W, H);
    }
  };

  const bmp = (f, str, ox, oy, W, H) => {
    str.trim().split('\n').forEach((row, y) => [...row].forEach((c, x) => {
      if (c === '#') px(f, ox + x, oy + y, W, H);
    }));
  };

  const arc = (f, cx, cy, r, a0, a1, W, H) => {
    for (let a = a0; a <= a1; a += 1) {
      const rd = (a * Math.PI) / 180;
      px(f, Math.round(cx + r * Math.cos(rd)), Math.round(cy + r * Math.sin(rd)), W, H);
    }
  };

  // Convertidor de matriz 2D a búfer nativo 1D { bitmap, durationMs }
  function to1D(frames2D, W, H, fps) {
    const durationMs = Math.round(1000 / fps);
    return frames2D.map(f2 => {
      const bm = new Uint8Array(W * H);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (f2[y] && f2[y][x]) bm[y * W + x] = 1;
        }
      }
      return { bitmap: bm, durationMs };
    });
  }

  // ── CATÁLOGO COMPLETO DE ANIMACIONES ──────────────────────────────────────────
  const AnimationTemplatesCatalog = [
    // 1. Pac-Man Arcade
    {
      id: 'pacman',
      name: 'Pac-Man Arcade',
      category: 'games',
      icon: '👾',
      description: 'El clásico Pac-Man abriendo y cerrando la boca comiendo píxeles.',
      frameCount: 4,
      fps: 6,
      generate(W, H) {
        const cy = Math.floor(H / 2), startX = Math.floor(W * 0.15);
        const mouths = [2, 26, 46, 26];
        const dots = [Math.floor(W * 0.5), Math.floor(W * 0.65), Math.floor(W * 0.8), Math.floor(W * 0.95)];
        const frames = mouths.map((m, i) => {
          const f = mk(W, H);
          const cx = startX + i * Math.floor(W * 0.12);
          circ(f, cx, cy, 12, W, H);
          fillCirc(f, cx, cy, 11, W, H);
          if (m > 0) {
            for (let a = -m; a <= m; a += 1) {
              const rd = (a * Math.PI) / 180;
              for (let rr = 0; rr <= 12; rr++) {
                const py = Math.round(cy + rr * Math.sin(rd));
                const px2 = Math.round(cx + rr * Math.cos(rd));
                if (px2 >= 0 && px2 < W && py >= 0 && py < H) f[py][px2] = 0;
              }
            }
          }
          dots.slice(i).forEach(dx => fillCirc(f, dx, cy, 2, W, H));
          if (cy - 5 >= 0 && cx - 2 >= 0 && cx - 2 < W) f[cy - 5][cx - 2] = 0;
          return f;
        });
        return to1D(frames, W, H, this.fps);
      }
    },

    // 2. Latido de Corazón
    {
      id: 'heart_beat',
      name: 'Latido de Corazón (Pulse)',
      category: 'games',
      icon: '❤️',
      description: 'Corazón palpitante con doble pulso biológico.',
      frameCount: 4,
      fps: 4,
      generate(W, H) {
        const cx = Math.floor(W / 2), cy = Math.floor(H / 2);
        const sm = `.##.##.\n#######\n#######\n.#####.\n..###..\n...#...`;
        const lg = `..###...###..\n.#######.#######.\n#################\n#################\n.###############.\n..#############..\n...###########...\n....#########....\n.....#######.....\n......#####......\n.......###.......\n........#........`;
        const f1 = mk(W, H); bmp(f1, sm, cx - 3, cy - 3, W, H);
        const f2 = mk(W, H); bmp(f2, lg, cx - 8, cy - 6, W, H);
        const f3 = mk(W, H); bmp(f3, sm, cx - 3, cy - 3, W, H);
        const f4 = mk(W, H);
        return to1D([f1, f2, f3, f4], W, H, this.fps);
      }
    },

    // 3. Hiperespacio / Warp Speed
    {
      id: 'warp_speed',
      name: 'Warp Speed (Hiperespacio 3D)',
      category: 'fx',
      icon: '🚀',
      description: 'Estrellas acelerando desde el centro simulando viaje espacial a velocidad luz.',
      frameCount: 15,
      fps: 15,
      generate(W, H) {
        const stars = Array.from({ length: 45 }, () => ({
          x: (Math.random() - 0.5) * W,
          y: (Math.random() - 0.5) * H,
          z: Math.random() * 0.8 + 0.2
        }));
        const frames = [];
        const cx = W / 2, cy = H / 2;

        for (let i = 0; i < 15; i++) {
          const f = mk(W, H);
          stars.forEach(s => {
            s.x *= 1.18;
            s.y *= 1.18;
            if (Math.abs(s.x) > cx || Math.abs(s.y) > cy) {
              s.x = (Math.random() - 0.5) * (W * 0.3);
              s.y = (Math.random() - 0.5) * (H * 0.3);
            }
            const px0 = Math.round(cx + s.x);
            const py0 = Math.round(cy + s.y);
            const px1 = Math.round(cx + s.x * 0.85);
            const py1 = Math.round(cy + s.y * 0.85);
            ln(f, px0, py0, px1, py1, W, H);
          });
          frames.push(f);
        }
        return to1D(frames, W, H, this.fps);
      }
    },

    // 4. Matrix Rain
    {
      id: 'matrix_rain',
      name: 'Lluvia de Código Matrix',
      category: 'fx',
      icon: '💻',
      description: 'Efecto cyberpunk de cascada digital descendente.',
      frameCount: 12,
      fps: 10,
      generate(W, H) {
        const cols = Math.floor(W / 4);
        const drops = Array.from({ length: cols }, () => Math.floor(Math.random() * H));
        const frames = [];
        for (let i = 0; i < 12; i++) {
          const f = mk(W, H);
          drops.forEach((y, c) => {
            const x = c * 4;
            px(f, x, y, W, H);
            if (y > 0) px(f, x, y - 1, W, H);
            if (y > 2) px(f, x, y - 3, W, H);
            if (y > 5) px(f, x, y - 6, W, H);
            drops[c] = (y + Math.floor(Math.random() * 3) + 2) % H;
          });
          frames.push(f);
        }
        return to1D(frames, W, H, this.fps);
      }
    },

    // 5. Ondas de Agua Ripple
    {
      id: 'ripple',
      name: 'Ondas de Agua (Ripple)',
      category: 'fx',
      icon: '🌊',
      description: 'Anillos concéntricos de agua expandiéndose suavemente.',
      frameCount: 15,
      fps: 12,
      generate(W, H) {
        const frames = [];
        const maxR = Math.max(W, H) * 0.75;
        for (let i = 0; i < 15; i++) {
          const f = mk(W, H);
          for (let r = i * 4; r < maxR; r += 16) {
            circ(f, W / 2, H / 2, r, W, H);
          }
          frames.push(f);
        }
        return to1D(frames, W, H, this.fps);
      }
    },

    // 6. Lluvia Meteorológica
    {
      id: 'rain_fall',
      name: 'Lluvia Animada',
      category: 'fx',
      icon: '🌧️',
      description: 'Gotas de lluvia cayendo a diferentes velocidades.',
      frameCount: 10,
      fps: 14,
      generate(W, H) {
        const drops = Array.from({ length: 35 }, () => ({
          x: Math.random() * W,
          y: Math.random() * H,
          s: Math.random() * 3 + 2
        }));
        const frames = [];
        for (let i = 0; i < 10; i++) {
          const f = mk(W, H);
          drops.forEach(d => {
            d.y += d.s * 2.2;
            d.x -= 0.8;
            if (d.y > H) { d.y = 0; d.x = Math.random() * (W + 20); }
            ln(f, d.x, d.y, d.x - 1, d.y + 4, W, H);
          });
          frames.push(f);
        }
        return to1D(frames, W, H, this.fps);
      }
    },

    // 7. Reloj Digital 7 Segmentos
    {
      id: 'digital_clock',
      name: 'Reloj Digital 7-Segmentos',
      category: 'dashboard',
      icon: '🕐',
      description: 'Reloj digital grande estilo Smartwatch con segundero parpadeante.',
      frameCount: 4,
      fps: 2,
      generate(W, H) {
        const SEG = {
          '0': [1,1,1,1,1,1,0], '1': [0,1,1,0,0,0,0], '2': [1,1,0,1,1,0,1], '3': [1,1,1,1,0,0,1],
          '4': [0,1,1,0,0,1,1], '5': [1,0,1,1,0,1,1], '6': [1,0,1,1,1,1,1], '7': [1,1,1,0,0,0,0],
          '8': [1,1,1,1,1,1,1], '9': [1,1,1,1,0,1,1]
        };
        function drawDigit(f, d, x, y, dw, dh) {
          const s = SEG[d]; if (!s) return;
          const t = 2, mid = y + Math.floor(dh / 2);
          if (s[0]) fillRect(f, x + t, y, dw - 2 * t, t, W, H);
          if (s[3]) fillRect(f, x + t, y + dh - t, dw - 2 * t, t, W, H);
          if (s[6]) fillRect(f, x + t, mid - 1, dw - 2 * t, t, W, H);
          if (s[5]) fillRect(f, x, y + t, t, mid - y - t, W, H);
          if (s[1]) fillRect(f, x + dw - t, y + t, t, mid - y - t, W, H);
          if (s[4]) fillRect(f, x, mid, t, y + dh - mid - t, W, H);
          if (s[2]) fillRect(f, x + dw - t, mid, t, y + dh - mid - t, W, H);
        }

        const times = ['10:08', '10:09', '10:10', '10:11'];
        const frames = times.map((tm, idx) => {
          const f = mk(W, H);
          const dw = 14, dh = 26;
          let cx = Math.floor((W - (4 * dw + 20)) / 2);
          const cy = Math.floor((H - dh) / 2) - 3;

          for (let i = 0; i < tm.length; i++) {
            const ch = tm[i];
            if (ch === ':') {
              if (idx % 2 === 0) {
                fillCirc(f, cx + 3, cy + 8, 1, W, H);
                fillCirc(f, cx + 3, cy + 18, 1, W, H);
              }
              cx += 8;
            } else {
              drawDigit(f, ch, cx, cy, dw, dh);
              cx += dw + 4;
            }
          }
          // Fecha serigrafiada abajo
          outRect(f, Math.floor(W * 0.2), H - 10, Math.floor(W * 0.6), 7, W, H);
          return f;
        });
        return to1D(frames, W, H, this.fps);
      }
    },

    // 8. Reloj Analógico
    {
      id: 'analog_clock',
      name: 'Reloj Analógico de Manecillas',
      category: 'dashboard',
      icon: '🕰️',
      description: 'Esfera con marcas horarias y manecilla giratoria de 360 grados.',
      frameCount: 12,
      fps: 4,
      generate(W, H) {
        const cx = Math.floor(W / 2), cy = Math.floor(H / 2), r = Math.min(cx, cy) - 4;
        const frames = [];
        for (let h = 0; h < 12; h++) {
          const f = mk(W, H);
          circ(f, cx, cy, r, W, H);
          // Marcas horarias
          for (let m = 0; m < 12; m++) {
            const ma = (m / 12) * Math.PI * 2 - Math.PI / 2;
            px(f, Math.round(cx + (r - 2) * Math.cos(ma)), Math.round(cy + (r - 2) * Math.sin(ma)), W, H);
          }
          // Manecilla de hora
          const ha = (h / 12) * Math.PI * 2 - Math.PI / 2;
          ln(f, cx, cy, Math.round(cx + (r * 0.6) * Math.cos(ha)), Math.round(cy + (r * 0.6) * Math.sin(ha)), W, H);
          // Manecilla de minuto fija en las 12
          ln(f, cx, cy, cx, cy - r + 4, W, H);
          fillCirc(f, cx, cy, 2, W, H);
          frames.push(f);
        }
        return to1D(frames, W, H, this.fps);
      }
    },

    // 9. Batería Cargando con Rayo
    {
      id: 'battery_charging',
      name: 'Carga de Batería con Rayo',
      category: 'hardware',
      icon: '🔋',
      description: 'Indicador de batería llenándose cíclicamente con icono de carga.',
      frameCount: 5,
      fps: 4,
      generate(W, H) {
        const bw = 70, bh = 24;
        const bx = Math.floor((W - bw) / 2) - 3, by = Math.floor((H - bh) / 2);
        const frames = [0, 1, 2, 3, 4].map(level => {
          const f = mk(W, H);
          outRect(f, bx, by, bw, bh, W, H);
          fillRect(f, bx + bw, by + Math.floor(bh * 0.25), 5, Math.floor(bh * 0.5), W, H);
          const fillW = Math.floor((bw - 6) * (level / 4));
          if (fillW > 0) fillRect(f, bx + 3, by + 3, fillW, bh - 6, W, H);
          // Rayo de carga
          const lx = Math.floor(bx + bw / 2), ly = by + 5;
          bmp(f, `..#\n.##\n####\n.##\n..#`, lx - 2, ly, W, H);
          return f;
        });
        return to1D(frames, W, H, this.fps);
      }
    },

    // 10. Barras de Señal Móvil
    {
      id: 'signal_bars',
      name: 'Barras de Señal Móvil',
      category: 'hardware',
      icon: '📶',
      description: 'Barras de cobertura celular creciendo progresivamente.',
      frameCount: 5,
      fps: 3,
      generate(W, H) {
        const bars = 5, bw = 8, gap = 4;
        const totalW = bars * (bw + gap) - gap;
        const sx = Math.floor((W - totalW) / 2);
        const baseY = Math.floor(H * 0.75);
        const bhs = [6, 12, 18, 24, 30];

        const frames = [0, 1, 2, 3, 4].map(lvl => {
          const f = mk(W, H);
          for (let b = 0; b < bars; b++) {
            const x = sx + b * (bw + gap);
            const h = bhs[b], y = baseY - h;
            if (b <= lvl) fillRect(f, x, y, bw, h, W, H);
            else outRect(f, x, y, bw, h, W, H);
          }
          return f;
        });
        return to1D(frames, W, H, this.fps);
      }
    },

    // 11. Pelota Rebotando
    {
      id: 'bouncing_ball',
      name: 'Pelota Rebotando (Física)',
      category: 'games',
      icon: '⚽',
      description: 'Pelota elástica rebotando contra los límites de la pantalla con trayectoria.',
      frameCount: 12,
      fps: 14,
      generate(W, H) {
        const r = 4, frames = [];
        let x = 15, y = 15, vx = 8, vy = 5;
        for (let i = 0; i < 12; i++) {
          const f = mk(W, H);
          fillCirc(f, x, y, r, W, H);
          outRect(f, 0, 0, W, H, W, H);
          frames.push(f);
          x += vx; y += vy;
          if (x + r >= W - 1 || x - r <= 0) vx = -vx;
          if (y + r >= H - 1 || y - r <= 0) vy = -vy;
        }
        return to1D(frames, W, H, this.fps);
      }
    },

    // 12. Carita Sonriente Feliz
    {
      id: 'smiley_face',
      name: 'Carita Emoji Sonriente',
      category: 'robot',
      icon: '😊',
      description: 'Cara feliz con pestañeo de ojos sincronizado.',
      frameCount: 4,
      fps: 3,
      generate(W, H) {
        const cx = Math.floor(W / 2), cy = Math.floor(H / 2);
        function base(open) {
          const f = mk(W, H);
          circ(f, cx, cy, 22, W, H);
          if (open) {
            fillCirc(f, cx - 8, cy - 6, 3, W, H);
            fillCirc(f, cx + 8, cy - 6, 3, W, H);
          } else {
            ln(f, cx - 11, cy - 6, cx - 5, cy - 6, W, H);
            ln(f, cx + 5, cy - 6, cx + 11, cy - 6, W, H);
          }
          arc(f, cx, cy + 4, 12, 30, 150, W, H);
          return f;
        }
        return to1D([base(true), base(true), base(false), base(true)], W, H, this.fps);
      }
    },

    // 13. Ojos Robóticos Parpadeo
    {
      id: 'robot_blink',
      name: 'Ojos Robóticos — Parpadeo',
      category: 'robot',
      icon: '🤖',
      description: 'Animación fluida de ojos de robot parpadeando (estilo Cozmo / Vector).',
      frameCount: 8,
      fps: 12,
      generate(W, H) {
        const frames = [];
        const eyeW = Math.round(W * 0.22);
        const maxEyeH = Math.round(H * 0.55);
        const leftX = Math.round(W * 0.22);
        const rightX = Math.round(W * 0.78);
        const centerY = Math.round(H * 0.5);
        const heights = [maxEyeH, maxEyeH * 0.8, maxEyeH * 0.45, maxEyeH * 0.15, 2, maxEyeH * 0.2, maxEyeH * 0.6, maxEyeH * 0.9];

        heights.forEach(h => {
          const bm = new Uint8Array(W * H);
          const halfH = Math.max(1, Math.round(h / 2));
          [leftX, rightX].forEach(cx => {
            for (let dy = -halfH; dy <= halfH; dy++) {
              for (let dx = -eyeW / 2; dx <= eyeW / 2; dx++) {
                const px2 = Math.round(cx + dx);
                const py = Math.round(centerY + dy);
                if (px2 >= 0 && px2 < W && py >= 0 && py < H) {
                  const cornerDist = Math.abs(dx) / (eyeW / 2) + Math.abs(dy) / halfH;
                  if (cornerDist <= 1.4) bm[py * W + px2] = 1;
                }
              }
            }
          });
          frames.push({ bitmap: bm, durationMs: 80 });
        });
        return frames;
      }
    },

    // 14. Ojos Robóticos Mirada Curiosa
    {
      id: 'robot_look',
      name: 'Ojos Robóticos — Mirada Curiosa',
      category: 'robot',
      icon: '👀',
      description: 'Los ojos se desplazan de izquierda a derecha con parpadeo expresivo.',
      frameCount: 8,
      fps: 8,
      generate(W, H) {
        const frames = [];
        const eyeW = Math.round(W * 0.2);
        const eyeH = Math.round(H * 0.5);
        const centerY = Math.round(H * 0.5);
        const offsets = [0, -12, -20, -10, 0, 10, 20, 10];

        offsets.forEach(offX => {
          const bm = new Uint8Array(W * H);
          const leftX = Math.round(W * 0.3 + offX);
          const rightX = Math.round(W * 0.7 + offX);
          [leftX, rightX].forEach(cx => {
            for (let dy = -eyeH / 2; dy <= eyeH / 2; dy++) {
              for (let dx = -eyeW / 2; dx <= eyeW / 2; dx++) {
                const px2 = Math.round(cx + dx);
                const py = Math.round(centerY + dy);
                if (px2 >= 0 && px2 < W && py >= 0 && py < H) bm[py * W + px2] = 1;
              }
            }
          });
          frames.push({ bitmap: bm, durationMs: 120 });
        });
        return frames;
      }
    },

    // 15. Onda Senoidal Flotante
    {
      id: 'sine_wave',
      name: 'Onda Senoidal Flotante',
      category: 'fx',
      icon: '〰️',
      description: 'Onda trigonométrica continua oscilando a través de la pantalla.',
      frameCount: 8,
      fps: 12,
      generate(W, H) {
        const frames = [];
        const cy = Math.floor(H / 2);
        for (let i = 0; i < 8; i++) {
          const f = mk(W, H);
          const off = i * 8;
          for (let x = 0; x < W; x++) {
            const y = Math.round(cy + 18 * Math.sin(((x + off) * 2 * Math.PI) / 40));
            px(f, x, y, W, H);
            if (y + 1 < H) px(f, x, y + 1, W, H);
          }
          frames.push(f);
        }
        return to1D(frames, W, H, this.fps);
      }
    },

    // 16. Monitor Cardíaco ECG
    {
      id: 'ecg_pulse',
      name: 'Monitor Cardíaco ECG',
      category: 'hardware',
      icon: '📈',
      description: 'Trazo de electrocardiograma en tiempo real con corazón palpitante.',
      frameCount: 8,
      fps: 10,
      generate(W, H) {
        const frames = [];
        const cy = Math.round(H * 0.55);
        for (let f = 0; f < 8; f++) {
          const bm = new Uint8Array(W * H);
          const shift = f * (W / 8);
          for (let x = 0; x < W; x++) {
            const px2 = (x + shift) % W;
            let dy = 0;
            if (px2 > 40 && px2 < 46) dy = 4;
            else if (px2 >= 46 && px2 < 50) dy = -20;
            else if (px2 >= 50 && px2 < 54) dy = 10;
            else if (px2 >= 60 && px2 < 70) dy = -6;

            const y = Math.max(0, Math.min(H - 1, cy + dy));
            bm[y * W + x] = 1;
            if (Math.abs(dy) > 4) bm[Math.min(H - 1, y + 1) * W + x] = 1;
          }
          frames.push({ bitmap: bm, durationMs: 100 });
        }
        return frames;
      }
    },

    // 17. Radar / WiFi Sweep
    {
      id: 'wifi_radar',
      name: 'Radar / WiFi Concéntrico',
      category: 'hardware',
      icon: '📡',
      description: 'Ondas concéntricas de radiofrecuencia emitiendo desde el transmisor.',
      frameCount: 6,
      fps: 6,
      generate(W, H) {
        const frames = [];
        const cx = Math.round(W / 2), cy = Math.round(H * 0.75);
        for (let f = 0; f < 6; f++) {
          const bm = new Uint8Array(W * H);
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              if (dx * dx + dy * dy <= 4) bm[(cy + dy) * W + (cx + dx)] = 1;
            }
          }
          [1, 2, 3].forEach(ring => {
            const curR = ((f + ring * 3) % 10) * 4 + 6;
            for (let a = -Math.PI * 0.85; a <= -Math.PI * 0.15; a += 0.04) {
              const rx = Math.round(cx + Math.cos(a) * curR);
              const ry = Math.round(cy + Math.sin(a) * curR);
              if (rx >= 0 && rx < W && ry >= 0 && ry < H) bm[ry * W + rx] = 1;
            }
          });
          frames.push({ bitmap: bm, durationMs: 160 });
        }
        return frames;
      }
    },

    // 18. Spinner Circular de Carga
    {
      id: 'spinner_ring',
      name: 'Spinner Circular de Carga',
      category: 'hardware',
      icon: '🔄',
      description: 'Indicador circular rotatorio para pantallas de carga y progreso.',
      frameCount: 8,
      fps: 10,
      generate(W, H) {
        const frames = [];
        const cx = Math.round(W / 2), cy = Math.round(H / 2);
        const radius = Math.min(cx, cy) * 0.65;
        for (let f = 0; f < 8; f++) {
          const bm = new Uint8Array(W * H);
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const px2 = Math.round(cx + Math.cos(angle) * radius);
            const py = Math.round(cy + Math.sin(angle) * radius);
            const isHead = (i === f), isTail = ((i + 1) % 8 === f);
            const dotSize = isHead ? 3 : (isTail ? 2 : 1);
            for (let dy = -dotSize; dy <= dotSize; dy++) {
              for (let dx = -dotSize; dx <= dotSize; dx++) {
                const rx = px2 + dx, ry = py + dy;
                if (rx >= 0 && rx < W && ry >= 0 && ry < H && dx * dx + dy * dy <= dotSize * dotSize) {
                  bm[ry * W + rx] = 1;
                }
              }
            }
          }
          frames.push({ bitmap: bm, durationMs: 100 });
        }
        return frames;
      }
    }
  ];

  // ── CONTROLADOR DE LA INTERFAZ DE PLANTILLAS ──────────────────────────────────
  let activeAnimCategory = 'all';
  let activeAnimSearch = '';
  let activeAnimIntervals = [];

  function openAnimTemplatesModal() {
    openModal('modal-anim-templates');
    initAnimTemplatesUI();
  }

  function initAnimTemplatesUI() {
    // Limpiar intervalos de vista previa anteriores
    activeAnimIntervals.forEach(clearInterval);
    activeAnimIntervals = [];

    // Pestañas de categoría
    document.querySelectorAll('.anim-cat-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.anim-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeAnimCategory = btn.dataset.acat;
        renderAnimTemplatesGrid();
      };
    });

    // Buscador
    const searchInput = document.getElementById('anim-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        activeAnimSearch = e.target.value.toLowerCase().trim();
        renderAnimTemplatesGrid();
      };
    }

    renderAnimTemplatesGrid();
  }

  function renderAnimTemplatesGrid() {
    // Detener animaciones previas
    activeAnimIntervals.forEach(clearInterval);
    activeAnimIntervals = [];

    const grid = document.getElementById('anim-templates-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = AnimationTemplatesCatalog.filter(tpl => {
      const matchCat = (activeAnimCategory === 'all' || tpl.category === activeAnimCategory);
      const matchSearch = (!activeAnimSearch || tpl.name.toLowerCase().includes(activeAnimSearch) || tpl.description.toLowerCase().includes(activeAnimSearch));
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 40px;">No se encontraron plantillas coincidentes.</div>';
      return;
    }

    filtered.forEach(tpl => {
      const card = document.createElement('div');
      card.className = 'anim-tpl-card';

      const header = document.createElement('div');
      header.className = 'anim-tpl-title';
      header.innerHTML = `<span>${tpl.icon || '🎬'}</span> ${tpl.name}`;
      card.appendChild(header);

      // Canvas de vista previa animada
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      card.appendChild(canvas);

      const desc = document.createElement('div');
      desc.className = 'anim-tpl-desc';
      desc.textContent = `${tpl.frameCount} frames · ${tpl.fps} FPS · ${tpl.description}`;
      card.appendChild(desc);

      const loadBtn = document.createElement('button');
      loadBtn.className = 'btn-primary btn-full';
      loadBtn.textContent = (window.I18N && window.I18N.t('btn_load_timeline')) || 'Cargar en Timeline';
      loadBtn.onclick = () => loadTemplateIntoTimeline(tpl);
      card.appendChild(loadBtn);

      grid.appendChild(card);

      // Iniciar animación en miniatura
      try {
        const generated = tpl.generate(128, 64);
        let curF = 0;
        const ctx = canvas.getContext('2d');

        const interval = setInterval(() => {
          const modal = document.getElementById('modal-anim-templates');
          if (!modal || modal.classList.contains('hidden')) {
            clearInterval(interval);
            return;
          }
          ctx.fillStyle = '#020305';
          ctx.fillRect(0, 0, 128, 64);
          ctx.fillStyle = '#00d4aa';

          const frameObj = generated[curF];
          if (frameObj && frameObj.bitmap) {
            const bm = frameObj.bitmap;
            for (let y = 0; y < 64; y++) {
              for (let x = 0; x < 128; x++) {
                if (bm[y * 128 + x]) ctx.fillRect(x, y, 1, 1);
              }
            }
          }
          curF = (curF + 1) % generated.length;
        }, 1000 / tpl.fps);

        activeAnimIntervals.push(interval);
      } catch (err) {
        console.error('Error al generar preview de plantilla:', tpl.name, err);
      }
    });
  }

  function loadTemplateIntoTimeline(tpl) {
    pushHistory();
    const frames = tpl.generate(State.width, State.height);

    State.frames = frames.map((f, idx) => ({
      id: Date.now() + idx,
      name: `Frame ${idx + 1}`,
      bitmap: f.bitmap,
      durationMs: f.durationMs
    }));

    State.fps = tpl.fps;
    State.currentFrameIndex = 0;
    State.bitmap.set(State.frames[0].bitmap);
    toggleTimeline(true);

    renderCanvas();
    renderPreview();
    updateTimelineUI();
    closeModal('modal-anim-templates');
    showToast(`Plantilla "${tpl.name}" cargada en la línea de tiempo ✓`, 'success');
  }

  window.addEventListener('appLanguageChanged', () => {
    const modal = document.getElementById('modal-anim-templates');
    if (modal && !modal.classList.contains('hidden')) {
      renderAnimTemplatesGrid();
    }
  });

  if (typeof window !== 'undefined') {
    window.openAnimTemplatesModal = openAnimTemplatesModal;
    window.AnimationTemplatesCatalog = AnimationTemplatesCatalog;
  }
})();

