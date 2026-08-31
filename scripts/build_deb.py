#!/usr/bin/env python3
"""
OLED Designer — Build Script para Linux (.deb)
build_deb.py

Genera un paquete .deb para distribución en Debian/Ubuntu.
Requiere: electron-builder o empaquetado manual.

Uso:
    python3 build_deb.py
    python3 build_deb.py --version 1.0.0 --arch amd64
"""

import os
import sys
import json
import shutil
import subprocess
import argparse
from pathlib import Path
from datetime import datetime

# ============================================================
# CONFIGURACIÓN
# ============================================================

APP_NAME = "oled-designer"
APP_DISPLAY_NAME = "OLED Designer"
APP_VERSION = "1.0.0"
APP_DESCRIPTION = "Editor visual para pantallas OLED con exportación de código"
APP_MAINTAINER = "OLED Designer Team <oled@designer.app>"
APP_HOMEPAGE = "https://github.com/oled-designer/app"
APP_ARCH = "amd64"
APP_SECTION = "electronics"
APP_PRIORITY = "optional"
APP_LICENSE = "MIT"

# Directorios de instalación
INSTALL_PREFIX = "/opt/oled-designer"
DESKTOP_DIR = "/usr/share/applications"
BIN_DIR = "/usr/local/bin"
ICON_DIR = "/usr/share/icons/hicolor"

# ============================================================
# CLASE PRINCIPAL
# ============================================================

class DebBuilder:
    def __init__(self, version: str, arch: str, output_dir: str):
        self.version = version
        self.arch = arch
        self.output_dir = Path(output_dir)
        self.project_root = Path(__file__).parent.parent
        self.build_dir = self.project_root / "build" / "deb"
        self.package_name = f"{APP_NAME}_{version}_{arch}"
        self.package_dir = self.build_dir / self.package_name
        
        print(f"\n{'='*50}")
        print(f"  {APP_DISPLAY_NAME} — Build .deb")
        print(f"  Versión: {version} | Arch: {arch}")
        print(f"{'='*50}\n")

    def run(self):
        """Ejecutar el proceso de build completo."""
        steps = [
            ("Verificando requisitos",     self.check_requirements),
            ("Limpiando build anterior",   self.clean_build),
            ("Compilando con npm",         self.npm_build),
            ("Creando estructura .deb",    self.create_deb_structure),
            ("Copiando archivos",          self.copy_files),
            ("Creando scripts de control", self.create_control_files),
            ("Creando lanzadores",         self.create_launchers),
            ("Construyendo .deb",          self.build_deb),
            ("Verificando paquete",        self.verify_deb),
        ]
        
        for step_name, step_fn in steps:
            print(f"[{steps.index((step_name, step_fn))+1}/{len(steps)}] {step_name}...")
            try:
                step_fn()
                print(f"      ✓ OK")
            except Exception as e:
                print(f"      ✗ ERROR: {e}")
                sys.exit(1)
        
        deb_path = self.output_dir / f"{self.package_name}.deb"
        print(f"\n{'='*50}")
        print(f"  ✓ Paquete .deb generado:")
        print(f"  {deb_path}")
        print(f"{'='*50}")
        print(f"\nInstalar con:")
        print(f"  sudo dpkg -i {deb_path.name}")
        print(f"  o: sudo apt install ./{deb_path.name}\n")

    def check_requirements(self):
        """Verificar que las herramientas necesarias estén instaladas."""
        required = ["node", "npm", "dpkg-deb"]
        missing = []
        
        for tool in required:
            if not shutil.which(tool):
                missing.append(tool)
        
        if missing:
            raise RuntimeError(f"Herramientas no encontradas: {', '.join(missing)}")
        
        # Verificar package.json
        pkg_json = self.project_root / "package.json"
        if not pkg_json.exists():
            raise FileNotFoundError(f"package.json no encontrado en {self.project_root}")

    def clean_build(self):
        """Limpiar directorio de build anterior."""
        if self.build_dir.exists():
            shutil.rmtree(self.build_dir)
        self.build_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def npm_build(self):
        """Instalar dependencias y preparar la app."""
        # npm install si no existe node_modules
        if not (self.project_root / "node_modules").exists():
            result = subprocess.run(
                ["npm", "install", "--production"],
                cwd=self.project_root,
                capture_output=True, text=True
            )
            if result.returncode != 0:
                raise RuntimeError(f"npm install falló:\n{result.stderr}")

    def create_deb_structure(self):
        """Crear la estructura de directorios del paquete .deb."""
        dirs = [
            self.package_dir / "DEBIAN",
            self.package_dir / INSTALL_PREFIX.lstrip("/"),
            self.package_dir / DESKTOP_DIR.lstrip("/"),
            self.package_dir / BIN_DIR.lstrip("/"),
            self.package_dir / f"{ICON_DIR.lstrip('/')}/256x256/apps",
            self.package_dir / f"{ICON_DIR.lstrip('/')}/48x48/apps",
        ]
        for d in dirs:
            d.mkdir(parents=True, exist_ok=True)

    def copy_files(self):
        """Copiar archivos de la app al paquete."""
        install_dir = self.package_dir / INSTALL_PREFIX.lstrip("/")
        
        # Archivos y directorios a copiar
        copy_items = [
            "main.js",
            "preload.js",
            "package.json",
            "renderer",
            "src",
        ]
        
        for item in copy_items:
            src = self.project_root / item
            dst = install_dir / item
            
            if src.is_dir():
                shutil.copytree(src, dst, dirs_exist_ok=True)
            elif src.is_file():
                shutil.copy2(src, dst)
        
        # Copiar node_modules (solo producción)
        nm_src = self.project_root / "node_modules"
        nm_dst = install_dir / "node_modules"
        if nm_src.exists():
            print("      Copiando node_modules (puede tardar)...")
            shutil.copytree(nm_src, nm_dst, dirs_exist_ok=True)
        
        # Copiar ícono si existe
        icon_src = self.project_root / "assets" / "icons" / "icon.png"
        if icon_src.exists():
            icon_dst = self.package_dir / f"{ICON_DIR.lstrip('/')}/256x256/apps/{APP_NAME}.png"
            shutil.copy2(icon_src, icon_dst)
        
        # Calcular tamaño instalado (en KB)
        self._installed_size = sum(
            f.stat().st_size for f in install_dir.rglob("*") if f.is_file()
        ) // 1024

    def create_control_files(self):
        """Crear archivos de control del paquete .deb."""
        control_dir = self.package_dir / "DEBIAN"
        
        # ---- control ----
        control_content = f"""Package: {APP_NAME}
Version: {self.version}
Architecture: {self.arch}
Maintainer: {APP_MAINTAINER}
Installed-Size: {getattr(self, '_installed_size', 50000)}
Depends: libc6, libx11-6, libxss1, libxtst6, libnss3, libgdk-pixbuf2.0-0, libgtk-3-0, libgbm1
Section: {APP_SECTION}
Priority: {APP_PRIORITY}
Homepage: {APP_HOMEPAGE}
Description: {APP_DESCRIPTION}
 OLED Designer es un editor visual de escritorio para diseñar
 interfaces de pantallas OLED. Soporta múltiples controladores
 (SSD1306, SH1106, SSD1331, etc.) y exporta código listo para
 usar en Arduino, MicroPython, U8g2, Rust y más.
 .
 Características:
  - Editor de canvas con herramientas de dibujo
  - Importación de imágenes con conversión a 1-bit
  - Exportación de código asistida por IA
  - Base de datos PostgreSQL para proyectos
  - Compatible con I2C y SPI
"""
        (control_dir / "control").write_text(control_content)
        
        # ---- postinst ----
        postinst = f"""#!/bin/bash
set -e

# Dar permisos de ejecución
chmod +x {INSTALL_PREFIX}/node_modules/.bin/electron || true

# Actualizar base de datos de aplicaciones
update-desktop-database {DESKTOP_DIR} 2>/dev/null || true

echo ""
echo "  OLED Designer instalado correctamente."
echo "  Ejecutar: oled-designer"
echo "  O buscar en el menú de aplicaciones."
echo ""
"""
        postinst_path = control_dir / "postinst"
        postinst_path.write_text(postinst)
        postinst_path.chmod(0o755)
        
        # ---- prerm ----
        prerm = f"""#!/bin/bash
set -e
echo "Desinstalando OLED Designer..."
"""
        prerm_path = control_dir / "prerm"
        prerm_path.write_text(prerm)
        prerm_path.chmod(0o755)

    def create_launchers(self):
        """Crear lanzadores y archivos .desktop."""
        install_dir = Path(INSTALL_PREFIX)
        
        # ---- Script lanzador ----
        launcher_content = f"""#!/bin/bash
# OLED Designer — Lanzador Linux
cd {INSTALL_PREFIX}
exec node_modules/.bin/electron . "$@"
"""
        launcher_path = self.package_dir / BIN_DIR.lstrip("/") / "oled-designer"
        launcher_path.write_text(launcher_content)
        launcher_path.chmod(0o755)
        
        # ---- Archivo .desktop ----
        desktop_content = f"""[Desktop Entry]
Name={APP_DISPLAY_NAME}
GenericName=Editor de Pantallas OLED
Comment={APP_DESCRIPTION}
Exec=/usr/local/bin/oled-designer %U
Icon={APP_NAME}
Terminal=false
Type=Application
Categories=Development;Electronics;Graphics;
Keywords=OLED;SSD1306;Arduino;MicroPython;Display;Embedded;
StartupWMClass=oled-designer
StartupNotify=true
"""
        desktop_path = self.package_dir / DESKTOP_DIR.lstrip("/") / f"{APP_NAME}.desktop"
        desktop_path.write_text(desktop_content)

    def build_deb(self):
        """Construir el archivo .deb con dpkg-deb."""
        deb_path = self.output_dir / f"{self.package_name}.deb"
        
        result = subprocess.run(
            ["dpkg-deb", "--build", "--root-owner-group",
             str(self.package_dir), str(deb_path)],
            capture_output=True, text=True
        )
        
        if result.returncode != 0:
            raise RuntimeError(f"dpkg-deb falló:\n{result.stderr}")

    def verify_deb(self):
        """Verificar el paquete .deb generado."""
        deb_path = self.output_dir / f"{self.package_name}.deb"
        
        if not deb_path.exists():
            raise FileNotFoundError(f"El .deb no fue generado: {deb_path}")
        
        size_mb = deb_path.stat().st_size / (1024 * 1024)
        
        # Verificar contenido
        result = subprocess.run(
            ["dpkg-deb", "--info", str(deb_path)],
            capture_output=True, text=True
        )
        
        if result.returncode != 0:
            raise RuntimeError(f"El .deb está corrupto:\n{result.stderr}")
        
        print(f"      Tamaño: {size_mb:.1f} MB")


# ============================================================
# CLI
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description=f"Build script para {APP_DISPLAY_NAME} (.deb)"
    )
    parser.add_argument("--version", default=APP_VERSION,
                        help=f"Versión del paquete (default: {APP_VERSION})")
    parser.add_argument("--arch", default=APP_ARCH,
                        choices=["amd64", "arm64", "armhf"],
                        help=f"Arquitectura (default: {APP_ARCH})")
    parser.add_argument("--output", default="dist",
                        help="Directorio de salida (default: dist/)")
    
    args = parser.parse_args()
    
    builder = DebBuilder(
        version=args.version,
        arch=args.arch,
        output_dir=args.output
    )
    builder.run()


if __name__ == "__main__":
    main()
