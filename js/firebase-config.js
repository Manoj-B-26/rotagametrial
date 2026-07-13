/* ============================================
   RotaGame — Firebase Config & Initialization
   ============================================ */

// Replace these values with your actual Firebase project config credentials
const firebaseConfig = {
  apiKey: "AIzaSyCf-5gVPvIQEZK9k3Ge-DfRpHalrWZcUc4",
  authDomain: "rotagame.firebaseapp.com",
  projectId: "rotagame",
  storageBucket: "rotagame.firebasestorage.app",
  messagingSenderId: "782822463141",
  appId: "1:782822463141:web:fbbb8a725c80f9ce899f4c",
  measurementId: "G-3D351GC53Q"
};

// Global Firebase service references
let firebaseApp = null;
let fbAuth = null;
let fbDb = null; // Firestore
let fbRtdb = null; // Realtime DB

let isFirebaseMocked = false;

// Mock Firebase for instant local/demo play
class MockFirebaseServices {
  constructor() {
    isFirebaseMocked = true;
    console.warn("⚠️ RotaGame is running in DEMO mode with Mock Firebase. Configure real keys in js/firebase-config.js to persist data.");

    // Initialize Local Storage for Mock Data
    if (!localStorage.getItem('rotagame_mock_users')) {
      localStorage.setItem('rotagame_mock_users', JSON.stringify({}));
    }
    if (!localStorage.getItem('rotagame_mock_clubs')) {
      const defaultClubs = [
        { id: 'c1', name: 'Rotaract Club of Bangalore JP Nagar', shortName: 'JP Nagar', city: 'Bangalore', memberCount: 15, totalPoints: 1250 },
        { id: 'c2', name: 'Rotaract Club of Bangalore East', shortName: 'Bangalore East', city: 'Bangalore', memberCount: 22, totalPoints: 2450 },
        { id: 'c3', name: 'Rotaract Club of RV Dental College', shortName: 'RV Dental', city: 'Bangalore', memberCount: 18, totalPoints: 950 },
        { id: 'c4', name: 'Rotaract Club of KLE Law College', shortName: 'KLE Law', city: 'Bangalore', memberCount: 12, totalPoints: 1600 }
      ];
      localStorage.setItem('rotagame_mock_clubs', JSON.stringify(defaultClubs));
    }
    if (!localStorage.getItem('rotagame_mock_scores')) {
      localStorage.setItem('rotagame_mock_scores', JSON.stringify([]));
    }
    if (!localStorage.getItem('rotagame_mock_rooms')) {
      localStorage.setItem('rotagame_mock_rooms', JSON.stringify({}));
    }

    this.activeIntervals = {};

    this.setupMockAuth();
    this.setupMockFirestore();
    this.setupMockRealtimeDB();
  }

  // --- Mock Authentication ---
  setupMockAuth() {
    this.currentUser = JSON.parse(sessionStorage.getItem('rotagame_mock_session')) || null;
    this.authListeners = [];

    fbAuth = {
      currentUser: this.currentUser,
      onAuthStateChanged: (callback) => {
        this.authListeners.push(callback);
        // Invoke immediately with current state
        setTimeout(() => callback(this.currentUser), 10);
        return () => {
          this.authListeners = this.authListeners.filter(l => l !== callback);
        };
      },
      signInWithPopup: () => {
        return new Promise((resolve) => {
          // Simulate simple Google Sign-In with a prompt
          const mockName = prompt("Enter your Player Name for Demo Sign-In:", "Guest Rotaractor") || "Guest Player";
          const mockEmail = `${mockName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
          const mockUser = {
            uid: `mock_user_${Date.now()}`,
            displayName: mockName,
            email: mockEmail,
            photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${mockName}`
          };
          this.currentUser = mockUser;
          sessionStorage.setItem('rotagame_mock_session', JSON.stringify(mockUser));
          fbAuth.currentUser = mockUser;

          this.authListeners.forEach(listener => listener(mockUser));
          resolve({ user: mockUser });
        });
      },
      signOut: () => {
        return new Promise((resolve) => {
          this.currentUser = null;
          fbAuth.currentUser = null;
          sessionStorage.removeItem('rotagame_mock_session');
          this.authListeners.forEach(listener => listener(null));
          resolve();
        });
      }
    };
  }

  // --- Mock Firestore (Cloud Firestore) ---
  setupMockFirestore() {
    const getStorageData = (key) => JSON.parse(localStorage.getItem(key));
    const setStorageData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    fbDb = {
      collection: (collectionName) => {
        const key = `rotagame_mock_${collectionName}`;

        return {
          doc: (docId) => {
            return {
              get: () => {
                return new Promise((resolve) => {
                  const data = getStorageData(key) || {};
                  const doc = Array.isArray(data) ? data.find(item => item.id === docId) : data[docId];
                  resolve({
                    exists: !!doc,
                    data: () => doc
                  });
                });
              },
              set: (newData, options) => {
                return new Promise((resolve) => {
                  const data = getStorageData(key) || {};
                  if (Array.isArray(data)) {
                    const idx = data.findIndex(item => item.id === docId);
                    if (idx !== -1) {
                      data[idx] = options?.merge ? { ...data[idx], ...newData } : newData;
                    } else {
                      data.push({ id: docId, ...newData });
                    }
                    setStorageData(key, data);
                  } else {
                    data[docId] = options?.merge ? { ...data[docId], ...newData } : newData;
                    setStorageData(key, data);
                  }
                  resolve();
                });
              },
              update: (updateData) => {
                return new Promise((resolve) => {
                  const data = getStorageData(key) || {};
                  if (Array.isArray(data)) {
                    const idx = data.findIndex(item => item.id === docId);
                    if (idx !== -1) {
                      data[idx] = { ...data[idx], ...updateData };
                      setStorageData(key, data);
                    }
                  } else {
                    if (data[docId]) {
                      data[docId] = { ...data[docId], ...updateData };
                      setStorageData(key, data);
                    }
                  }
                  resolve();
                });
              },
              delete: () => {
                return new Promise((resolve) => {
                  const data = getStorageData(key) || {};
                  if (Array.isArray(data)) {
                    const filtered = data.filter(item => item.id !== docId);
                    setStorageData(key, filtered);
                  } else {
                    delete data[docId];
                    setStorageData(key, data);
                  }
                  resolve();
                });
              }
            };
          },
          add: (newData) => {
            return new Promise((resolve) => {
              const data = getStorageData(key) || [];
              const newId = `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
              const item = { id: newId, ...newData };
              data.push(item);
              setStorageData(key, data);
              resolve({ id: newId });
            });
          },
          get: () => {
            return new Promise((resolve) => {
              const rawData = getStorageData(key) || {};
              let docs = [];
              if (Array.isArray(rawData)) {
                docs = rawData.map(item => ({ id: item.id, data: () => item }));
              } else {
                docs = Object.keys(rawData).map(id => ({ id: id, data: () => rawData[id] }));
              }
              resolve({
                docs: docs,
                forEach: (cb) => docs.forEach(cb)
              });
            });
          },
          // Simple snapshot listener using simple polling
          onSnapshot: (callback) => {
            const executeCallback = () => {
              const rawData = getStorageData(key) || {};
              let docs = [];
              if (Array.isArray(rawData)) {
                docs = rawData.map(item => ({ id: item.id, data: () => item }));
              } else {
                docs = Object.keys(rawData).map(id => ({ id: id, data: () => rawData[id] }));
              }
              callback({
                docs: docs,
                forEach: (cb) => docs.forEach(cb)
              });
            };

            executeCallback();
            const interval = setInterval(executeCallback, 1500);
            return () => clearInterval(interval);
          }
        };
      }
    };
  }

  // --- Mock Realtime Database (for multiplayer rooms) ---
  setupMockRealtimeDB() {
    const getRooms = () => JSON.parse(localStorage.getItem('rotagame_mock_rooms')) || {};
    const setRooms = (rooms) => localStorage.setItem('rotagame_mock_rooms', JSON.stringify(rooms));

    fbRtdb = {
      ref: (path) => {
        const parts = path.split('/');
        const roomCode = parts[1]; // e.g. "rooms/CODE" -> ["rooms", "CODE"]

        return {
          set: (data) => {
            return new Promise((resolve) => {
              const rooms = getRooms();
              if (roomCode) {
                rooms[roomCode] = data;
                setRooms(rooms);
              }
              resolve();
            });
          },
          update: (updateData) => {
            return new Promise((resolve) => {
              const rooms = getRooms();
              if (roomCode && rooms[roomCode]) {
                rooms[roomCode] = { ...rooms[roomCode], ...updateData };
                setRooms(rooms);
              }
              resolve();
            });
          },
          remove: () => {
            return new Promise((resolve) => {
              const rooms = getRooms();
              if (roomCode) {
                delete rooms[roomCode];
                setRooms(rooms);
              }
              resolve();
            });
          },
          on: (event, callback) => {
            const pollRooms = () => {
              const rooms = getRooms();
              if (roomCode) {
                const room = rooms[roomCode];
                callback({
                  val: () => room,
                  exists: () => !!room
                });

                // --- BOT OPPONENT LOGIC FOR MULTIPLAYER DEMO ---
                // If user is hosting a room and waiting, spawn a mock guest opponent after 4 seconds
                if (room && room.status === "waiting" && !room.guestId) {
                  setTimeout(() => {
                    const currentRooms = getRooms();
                    const activeRoom = currentRooms[roomCode];
                    if (activeRoom && activeRoom.status === "waiting" && !activeRoom.guestId) {
                      activeRoom.guestId = "bot_player";
                      activeRoom.guestName = "Mock Rotaract Bot 🤖";
                      activeRoom.guestReady = true;
                      activeRoom.guestClubName = "JP Nagar";
                      activeRoom.guestClubId = "c1";
                      setRooms(currentRooms);
                    }
                  }, 4000);
                }

                // If room is playing and opponent is a bot, simulate bot finishing game after 8 seconds
                if (room && room.status === "playing" && room.guestId === "bot_player" && !room.result) {
                  setTimeout(() => {
                    const currentRooms = getRooms();
                    const activeRoom = currentRooms[roomCode];
                    if (activeRoom && activeRoom.status === "playing" && !activeRoom.result) {
                      // Generate a random score for the bot
                      let botScore = 150;
                      if (activeRoom.game === 'quiz') botScore = 120 + Math.floor(Math.random() * 80);
                      if (activeRoom.game === 'word-scramble') botScore = 80 + Math.floor(Math.random() * 100);
                      if (activeRoom.game === 'tic-tac-toe') botScore = Math.random() > 0.5 ? 100 : 25;

                      activeRoom.status = "finished";
                      activeRoom.result = {
                        winnerId: activeRoom.hostId, // Let host win for fun
                        hostScore: activeRoom.gameState?.hostScore || 200,
                        guestScore: botScore
                      };
                      setRooms(currentRooms);
                    }
                  }, 8000);
                }
              }
            };

            pollRooms();
            const interval = setInterval(pollRooms, 1000);

            if (!this.activeIntervals[path]) {
              this.activeIntervals[path] = [];
            }
            this.activeIntervals[path].push(interval);

            return callback;
          },
          off: (event, callback) => {
            const intervals = this.activeIntervals[path];
            if (intervals) {
              intervals.forEach(interval => clearInterval(interval));
              delete this.activeIntervals[path];
            }
          }
        };
      }
    };
  }
}

// Initialize Real or Mock Firebase
try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    // Initialize real Firebase SDK compat modules
    firebaseApp = firebase.initializeApp(firebaseConfig);
    fbAuth = firebase.auth();
    fbDb = firebase.firestore();
    fbRtdb = firebase.database();
    console.log("🚀 Firebase initialized successfully.");
  } else {
    // Fire up mock services
    new MockFirebaseServices();
  }
} catch (error) {
  console.error("Firebase initialization failed. Falling back to Mock services:", error);
  new MockFirebaseServices();
}
