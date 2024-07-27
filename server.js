const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 3000; // Use PORT environment variable or default to 3000

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Database setup
const db = new sqlite3.Database('database.db'); // Use a file-based SQLite database for persistence

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT  NOT NULL,
    amount INTEGER  NOT NULL,
    description TEXT  NOT NULL,
    date TEXT  NOT NULL,
    running_balance INTEGER  NOT NULL
  )`);
});

// API Endpoints
app.get('/api/transactions', (req, res) => {
  db.all('SELECT * FROM transactions ORDER BY date DESC', [], (err, rows) => {
    if (err) {
      console.error('Database error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/transactions', (req, res) => {
  const { type, amount, description, date } = req.body;

  if (!type || !amount || !description || !date) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  db.get('SELECT running_balance FROM transactions ORDER BY date DESC LIMIT 1', [], (err, row) => {
    if (err) {
      console.error('Database error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    let running_balance = row ? row.running_balance : 0;
    running_balance = type === 'credit' ? running_balance + amount : running_balance - amount;

    db.run(
      'INSERT INTO transactions (type, amount, description, date, running_balance) VALUES (?, ?, ?, ?, ?)',
      [type, amount, description, date, running_balance],
      function (err) {
        if (err) {
          console.error('Database error:', err.message);
          res.status(500).json({ error: 'Internal server error' });
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
