// seed_teams.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const teams = [
  { name: 'Barons/Coach James Slavet' },
  { name: 'Curve/ Coach Ernie Perez' },
  { name: 'Iron Birds/Coach Jared Wilk' },
  { name: 'Green Jackets/ Coach Jonathan Ellis' },
  { name: 'Tourists/Coach Evan Olesh' },
  { name: 'Sky Carp/Coach Greg Wise' },
  { name: 'Rubber Ducks/Coach Mike Nason' },
  { name: 'Isotopes/Coach Anthony Fava' }
];

async function seedTeams() {
  for (const team of teams) {
    await pool.query('INSERT INTO teams (name) VALUES ($1) ON CONFLICT DO NOTHING', [team.name]);
  }
  console.log('Teams seeded!');
  await pool.end();
}

seedTeams().catch(err => {
  console.error(err);
  process.exit(1);
});
