/**
 * OLED Designer — Módulo de Gestión de Proyectos
 * src/projects.js
 */

'use strict';

const db = require('./db');

// ============================================================
// GUARDAR PROYECTO
// ============================================================

async function saveProject(projectData) {
  const {
    id, name, description, driver_name, width, height,
    interface: iface, display_color, canvas_data, thumbnail
  } = projectData;

  return db.withTransaction(async (client) => {
    // Buscar driver_id
    const driverRes = await client.query(
      'SELECT id FROM drivers WHERE name = $1', [driver_name]
    );
    const driverId = driverRes.rows[0]?.id || null;

    // Buscar resolution_id
    const resRes = await client.query(
      'SELECT id FROM resolutions WHERE width = $1 AND height = $2 LIMIT 1', [width, height]
    );
    const resolutionId = resRes.rows[0]?.id || null;

    // Obtener usuario local
    const userRes = await client.query(
      "SELECT id FROM users WHERE username = 'local_user' LIMIT 1"
    );
    const userId = userRes.rows[0]?.id || null;

    if (id) {
      // Actualizar existente
      const result = await client.query(
        `UPDATE projects SET
          name = $1, description = $2, driver_id = $3, resolution_id = $4,
          width = $5, height = $6, interface = $7, display_color = $8,
          canvas_data = $9, thumbnail = $10, last_opened_at = NOW()
         WHERE id = $11
         RETURNING *`,
        [name, description, driverId, resolutionId, width, height,
         iface, display_color, canvas_data, thumbnail, id]
      );
      return result.rows[0];
    } else {
      // Crear nuevo
      const result = await client.query(
        `INSERT INTO projects
          (user_id, name, description, driver_id, resolution_id, width, height,
           interface, display_color, canvas_data, thumbnail)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [userId, name, description, driverId, resolutionId, width, height,
         iface, display_color, canvas_data, thumbnail]
      );
      return result.rows[0];
    }
  });
}

// ============================================================
// CARGAR PROYECTO
// ============================================================

async function loadProject(projectId) {
  const result = await db.query(
    `SELECT p.*, d.name AS driver_name
     FROM projects p
     LEFT JOIN drivers d ON p.driver_id = d.id
     WHERE p.id = $1`,
    [projectId]
  );

  if (!result.rows[0]) throw new Error('Proyecto no encontrado');

  // Actualizar last_opened_at
  await db.query(
    'UPDATE projects SET last_opened_at = NOW() WHERE id = $1', [projectId]
  );

  return result.rows[0];
}

// ============================================================
// LISTAR PROYECTOS
// ============================================================

async function listProjects() {
  const result = await db.query(
    `SELECT p.id, p.name, p.description, p.width, p.height,
            p.interface, p.display_color, p.thumbnail,
            p.created_at, p.updated_at, p.last_opened_at,
            p.canvas_data,
            d.name AS driver_name
     FROM projects p
     LEFT JOIN drivers d ON p.driver_id = d.id
     WHERE p.is_template = FALSE
     ORDER BY p.last_opened_at DESC
     LIMIT 50`
  );
  return result.rows;
}

// ============================================================
// ELIMINAR PROYECTO
// ============================================================

async function deleteProject(projectId) {
  await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
}

// ============================================================
// HISTORIAL DE VERSIONES
// ============================================================

async function getVersionHistory(projectId) {
  const result = await db.query(
    `SELECT id, version_number, canvas_data, thumbnail, change_notes, created_at
     FROM project_versions
     WHERE project_id = $1
     ORDER BY version_number DESC
     LIMIT 20`,
    [projectId]
  );
  return result.rows;
}

// ============================================================
// RESTAURAR VERSIÓN
// ============================================================

async function restoreVersion(projectId, versionId) {
  return db.withTransaction(async (client) => {
    const version = await client.query(
      'SELECT * FROM project_versions WHERE id = $1 AND project_id = $2',
      [versionId, projectId]
    );

    if (!version.rows[0]) throw new Error('Versión no encontrada');

    const v = version.rows[0];

    await client.query(
      `UPDATE projects SET
        canvas_data = $1, canvas_elements = $2, thumbnail = $3
       WHERE id = $4`,
      [v.canvas_data, v.canvas_elements, v.thumbnail, projectId]
    );

    return v;
  });
}

// ============================================================
// GUARDAR CÓDIGO EXPORTADO
// ============================================================

async function saveExportedCode(projectId, platform, code, aiAssisted = false) {
  await db.query(
    `INSERT INTO exported_code (project_id, platform, code, ai_assisted)
     VALUES ($1, $2, $3, $4)`,
    [projectId, platform, code, aiAssisted]
  );
}

// ============================================================
// PROYECTOS RECIENTES
// ============================================================

async function getRecentProjects(limit = 10) {
  const result = await db.query(
    `SELECT p.id, p.name, p.width, p.height, p.thumbnail, p.last_opened_at,
            d.name AS driver_name
     FROM projects p
     LEFT JOIN drivers d ON p.driver_id = d.id
     ORDER BY p.last_opened_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

module.exports = {
  saveProject,
  loadProject,
  listProjects,
  deleteProject,
  getVersionHistory,
  restoreVersion,
  saveExportedCode,
  getRecentProjects
};
