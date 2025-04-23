import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Create a new database connection
const dbPath = path.join(__dirname, 'data', 'lottery.db');
const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
const setupDatabase = () => {
  return new Promise((resolve, reject) => {
    // Table for storing past lottery results
    db.run(`
      CREATE TABLE IF NOT EXISTS past_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numbers TEXT NOT NULL,
        bonus_number INTEGER NOT NULL,
        date TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table for storing predictions
    db.run(`
      CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numbers TEXT NOT NULL,
        bonus_number INTEGER NOT NULL,
        source TEXT NOT NULL,
        date TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table for storing model accuracy
    db.run(`
      CREATE TABLE IF NOT EXISTS model_accuracy (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_name TEXT NOT NULL,
        accuracy REAL NOT NULL,
        date TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table for pattern detection
    db.run(`
      CREATE TABLE IF NOT EXISTS detected_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_description TEXT NOT NULL,
        confidence REAL NOT NULL,
        date TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error setting up database:', err);
        reject(err);
      } else {
        console.log("Database setup complete");
        resolve();
      }
    });
  });
};

// Helper functions for database operations
const dbHelper = {
  all: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  get: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  run: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }
};

// Initialize database
setupDatabase().catch(console.error);

export { db, dbHelper };
