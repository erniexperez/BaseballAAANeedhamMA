// remove_default_teams.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function removeDefaultTeams() {
  await pool.query("DELETE FROM teams WHERE name = 'Team A' OR name = 'Team B'");
  console.log('Removed Team A and Team B');
  await pool.end();
}

removeDefaultTeams().catch(err => {
  console.error(err);
  process.exit(1);
});
