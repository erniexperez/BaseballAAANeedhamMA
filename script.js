document.addEventListener('DOMContentLoaded', function() {
    loadGames();
    setupStatusListeners();
    setupRosterListeners();
    setupTeamNav();
    setupFormPlayerControls();
});


document.getElementById('gameForm').addEventListener('submit', function(e) {
    e.preventDefault();
    submitGame();
});

function setupFormPlayerControls() {
    const container = document.getElementById('playersContainer');
    function addPlayerRow() {
        const div = document.createElement('div');
        div.className = 'player';
        div.innerHTML = `
            <label>Player Name:</label>
            <input type="text" class="playerName" list="playersList" required>
            <label>Pitch Count:</label>
            <input type="number" class="pitchCount" min="1" max="75" required>
            <span class="status"></span>
            <button type="button" class="removePlayerBtn">Remove</button>
        `;
        div.querySelector('.removePlayerBtn').onclick = () => {
            div.remove();
        };
        container.appendChild(div);
    }
    document.getElementById('addFormPlayerBtn').onclick = addPlayerRow;
    // Add one row by default
    addPlayerRow();
}

function getSelectedTeam() {
    return document.getElementById('teamSelect').value;
}

function setupStatusListeners() {
    document.getElementById('teamSelect').addEventListener('change', function() {
        updateActiveTeamButton(this.value);
        updateRosterDisplay();
        updateAllStatuses();
        displayFilteredGames();
        updateTeamHeader();
    });
    document.getElementById('date').addEventListener('input', function() {
        updateAllStatuses();
        updateRosterDisplay();
    });
    document.querySelectorAll('.playerName').forEach(input => {
        input.addEventListener('input', (e) => updateStatus(e.target.closest('.player')));
    });
}

function setupRosterListeners() {
    document.getElementById('addPlayerBtn').addEventListener('click', addPlayer);
}

async function updateStatus(playerDiv) {
    const team = getSelectedTeam();
    const date = document.getElementById('date').value;
    const name = playerDiv.querySelector('.playerName').value.trim();
    const statusSpan = playerDiv.querySelector('.status');

    if (!team || !date || !name) {
        statusSpan.textContent = '';
        return;
    }

    const games = await getGames();
    const playerGames = games.filter(g => g.team === team && g.players.some(p => p.name === name) && g.date < date);
    if (playerGames.length === 0) {
        statusSpan.textContent = 'Available';
        statusSpan.style.color = 'green';
        return;
    }

    const lastGame = playerGames.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const lastPitches = lastGame.players.find(p => p.name === name).pitches;
    const restDays = getRestDays(lastPitches);

    const lastDate = new Date(lastGame.date);
    const requiredDate = new Date(lastDate);
    requiredDate.setDate(lastDate.getDate() + restDays + 1);

    const gameDate = new Date(date);
    if (gameDate >= requiredDate) {
        statusSpan.textContent = 'Available';
        statusSpan.style.color = 'green';
    } else {
        const daysLeft = Math.ceil((requiredDate - gameDate) / (1000 * 60 * 60 * 24));
        statusSpan.textContent = `Needs ${daysLeft} more day(s) rest`;
        statusSpan.style.color = 'red';
    }
}

    if (!team || !date || !name) {
        statusSpan.textContent = '';
        return;
    }

    const games = getGames();
    const playerGames = games.filter(g => g.team === team && g.players.some(p => p.name === name) && g.date < date);
    if (playerGames.length === 0) {
        statusSpan.textContent = 'Available';
        statusSpan.style.color = 'green';
        return;
    }

    const lastGame = playerGames.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const lastPitches = lastGame.players.find(p => p.name === name).pitches;
    const restDays = getRestDays(lastPitches);

    const lastDate = new Date(lastGame.date);
    const requiredDate = new Date(lastDate);
    requiredDate.setDate(lastDate.getDate() + restDays + 1);

    const gameDate = new Date(date);
    if (gameDate >= requiredDate) {
        statusSpan.textContent = 'Available';
        statusSpan.style.color = 'green';
    } else {
        const daysLeft = Math.ceil((requiredDate - gameDate) / (1000 * 60 * 60 * 24));
        statusSpan.textContent = `Needs ${daysLeft} more day(s) rest`;
        statusSpan.style.color = 'red';
    }
}

async function loadGames() {
    await displayFilteredGames();
}
    displayFilteredGames();
}

async function getGames() {
    try {
        const doc = await db.collection('games').doc('main').get();
        return doc.exists ? doc.data().games : [];
    } catch (e) {
        alert('Error loading games from server.');
        return [];
    }
}

async function saveGames(games) {
    try {
        await db.collection('games').doc('main').set({games});
    } catch (e) {
        alert('Error saving games to server.');
    }
}

async function displayFilteredGames() {
    const team = getSelectedTeam();
    const allGames = await getGames();
    const games = team ? allGames.filter(g => g.team === team) : allGames;
    displayGames(games);
}
    const team = getSelectedTeam();
    const allGames = getGames();
    const games = team ? allGames.filter(g => g.team === team) : allGames;
    displayGames(games);
}

function displayGames(games) {
    const tbody = document.getElementById('gamesBody');
    tbody.innerHTML = '';
    games.sort((a, b) => new Date(b.date) - new Date(a.date)); // newest first
    games.forEach(game => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${game.date}</td>
            <td>${game.team}</td>
            <td>${game.opponent}</td>
            <td>${game.players.map(p => `${p.name}: ${p.pitches}`).join(', ')}</td>
        `;
        tbody.appendChild(row);
    });
}

async function submitGame() {
    const team = getSelectedTeam();
    if (!team) {
        alert('Please select a team first');
        return;
    }
    const date = document.getElementById('date').value;
    const opponent = document.getElementById('opponent').value;

    const players = [];
    const playerDivs = document.querySelectorAll('#playersContainer .player');
    let valid = true;
    playerDivs.forEach(div => {
        const name = div.querySelector('.playerName').value.trim();
        const pitches = parseInt(div.querySelector('.pitchCount').value);
        if (name && !isNaN(pitches)) {
            if (pitches < 1 || pitches > 75) {
                alert('Pitch count must be between 1 and 75');
                valid = false;
                return;
            }
            players.push({ name, pitches });
        }
    });

    if (!valid) return;

    if (players.length === 0) {
        alert('At least one player must be entered');
        return;
    }

    // Validate rest rules
    const games = await getGames();
    for (const player of players) {
        if (!validatePlayerRest(team, player.name, player.pitches, date, games)) {
            return; // alert inside
        }
    }

    // Add game
    const newGame = { team, date, opponent, players };
    games.push(newGame);
    await saveGames(games);
    await displayFilteredGames();

    // Reset form and player rows
    document.getElementById('gameForm').reset();
    document.getElementById('playersContainer').innerHTML = '';
    // Add one player row back
    setupFormPlayerControls();
    alert('Game recorded successfully!');
}
    const team = getSelectedTeam();
    if (!team) {
        alert('Please select a team first');
        return;
    }
    const date = document.getElementById('date').value;
    const opponent = document.getElementById('opponent').value;

    const players = [];
    const playerDivs = document.querySelectorAll('#playersContainer .player');
    let valid = true;
    playerDivs.forEach(div => {
        const name = div.querySelector('.playerName').value.trim();
        const pitches = parseInt(div.querySelector('.pitchCount').value);
        if (name && !isNaN(pitches)) {
            if (pitches < 1 || pitches > 75) {
                alert('Pitch count must be between 1 and 75');
                valid = false;
                return;
            }
            players.push({ name, pitches });
        }
    });

    if (!valid) return;

    if (players.length === 0) {
        alert('At least one player must be entered');
        return;
    }

    // Validate rest rules
    const games = getGames();
    for (const player of players) {
        if (!validatePlayerRest(team, player.name, player.pitches, date, games)) {
            return; // alert inside
        }
    }

    // Add game
    const newGame = { team, date, opponent, players };
    games.push(newGame);
    saveGames(games);
    displayFilteredGames();

    // Reset form and player rows
    document.getElementById('gameForm').reset();
    document.getElementById('playersContainer').innerHTML = '';
    // Add one player row back
    setupFormPlayerControls();
    alert('Game recorded successfully!');
}

function validatePlayerRest(team, playerName, pitches, date, games) {
    // Find last game for this player on this team
    const playerGames = games.filter(g => g.team === team && g.players.some(p => p.name === playerName) && g.date < date);
    if (playerGames.length === 0) return true; // no previous, ok

    const lastGame = playerGames.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const lastPitches = lastGame.players.find(p => p.name === playerName).pitches;
    const restDays = getRestDays(lastPitches);

    const lastDate = new Date(lastGame.date);
    const requiredDate = new Date(lastDate);
    requiredDate.setDate(lastDate.getDate() + restDays + 1); // next day after rest

    const gameDate = new Date(date);
    if (gameDate < requiredDate) {
        alert(`Player ${playerName} needs ${restDays} day(s) rest after pitching ${lastPitches} pitches on ${lastGame.date}. Next available date: ${requiredDate.toISOString().split('T')[0]}`);
        return false;
    }
    return true;
}

function getRestDays(pitches) {
    if (pitches <= 20) return 0;
    if (pitches <= 35) return 1;
    if (pitches <= 50) return 2;
    if (pitches <= 65) return 3;
    if (pitches <= 75) return 4;
    return 0; // fallback for invalid input
}

// Roster functions
function getRosters() {
    return JSON.parse(localStorage.getItem('rosters') || '{}');
}

function saveRosters(rosters) {
    localStorage.setItem('rosters', JSON.stringify(rosters));
}

function loadRoster(team) {
    const rosters = getRosters();
    return rosters[team] || [];
}

function updateRosterDisplay() {
    const team = getSelectedTeam();
    const roster = loadRoster(team);
    const list = document.getElementById('rosterList');
    list.innerHTML = '';
    const date = document.getElementById('date').value;
    roster.forEach(player => {
        let color = 'gray'; // default
        if (date) {
            const games = getGames();
            const playerGames = games.filter(g => g.team === team && g.players.some(p => p.name === player) && g.date < date);
            if (playerGames.length === 0) {
                color = 'green';
            } else {
                const lastGame = playerGames.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                const lastPitches = lastGame.players.find(p => p.name === player).pitches;
                const restDays = getRestDays(lastPitches);
                const lastDate = new Date(lastGame.date);
                const requiredDate = new Date(lastDate);
                requiredDate.setDate(lastDate.getDate() + restDays + 1);
                const gameDate = new Date(date);
                color = gameDate >= requiredDate ? 'green' : 'red';
            }
        }
        const li = document.createElement('li');
        li.innerHTML = `<span class="traffic-light" style="background-color: ${color};"></span> ${player} `;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => removePlayer(team, player);
        li.appendChild(removeBtn);
        list.appendChild(li);
    });
    // Update datalist
    const datalist = document.getElementById('playersList');
    datalist.innerHTML = '';
    roster.forEach(player => {
        const option = document.createElement('option');
        option.value = player;
        datalist.appendChild(option);
    });
}

function addPlayer() {
    const team = getSelectedTeam();
    if (!team) {
        alert('Please select a team first');
        return;
    }
    const player = document.getElementById('newPlayer').value.trim();
    if (!player) {
        alert('Please enter player name');
        return;
    }
    const rosters = getRosters();
    if (!rosters[team]) rosters[team] = [];
    if (rosters[team].includes(player)) {
        alert('Player already in roster');
        return;
    }
    rosters[team].push(player);
    saveRosters(rosters);
    updateRosterDisplay();
    document.getElementById('newPlayer').value = '';
}

function removePlayer(team, player) {
    const rosters = getRosters();
    if (rosters[team]) {
        rosters[team] = rosters[team].filter(p => p !== player);
        saveRosters(rosters);
        updateRosterDisplay();
    }
}