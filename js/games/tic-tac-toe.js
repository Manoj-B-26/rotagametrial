/* ============================================
   RotaGame — Tic Tac Toe Engine
   ============================================ */

class TicTacToeGame extends BaseGame {
  constructor() {
    super('tic-tac-toe', '❌ Tic Tac Toe');
    this.duration = 60; // 60 seconds round limit
    this.metricLabel = 'Points';
    this.board = Array(9).fill(null);
    this.playerSym = 'X';
    this.aiSym = 'O';
    this.currentTurn = 'X'; // 'X' or 'O'
    this.difficulty = 'medium'; // easy, medium, hard
    this.winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    this.multiplayerBoardRef = null;
  }

  init(mode = 'solo', roomCode = null, isHost = false) {
    super.init(mode, roomCode, isHost);
    this.score = 0;
    this.board = Array(9).fill(null);
    this.currentTurn = 'X';

    if (this.mode === 'solo') {
      this.renderDifficultySelect();
    } else {
      // Multiplayer: Host is X, Guest is O
      this.playerSym = this.isHost ? 'X' : 'O';
      this.aiSym = this.isHost ? 'O' : 'X';
      this.renderTTTGrid();
      this.updateMultiplayerStatus();
      this.initMultiplayerSync();
      this.start();
    }
  }

  renderDifficultySelect() {
    const board = document.getElementById('game-board');
    if (!board) return;

    board.innerHTML = `
      <div class="card card-glass text-center animate-scale-in" style="max-width: 360px; width:100%;">
        <h3>Select AI Difficulty</h3>
        <p style="font-size: var(--text-sm); margin-bottom: var(--space-6);">Challenge our district bot to a match!</p>
        <div style="display: flex; flex-direction: column; gap: var(--space-3);">
          <button class="btn btn-secondary" onclick="gameManager.activeGame.startGameWithDifficulty('easy')">🟢 Easy Bot</button>
          <button class="btn btn-primary" onclick="gameManager.activeGame.startGameWithDifficulty('medium')">🟡 Medium Bot</button>
          <button class="btn btn-gold" onclick="gameManager.activeGame.startGameWithDifficulty('hard')">🔴 Hard Bot (Minimax)</button>
        </div>
      </div>
    `;
  }

  startGameWithDifficulty(difficulty) {
    this.difficulty = difficulty;
    this.renderTTTGrid();
    this.start();
  }

  renderTTTGrid() {
    const board = document.getElementById('game-board');
    if (!board) return;

    board.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-4);">
        <div style="font-family: var(--font-display); font-weight: 700; font-size: var(--text-lg);" id="ttt-status">Your turn (X)</div>
        <div class="ttt-board" id="ttt-board">
          <button class="ttt-cell" data-index="0"></button>
          <button class="ttt-cell" data-index="1"></button>
          <button class="ttt-cell" data-index="2"></button>
          <button class="ttt-cell" data-index="3"></button>
          <button class="ttt-cell" data-index="4"></button>
          <button class="ttt-cell" data-index="5"></button>
          <button class="ttt-cell" data-index="6"></button>
          <button class="ttt-cell" data-index="7"></button>
          <button class="ttt-cell" data-index="8"></button>
        </div>
      </div>
    `;

    // Cell bindings
    const cells = document.querySelectorAll('.ttt-cell');
    cells.forEach(c => {
      c.onclick = () => this.handleCellClick(parseInt(c.dataset.index, 10));
    });
  }

  // --- MULTIPLAYER SYNC ---
  initMultiplayerSync() {
    if (!this.roomCode) return;

    const roomRef = fbRtdb.ref(`rooms/${this.roomCode}`);

    // Initialize board state in RTDB (host writes initial empty board)
    if (this.isHost) {
      roomRef.update({
        'tttBoard': Array(9).fill(''),
        'tttTurn': 'X'
      });
    }

    // Listen for board and turn updates from RTDB
    this.multiplayerBoardRef = roomRef.on('value', (snapshot) => {
      const room = snapshot.val();
      if (!room || !room.tttBoard) return;

      // Update local board from RTDB
      const remoteBoard = room.tttBoard;
      const remoteTurn = room.tttTurn;

      for (let i = 0; i < 9; i++) {
        const remoteSym = remoteBoard[i] || null;
        if (remoteSym && this.board[i] !== remoteSym) {
          this.board[i] = remoteSym;
          this.makeMove(i, remoteSym, true); // visual only
        }
      }

      // Update turn
      this.currentTurn = remoteTurn || 'X';
      this.updateMultiplayerStatus();

      // Check for game-ending states from opponent's move
      if (this.checkWin(this.board, this.aiSym)) {
        this.handleGameOver('loss');
        return;
      }
      if (this.checkWin(this.board, this.playerSym)) {
        this.handleGameOver('win');
        return;
      }
      if (this.checkDraw(this.board)) {
        this.handleGameOver('draw');
        return;
      }
    });
  }

  updateMultiplayerStatus() {
    const statusEl = document.getElementById('ttt-status');
    if (!statusEl || this.mode !== 'multiplayer') return;

    const isMyTurn = this.currentTurn === this.playerSym;
    statusEl.textContent = isMyTurn
      ? `Your turn (${this.playerSym})`
      : `Opponent's turn (${this.aiSym})...`;
  }

  handleCellClick(idx) {
    if (this.board[idx] !== null) return;
    if (this.currentTurn !== this.playerSym) return;

    if (this.mode === 'multiplayer') {
      // Sync move to RTDB
      this.board[idx] = this.playerSym;
      this.makeMove(idx, this.playerSym, true);

      const nextTurn = this.playerSym === 'X' ? 'O' : 'X';
      const boardForRTDB = this.board.map(cell => cell || '');

      const roomRef = fbRtdb.ref(`rooms/${this.roomCode}`);
      roomRef.update({
        'tttBoard': boardForRTDB,
        'tttTurn': nextTurn
      });

      // Check win/draw after our own move
      if (this.checkWin(this.board, this.playerSym)) {
        this.handleGameOver('win');
        return;
      }
      if (this.checkDraw(this.board)) {
        this.handleGameOver('draw');
        return;
      }

      this.currentTurn = nextTurn;
      this.updateMultiplayerStatus();
      return;
    }

    // Solo mode: play against AI
    this.makeMove(idx, this.playerSym);

    if (this.checkWin(this.board, this.playerSym)) {
      this.handleGameOver('win');
      return;
    }

    if (this.checkDraw(this.board)) {
      this.handleGameOver('draw');
      return;
    }

    // Toggle turn to AI
    this.currentTurn = this.aiSym;
    document.getElementById('ttt-status').textContent = "Bot is thinking (O)...";
    
    // AI makes a move after a delay
    this.aiTimeout = setTimeout(() => {
      this.aiMakeMove();
    }, 600);
  }

  makeMove(idx, sym, visualOnly = false) {
    if (!visualOnly) {
      this.board[idx] = sym;
    }
    const cell = document.querySelector(`.ttt-cell[data-index="${idx}"]`);
    if (cell) {
      cell.textContent = sym;
      cell.classList.add(sym.toLowerCase(), 'taken');
    }
  }

  aiMakeMove() {
    if (!this.isActive) return;

    let moveIdx = -1;

    if (this.difficulty === 'easy') {
      moveIdx = this.getRandomMove();
    } else if (this.difficulty === 'medium') {
      // 70% chance to make best move, otherwise random
      if (Math.random() < 0.7) {
        moveIdx = this.getBestMove();
      } else {
        moveIdx = this.getRandomMove();
      }
    } else {
      // Hard: Minimax Algorithm (unbeatable)
      moveIdx = this.getBestMove();
    }

    if (moveIdx !== -1) {
      this.makeMove(moveIdx, this.aiSym);
    }

    if (this.checkWin(this.board, this.aiSym)) {
      this.handleGameOver('loss');
      return;
    }

    if (this.checkDraw(this.board)) {
      this.handleGameOver('draw');
      return;
    }

    // Toggle back to Player
    this.currentTurn = this.playerSym;
    document.getElementById('ttt-status').textContent = "Your turn (X)";
  }

  getRandomMove() {
    const available = [];
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) available.push(i);
    }
    if (available.length === 0) return -1;
    return available[Math.floor(Math.random() * available.length)];
  }

  getBestMove() {
    let bestVal = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) {
        this.board[i] = this.aiSym;
        const moveVal = this.minimax(this.board, 0, false);
        this.board[i] = null;

        if (moveVal > bestVal) {
          bestVal = moveVal;
          bestMove = i;
        }
      }
    }
    return bestMove;
  }

  minimax(board, depth, isMax) {
    if (this.checkWin(board, this.aiSym)) return 10 - depth;
    if (this.checkWin(board, this.playerSym)) return depth - 10;
    if (this.checkDraw(board)) return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = this.aiSym;
          best = Math.max(best, this.minimax(board, depth + 1, false));
          board[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = this.playerSym;
          best = Math.min(best, this.minimax(board, depth + 1, true));
          board[i] = null;
        }
      }
      return best;
    }
  }

  checkWin(board, sym) {
    return this.winPatterns.some(pattern => {
      return pattern.every(idx => board[idx] === sym);
    });
  }

  checkDraw(board) {
    return board.every(cell => cell !== null);
  }

  handleGameOver(result) {
    this.isActive = false;
    this.stopTimer();

    let titleText = "Draw!";
    let points = 25; // Draw points
    let desc = "A tight tactical match.";

    if (result === 'win') {
      titleText = "Victory! 🎉";
      points = 100;
      if (this.mode === 'solo') {
        if (this.difficulty === 'medium') points = 150;
        if (this.difficulty === 'hard') points = 250;
        desc = `You defeated the ${this.difficulty} level Bot!`;
      } else {
        desc = "You outplayed your opponent!";
      }
    } else if (result === 'loss') {
      titleText = "Defeat 😔";
      points = 10; // Participation points
      desc = this.mode === 'solo' ? "The bot outsmarted you this time!" : "Your opponent won this round!";
    }

    this.score = points;
    
    // Highlight winning cells
    if (result === 'win' || result === 'loss') {
      const winningSym = result === 'win' ? this.playerSym : this.aiSym;
      this.winPatterns.forEach(pattern => {
        if (pattern.every(idx => this.board[idx] === winningSym)) {
          pattern.forEach(idx => {
            const cell = document.querySelector(`.ttt-cell[data-index="${idx}"]`);
            if (cell) cell.classList.add('winning-cell');
          });
        }
      });
    }

    document.getElementById('ttt-status').textContent = "Game Over!";

    // Save score and render
    this.gameOverTimeout = setTimeout(async () => {
      await this.saveScore();
      this.showResultsScreen();
    }, 1500);
  }

  cleanup() {
    if (this.aiTimeout) {
      clearTimeout(this.aiTimeout);
      this.aiTimeout = null;
    }
    if (this.gameOverTimeout) {
      clearTimeout(this.gameOverTimeout);
      this.gameOverTimeout = null;
    }
    // Stop RTDB multiplayer listener
    if (this.multiplayerBoardRef && this.roomCode) {
      fbRtdb.ref(`rooms/${this.roomCode}`).off();
      this.multiplayerBoardRef = null;
    }
  }
}

// Register Game instance
const ticTacToeGame = new TicTacToeGame();
