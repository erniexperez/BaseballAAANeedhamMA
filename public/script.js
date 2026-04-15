
const mainDiv = document.getElementById('main-content');

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
let selectedTeamId = null;

async function loadData() {
	teams = await fetchJSON('/api/teams');
	games = await fetchJSON('/api/games');
	pitchCounts = await fetchJSON('/api/pitch_counts');
}

function renderSidebar() {
	return `
		<div class="sidebar">
			<h2>Teams</h2>
			<ul class="team-list">
				${teams.map(t => `<li><button class="team-btn${selectedTeamId == t.id ? ' selected' : ''}" data-team="${t.id}">${t.name}</button></li>`).join('')}
			</ul>
		</div>
	`;
}

function renderContent() {
	const selectedTeam = teams.find(t => t.id == selectedTeamId);
	return `
		<div class="content">
			<h3>Select a team to view roster and pitcher status</h3>
			<form id="game-form">
				<label>Team:
					<select name="team_id" required>
						<option value="">Select Team</option>
						${teams.map(t => `<option value="${t.id}"${selectedTeamId == t.id ? ' selected' : ''}>${t.name}</option>`).join('')}
					</select>
				</label>
				<label>Date: <input type="date" name="date" required></label>
				<label>Opponent: <input type="text" name="opponent" required></label>
				<button class="btn" type="submit">Record Game</button>
			</form>

			<div style="margin: 16px 0;"><b>Players:</b></div>
			<button class="btn" id="add-player-btn">Add Player</button>

			<div style="margin: 16px 0;"><b>Roster</b></div>
			<form id="roster-form">
				<label>Check eligibility for date: <input type="date" name="eligibility_date"></label>
				<input type="text" name="player_name" placeholder="New Player Name">
				<button class="btn" type="submit">Add Player</button>
			</form>

			<div style="margin: 16px 0;"><b>Game History</b></div>
			<table>
				<thead><tr><th>Date</th><th>Team</th><th>Opponent</th><th>Players</th></tr></thead>
				<tbody>
					${games.filter(g => !selectedTeamId || g.team_id == selectedTeamId).map(g => `
						<tr>
							<td>${g.date}</td>
							<td>${teams.find(t => t.id == g.team_id)?.name || ''}</td>
							<td>${g.opponent}</td>
							<td>${pitchCounts.filter(pc => pc.game_id == g.id).map(pc => pc.player).join(', ')}</td>
						</tr>
					`).join('')}
				</tbody>
			</table>
		</div>
	`;
}

function render() {
	mainDiv.innerHTML = `
		${renderSidebar()}
		${renderContent()}
	`;

	// Sidebar team selection
	document.querySelectorAll('.team-btn').forEach(btn => {
		btn.onclick = e => {
			selectedTeamId = btn.getAttribute('data-team');
			render();
		};
	});

	// Game form
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

	// Roster form (add player)
	document.getElementById('roster-form').onsubmit = async e => {
		e.preventDefault();
		// This is a placeholder for player add logic
		alert('Add player functionality not implemented in this demo.');
	};

	// Add player button
	document.getElementById('add-player-btn').onclick = () => {
		alert('Add player functionality not implemented in this demo.');
	};
}

async function refresh() {
	await loadData();
	render();
}

refresh();
