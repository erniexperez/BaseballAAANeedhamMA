const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL connection
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create tables if not exist
const createTables = async () => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS teams (
			id SERIAL PRIMARY KEY,
			name TEXT UNIQUE NOT NULL
		);
		CREATE TABLE IF NOT EXISTS games (
			id SERIAL PRIMARY KEY,
			date DATE NOT NULL,
			opponent TEXT NOT NULL,
			team_id INTEGER REFERENCES teams(id)
		);
		CREATE TABLE IF NOT EXISTS pitch_counts (
			id SERIAL PRIMARY KEY,
			game_id INTEGER REFERENCES games(id),
			player TEXT NOT NULL,
			pitches INTEGER NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS players (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			team_id INTEGER REFERENCES teams(id)
		);
	`);
	// Insert default teams if not present
	await pool.query(`
		INSERT INTO teams (name) VALUES ('Team A') ON CONFLICT DO NOTHING;
		INSERT INTO teams (name) VALUES ('Team B') ON CONFLICT DO NOTHING;
	`);
};

createTables().catch(err => console.error('Error creating tables:', err));

// API endpoints
app.get('/api/teams', async (req, res) => {
	const result = await pool.query('SELECT * FROM teams ORDER BY name');
	res.json(result.rows);
});

app.post('/api/teams', async (req, res) => {
	const { name } = req.body;
	try {
		const result = await pool.query('INSERT INTO teams (name) VALUES ($1) RETURNING *', [name]);
		res.json(result.rows[0]);
	} catch (err) {
		res.status(400).json({ error: err.detail || err.message });
	}
});

app.get('/api/games', async (req, res) => {
	const result = await pool.query('SELECT * FROM games ORDER BY date DESC');
	res.json(result.rows);
});

app.post('/api/games', async (req, res) => {
	const { date, opponent, team_id } = req.body;
	const result = await pool.query(
		'INSERT INTO games (date, opponent, team_id) VALUES ($1, $2, $3) RETURNING *',
		[date, opponent, team_id]
	);
	res.json(result.rows[0]);
});

app.get('/api/pitch_counts', async (req, res) => {
	const result = await pool.query('SELECT * FROM pitch_counts ORDER BY created_at DESC');
	res.json(result.rows);
});

app.post('/api/pitch_counts', async (req, res) => {
	const { game_id, player, pitches } = req.body;
	const result = await pool.query(
		'INSERT INTO pitch_counts (game_id, player, pitches) VALUES ($1, $2, $3) RETURNING *',
		[game_id, player, pitches]
	);
	res.json(result.rows[0]);
});

// Get players for a team
app.get('/api/players', async (req, res) => {
	const { team_id } = req.query;
	if (!team_id) return res.status(400).json({ error: 'team_id required' });
	const result = await pool.query('SELECT * FROM players WHERE team_id = $1 ORDER BY name', [team_id]);
	res.json(result.rows);
});

// Add a player
app.post('/api/players', async (req, res) => {
	const { name, team_id } = req.body;
	if (!name || !team_id) return res.status(400).json({ error: 'name and team_id required' });
	const result = await pool.query(
		'INSERT INTO players (name, team_id) VALUES ($1, $2) RETURNING *',
		[name, team_id]
	);
	res.json(result.rows[0]);
});

// Serve frontend (must be LAST)
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
