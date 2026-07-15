/* ============================================
   RotaGame — Memory Match Engine
   ============================================ */

class MemoryMatchGame extends BaseGame {
  constructor() {
    super('memory-match', '🎴 Memory Match');
    this.duration = 60; // 60 seconds
    this.iconsList = ['⚙️', '🌟', '💖', '👑', '🛡️', '🏆', '👍', '🤝'];
    this.cards = [];
    this.firstCard = null;
    this.secondCard = null;
    this.isBoardLocked = false;
    this.matchesFound = 0;
    this.moves = 0;
    this.matchTimeout = null;
  }

  init(mode = 'solo', roomCode = null, isHost = false) {
    super.init(mode, roomCode, isHost);
    this.score = 0;
    this.matchesFound = 0;
    this.moves = 0;
    this.firstCard = null;
    this.secondCard = null;
    this.isBoardLocked = false;

    this.renderMemoryBoard();
    this.start();
  }

  renderMemoryBoard() {
    const board = document.getElementById('game-board');
    if (!board) return;

    // Create 16 cards (double the icons list)
    const cardData = [...this.iconsList, ...this.iconsList];
    this.shuffle(cardData);

    board.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-4); width: 100%;">
        <div style="font-size: var(--text-sm); color: var(--text-muted);" id="memory-moves">Moves: 0</div>
        <div class="memory-grid" id="memory-grid"></div>
      </div>
    `;

    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';

    cardData.forEach((icon, idx) => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.dataset.icon = icon;
      card.dataset.index = idx;

      card.innerHTML = `
        <div class="memory-card-back"></div>
        <div class="memory-card-front">${icon}</div>
      `;

      card.onclick = () => this.flipCard(card);
      grid.appendChild(card);
    });
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  flipCard(card) {
    if (this.isBoardLocked) return;
    if (card === this.firstCard) return;
    if (card.classList.contains('flipped')) return;

    card.classList.add('flipped');

    if (!this.firstCard) {
      this.firstCard = card;
      return;
    }

    this.secondCard = card;
    this.moves++;
    document.getElementById('memory-moves').textContent = `Moves: ${this.moves}`;

    this.checkMatch();
  }

  checkMatch() {
    const isMatch = this.firstCard.dataset.icon === this.secondCard.dataset.icon;

    if (isMatch) {
      this.disableCards();
    } else {
      this.unflipCards();
    }
  }

  disableCards() {
    this.matchesFound++;
    this.addPoints(25);
    app.showToast("Match Found!", "Nice memory!", "success");

    // Reset card selectors
    this.firstCard = null;
    this.secondCard = null;

    if (this.matchesFound === this.iconsList.length) {
      setTimeout(() => {
        this.endGame();
      }, 500);
    }
  }

  unflipCards() {
    this.isBoardLocked = true;

    this.matchTimeout = setTimeout(() => {
      if (this.isActive) {
        if (this.firstCard) this.firstCard.classList.remove('flipped');
        if (this.secondCard) this.secondCard.classList.remove('flipped');
        this.firstCard = null;
        this.secondCard = null;
        this.isBoardLocked = false;
      }
    }, 1000);
  }

  cleanup() {
    if (this.matchTimeout) {
      clearTimeout(this.matchTimeout);
      this.matchTimeout = null;
    }
  }

  endGame() {
    super.endGame();
  }
}

// Register Game instance
const memoryMatchGame = new MemoryMatchGame();
