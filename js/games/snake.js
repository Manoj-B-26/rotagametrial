/* ============================================
   RotaGame — Rota-Snake Engine
   ============================================ */

class SnakeGame extends BaseGame {
  constructor() {
    super('snake', '🐍 Rota-Snake');
    this.duration = 60; // 60 seconds
    
    // Canvas settings
    this.canvas = null;
    this.ctx = null;
    this.gridSize = 20;
    this.tileCount = 20; // 20x20 grid (400x400 canvas)
    
    // Game loop
    this.gameInterval = null;
    this.fps = 8; // Snake speed
    
    // States
    this.snake = [];
    this.food = { x: 0, y: 0 };
    this.dx = 1; // initial direction: moving right
    this.dy = 0;
    this.pendingDirection = { dx: 1, dy: 0 };
  }

  init(mode = 'solo', roomCode = null, isHost = false) {
    super.init(mode, roomCode, isHost);
    this.score = 0;
    this.dx = 1;
    this.dy = 0;
    this.pendingDirection = { dx: 1, dy: 0 };
    this.snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];

    this.renderSnakeBoard();
    this.spawnFood();
    this.bindControls();
    
    // Start game timers
    this.start();
  }

  renderSnakeBoard() {
    const board = document.getElementById('game-board');
    if (!board) return;

    board.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-4);">
        <canvas class="snake-canvas" id="snake-canvas" width="400" height="400"></canvas>
        <div style="font-size: var(--text-xs); color: var(--text-muted);">Use Arrow Keys or Swipe to Move</div>
      </div>
    `;

    this.canvas = document.getElementById('snake-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  start() {
    super.start();
    
    // Start canvas game render loop
    if (this.gameInterval) clearInterval(this.gameInterval);
    this.gameInterval = setInterval(() => this.updateLoop(), 1000 / this.fps);
  }

  spawnFood() {
    const newFoodX = Math.floor(Math.random() * this.tileCount);
    const newFoodY = Math.floor(Math.random() * this.tileCount);

    // Make sure food doesn't spawn on snake body
    const onSnake = this.snake.some(segment => segment.x === newFoodX && segment.y === newFoodY);
    
    if (onSnake) {
      this.spawnFood();
    } else {
      this.food = { x: newFoodX, y: newFoodY };
    }
  }

  bindControls() {
    // Keyboard Listener
    this.keyHandler = (e) => {
      if (!this.isActive) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (this.dy !== 1) this.pendingDirection = { dx: 0, dy: -1 };
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (this.dy !== -1) this.pendingDirection = { dx: 0, dy: 1 };
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (this.dx !== 1) this.pendingDirection = { dx: -1, dy: 0 };
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (this.dx !== -1) this.pendingDirection = { dx: 1, dy: 0 };
          e.preventDefault();
          break;
      }
    };
    
    window.addEventListener('keydown', this.keyHandler);

    // Touch Swiping Controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    this.touchStartHandler = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    this.touchEndHandler = (e) => {
      if (!this.isActive) return;
      
      const diffX = e.changedTouches[0].clientX - touchStartX;
      const diffY = e.changedTouches[0].clientY - touchStartY;
      
      // Check horizontal vs vertical swipe
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 30 && this.dx !== -1) this.pendingDirection = { dx: 1, dy: 0 }; // Swipe Right
        if (diffX < -30 && this.dx !== 1) this.pendingDirection = { dx: -1, dy: 0 }; // Swipe Left
      } else {
        if (diffY > 30 && this.dy !== -1) this.pendingDirection = { dx: 0, dy: 1 }; // Swipe Down
        if (diffY < -30 && this.dy !== 1) this.pendingDirection = { dx: 0, dy: -1 }; // Swipe Up
      }
    };

    this.canvas.addEventListener('touchstart', this.touchStartHandler, { passive: true });
    this.canvas.addEventListener('touchend', this.touchEndHandler, { passive: true });
  }

  removeControls() {
    window.removeEventListener('keydown', this.keyHandler);
    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this.touchStartHandler);
      this.canvas.removeEventListener('touchend', this.touchEndHandler);
    }
  }

  updateLoop() {
    if (!this.isActive) return;

    // Apply pending direction
    this.dx = this.pendingDirection.dx;
    this.dy = this.pendingDirection.dy;

    // Move head
    const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

    // Wall Collision Check (Exit / End game)
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      app.showToast("Crashed!", "Hit the district boundary wall!", "error");
      this.endGame();
      return;
    }

    // Body Self-Collision Check
    const selfCollide = this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    if (selfCollide) {
      app.showToast("Crashed!", "Collided with your own tail!", "error");
      this.endGame();
      return;
    }

    // Move head onto body
    this.snake.unshift(head);

    // Food Eaten Check
    if (head.x === this.food.x && head.y === this.food.y) {
      this.addPoints(20);
      this.spawnFood();
    } else {
      // Remove tail segment if food not eaten
      this.snake.pop();
    }

    this.drawCanvas();
  }

  drawCanvas() {
    if (!this.ctx || !this.canvas) return;

    // 1. Clear background
    this.ctx.fillStyle = '#020208';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Draw Food (star or service circle)
    this.ctx.fillStyle = '#f7a81b'; // Gold food
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#f7a81b';
    this.ctx.beginPath();
    const radius = this.gridSize / 2 - 2;
    const centerX = this.food.x * this.gridSize + this.gridSize / 2;
    const centerY = this.food.y * this.gridSize + this.gridSize / 2;
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0; // reset glow

    // 3. Draw Snake
    this.snake.forEach((segment, idx) => {
      // Head vs Body coloring
      this.ctx.fillStyle = idx === 0 ? '#c3145b' : '#9a0f48'; // Cranberry scale gradient
      
      this.ctx.fillRect(
        segment.x * this.gridSize + 1,
        segment.y * this.gridSize + 1,
        this.gridSize - 2,
        this.gridSize - 2
      );

      // Eye indicator for head direction
      if (idx === 0) {
        this.ctx.fillStyle = 'white';
        const eyeSize = 3;
        const offset = 5;
        if (this.dx !== 0) {
          // Horizontal eyes
          this.ctx.fillRect(segment.x * this.gridSize + offset, segment.y * this.gridSize + offset, eyeSize, eyeSize);
          this.ctx.fillRect(segment.x * this.gridSize + offset, segment.y * this.gridSize + this.gridSize - offset - eyeSize, eyeSize, eyeSize);
        } else {
          // Vertical eyes
          this.ctx.fillRect(segment.x * this.gridSize + offset, segment.y * this.gridSize + offset, eyeSize, eyeSize);
          this.ctx.fillRect(segment.x * this.gridSize + this.gridSize - offset - eyeSize, segment.y * this.gridSize + offset, eyeSize, eyeSize);
        }
      }
    });
  }

  endGame() {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
    this.removeControls();
    super.endGame();
  }
}

// Register Game instance
const snakeGame = new SnakeGame();
