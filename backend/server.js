const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());


// Initialize SQLite database
const db = new sqlite3.Database('./lottery.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run(`
      CREATE TABLE IF NOT EXISTS past_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,


        numbers TEXT NOT NULL,
        bonus_number INTEGER NOT NULL,
        date TEXT NOT NULL
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_description TEXT NOT NULL,
        confidence REAL NOT NULL,
        date TEXT NOT NULL
      )
    `);
  }
});

// API Endpoints

// Get all past results
app.get('/api/past-results', (req, res) => {
  db.all('SELECT * FROM past_results ORDER BY date DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Add a new past result
app.post('/api/store', (req, res) => {
  const { numbers, bonusNumber } = req.body;
  const date = new Date().toISOString();

  db.run(
    'INSERT INTO past_results (numbers, bonus_number, date) VALUES (?, ?, ?)',
    [numbers.join(','), bonusNumber, date],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, numbers, bonus_number: bonusNumber, date });
      }
    }
  );
});

// Get all patterns
app.get('/api/patterns', (req, res) => {
  db.all('SELECT * FROM patterns ORDER BY date DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Add a new pattern
app.post('/api/patterns', (req, res) => {
  const { pattern_description, confidence } = req.body;
  const date = new Date().toISOString();

  db.run(
    'INSERT INTO patterns (pattern_description, confidence, date) VALUES (?, ?, ?)',
    [pattern_description, confidence, date],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, pattern_description, confidence, date });
      }
    }
  );
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});