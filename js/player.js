/* ============================================
   RotaGame — Player Profile & History
   ============================================ */

class PlayerManager {
  constructor() {}

  async renderProfile() {
    const profile = auth.userProfile;
    if (!profile) return;

    // Set text elements
    document.getElementById('profile-name').textContent = profile.displayName || "Rotaractor";
    document.getElementById('profile-club').textContent = profile.clubName || "District 3191";
    document.getElementById('profile-total-points').textContent = profile.totalPoints || 0;
    document.getElementById('profile-games-played').textContent = profile.gamesPlayed || 0;

    // Avatar initial letter
    const initial = profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'R';
    document.getElementById('profile-avatar').textContent = initial;

    // Set Role Badge
    const roleBadge = document.getElementById('profile-role');
    if (profile.isAdmin) {
      roleBadge.textContent = "District Admin 👑";
      roleBadge.className = "badge badge-cranberry";
    } else {
      roleBadge.textContent = profile.role || "Club Member";
      roleBadge.className = "badge badge-gold";
    }


    // Load recent matches
    await this.loadMatchHistory(profile.uid);
  }

  async loadMatchHistory(uid) {
    const historyBody = document.getElementById('profile-match-history');
    if (!historyBody) return;

    historyBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading match history...</td></tr>';

    try {
      const snapshot = await fbDb.collection('scores')
        .where('playerId', '==', uid)
        .get();

      let matches = [];
      snapshot.forEach(doc => {
        matches.push(doc.data());
      });

      // Sort by timestamp descending
      matches.sort((a, b) => {
        const timeA = a.timestamp?.seconds || a.timestamp || 0;
        const timeB = b.timestamp?.seconds || b.timestamp || 0;
        return timeB - timeA;
      });

      if (matches.length === 0) {
        historyBody.innerHTML = '<tr><td colspan="4" class="text-center">No matches played yet. Start a game to make history!</td></tr>';
        return;
      }

      historyBody.innerHTML = '';
      matches.slice(0, 10).forEach(match => {
        const row = document.createElement('tr');
        
        // Format Date
        let dateStr = "Recent";
        if (match.timestamp) {
          const dateVal = match.timestamp.toDate ? match.timestamp.toDate() : new Date(match.timestamp);
          dateStr = dateVal.toLocaleDateString() + ' ' + dateVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Format Game name
        let gameName = match.game || "Game";
        const found = app.gamesList.find(g => g.id === match.game);
        if (found) {
          gameName = found.title;
        }

        // Mode badge style
        const modeBadge = match.mode === 'multiplayer' 
          ? '<span class="badge badge-success">Multiplayer</span>' 
          : '<span class="badge badge-info">Solo</span>';

        row.innerHTML = `
          <td>${dateStr}</td>
          <td><strong>${gameName}</strong></td>
          <td>${modeBadge}</td>
          <td class="leaderboard-score-cell">${match.score || 0} pts</td>
        `;
        historyBody.appendChild(row);
      });
    } catch (error) {
      console.error("Load matches error:", error);
      historyBody.innerHTML = '<tr><td colspan="4" class="text-center" style="color:var(--error);">Failed to load match history.</td></tr>';
    }
  }
}

// Global Player Instance
const player = new PlayerManager();
