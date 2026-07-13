/* ============================================
   RotaGame — Base Game Class & GameManager
   ============================================ */

class BaseGame {
  constructor(gameId, title) {
    this.gameId = gameId;
    this.title = title;
    this.isActive = false;
    this.mode = 'solo'; // 'solo' or 'multiplayer'
    this.roomCode = null;
    this.isHost = false;
    
    this.timer = null;
    this.timeLeft = 0;
    this.duration = 60; // default 60s
    this.score = 0;
    
    this.metricLabel = 'Score';
    this.multiplayerListenerRef = null;
  }

  // --- Initialization ---
  init(mode = 'solo', roomCode = null, isHost = false) {
    this.isActive = true;
    this.mode = mode;
    this.roomCode = roomCode;
    this.isHost = isHost;
    this.score = 0;
    
    // Clear any previous multiplayer listeners
    if (this.multiplayerListenerRef) {
      this.multiplayerListenerRef.off();
      this.multiplayerListenerRef = null;
    }

    // Set titles and UI layout
    document.getElementById('game-active-title').textContent = this.title;
    document.getElementById('game-metric-label').textContent = this.metricLabel;
    this.updateMetricDisplay();

    // Reset game-over display if exists
    const existingOverlay = document.querySelector('.result-overlay');
    if (existingOverlay) existingOverlay.remove();

    // Setup timer
    this.resetTimer();

    // Bind base actions
    const exitBtn = document.getElementById('btn-exit-game');
    if (exitBtn) {
      exitBtn.onclick = () => this.exitGame();
    }
  }

  start() {
    this.startTimer();
  }

  // --- Timer Operations ---
  resetTimer() {
    this.timeLeft = this.duration;
    this.updateTimerUI();
  }

  startTimer() {
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimerUI();

      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  updateTimerUI() {
    const bar = document.getElementById('game-timer-bar');
    if (!bar) return;

    const percent = (this.timeLeft / this.duration) * 100;
    bar.style.transform = `scaleX(${percent / 100})`;

    // Reset warnings
    bar.className = 'game-timer-bar';

    if (percent <= 25) {
      bar.classList.add('critical');
    } else if (percent <= 50) {
      bar.classList.add('warning');
    }
  }

  // --- Scoring & Metrics ---
  updateMetricDisplay() {
    const val = document.getElementById('game-metric-value');
    if (val) val.textContent = this.score;
  }

  addPoints(points) {
    this.score += points;
    this.updateMetricDisplay();
    this.triggerPointsPopup(points);
  }

  triggerPointsPopup(points) {
    const board = document.getElementById('game-board');
    if (!board) return;

    const popup = document.createElement('div');
    popup.className = 'points-popup';
    popup.style.cssText = `
      position: absolute;
      color: var(--gold);
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-lg);
      pointer-events: none;
      animation: score-popup 1s ease forwards;
      left: 50%;
      top: 40%;
      z-index: 100;
    `;
    popup.textContent = `+${points}`;
    board.appendChild(popup);

    popup.addEventListener('animationend', () => popup.remove());
  }

  // --- Lifecycle Ends ---
  async endGame() {
    this.isActive = false;
    this.stopTimer();
    
    if (this.mode === 'multiplayer') {
      await this.handleMultiplayerEnd();
    } else {
      // Play celebratory confetti if solo high
      if (this.score > 0) {
        app.triggerConfetti();
      }
      // Save final scores to database
      await this.saveScore();
      // Render results
      this.showResultsScreen();
    }
  }

  // --- Multiplayer Game Sync ---
  async handleMultiplayerEnd() {
    const board = document.getElementById('game-board');
    if (!board) return;

    // Show waiting for opponent overlay
    const waitingOverlay = document.createElement('div');
    waitingOverlay.className = 'result-overlay';
    waitingOverlay.id = 'multiplayer-waiting-overlay';
    waitingOverlay.innerHTML = `
      <div class="spinner"></div>
      <h2 class="animate-pulse" style="margin-top: var(--space-4);">Submitting Score...</h2>
      <p style="color:var(--text-muted);">Waiting for opponent to finish...</p>
    `;
    board.appendChild(waitingOverlay);

    try {
      const roomRef = fbRtdb.ref(`rooms/${this.roomCode}`);
      
      // Submit local score to RTDB
      const scoreUpdate = {};
      if (this.isHost) {
        scoreUpdate['result/hostScore'] = this.score;
      } else {
        scoreUpdate['result/guestScore'] = this.score;
      }
      await roomRef.update(scoreUpdate);

      // Listen for both scores
      this.multiplayerListenerRef = roomRef.on('value', async (snapshot) => {
        const room = snapshot.val();
        if (!room || !room.result) return;

        const hostScore = room.result.hostScore;
        const guestScore = room.result.guestScore;

        if (hostScore !== undefined && guestScore !== undefined) {
          // Stop listener
          if (this.multiplayerListenerRef) {
            roomRef.off();
            this.multiplayerListenerRef = null;
          }

          // Host calculates winner and sets status to finished
          if (this.isHost) {
            let winnerId = 'draw';
            if (hostScore > guestScore) winnerId = room.hostId;
            if (guestScore > hostScore) winnerId = room.guestId;

            await roomRef.update({
              status: 'finished',
              'result/winnerId': winnerId
            });
          }

          // Clean up waiting spinner
          document.getElementById('multiplayer-waiting-overlay')?.remove();

          // Calculate final award points for district leaderboards
          const myProfile = auth.userProfile;
          const isWinner = room.result.winnerId === myProfile.uid;
          const isDraw = room.result.winnerId === 'draw';

          // Score mapping: Win = 100, Draw = 25, Loss = 10
          let pointsAwarded = 10;
          if (isWinner) pointsAwarded = 100;
          if (isDraw) pointsAwarded = 25;

          // Save final leaderboard stats using the awarded points
          this.score = pointsAwarded;
          await this.saveScore();

          // Show versus screen comparison
          this.showMultiplayerResults(room, hostScore, guestScore);
        }
      });
    } catch (error) {
      console.error("Multiplayer end error:", error);
      app.showToast("Sync Error", "Failed to sync multiplayer results.", "error");
    }
  }

  showMultiplayerResults(room, hostScore, guestScore) {
    const board = document.getElementById('game-board');
    if (!board) return;

    const myProfile = auth.userProfile;
    const isWinner = room.result.winnerId === myProfile.uid;
    const isDraw = room.result.winnerId === 'draw';

    let resultBanner = "DEFEAT 😔";
    let bannerColor = "var(--error)";
    if (isWinner) {
      resultBanner = "VICTORY! 🎉";
      bannerColor = "var(--success)";
      app.triggerConfetti();
    } else if (isDraw) {
      resultBanner = "DRAW GAME 🤝";
      bannerColor = "var(--gold)";
    }

    const opponentName = this.isHost ? room.guestName : room.hostName;
    const myScore = this.isHost ? hostScore : guestScore;
    const oppScore = this.isHost ? guestScore : hostScore;

    const overlay = document.createElement('div');
    overlay.className = 'result-overlay';
    overlay.innerHTML = `
      <h1 class="result-title" style="color:${bannerColor}; font-size:var(--text-4xl);">${resultBanner}</h1>
      <p style="color:var(--text-muted); margin-bottom: var(--space-4);">Matchup: ${this.title}</p>
      
      <div style="display: flex; gap: var(--space-8); align-items: center; margin-bottom: var(--space-6); background: rgba(255,255,255,0.02); padding: var(--space-4) var(--space-8); border-radius: var(--radius-xl); border: 1px solid var(--border-subtle);">
        <div class="text-center">
          <div style="font-size: var(--text-xs); color: var(--text-muted);">YOU</div>
          <div style="font-family: var(--font-display); font-size: var(--text-3xl); font-weight: 800; color:var(--text-primary);">${myScore}</div>
        </div>
        <div style="font-family: var(--font-display); font-weight: 900; color: var(--text-muted);">VS</div>
        <div class="text-center">
          <div style="font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase;">${opponentName.split(' ')[0]}</div>
          <div style="font-family: var(--font-display); font-size: var(--text-3xl); font-weight: 800; color:var(--text-primary);">${oppScore}</div>
        </div>
      </div>

      <div style="font-size: var(--text-sm); margin-bottom: var(--space-6);">
        District Points Earned: <strong style="color:var(--gold); font-size:var(--text-lg);">${this.score} pts</strong>
      </div>

      <div style="display: flex; gap: var(--space-4);">
        <button class="btn btn-secondary" onclick="app.navigateTo('dashboard')">Dashboard</button>
        <button class="btn btn-primary" onclick="app.launchLobby('${this.gameId}')">Rematch</button>
      </div>
    `;

    board.appendChild(overlay);
  }

  // --- Save Score to Firestore ---
  async saveScore() {
    const profile = auth.userProfile;
    if (!profile) return;

    try {
      const scoreRecord = {
        playerId: profile.uid,
        playerName: profile.displayName,
        clubId: profile.club,
        clubName: profile.clubName,
        game: this.gameId,
        score: this.score,
        mode: this.mode,
        timestamp: isFirebaseMocked ? Date.now() : firebase.firestore.FieldValue.serverTimestamp()
      };

      // 1. Save score record
      await fbDb.collection('scores').add(scoreRecord);

      // 2. Increment player stats
      const userRef = fbDb.collection('users').doc(profile.uid);
      const userPoints = (profile.totalPoints || 0) + this.score;
      const userGames = (profile.gamesPlayed || 0) + 1;
      
      await userRef.update({
        totalPoints: userPoints,
        gamesPlayed: userGames
      });

      // Update in-memory profile
      profile.totalPoints = userPoints;
      profile.gamesPlayed = userGames;

      // 3. Update club total
      if (profile.club) {
        const clubRef = fbDb.collection('clubs').doc(profile.club);
        const clubDoc = await clubRef.get();
        if (clubDoc.exists) {
          const clubPoints = (clubDoc.data().totalPoints || 0) + this.score;
          await clubRef.update({ totalPoints: clubPoints });
        }
      }

      app.showToast("Score Submitted", `Successfully recorded ${this.score} pts!`, "success");
      auth.updateUserNavbar(true);

    } catch (error) {
      console.error("Save score error:", error);
      app.showToast("Database Error", "Failed to submit score.", "error");
    }
  }

  showResultsScreen() {
    const board = document.getElementById('game-board');
    if (!board) return;

    const overlay = document.createElement('div');
    overlay.className = 'result-overlay';
    
    overlay.innerHTML = `
      <h2 class="result-title">Game Over!</h2>
      <div class="result-stats-grid">
        <div class="result-stat-label">Game Played</div>
        <div class="result-stat-value">${this.title}</div>
        <div class="result-stat-label">Final Score</div>
        <div class="result-stat-value" style="font-size:var(--text-xl); color:var(--gold); font-weight:800;">${this.score} pts</div>
      </div>
      <div style="display: flex; gap: var(--space-4); margin-top: var(--space-4);">
        <button class="btn btn-secondary" onclick="app.navigateTo('dashboard')">Back to Dashboard</button>
        <button class="btn btn-primary" id="btn-replay-game">Play Again</button>
      </div>
    `;

    board.appendChild(overlay);

    const replayBtn = document.getElementById('btn-replay-game');
    if (replayBtn) {
      replayBtn.onclick = () => {
        app.launchSolo(this.gameId);
      };
    }
  }

  exitGame() {
    const confirmExit = confirm("Are you sure you want to quit the current game? Your progress will be lost.");
    if (confirmExit) {
      // Clear listeners
      if (this.multiplayerListenerRef && this.roomCode) {
        fbRtdb.ref(`rooms/${this.roomCode}`).off();
      }
      this.stopTimer();
      this.isActive = false;
      app.navigateTo('dashboard');
    }
  }
}

class GameManager {
  constructor() {
    this.activeGame = null;
  }

  startSoloGame(gameId) {
    this.resolveGameInstance(gameId);
    if (this.activeGame) {
      this.activeGame.init('solo');
    }
  }

  startMultiplayerGame(gameId, roomCode, isHost) {
    this.resolveGameInstance(gameId);
    if (this.activeGame) {
      this.activeGame.init('multiplayer', roomCode, isHost);
    }
  }

  resolveGameInstance(gameId) {
    if (this.activeGame && this.activeGame.isActive) {
      this.activeGame.stopTimer();
    }

    switch(gameId) {
      case 'quiz':
        this.activeGame = quizGame;
        break;
      case 'word-scramble':
        this.activeGame = wordScrambleGame;
        break;
      case 'memory-match':
        this.activeGame = memoryMatchGame;
        break;
      case 'speed-click':
        this.activeGame = speedClickGame;
        break;
      case 'snake':
        this.activeGame = snakeGame;
        break;
      case 'math-blitz':
        this.activeGame = mathBlitzGame;
        break;
      case 'sudoku':
        this.activeGame = sudokuGame;
        break;
      case 'tic-tac-toe':
        this.activeGame = ticTacToeGame;
        break;
      default:
        console.error(`Unknown gameId: ${gameId}`);
        this.activeGame = null;
    }
  }
}

const gameManager = new GameManager();
