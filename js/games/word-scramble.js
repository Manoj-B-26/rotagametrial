/* ============================================
   RotaGame — Word Scramble Engine
   ============================================ */

class WordScrambleGame extends BaseGame {
  constructor() {
    super('word-scramble', '🔤 Word Scramble');
    this.duration = 60; // 60 seconds
    this.wordsBank = [
      { word: "ROTARACT", hint: "The name of our global student & young professional movement" },
      { word: "ROTARY", hint: "The parent international service organization" },
      { word: "FELLOWSHIP", hint: "Rotaract Core Value - building strong relationships" },
      { word: "SERVICE", hint: "Contributing selflessly to society" },
      { word: "BANGALORE", hint: "The primary headquarters city of District 3191" },
      { word: "LEADERSHIP", hint: "Skill developed by leading community initiatives" },
      { word: "CHARTER", hint: "The official founding document of a Rotaract Club" },
      { word: "INTERACT", hint: "Rotary club for high school students" },
      { word: "CRANBERRY", hint: "One of the two official colors of Rotaract" },
      { word: "INSTALLATION", hint: "Ceremony where new office bearers assume roles" }
    ];
    this.currentWordObj = null;
    this.scrambledWord = "";
  }

  init(mode = 'solo', roomCode = null, isHost = false) {
    super.init(mode, roomCode, isHost);
    this.score = 0;
    this.renderScrambleShell();
    this.start();
  }

  renderScrambleShell() {
    const board = document.getElementById('game-board');
    if (!board) return;

    board.innerHTML = `
      <div class="scramble-container animate-scale-in">
        <div class="scrambled-word" id="scrambled-word">Loading...</div>
        <div class="scramble-hint" id="scramble-hint">Hint is shown here.</div>
        
        <form id="scramble-form" style="width: 100%; display: flex; flex-direction: column; gap: var(--space-4);">
          <div class="scramble-input-group">
            <input type="text" class="form-input" id="scramble-input" placeholder="Type unscrambled word..." autofocus autocomplete="off" style="text-align: center; text-transform: uppercase; font-family: var(--font-display); font-weight: 700; font-size: var(--text-lg); letter-spacing: 0.05em;">
          </div>
          <div style="display: flex; gap: var(--space-3);">
            <button type="button" class="btn btn-secondary" style="flex: 1;" id="btn-scramble-skip">Skip Word</button>
            <button type="submit" class="btn btn-primary" style="flex: 2;">Submit Guess</button>
          </div>
        </form>
      </div>
    `;

    // Listeners
    const form = document.getElementById('scramble-form');
    form.onsubmit = (e) => {
      e.preventDefault();
      this.checkGuess();
    };

    const skipBtn = document.getElementById('btn-scramble-skip');
    skipBtn.onclick = () => this.nextWord();

    this.nextWord();
  }

  scrambleWord(word, attempts = 0) {
    if (word.length <= 1 || attempts > 10) return word;
    const arr = word.split('');
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const scrambled = arr.join('');
    // Guarantee that it is actually scrambled with a safe recursion limit
    return scrambled === word ? this.scrambleWord(word, attempts + 1) : scrambled;
  }

  nextWord() {
    // Clear input
    const input = document.getElementById('scramble-input');
    if (input) {
      input.value = '';
      input.focus();
    }

    // Select random word
    const randObj = this.wordsBank[Math.floor(Math.random() * this.wordsBank.length)];
    this.currentWordObj = randObj;
    this.scrambledWord = this.scrambleWord(randObj.word);

    // Render word & hint
    document.getElementById('scrambled-word').textContent = this.scrambledWord;
    document.getElementById('scramble-hint').textContent = `💡 Hint: ${randObj.hint}`;
  }

  checkGuess() {
    const input = document.getElementById('scramble-input');
    if (!input) return;

    const userGuess = input.value.trim().toUpperCase();
    const correctWord = this.currentWordObj.word.toUpperCase();

    if (userGuess === correctWord) {
      this.addPoints(15);
      app.showToast("Correct!", `You found the word: ${correctWord}`, "success");
      this.nextWord();
    } else {
      app.showToast("Incorrect", "Try looking at the letters again!", "error");
      input.select();
    }
  }
}

// Register Game instance
const wordScrambleGame = new WordScrambleGame();
