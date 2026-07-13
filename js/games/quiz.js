/* ============================================
   RotaGame — Rota-Quiz Engine
   ============================================ */

class QuizGame extends BaseGame {
  constructor() {
    super('quiz', '🧠 Rota-Quiz');
    this.duration = 45; // 45 seconds total
    this.questionsList = [
      {
        q: "What is the Rotaract Motto?",
        o: ["Fellowship Through Service", "Service Above Self", "Selfless Giving", "Unity is Strength"],
        a: 0
      },
      {
        q: "In which year was the first Rotaract Club founded?",
        o: ["1968", "1972", "1958", "1980"],
        a: 0
      },
      {
        q: "Where was the first Rotaract club chartered?",
        o: ["North Carolina, USA", "London, UK", "New Delhi, India", "Melbourne, Australia"],
        a: 0
      },
      {
        q: "What is the Rotary Four-Way Test's first question?",
        o: ["Is it the TRUTH?", "Is it FAIR to all concerned?", "Will it build GOODWILL?", "Will it be BENEFICIAL?"],
        a: 0
      },
      {
        q: "Which Rotary International District does Bangalore belong to?",
        o: ["District 3191", "District 3201", "District 3181", "District 3000"],
        a: 0
      },
      {
        q: "Who is the founder of Rotary International?",
        o: ["Paul Harris", "Warren Wheeler", "Chesley Perry", "Arch Klumph"],
        a: 0
      },
      {
        q: "Which month is celebrated as Rotary Fellowship Month?",
        o: ["June", "November", "March", "September"],
        a: 0
      },
      {
        q: "What is the official logo shape of Rotary International?",
        o: ["A Gear Wheel", "A Star", "A Globe", "An Anchor"],
        a: 0
      },
      {
        q: "What is the age limit for Rotaract club members?",
        o: ["No age limit (since 2019)", "18 to 30 years", "16 to 25 years", "21 to 35 years"],
        a: 0
      },
      {
        q: "What is the primary fundraising organization of Rotary?",
        o: ["The Rotary Foundation", "Rotaract Charity Fund", "World Health Trust", "Service Fund"],
        a: 0
      }
    ];
    this.currentQuestionIdx = 0;
    this.activeQuestions = [];
  }

  init(mode = 'solo', roomCode = null, isHost = false) {
    super.init(mode, roomCode, isHost);
    this.currentQuestionIdx = 0;
    this.activeQuestions = this.shuffleArray([...this.questionsList]).slice(0, 10);
    this.score = 0;

    this.renderQuestionShell();
    this.start();
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  renderQuestionShell() {
    const board = document.getElementById('game-board');
    if (!board) return;

    board.innerHTML = `
      <div class="quiz-question-container">
        <div style="display: flex; justify-content: space-between; font-size: var(--text-sm); color: var(--text-muted);">
          <span id="quiz-question-counter">Question 1 of 10</span>
          <span id="quiz-streak">Streak: 0 🔥</span>
        </div>
        <h3 class="quiz-question-text" id="quiz-question-text">Loading question...</h3>
        <div class="quiz-options-grid" id="quiz-options">
          <!-- Options injected dynamically -->
        </div>
      </div>
    `;

    this.streak = 0;
    this.showNextQuestion();
  }

  showNextQuestion() {
    if (this.currentQuestionIdx >= this.activeQuestions.length) {
      this.endGame();
      return;
    }

    // Update Counter
    document.getElementById('quiz-question-counter').textContent = `Question ${this.currentQuestionIdx + 1} of ${this.activeQuestions.length}`;
    document.getElementById('quiz-streak').textContent = `Streak: ${this.streak} 🔥`;

    const qData = this.activeQuestions[this.currentQuestionIdx];
    document.getElementById('quiz-question-text').textContent = qData.q;

    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';

    qData.o.forEach((option, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.textContent = option;
      btn.onclick = () => this.handleAnswerSelection(idx, btn);
      optionsContainer.appendChild(btn);
    });
  }

  handleAnswerSelection(selectedIdx, selectedBtn) {
    // Disable all options immediately
    const btns = document.querySelectorAll('.quiz-option-btn');
    btns.forEach(b => b.disabled = true);

    const qData = this.activeQuestions[this.currentQuestionIdx];
    const isCorrect = selectedIdx === qData.a;

    if (isCorrect) {
      selectedBtn.classList.add('correct');
      this.streak++;
      // Base points + streak bonus + speed factor
      const points = 10 + (this.streak * 2);
      this.addPoints(points);
    } else {
      selectedBtn.classList.add('incorrect');
      this.streak = 0;
      // Highlight the correct answer
      btns[qData.a].classList.add('correct');
    }

    // Wait 1.2s then load next question
    this.questionTimeout = setTimeout(() => {
      this.currentQuestionIdx++;
      this.showNextQuestion();
    }, 1200);
  }

  cleanup() {
    if (this.questionTimeout) {
      clearTimeout(this.questionTimeout);
      this.questionTimeout = null;
    }
  }
}

// Register Game instance
const quizGame = new QuizGame();
