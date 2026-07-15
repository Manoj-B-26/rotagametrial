/* ============================================
   RotaGame — Application Controller & Router
   ============================================ */

class AppController {
  constructor() {
    this.currentView = 'loading';
    this.gamesList = [
      {
        id: 'quiz',
        title: '🧠 Rota-Quiz',
        desc: 'Test your Rotary & general knowledge under pressure. Quick answers win bonuses!',
        category: 'brain',
        modes: ['solo', 'multi'],
        icon: '🧠'
      },
      {
        id: 'word-scramble',
        title: '🔤 Word Scramble',
        desc: 'Unscramble Rotaract & service terms before the time runs out.',
        category: 'brain',
        modes: ['solo', 'multi'],
        icon: '🔤'
      },
      {
        id: 'memory-match',
        title: '🎴 Memory Match',
        desc: 'Match pairs of service cards. Play solo or take turns with an opponent.',
        category: 'brain',
        modes: ['solo', 'multi'],
        icon: '🎴'
      },
      {
        id: 'speed-click',
        title: '⚡ Speed Click',
        desc: 'Fast-paced clicking game. Pop the targets as they blink onto the screen.',
        category: 'action',
        modes: ['solo', 'multi'],
        icon: '⚡'
      },
      {
        id: 'snake',
        title: '🐍 Rota-Snake',
        desc: 'Guide the snake to collect service stars. Avoid crashing into the walls!',
        category: 'action',
        modes: ['solo', 'multi'],
        icon: '🐍'
      },
      {
        id: 'math-blitz',
        title: '🔢 Math Blitz',
        desc: 'Solve simple math equations rapidly. Keep the streaks alive!',
        category: 'brain',
        modes: ['solo', 'multi'],
        icon: '🔢'
      },
      {
        id: 'sudoku',
        title: '🔲 Sudoku',
        desc: 'Fill the 9x9 grid with numbers 1-9. Race against time or an opponent.',
        category: 'brain',
        modes: ['solo', 'multi'],
        icon: '🔲'
      },
      {
        id: 'tic-tac-toe',
        title: '❌ Tic Tac Toe',
        desc: 'Unbeatable logic. Face off against AI or a player online.',
        category: 'action',
        modes: ['solo', 'multi'],
        icon: '❌'
      }
    ];

    this.initEventListeners();
  }

  initEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      // Mobile menu toggle & Profile navigation via Avatar
      const navUserAvatar = document.getElementById('nav-user-avatar');
      const navLinks = document.getElementById('nav-links');
      if (navUserAvatar && navLinks) {
        navUserAvatar.addEventListener('click', () => {
          if (window.innerWidth <= 768) {
            navLinks.classList.toggle('open');
          } else {
            this.navigateTo('profile');
          }
        });
      }

      // Category filters
      const tabAll = document.getElementById('tab-dashboard-all');
      const tabBrain = document.getElementById('tab-dashboard-brain');
      const tabAction = document.getElementById('tab-dashboard-action');

      if (tabAll) tabAll.addEventListener('click', () => this.filterGames('all'));
      if (tabBrain) tabBrain.addEventListener('click', () => this.filterGames('brain'));
      if (tabAction) tabAction.addEventListener('click', () => this.filterGames('action'));

      // Render games list initially
      this.renderGamesGrid();
      
      // Refresh lucide icons
      lucide.createIcons();
    });
  }

  // --- SPA Routing ---
  navigateTo(viewId, params = {}) {
    console.log(`Navigating to: ${viewId}`, params);
    
    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(v => v.classList.remove('active'));

    // Show targets
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) {
      targetView.classList.add('active');
      this.currentView = viewId;
    }

    // Set menu active link
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      // Matches onclick navTo
      if (link.getAttribute('onclick')?.includes(`'${viewId}'`)) {
        link.classList.add('active');
      }
    });

    // Close mobile nav menu
    document.getElementById('nav-links')?.classList.remove('open');

    // Trigger modules specific loading/view setups
    this.handleViewLoad(viewId, params);
  }

  handleViewLoad(viewId, params) {
    switch(viewId) {
      case 'dashboard':
        this.renderGamesGrid();
        if (typeof auth !== 'undefined') {
          auth.updateUserNavbar(!!auth.userProfile);
          if (auth.updatePresenceStatus) auth.updatePresenceStatus('idle');
        }
        if (typeof lobby !== 'undefined') {
          lobby.cleanupLobbyView();
        }
        break;
      case 'leaderboard':
        if (typeof leaderboard !== 'undefined') {
          leaderboard.initView();
        }
        break;
      case 'profile':
        if (typeof player !== 'undefined') {
          player.renderProfile();
        }
        break;
      case 'admin':
        if (typeof admin !== 'undefined') {
          admin.initView();
        }
        break;
      case 'lobby':
        if (typeof lobby !== 'undefined') {
          lobby.initView(params.gameId);
        }
        break;
      case 'game':
        // Game initialization happens dynamically via lobby or dashboard solo buttons
        break;
    }
  }

  // --- Render Games ---
  renderGamesGrid(category = 'all') {
    const grid = document.getElementById('game-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const filtered = this.gamesList.filter(g => category === 'all' || g.category === category);

    filtered.forEach(game => {
      const card = document.createElement('div');
      card.className = 'card card-game animate-scale-in';
      card.innerHTML = `
        <div class="game-icon">${game.icon}</div>
        <h3 class="game-title">${game.title}</h3>
        <p class="game-desc">${game.desc}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
          <div class="game-modes">
            <span class="mode-badge solo"><i data-lucide="user" style="width:12px;height:12px;"></i> Solo</span>
            <span class="mode-badge multi"><i data-lucide="users" style="width:12px;height:12px;"></i> VS</span>
          </div>
        </div>
        <div style="display: flex; gap: var(--space-2); margin-top: var(--space-4);">
          <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="app.launchSolo('${game.id}')">Play Solo</button>
          <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="app.launchLobby('${game.id}')">Versus</button>
        </div>
      `;
      grid.appendChild(card);
    });

    lucide.createIcons();
  }

  filterGames(category) {
    const tabs = document.querySelectorAll('.tabs .tab');
    tabs.forEach(t => t.classList.remove('active'));

    const activeTab = document.getElementById(`tab-dashboard-${category}`);
    if (activeTab) activeTab.classList.add('active');

    this.renderGamesGrid(category);
  }

  launchSolo(gameId) {
    if (!auth.checkAuthState()) return;
    console.log(`Launching Solo Game: ${gameId}`);
    this.navigateTo('game');
    gameManager.startSoloGame(gameId);
  }

  launchLobby(gameId) {
    if (!auth.checkAuthState()) return;
    this.navigateTo('lobby', { gameId });
  }

  // --- Toast Notifications ---
  showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'info';
    if (type === 'success') icon = 'check-circle-2';
    if (type === 'error') icon = 'alert-octagon';
    if (type === 'warning') icon = 'alert-triangle';

    toast.innerHTML = `
      <div class="toast-icon"><i data-lucide="${icon}"></i></div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-dismiss">&times;</button>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    // Setup dismiss click
    toast.querySelector('.toast-dismiss').addEventListener('click', () => {
      this.dismissToast(toast);
    });

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      this.dismissToast(toast);
    }, 4000);
  }

  dismissToast(toast) {
    if (toast.classList.contains('removing')) return;
    toast.classList.add('removing');

    // Safety fallback: force clean up element if animation event lags
    const fallbackTimer = setTimeout(() => {
      toast.remove();
    }, 300);

    toast.addEventListener('animationend', () => {
      clearTimeout(fallbackTimer);
      toast.remove();
    }, { once: true });
  }

  // --- Confetti Animations ---
  triggerConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    const colors = ['#c3145b', '#f7a81b', '#3b82f6', '#22c55e', '#a855f7'];
    const totalCount = 100;

    for (let i = 0; i < totalCount; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.transform = `scale(${Math.random() * 0.8 + 0.4})`;
      piece.style.animationDuration = `${Math.random() * 3 + 2}s`;
      piece.style.animationDelay = `${Math.random() * 0.5}s`;
      
      container.appendChild(piece);

      // Auto-cleanup
      piece.addEventListener('animationend', () => {
        piece.remove();
      });
    }
  }
}

// Global App Instance
const app = new AppController();
