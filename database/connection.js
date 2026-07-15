const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config/env');

let db = null;

function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(config.databasePath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
      }
    });
    db.configure('busyTimeout', 5000);
  }
  return db;
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function close() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) reject(err);
        else {
          db = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  getDatabase,
  runAsync,
  getAsync,
  allAsync,
  close,
};
