const appDiv = document.getElementById('app');

// Utility to fetch JSON
async function fetchJSON(url, options = {}) {
	const res = await fetch(url, options);
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

// State
let teams = [];
let games = [];
let pitchCounts = [];

async function loadData() {
	teams = await fetchJSON('/api/teams');
	games = await fetchJSON('/api/games');
	pitchCounts = await fetchJSON('/api/pitch_counts');
}

function render() {
	appDiv.innerHTML = `
		<section>
			<h2>Add Game</h2>
			<form id="game-form">
				<label>Date <input type="date" name="date" required></label>
				<label>Opponent <input type="text" name="opponent" required></label>
				<label>Team
					<select name="team_id" required>
						${teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
					</select>
				</label>
				<button type="submit">Add Game</button>
			</form>
		</section>

		<section>
			<h2>Add Pitch Count</h2>
			<form id="pitch-form">
				<label>Game
					<select name="game_id" required>
						${games.map(g => `<option value="${g.id}">${g.date} vs ${g.opponent}</option>`).join('')}
					</select>
				</label>
				<label>Player <input type="text" name="player" required></label>
				<label>Pitches <input type="number" name="pitches" min="1" required></label>
				<button type="submit">Add Pitch Count</button>
			</form>
		</section>

		<section>
			<h2>Pitch Counts</h2>
			<table class="table">
				<thead>
					<tr><th>Date</th><th>Opponent</th><th>Team</th><th>Player</th><th>Pitches</th><th>Recorded</th></tr>
				</thead>
				<tbody>
					${pitchCounts.map(pc => {
						const game = games.find(g => g.id === pc.game_id) || {};
						const team = teams.find(t => t.id === game.team_id) || {};
						return `<tr>
							<td>${game.date || ''}</td>
							<td>${game.opponent || ''}</td>
							<td>${team.name || ''}</td>
							<td>${pc.player}</td>
							<td>${pc.pitches}</td>
							<td>${new Date(pc.created_at).toLocaleString()}</td>
						</tr>`;
					}).join('')}
				</tbody>
			</table>
		</section>
	`;

	document.getElementById('game-form').onsubmit = async e => {
		e.preventDefault();
		const fd = new FormData(e.target);
		try {
			await fetchJSON('/api/games', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					date: fd.get('date'),
					opponent: fd.get('opponent'),
					team_id: fd.get('team_id'),
				})
			});
			await refresh();
		} catch (err) {
			alert('Error adding game: ' + err);
		}
	};

	document.getElementById('pitch-form').onsubmit = async e => {
		e.preventDefault();
		const fd = new FormData(e.target);
		try {
			await fetchJSON('/api/pitch_counts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					game_id: fd.get('game_id'),
					player: fd.get('player'),
					pitches: fd.get('pitches'),
				})
			});
			await refresh();
		} catch (err) {
			alert('Error adding pitch count: ' + err);
		}
	};
}

async function refresh() {
	await loadData();
	render();
}

refresh();
