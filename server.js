db.serialize(() => {

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Create tables if not exist
async function initDb() {
  await pool.query(`CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    coach TEXT NOT NULL
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    team_id INTEGER REFERENCES teams(id)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    opponent TEXT,
    date DATE
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS pitch_counts (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id),
    player_id INTEGER REFERENCES players(id),
    pitch_count INTEGER
  )`);
  // Insert default teams if none exist
  const { rows } = await pool.query('SELECT COUNT(*) FROM teams');
  if (parseInt(rows[0].count) === 0) {
    const defaultTeams = [
      ['Barons', 'James Slavet'],
      ['Curve', 'Ernie Perez'],
      ['Iron Birds', 'Jared Wilk'],
      ['Green Jackets', 'Jonathan Ellis'],
      ['Tourists', 'Evan Olesh'],
      ['Sky Carp', 'Greg Wise'],
      ['Rubber Ducks', 'Mike Nason'],
      ['Isotopes', 'Anthony Fava']
    ];
    for (const [name, coach] of defaultTeams) {
      await pool.query('INSERT INTO teams (name, coach) VALUES ($1, $2)', [name, coach]);
    }
    console.log('Default teams inserted.');
  }
}

initDb();

// API Endpoints

// Get all teams
app.get('/api/teams', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM teams ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a team
app.post('/api/teams', async (req, res) => {
  const { name, coach } = req.body;
  try {
    const result = await pool.query('INSERT INTO teams (name, coach) VALUES ($1, $2) RETURNING *', [name, coach]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get players for a team
app.get('/api/teams/:teamId/players', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM players WHERE team_id = $1', [req.params.teamId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add player to a team
app.post('/api/teams/:teamId/players', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query('INSERT INTO players (name, team_id) VALUES ($1, $2) RETURNING *', [name, req.params.teamId]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record a game and pitch counts
app.post('/api/games', async (req, res) => {
  const { team_id, opponent, date, players } = req.body;
  try {
    const gameResult = await pool.query('INSERT INTO games (team_id, opponent, date) VALUES ($1, $2, $3) RETURNING id', [team_id, opponent, date]);
    const gameId = gameResult.rows[0].id;
    for (const p of players) {
      await pool.query('INSERT INTO pitch_counts (game_id, player_id, pitch_count) VALUES ($1, $2, $3)', [gameId, p.player_id, p.pitch_count]);
    }
    res.json({ game_id: gameId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get game history for a team
app.get('/api/teams/:teamId/games', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM games WHERE team_id = $1 ORDER BY date DESC', [req.params.teamId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pitch counts for a game
app.get('/api/games/:gameId/pitch_counts', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM pitch_counts WHERE game_id = $1', [req.params.gameId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
  // Insert default teams if none exist
  db.get('SELECT COUNT(*) as count FROM teams', (err, row) => {
    if (!err && row.count === 0) {
      const defaultTeams = [
        { name: 'Barons', coach: 'James Slavet' },
        { name: 'Curve', coach: 'Ernie Perez' },
        { name: 'Iron Birds', coach: 'Jared Wilk' },
        { name: 'Green Jackets', coach: 'Jonathan Ellis' },
        { name: 'Tourists', coach: 'Evan Olesh' },
        { name: 'Sky Carp', coach: 'Greg Wise' },
        { name: 'Rubber Ducks', coach: 'Mike Nason' },
        { name: 'Isotopes', coach: 'Anthony Fava' }
      ];
      const stmt = db.prepare('INSERT INTO teams (name, coach) VALUES (?, ?)');
      defaultTeams.forEach(team => stmt.run(team.name, team.coach));
      stmt.finalize();
      console.log('Default teams inserted.');
    }
  });
});

// API Endpoints

// Get all teams
app.get('/api/teams', (req, res) => {
  db.all('SELECT * FROM teams', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a team
app.post('/api/teams', (req, res) => {
  const { name, coach } = req.body;
  db.run('INSERT INTO teams (name, coach) VALUES (?, ?)', [name, coach], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name, coach });
  });
});

// Get players for a team
app.get('/api/teams/:teamId/players', (req, res) => {
  db.all('SELECT * FROM players WHERE team_id = ?', [req.params.teamId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add player to a team
app.post('/api/teams/:teamId/players', (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO players (name, team_id) VALUES (?, ?)', [name, req.params.teamId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name });
  });
});

// Record a game and pitch counts
app.post('/api/games', (req, res) => {
  const { team_id, opponent, date, players } = req.body;
  db.run('INSERT INTO games (team_id, opponent, date) VALUES (?, ?, ?)', [team_id, opponent, date], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const gameId = this.lastID;
    const stmt = db.prepare('INSERT INTO pitch_counts (game_id, player_id, pitch_count) VALUES (?, ?, ?)');
    players.forEach(p => {
      stmt.run(gameId, p.player_id, p.pitch_count);
    });
    stmt.finalize();
    res.json({ game_id: gameId });
  });
});

// Get game history for a team
app.get('/api/teams/:teamId/games', (req, res) => {
  db.all('SELECT * FROM games WHERE team_id = ? ORDER BY date DESC', [req.params.teamId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get pitch counts for a game
app.get('/api/games/:gameId/pitch_counts', (req, res) => {
  db.all('SELECT * FROM pitch_counts WHERE game_id = ?', [req.params.gameId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
