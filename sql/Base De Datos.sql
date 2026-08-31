-- ============================================================
-- OLED Designer — Esquema Completo de Base de Datos
-- Base De Datos.sql
-- Versión: 1.0.0
-- ============================================================

-- Crear base de datos (ejecutar como superusuario)
-- CREATE DATABASE oled_designer;
-- \c oled_designer;

-- ============================================================
-- EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- TABLA: users (opcional, para multiusuario)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username    VARCHAR(50) UNIQUE NOT NULL,
    email       VARCHAR(100) UNIQUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preferences JSONB DEFAULT '{}'::JSONB
);

-- ============================================================
-- TABLA: drivers (controladores de pantalla OLED)
-- ============================================================
CREATE TABLE IF NOT EXISTS drivers (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) UNIQUE NOT NULL,
    description     TEXT,
    manufacturer    VARCHAR(100),
    max_width       INTEGER NOT NULL DEFAULT 128,
    max_height      INTEGER NOT NULL DEFAULT 64,
    color_support   VARCHAR(20) DEFAULT 'monochrome',  -- monochrome, rgb, grayscale
    interfaces      TEXT[] DEFAULT ARRAY['I2C', 'SPI'],
    i2c_addresses   TEXT[] DEFAULT ARRAY['0x3C', '0x3D'],
    voltage         VARCHAR(20) DEFAULT '3.3V',
    notes           TEXT,
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: resolutions (resoluciones de pantalla)
-- ============================================================
CREATE TABLE IF NOT EXISTS resolutions (
    id          SERIAL PRIMARY KEY,
    width       INTEGER NOT NULL,
    height      INTEGER NOT NULL,
    label       VARCHAR(50) NOT NULL,        -- ej: "128x64 (Standard)"
    is_custom   BOOLEAN DEFAULT FALSE,
    description TEXT,
    common_drivers TEXT[],                   -- drivers compatibles típicos
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(width, height, label)
);

-- ============================================================
-- TABLA: pinouts (distribución de pines por interfaz)
-- ============================================================
CREATE TABLE IF NOT EXISTS pinouts (
    id          SERIAL PRIMARY KEY,
    driver_id   INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    interface   VARCHAR(10) NOT NULL,        -- 'I2C' o 'SPI'
    pin_name    VARCHAR(20) NOT NULL,        -- ej: SCL, SDA, CS, DC, RST
    pin_number  INTEGER,                     -- número de pin del módulo
    description TEXT,                        -- descripción funcional
    arduino_pin VARCHAR(30),                 -- mapeo típico en Arduino
    color       VARCHAR(20) DEFAULT '#FFFFFF', -- color para diagrama visual
    sort_order  INTEGER DEFAULT 0
);

-- ============================================================
-- TABLA: code_templates (plantillas de código por plataforma)
-- ============================================================
CREATE TABLE IF NOT EXISTS code_templates (
    id              SERIAL PRIMARY KEY,
    platform        VARCHAR(50) NOT NULL,    -- arduino, u8g2, micropython, c_array, js, rust
    driver_id       INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
    template_name   VARCHAR(100) NOT NULL,
    header_code     TEXT,                    -- includes, declaraciones
    init_code       TEXT,                    -- código de inicialización
    draw_pixel      TEXT,                    -- función para dibujar pixel
    draw_text       TEXT,                    -- función para texto
    draw_line       TEXT,                    -- función para líneas
    draw_rect       TEXT,                    -- función para rectángulos
    draw_circle     TEXT,                    -- función para círculos
    draw_bitmap     TEXT,                    -- función para bitmaps
    display_update  TEXT,                    -- función para actualizar display
    clear_display   TEXT,                    -- función para limpiar
    footer_code     TEXT,                    -- código de cierre
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: projects (proyectos guardados)
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    driver_id       INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
    resolution_id   INTEGER REFERENCES resolutions(id) ON DELETE SET NULL,
    width           INTEGER NOT NULL DEFAULT 128,
    height          INTEGER NOT NULL DEFAULT 64,
    interface       VARCHAR(10) DEFAULT 'I2C',   -- I2C o SPI
    display_color   VARCHAR(20) DEFAULT 'white', -- white, blue, yellow, rgb
    canvas_data     TEXT NOT NULL,               -- bitmap en base64 o JSON
    canvas_elements JSONB DEFAULT '[]'::JSONB,   -- elementos individuales (texto, shapes)
    thumbnail       TEXT,                        -- preview en base64
    tags            TEXT[] DEFAULT '{}',
    is_template     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_opened_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: project_versions (historial de versiones)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_versions (
    id              SERIAL PRIMARY KEY,
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    version_number  INTEGER NOT NULL,
    canvas_data     TEXT NOT NULL,
    canvas_elements JSONB DEFAULT '[]'::JSONB,
    change_notes    TEXT,
    thumbnail       TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: exported_code (historial de código exportado)
-- ============================================================
CREATE TABLE IF NOT EXISTS exported_code (
    id          SERIAL PRIMARY KEY,
    project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
    platform    VARCHAR(50) NOT NULL,
    code        TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_assisted BOOLEAN DEFAULT FALSE,
    metadata    JSONB DEFAULT '{}'::JSONB
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_last_opened ON projects(last_opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_project ON project_versions(project_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_pinouts_driver ON pinouts(driver_id);
CREATE INDEX IF NOT EXISTS idx_code_templates_platform ON code_templates(platform);
CREATE INDEX IF NOT EXISTS idx_drivers_name ON drivers USING gin(name gin_trgm_ops);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Función: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en projects
CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger en code_templates
CREATE TRIGGER trg_templates_updated_at
    BEFORE UPDATE ON code_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función: auto-versionar al guardar proyecto
CREATE OR REPLACE FUNCTION auto_version_project()
RETURNS TRIGGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    -- Solo versionar si el canvas_data cambió
    IF OLD.canvas_data IS DISTINCT FROM NEW.canvas_data THEN
        SELECT COALESCE(MAX(version_number), 0) + 1
        INTO next_version
        FROM project_versions
        WHERE project_id = NEW.id;

        INSERT INTO project_versions (project_id, version_number, canvas_data, canvas_elements, thumbnail)
        VALUES (NEW.id, next_version, OLD.canvas_data, OLD.canvas_elements, OLD.thumbnail);

        -- Mantener solo las últimas 20 versiones
        DELETE FROM project_versions
        WHERE project_id = NEW.id
          AND id NOT IN (
              SELECT id FROM project_versions
              WHERE project_id = NEW.id
              ORDER BY version_number DESC
              LIMIT 20
          );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_version_project
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION auto_version_project();

-- ============================================================
-- FIN DEL ESQUEMA
-- ============================================================
