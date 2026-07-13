/* ============================================
   RotaGame — Sudoku Engine
   ============================================ */

class SudokuGame extends BaseGame {
  constructor() {
    super('sudoku', '🔲 Sudoku');
    this.duration = 300; // 5 minutes duration
    this.boardState = []; // 9x9 grid representation
    this.solution = [];
    this.originalState = [];
    this.selectedCell = null;
    this.notesMode = false;
    this.cellNotes = {}; // key: idx, val: set of note numbers
    this.difficulty = 'easy'; // easy, medium, hard
  }

  init(mode = 'solo', roomCode = null) {
    super.init(mode, roomCode);
    this.score = 0;
    this.selectedCell = null;
    this.notesMode = false;
    this.cellNotes = {};

    this.renderDifficultySelect();
  }

  renderDifficultySelect() {
    const board = document.getElementById('game-board');
    if (!board) return;

    board.innerHTML = `
      <div class="card card-glass text-center animate-scale-in" style="max-width: 360px; width:100%;">
        <h3>Select Sudoku Difficulty</h3>
        <p style="font-size: var(--text-sm); margin-bottom: var(--space-6);">Higher difficulties yield score multipliers.</p>
        <div style="display: flex; flex-direction: column; gap: var(--space-3);">
          <button class="btn btn-secondary" onclick="gameManager.activeGame.startGameWithDifficulty('easy')">🟢 Easy (x1.0)</button>
          <button class="btn btn-primary" onclick="gameManager.activeGame.startGameWithDifficulty('medium')">🟡 Medium (x2.0)</button>
          <button class="btn btn-gold" onclick="gameManager.activeGame.startGameWithDifficulty('hard')">🔴 Hard (x3.5)</button>
        </div>
      </div>
    `;
  }

  startGameWithDifficulty(difficulty) {
    this.difficulty = difficulty;
    this.generateBoard();
    this.renderSudokuGrid();
    this.start();
  }

  generateBoard() {
    // Generate a full solved Sudoku board first
    const fullGrid = Array(81).fill(0);
    this.solveSudokuBacktrack(fullGrid);
    this.solution = [...fullGrid];

    // Remove numbers according to difficulty
    let cellsToRemove = 40;
    if (this.difficulty === 'medium') cellsToRemove = 48;
    if (this.difficulty === 'hard') cellsToRemove = 56;

    this.boardState = [...this.solution];
    this.originalState = Array(81).fill(false);

    let removed = 0;
    while (removed < cellsToRemove) {
      const idx = Math.floor(Math.random() * 81);
      if (this.boardState[idx] !== 0) {
        this.boardState[idx] = 0;
        removed++;
      }
    }

    // Set markers for original cells
    for (let i = 0; i < 81; i++) {
      if (this.boardState[i] !== 0) {
        this.originalState[i] = true;
      }
    }
  }

  // Backtracking solver
  solveSudokuBacktrack(grid) {
    for (let i = 0; i < 81; i++) {
      if (grid[i] === 0) {
        // Shuffle numbers 1-9 to generate random puzzle solutions
        const nums = this.shuffleArray([1,2,3,4,5,6,7,8,9]);
        for (const val of nums) {
          if (this.isValidPlacement(grid, i, val)) {
            grid[i] = val;
            if (this.solveSudokuBacktrack(grid)) return true;
            grid[i] = 0;
          }
        }
        return false;
      }
    }
    return true;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  isValidPlacement(grid, index, val) {
    const row = Math.floor(index / 9);
    const col = index % 9;

    // Check Row & Col
    for (let i = 0; i < 9; i++) {
      if (grid[row * 9 + i] === val) return false;
      if (grid[i * 9 + col] === val) return false;
    }

    // Check 3x3 Box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const checkIdx = (startRow + r) * 9 + (startCol + c);
        if (grid[checkIdx] === val) return false;
      }
    }
    return true;
  }

  renderSudokuGrid() {
    const board = document.getElementById('game-board');
    if (!board) return;

    board.innerHTML = `
      <div class="sudoku-container animate-scale-in">
        <div class="sudoku-board" id="sudoku-grid">
          <!-- Dynamically populated cells -->
        </div>

        <div style="display: flex; gap: var(--space-3); width: 100%; max-width: 412px;">
          <button class="btn btn-secondary" style="flex: 1;" id="btn-sudoku-notes">✏️ Notes: OFF</button>
          <button class="btn btn-secondary" style="flex: 1;" id="btn-sudoku-hint">💡 Hint (-15s)</button>
          <button class="btn btn-secondary" style="flex: 1;" id="btn-sudoku-erase">🧹 Erase</button>
        </div>

        <div class="sudoku-keypad">
          <button class="btn btn-primary sudoku-key" data-val="1">1</button>
          <button class="btn btn-primary sudoku-key" data-val="2">2</button>
          <button class="btn btn-primary sudoku-key" data-val="3">3</button>
          <button class="btn btn-primary sudoku-key" data-val="4">4</button>
          <button class="btn btn-primary sudoku-key" data-val="5">5</button>
          <button class="btn btn-primary sudoku-key" data-val="6">6</button>
          <button class="btn btn-primary sudoku-key" data-val="7">7</button>
          <button class="btn btn-primary sudoku-key" data-val="8">8</button>
          <button class="btn btn-primary sudoku-key" data-val="9">9</button>
        </div>
      </div>
    `;

    // Render cells
    const grid = document.getElementById('sudoku-grid');
    grid.innerHTML = '';

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const idx = r * 9 + c;
        const val = this.boardState[idx];

        const cell = document.createElement('div');
        cell.className = 'sudoku-cell';
        if (this.originalState[idx]) cell.classList.add('given');
        cell.dataset.index = idx;

        if (val !== 0) {
          cell.textContent = val;
        } else {
          // Inner Notes grid
          const notesGrid = document.createElement('div');
          notesGrid.className = 'sudoku-cell-notes';
          for (let n = 1; n <= 9; n++) {
            const note = document.createElement('div');
            note.className = 'sudoku-note';
            note.dataset.note = n;
            notesGrid.appendChild(note);
          }
          cell.appendChild(notesGrid);
        }

        cell.onclick = () => this.selectCell(cell);
        grid.appendChild(cell);
      }
    }

    // Event Bindings
    document.getElementById('btn-sudoku-notes').onclick = () => this.toggleNotes();
    document.getElementById('btn-sudoku-erase').onclick = () => this.eraseCell();
    document.getElementById('btn-sudoku-hint').onclick = () => this.useHint();

    const keys = document.querySelectorAll('.sudoku-key');
    keys.forEach(k => {
      k.onclick = () => this.enterValue(parseInt(k.dataset.val, 10));
    });

    // Keyboard support
    this.keyListener = (e) => {
      if (!this.isActive) return;
      if (e.key >= '1' && e.key <= '9') {
        this.enterValue(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        this.eraseCell();
      }
    };
    window.addEventListener('keydown', this.keyListener);
  }

  selectCell(cellElement) {
    const idx = parseInt(cellElement.dataset.index, 10);
    
    // Clear selection classes
    const cells = document.querySelectorAll('.sudoku-cell');
    cells.forEach(c => {
      c.classList.remove('selected', 'highlighted', 'conflict');
    });

    this.selectedCell = idx;
    cellElement.classList.add('selected');

    // Highlight row, col and matching numbers
    const selectedRow = Math.floor(idx / 9);
    const selectedCol = idx % 9;
    const selectedVal = this.boardState[idx];

    cells.forEach(c => {
      const checkIdx = parseInt(c.dataset.index, 10);
      const r = Math.floor(checkIdx / 9);
      const col = checkIdx % 9;
      const val = this.boardState[checkIdx];

      if (r === selectedRow || col === selectedCol) {
        c.classList.add('highlighted');
      }

      if (selectedVal !== 0 && val === selectedVal && checkIdx !== idx) {
        c.classList.add('highlighted');
      }
    });
  }

  enterValue(val) {
    if (this.selectedCell === null) return;
    if (this.originalState[this.selectedCell]) return; // Cannot edit originals

    const cellElement = document.querySelector(`.sudoku-cell[data-index="${this.selectedCell}"]`);
    if (!cellElement) return;

    if (this.notesMode) {
      // Toggle note val
      if (!this.cellNotes[this.selectedCell]) {
        this.cellNotes[this.selectedCell] = new Set();
      }
      const notes = this.cellNotes[this.selectedCell];
      if (notes.has(val)) {
        notes.delete(val);
      } else {
        notes.add(val);
      }

      // Render notes
      this.boardState[this.selectedCell] = 0;
      cellElement.innerHTML = '';
      
      const notesGrid = document.createElement('div');
      notesGrid.className = 'sudoku-cell-notes';
      for (let n = 1; n <= 9; n++) {
        const note = document.createElement('div');
        note.className = 'sudoku-note';
        if (notes.has(n)) note.textContent = n;
        notesGrid.appendChild(note);
      }
      cellElement.appendChild(notesGrid);
    } else {
      // Direct placement
      this.boardState[this.selectedCell] = val;
      cellElement.innerHTML = val;

      // Validate immediately and apply score penalty or verify end-state
      if (val !== this.solution[this.selectedCell]) {
        cellElement.classList.add('conflict');
        app.showToast("Conflict", "Wrong placement!", "warning");
      } else {
        this.selectCell(cellElement);
        this.checkSolvedState();
      }
    }
  }

  eraseCell() {
    if (this.selectedCell === null) return;
    if (this.originalState[this.selectedCell]) return;

    this.boardState[this.selectedCell] = 0;
    delete this.cellNotes[this.selectedCell];

    const cellElement = document.querySelector(`.sudoku-cell[data-index="${this.selectedCell}"]`);
    cellElement.innerHTML = '';
    
    const notesGrid = document.createElement('div');
    notesGrid.className = 'sudoku-cell-notes';
    for (let n = 1; n <= 9; n++) {
      const note = document.createElement('div');
      note.className = 'sudoku-note';
      notesGrid.appendChild(note);
    }
    cellElement.appendChild(notesGrid);
    this.selectCell(cellElement);
  }

  toggleNotes() {
    this.notesMode = !this.notesMode;
    const btn = document.getElementById('btn-sudoku-notes');
    btn.textContent = this.notesMode ? "✏️ Notes: ON" : "✏️ Notes: OFF";
    if (this.notesMode) {
      btn.classList.add('btn-primary');
    } else {
      btn.classList.remove('btn-primary');
    }
  }

  useHint() {
    if (this.selectedCell === null) return;
    if (this.originalState[this.selectedCell]) return;

    // Reveal correct solution cell value
    const correctVal = this.solution[this.selectedCell];
    this.boardState[this.selectedCell] = correctVal;
    
    const cellElement = document.querySelector(`.sudoku-cell[data-index="${this.selectedCell}"]`);
    cellElement.innerHTML = correctVal;
    cellElement.classList.add('given'); // Mark as read-only / static now
    this.originalState[this.selectedCell] = true;

    // Time penalty (15 seconds off clock)
    this.timeLeft = Math.max(0, this.timeLeft - 15);
    this.updateTimerUI();

    app.showToast("Hint Used", "15 seconds deducted from timer.", "info");
    this.selectCell(cellElement);
    this.checkSolvedState();
  }

  checkSolvedState() {
    const isSolved = this.boardState.every((val, idx) => val === this.solution[idx]);
    
    if (isSolved) {
      // Calculate score based on time remaining and difficulty multiplier
      let diffMultiplier = 1;
      if (this.difficulty === 'medium') diffMultiplier = 2;
      if (this.difficulty === 'hard') diffMultiplier = 3.5;

      const timeBonus = Math.floor(this.timeLeft * 0.5);
      const basePoints = 200;
      
      this.score = Math.floor((basePoints + timeBonus) * diffMultiplier);
      app.showToast("Victory!", "You solved the Sudoku grid!", "success");
      this.endGame();
    }
  }

  endGame() {
    window.removeEventListener('keydown', this.keyListener);
    super.endGame();
  }
}

// Register Game instance
const sudokuGame = new SudokuGame();
