/* ============================================
   RotaGame — Math Blitz Engine
   ============================================ */

class MathBlitzGame extends BaseGame {
  constructor() {
    super('math-blitz', '🔢 Math Blitz');
    this.duration = 60; // 60 seconds
    this.currentAnswer = 0;
    this.streak = 0;
  }

  init(mode = 'solo', roomCode = null) {
    super.init(mode, roomCode);
    this.score = 0;
    this.streak = 0;
    
    this.renderMathShell();
    this.start();
  }

  renderMathShell() {
    const board = document.getElementById('game-board');
    if (!board) return;

    board.innerHTML = `
      <div class="math-container animate-scale-in">
        <div style="font-size: var(--text-sm); color: var(--text-muted);" id="math-streak">Streak: 0 🔥</div>
        <div class="math-problem" id="math-problem">5 + 7</div>
        
        <form id="math-form" style="width: 100%; display: flex; flex-direction: column; gap: var(--space-4);">
          <input type="number" class="form-input" id="math-input" placeholder="?" autofocus autocomplete="off" style="text-align: center; font-family: var(--font-display); font-weight: 700; font-size: var(--text-3xl);">
          <button type="submit" class="btn btn-primary" style="width: 100%;">Submit</button>
        </form>
      </div>
    `;

    const form = document.getElementById('math-form');
    form.onsubmit = (e) => {
      e.preventDefault();
      this.checkAnswer();
    };

    this.nextProblem();
  }

  nextProblem() {
    const input = document.getElementById('math-input');
    if (input) {
      input.value = '';
      input.focus();
    }

    // Generate random operations based on score/streak level
    let op = '+';
    let num1 = 1;
    let num2 = 1;

    if (this.score < 50) {
      // Level 1: Simple single digit additions
      num1 = Math.floor(Math.random() * 9) + 1;
      num2 = Math.floor(Math.random() * 9) + 1;
      op = '+';
    } else if (this.score < 150) {
      // Level 2: Double digit addition / subtraction
      num1 = Math.floor(Math.random() * 40) + 10;
      num2 = Math.floor(Math.random() * 40) + 10;
      op = Math.random() > 0.5 ? '+' : '-';
      // Ensure no negative outcomes for simpler subtraction UX
      if (op === '-' && num1 < num2) {
        const temp = num1;
        num1 = num2;
        num2 = temp;
      }
    } else {
      // Level 3: Multiplications and harder operations
      const choose = Math.random();
      if (choose < 0.4) {
        num1 = Math.floor(Math.random() * 12) + 2;
        num2 = Math.floor(Math.random() * 12) + 2;
        op = '×';
      } else {
        num1 = Math.floor(Math.random() * 90) + 10;
        num2 = Math.floor(Math.random() * 90) + 10;
        op = Math.random() > 0.5 ? '+' : '-';
        if (op === '-' && num1 < num2) {
          const temp = num1;
          num1 = num2;
          num2 = temp;
        }
      }
    }

    // Solve math equation internally
    if (op === '+') this.currentAnswer = num1 + num2;
    if (op === '-') this.currentAnswer = num1 - num2;
    if (op === '×') this.currentAnswer = num1 * num2;

    document.getElementById('math-problem').textContent = `${num1} ${op} ${num2}`;
  }

  checkAnswer() {
    const input = document.getElementById('math-input');
    if (!input || input.value === '') return;

    const userAnswer = parseInt(input.value.trim(), 10);
    const isCorrect = userAnswer === this.currentAnswer;

    if (isCorrect) {
      this.streak++;
      const points = 10 + (this.streak * 2);
      this.addPoints(points);
      app.showToast("Correct!", `Streak: ${this.streak}`, "success");
    } else {
      this.streak = 0;
      app.showToast("Wrong", `Correct answer was ${this.currentAnswer}`, "error");
    }

    document.getElementById('math-streak').textContent = `Streak: ${this.streak} 🔥`;
    this.nextProblem();
  }
}

// Register Game instance
const mathBlitzGame = new MathBlitzGame();
