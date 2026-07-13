/* ============================================
   RotaGame — Speed Click Engine
   ============================================ */

class SpeedClickGame extends BaseGame {
  constructor() {
    super('speed-click', '⚡ Speed Click');
    this.duration = 30; // 30 seconds
    this.metricLabel = 'Hits';
    this.activeTarget = null;
  }

  init(mode = 'solo', roomCode = null, isHost = false) {
    super.init(mode, roomCode, isHost);
    this.score = 0;
    this.renderSpeedBoard();
    this.start();
  }

  renderSpeedBoard() {
    const board = document.getElementById('game-board');
    if (!board) return;

    board.innerHTML = `
      <div class="speed-click-board" id="speed-board"></div>
    `;

    // Catch miss clicks
    const speedBoard = document.getElementById('speed-board');
    speedBoard.onclick = (e) => {
      if (e.target === speedBoard) {
        // Miss penalty
        this.addPoints(-5);
      }
    };

    this.spawnTarget();
  }

  spawnTarget() {
    const board = document.getElementById('speed-board');
    if (!board) return;

    // Remove existing target
    if (this.activeTarget) {
      this.activeTarget.remove();
    }

    const size = Math.max(24, 48 - Math.floor(this.score / 2)); // Shrink target size as score increases
    const target = document.createElement('div');
    target.className = 'speed-target';
    
    // Bounds check
    const boardWidth = board.clientWidth;
    const boardHeight = board.clientHeight;
    
    const posX = Math.random() * (boardWidth - size - 20) + 10;
    const posY = Math.random() * (boardHeight - size - 20) + 10;

    target.style.width = `${size}px`;
    target.style.height = `${size}px`;
    target.style.left = `${posX}px`;
    target.style.top = `${posY}px`;

    // Icon or emoji inside target
    target.textContent = '🎯';
    target.style.fontSize = `${size * 0.5}px`;

    target.onclick = (e) => {
      e.stopPropagation(); // Stop trigger board miss-click
      this.handleTargetClick();
    };

    board.appendChild(target);
    this.activeTarget = target;
  }

  handleTargetClick() {
    this.addPoints(10);
    this.spawnTarget();
  }

  endGame() {
    if (this.activeTarget) {
      this.activeTarget.remove();
      this.activeTarget = null;
    }
    super.endGame();
  }
}

// Register Game instance
const speedClickGame = new SpeedClickGame();
