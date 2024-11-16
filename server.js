// holy crap i hate this shit

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(
  session({
    secret: 'session_secret', 
    resave: false,
    saveUninitialized: false,
  })
);

const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )`
    );
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.send('Username and password are required.');
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (username, password) VALUES (?, ?)`,
    [username, hashedPassword],
    (err) => {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          res.send('Username is already taken!');
        } else {
          res.send('An error occurred during registration.');
        }
      } else {
        res.send('Registration's successful. <a href="/login">Login here</a>');
      }
    }
  );
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.send('Username and password are required!');
  }

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err) {
      res.send('An error occurred during login.');
    } else if (!user || !bcrypt.compareSync(password, user.password)) {
      res.send('Invalid username or password!');
    } else {
      req.session.user = user;
      res.send('Login successful! <a href="/">Go to homepage</a>');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is currectly running at http://localhost:${PORT}`);
});
