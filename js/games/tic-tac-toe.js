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
  }

  init(mode = 'solo', roomCode = null) {
    super.init(mode, roomCode);
    this.score = 0;
    this.board = Array(9).fill(null);
    this.currentTurn = 'X';

    if (this.mode === 'solo') {
      this.renderDifficultySelect();
    } else {
      // Multiplayer initialization is handled in lobby.js/gamesync.js
      this.renderTTTGrid();
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

  handleCellClick(idx) {
    if (this.board[idx] !== null) return;
    if (this.currentTurn !== this.playerSym) return;

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
    setTimeout(() => {
      this.aiMakeMove();
    }, 600);
  }

  makeMove(idx, sym) {
    this.board[idx] = sym;
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
      if (this.difficulty === 'medium') points = 150;
      if (this.difficulty === 'hard') points = 250;
      desc = `You defeated the ${this.difficulty} level Bot!`;
    } else if (result === 'loss') {
      titleText = "Defeat 😔";
      points = 10; // Participation points
      desc = "The bot outsmarted you this time!";
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
    setTimeout(async () => {
      await this.saveScore();
      this.showResultsScreen();
    }, 1500);
  }
}

// Register Game instance
const ticTacToeGame = new TicTacToeGame();
