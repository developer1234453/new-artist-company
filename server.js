const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Database setup
const db = new sqlite3.Database('database.db');

db.serialize(() => {
  db.run(`CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    amount INTEGER,
    description TEXT,
    date TEXT,
    running_balance INTEGER
  )`);
});

// API Endpoints
app.get('/api/transactions', (req, res) => {
  db.all('SELECT * FROM transactions ORDER BY date DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/transactions', (req, res) => {
  const { type, amount, description, date } = req.body;

  db.get('SELECT running_balance FROM transactions ORDER BY date DESC LIMIT 1', [], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    let running_balance = row ? row.running_balance : 0;
    running_balance = type === 'credit' ? running_balance + amount : running_balance - amount;

    db.run(
      'INSERT INTO transactions (type, amount, description, date, running_balance) VALUES (?, ?, ?, ?, ?)',
      [type, amount, description, date, running_balance],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ id: this.lastID });
      }
    );
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
