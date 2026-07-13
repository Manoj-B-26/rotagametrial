/* ============================================
   RotaGame — Multiplayer Lobby & Matchmaking
   ============================================ */

class LobbyManager {
  constructor() {
    this.gameId = null;
    this.roomCode = null;
    this.roomRef = null;
    this.roomListener = null;
    this.isHost = false;

    this.initEventListeners();
  }

  initEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      // Create Room
      const createBtn = document.getElementById('btn-create-room');
      if (createBtn) {
        createBtn.addEventListener('click', () => this.createRoom());
      }

      // Join Room
      const joinBtn = document.getElementById('btn-join-room');
      if (joinBtn) {
        joinBtn.addEventListener('click', () => this.joinRoom());
      }

      // Leave Room
      const leaveBtn = document.getElementById('btn-leave-lobby');
      if (leaveBtn) {
        leaveBtn.addEventListener('click', () => this.leaveRoom());
      }

      // Ready Up
      const readyBtn = document.getElementById('btn-ready-lobby');
      if (readyBtn) {
        readyBtn.addEventListener('click', () => this.toggleReady());
      }
    });
  }

  initView(gameId) {
    this.gameId = gameId;
    const found = app.gamesList.find(g => g.id === gameId);
    
    // Set Header
    document.getElementById('lobby-game-title').textContent = found ? `Versus: ${found.title}` : "Versus Mode";
    
    // Show Action Selector, Hide Waiting Room
    document.getElementById('lobby-card').style.display = 'block';
    document.getElementById('waiting-room').style.display = 'none';

    // Clear Join input
    const joinInput = document.getElementById('input-room-code');
    if (joinInput) joinInput.value = '';
  }

  // --- Room Actions ---
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid lookalikes (I, 1, O, 0)
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createRoom() {
    const profile = auth.userProfile;
    if (!profile) return;

    this.roomCode = this.generateRoomCode();
    this.isHost = true;
    
    const roomData = {
      game: this.gameId,
      hostId: profile.uid,
      hostName: profile.displayName,
      hostClubId: profile.club,
      hostClubName: profile.clubName,
      hostReady: false,
      guestId: null,
      guestName: null,
      guestClubId: null,
      guestClubName: null,
      guestReady: false,
      status: "waiting",
      createdAt: Date.now()
    };

    try {
      this.roomRef = fbRtdb.ref(`rooms/${this.roomCode}`);
      await this.roomRef.set(roomData);
      
      this.showWaitingRoom();
      this.listenToRoom();
      app.showToast("Room Created", `Code: ${this.roomCode}`, "success");
    } catch (error) {
      console.error("Create room error:", error);
      app.showToast("Error", "Failed to create room.", "error");
    }
  }

  async joinRoom() {
    const codeInput = document.getElementById('input-room-code');
    if (!codeInput || !codeInput.value) {
      app.showToast("Required", "Please enter a room code.", "warning");
      return;
    }

    const code = codeInput.value.trim().toUpperCase();
    const profile = auth.userProfile;
    if (!profile) return;

    try {
      const roomSnapshot = await fbRtdb.ref(`rooms/${code}`).get();
      if (!roomSnapshot.exists()) {
        app.showToast("Not Found", "Invalid room code. Please try again.", "error");
        return;
      }

      const roomData = roomSnapshot.val();
      if (roomData.status !== 'waiting' || roomData.guestId) {
        app.showToast("Lobby Full", "This room is already full or in play.", "warning");
        return;
      }

      // Join room as Guest
      this.roomCode = code;
      this.isHost = false;
      this.roomRef = fbRtdb.ref(`rooms/${code}`);

      await this.roomRef.update({
        guestId: profile.uid,
        guestName: profile.displayName,
        guestClubId: profile.club,
        guestClubName: profile.clubName,
        guestReady: false
      });

      this.showWaitingRoom();
      this.listenToRoom();
      app.showToast("Connected", `Joined room ${code}!`, "success");
    } catch (error) {
      console.error("Join room error:", error);
      app.showToast("Error", "Failed to join room.", "error");
    }
  }

  showWaitingRoom() {
    document.getElementById('lobby-card').style.display = 'none';
    document.getElementById('waiting-room').style.display = 'block';
    document.getElementById('display-room-code').textContent = this.roomCode;
    
    // Reset ready up button
    const readyBtn = document.getElementById('btn-ready-lobby');
    readyBtn.textContent = "Ready Up";
    readyBtn.className = "btn btn-success";
    readyBtn.disabled = true; // Wait for both players to enter
  }

  listenToRoom() {
    if (this.roomListener) this.roomListener.off();

    this.roomListener = this.roomRef.on('value', (snapshot) => {
      const room = snapshot.val();
      if (!room) {
        this.handleRoomDeleted();
        return;
      }

      this.updateWaitingRoomUI(room);

      // Start game trigger if both ready
      if (room.status === 'playing') {
        this.launchMultiplayerGame(room);
      }
      
      // Auto start trigger by host once guest connects and both hit ready
      if (room.hostReady && room.guestReady && room.status === 'waiting') {
        if (this.isHost) {
          // Set status to playing
          this.roomRef.update({ status: 'playing' });
        }
      }
    });
  }

  updateWaitingRoomUI(room) {
    // Player 1 (Host)
    document.getElementById('lobby-p1-name').textContent = room.hostName;
    document.getElementById('lobby-p1-club').textContent = room.hostClubName || "District Player";
    document.getElementById('lobby-p1-avatar').textContent = room.hostName.charAt(0).toUpperCase();
    
    const p1Ready = document.getElementById('lobby-p1-ready');
    p1Ready.innerHTML = room.hostReady ? '<i data-lucide="check"></i> Ready' : '<i data-lucide="clock"></i> Waiting';
    p1Ready.className = room.hostReady ? "vs-player-ready-indicator ready" : "vs-player-ready-indicator waiting";

    // Player 2 (Guest)
    const p2Avatar = document.getElementById('lobby-p2-avatar');
    const p2Name = document.getElementById('lobby-p2-name');
    const p2Club = document.getElementById('lobby-p2-club');
    const p2Ready = document.getElementById('lobby-p2-ready');

    const readyBtn = document.getElementById('btn-ready-lobby');

    if (room.guestId) {
      p2Avatar.textContent = room.guestName.charAt(0).toUpperCase();
      p2Name.textContent = room.guestName;
      p2Club.textContent = room.guestClubName || "District Player";
      
      p2Ready.innerHTML = room.guestReady ? '<i data-lucide="check"></i> Ready' : '<i data-lucide="clock"></i> Waiting';
      p2Ready.className = room.guestReady ? "vs-player-ready-indicator ready" : "vs-player-ready-indicator waiting";
      
      // Enable ready button now that opponent is in
      readyBtn.disabled = false;
    } else {
      p2Avatar.textContent = '?';
      p2Name.textContent = 'Waiting...';
      p2Club.textContent = 'District 3191';
      p2Ready.innerHTML = '<i data-lucide="clock"></i> Empty';
      p2Ready.className = "vs-player-ready-indicator empty";
      
      readyBtn.disabled = true;
    }

    lucide.createIcons();
  }

  async toggleReady() {
    const readyBtn = document.getElementById('btn-ready-lobby');
    const isCurrentlyReady = readyBtn.textContent === "Unready";
    
    const nextState = !isCurrentlyReady;
    readyBtn.textContent = nextState ? "Unready" : "Ready Up";
    readyBtn.className = nextState ? "btn btn-secondary" : "btn btn-success";

    try {
      if (this.isHost) {
        await this.roomRef.update({ hostReady: nextState });
      } else {
        await this.roomRef.update({ guestReady: nextState });
      }
    } catch (error) {
      console.error("Toggle ready error:", error);
    }
  }

  async leaveRoom() {
    if (this.roomListener) {
      this.roomRef.off();
      this.roomListener = null;
    }

    try {
      if (this.isHost) {
        // Remove room completely
        await this.roomRef.remove();
      } else {
        // Remove self as guest
        await this.roomRef.update({
          guestId: null,
          guestName: null,
          guestClubId: null,
          guestClubName: null,
          guestReady: false
        });
      }
    } catch (error) {
      console.error("Leave room error:", error);
    }

    app.navigateTo('dashboard');
  }

  handleRoomDeleted() {
    if (this.roomListener) {
      this.roomRef.off();
      this.roomListener = null;
    }
    if (!this.isHost) {
      app.showToast("Room Closed", "The host has closed this room.", "warning");
    }
    app.navigateTo('dashboard');
  }

  launchMultiplayerGame(room) {
    if (this.roomListener) {
      this.roomRef.off();
      this.roomListener = null;
    }
    
    app.navigateTo('game');
    
    // Inject game and sync score updates using RTDB room state
    gameManager.startMultiplayerGame(room.game, this.roomCode, this.isHost);
  }
}

// Global Lobby Instance
const lobby = new LobbyManager();
