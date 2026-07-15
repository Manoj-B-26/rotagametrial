/* ============================================
   RotaGame — Leaderboards Engine
   ============================================ */

class LeaderboardManager {
  constructor() {
    this.currentFilterType = 'players'; // 'players', 'clubs', 'games'
    this.selectedGame = 'quiz'; // default game view
    this.dataSnapshotListener = null;

    this.initEventListeners();
  }

  initEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      // Leaderboard type toggles
      const typeToggle = document.getElementById('leaderboard-type-toggle');
      if (typeToggle) {
        typeToggle.addEventListener('click', (e) => {
          const btn = e.target.closest('.toggle-option');
          if (!btn) return;

          // Set active toggled state
          typeToggle.querySelectorAll('.toggle-option').forEach(opt => opt.classList.remove('active'));
          btn.classList.add('active');

          const type = btn.dataset.type;
          this.switchLeaderboardType(type);
        });
      }

      // Game selector changes
      const gameSelect = document.getElementById('leaderboard-game-select');
      if (gameSelect) {
        gameSelect.addEventListener('change', (e) => {
          this.selectedGame = e.target.value;
          this.loadLeaderboardData();
        });
      }

      // Setup games list options in selector dropdown
      this.populateGameSelector();
    });
  }

  populateGameSelector() {
    const select = document.getElementById('leaderboard-game-select');
    if (!select) return;

    select.innerHTML = '';
    app.gamesList.forEach(game => {
      const opt = document.createElement('option');
      opt.value = game.id;
      opt.textContent = game.title;
      select.appendChild(opt);
    });
  }

  initView() {
    this.switchLeaderboardType(this.currentFilterType);
  }

  switchLeaderboardType(type) {
    this.currentFilterType = type;

    // Toggle Game Selector element visibility
    const selectorContainer = document.getElementById('leaderboard-game-selector-container');
    if (selectorContainer) {
      selectorContainer.style.display = type === 'games' ? 'block' : 'none';
    }

    this.loadLeaderboardData();
  }

  loadLeaderboardData() {
    // Unsubscribe from existing snapshot listener
    if (this.dataSnapshotListener) {
      this.dataSnapshotListener();
      this.dataSnapshotListener = null;
    }

    const listBody = document.getElementById('leaderboard-list');
    const tableHeaders = document.getElementById('leaderboard-table-headers');
    if (!listBody || !tableHeaders) return;

    listBody.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner spinner-sm" style="margin: 0 auto;"></div></td></tr>';

    try {
      if (this.currentFilterType === 'players') {
        tableHeaders.innerHTML = `
          <th>Rank</th>
          <th>Player</th>
          <th>Club</th>
          <th>Total Points</th>
        `;

        this.dataSnapshotListener = fbDb.collection('users')
          .onSnapshot((snapshot) => {
            let players = [];
            snapshot.forEach(doc => {
              const u = doc.data();
              if (u.totalPoints > 0) {
                players.push(u);
              }
            });

            // Sort points desc
            players.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
            this.renderLeaderboard(players, 'players');
          });

      } else if (this.currentFilterType === 'clubs') {
        tableHeaders.innerHTML = `
          <th>Rank</th>
          <th>Club</th>
          <th>City</th>
          <th>Aggregate Points</th>
        `;

        this.dataSnapshotListener = fbDb.collection('clubs')
          .onSnapshot((snapshot) => {
            let clubs = [];
            snapshot.forEach(doc => {
              const c = doc.data();
              if (c.totalPoints > 0) {
                clubs.push({ id: doc.id, ...c });
              }
            });

            clubs.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
            this.renderLeaderboard(clubs, 'clubs');
          });

      } else if (this.currentFilterType === 'games') {
        tableHeaders.innerHTML = `
          <th>Rank</th>
          <th>Player</th>
          <th>Club</th>
          <th>High Score</th>
        `;

        this.dataSnapshotListener = fbDb.collection('scores')
          .onSnapshot((snapshot) => {
            let gameScores = [];
            
            snapshot.forEach(doc => {
              const s = doc.data();
              if (s.game === this.selectedGame) {
                gameScores.push(s);
              }
            });

            // For each unique player, get their highest score
            const uniquePlayers = {};
            gameScores.forEach(s => {
              const uid = s.playerId;
              if (!uniquePlayers[uid] || uniquePlayers[uid].score < s.score) {
                uniquePlayers[uid] = s;
              }
            });

            const sortedScores = Object.values(uniquePlayers);
            sortedScores.sort((a, b) => b.score - a.score);

            this.renderLeaderboard(sortedScores, 'games');
          });
      }
    } catch (error) {
      console.error("Leaderboard loading error:", error);
      listBody.innerHTML = '<tr><td colspan="4" class="text-center" style="color:var(--error);">Failed to load standings.</td></tr>';
    }
  }

  renderLeaderboard(data, type) {
    const listBody = document.getElementById('leaderboard-list');
    const podiumContainer = document.getElementById('leaderboard-podium');
    if (!listBody || !podiumContainer) return;

    listBody.innerHTML = '';
    podiumContainer.innerHTML = '';

    if (data.length === 0) {
      podiumContainer.style.display = 'none';
      listBody.innerHTML = '<tr><td colspan="4" class="text-center">No scores posted yet. Be the first!</td></tr>';
      return;
    }

    podiumContainer.style.display = 'flex';
    const currentUser = auth.userProfile;

    // --- Render Top 3 Podium ---
    const top3 = data.slice(0, 3);
    const order = [1, 0, 2]; // Render Rank 2, Rank 1, Rank 3 in order (for heights visualization)

    order.forEach(idx => {
      const item = top3[idx];
      if (!item) return;

      const rank = idx + 1;
      const podiumCard = document.createElement('div');
      podiumCard.className = `podium-card rank-${rank}-card animate-bounce-in`;

      let name = "";
      let subtitle = "";
      let scoreVal = 0;

      if (type === 'players') {
        name = item.displayName;
        subtitle = item.clubName || "District Player";
        scoreVal = `${item.totalPoints} pts`;
      } else if (type === 'clubs') {
        name = (item.name || "Unknown").replace("Rotaract Club of ", "RC ");
        subtitle = item.city || "Unknown City";
        scoreVal = `${item.totalPoints} pts`;
      } else {
        name = item.playerName;
        subtitle = item.clubName || "District Player";
        scoreVal = `${item.score} pts`;
      }

      const initial = name.charAt(0).toUpperCase();

      podiumCard.innerHTML = `
        <div class="rank-badge rank-${rank}">${rank}</div>
        <div class="avatar avatar-lg podium-avatar">${initial}</div>
        <div class="podium-name">${name}</div>
        <div class="podium-club">${subtitle}</div>
        <div class="podium-points">${scoreVal}</div>
      `;

      podiumContainer.appendChild(podiumCard);
    });

    // --- Render List Table Rows ---
    data.forEach((item, index) => {
      const rank = index + 1;
      const row = document.createElement('tr');

      // Highlight row if current player
      if (type !== 'clubs' && currentUser && (item.uid === currentUser.uid || item.playerId === currentUser.uid)) {
        row.className = 'current-player-row';
      }

      // Rank column formatting
      let rankDisplay = `<div class="rank-badge rank-other">${rank}</div>`;
      if (rank === 1) rankDisplay = `<div class="rank-badge rank-1">🥇</div>`;
      if (rank === 2) rankDisplay = `<div class="rank-badge rank-2">🥈</div>`;
      if (rank === 3) rankDisplay = `<div class="rank-badge rank-3">🥉</div>`;

      if (type === 'players') {
        row.innerHTML = `
          <td>${rankDisplay}</td>
          <td>
            <div class="leaderboard-player-cell">
              <div class="avatar avatar-sm">${item.displayName.charAt(0).toUpperCase()}</div>
              <div class="leaderboard-player-info">
                <span class="leaderboard-player-name">${item.displayName}</span>
              </div>
            </div>
          </td>
          <td>${item.clubName || 'District'}</td>
          <td class="leaderboard-score-cell">${item.totalPoints || 0} pts</td>
        `;
      } else if (type === 'clubs') {
        row.innerHTML = `
          <td>${rankDisplay}</td>
          <td><strong>${item.name}</strong></td>
          <td>${item.city}</td>
          <td class="leaderboard-score-cell">${item.totalPoints || 0} pts</td>
        `;
      } else if (type === 'games') {
        row.innerHTML = `
          <td>${rankDisplay}</td>
          <td>
            <div class="leaderboard-player-cell">
              <div class="avatar avatar-sm">${item.playerName.charAt(0).toUpperCase()}</div>
              <span class="leaderboard-player-name">${item.playerName}</span>
            </div>
          </td>
          <td>${item.clubName || 'District'}</td>
          <td class="leaderboard-score-cell">${item.score || 0} pts</td>
        `;
      }

      listBody.appendChild(row);
    });
  }
}

// Global Leaderboard Instance
const leaderboard = new LeaderboardManager();
