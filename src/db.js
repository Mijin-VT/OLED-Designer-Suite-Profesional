/**
 * OLED Designer — Módulo de Base de Datos
 * src/db.js
 * 
 * Pool de conexiones PostgreSQL con configuración desde variables de entorno.
 */

'use strict';

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// ============================================================
// CONFIGURACIÓN DE CONEXIÓN
// ============================================================

// Valores base — serán sobrescritos por db.config.json si existe
let dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'oled_designer',
  user: 'postgres',
  password: '',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
};

// Intentar leer configuración personalizada
const configPath = path.join(__dirname, '..', 'db.config.json');
if (fs.existsSync(configPath)) {
  try {
    const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    dbConfig = { ...dbConfig, ...userConfig };
  } catch (err) {
    // Ignorar si no es válido
  }
}

// Variables de entorno tienen prioridad
if (process.env.DB_HOST) dbConfig.host = process.env.DB_HOST;
if (process.env.DB_PORT) dbConfig.port = parseInt(process.env.DB_PORT);
if (process.env.DB_NAME) dbConfig.database = process.env.DB_NAME;
if (process.env.DB_USER) dbConfig.user = process.env.DB_USER;
if (process.env.DB_PASSWORD) dbConfig.password = process.env.DB_PASSWORD;

// ============================================================
// POOL DE CONEXIONES
// ============================================================

let pool = null;

/**
 * Inicializa la conexión al pool de PostgreSQL.
 * Si la base de datos no existe, la crea automáticamente.
 */
async function connect() {
  // Si no hay contraseña configurada, operar limpiamente en modo offline
  if (!dbConfig.password && !process.env.DB_PASSWORD) {
    throw new Error('OFFLINE_MODE');
  }

  // 1. Intentar conectar directamente
  try {
    pool = new Pool(dbConfig);
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    pool.on('error', (err) => console.error('[DB] Error en pool:', err.message));
    console.log(`[DB] Pool conectado → ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    await initSchema();
    return;
  } catch (err) {
    // Si la BD no existe (código 3D000), la creamos
    if (err.code === '3D000' || err.message.includes('does not exist') || err.message.includes('no existe')) {
      console.log(`[DB] La base de datos '${dbConfig.database}' no existe. Creando...`);
      if (pool) { try { await pool.end(); } catch {} pool = null; }
    } else {
      throw err; // Otro error (auth, conexión) → relanzar
    }
  }

  // 2. Conectar a 'postgres' para crear la BD objetivo
  const adminPool = new Pool({ ...dbConfig, database: 'postgres' });
  try {
    const adminClient = await adminPool.connect();
    await adminClient.query(`CREATE DATABASE "${dbConfig.database}" ENCODING 'UTF8'`);
    adminClient.release();
    console.log(`[DB] Base de datos '${dbConfig.database}' creada correctamente.`);
  } catch (createErr) {
    if (!createErr.message.includes('already exists') && !createErr.message.includes('ya existe')) {
      throw createErr;
    }
  } finally {
    await adminPool.end();
  }

  // 3. Conectar a la BD recién creada
  pool = new Pool(dbConfig);
  const client2 = await pool.connect();
  await client2.query('SELECT NOW()');
  client2.release();
  pool.on('error', (err) => console.error('[DB] Error en pool:', err.message));
  console.log(`[DB] Pool conectado → ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
  await initSchema();
}

/**
 * Ejecuta una consulta SQL.
 * @param {string} text - La consulta SQL.
 * @param {Array} params - Parámetros de la consulta.
 */
async function query(text, params) {
  if (!pool) throw new Error('Pool de base de datos no inicializado. Llama a connect() primero.');
  
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] Query (${duration}ms):`, text.substring(0, 80));
    }
    return result;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[DB] Error en query:', err.message);
      console.error('[DB] Query:', text);
    }
    throw err;
  }
}

/**
 * Obtiene un cliente del pool para transacciones.
 */
async function getClient() {
  if (!pool) throw new Error('Pool no inicializado.');
  return pool.connect();
}

/**
 * Ejecuta una función dentro de una transacción.
 * @param {Function} fn - async (client) => { ... }
 */
async function withTransaction(fn) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Cierra el pool de conexiones.
 */
async function end() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] Pool cerrado.');
  }
}

/**
 * Verifica si la conexión está activa.
 */
async function isConnected() {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Ejecuta los scripts de esquema e inicialización si las tablas no existen.
 */
async function initSchema() {
  const schemaPath = path.join(__dirname, '..', 'sql', 'Base De Datos.sql');
  const dataPath = path.join(__dirname, '..', 'sql', 'base_de_datos_pg.sql');

  try {
    // Verificar si las tablas ya existen
    const check = await query(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'drivers' AND table_schema = 'public'"
    );
    
    if (parseInt(check.rows[0].count) === 0) {
      console.log('[DB] Tablas no encontradas. Ejecutando scripts de esquema...');
      
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await query(schemaSql);
        console.log('[DB] Esquema creado.');
      }
      
      if (fs.existsSync(dataPath)) {
        const dataSql = fs.readFileSync(dataPath, 'utf8');
        await query(dataSql);
        console.log('[DB] Datos iniciales insertados.');
      }
    } else {
      console.log('[DB] Esquema ya existe.');
    }
  } catch (err) {
    console.error('[DB] Error al inicializar esquema:', err.message);
    // No lanzar error — la app puede funcionar sin DB (modo offline)
  }
}

module.exports = {
  connect,
  query,
  getClient,
  withTransaction,
  end,
  isConnected,
  initSchema,
  getConfig: () => ({ ...dbConfig, password: '***' }) // Sin exponer contraseña
};
