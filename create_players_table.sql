-- Create players table for storing player info and associating with teams
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    team_id INTEGER REFERENCES teams(id)
);