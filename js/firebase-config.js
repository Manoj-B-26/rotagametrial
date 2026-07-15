/* ========================================================
   District Gaming Zone — Firebase Config & Initialization
   ======================================================== */

// Read credentials from window.firebaseConfigEnv (js/env.js) or fallback to template placeholders
const firebaseConfig = {
  apiKey: window.firebaseConfigEnv?.apiKey || "YOUR_API_KEY",
  authDomain: window.firebaseConfigEnv?.authDomain || "YOUR_AUTH_DOMAIN",
  projectId: window.firebaseConfigEnv?.projectId || "YOUR_PROJECT_ID",
  storageBucket: window.firebaseConfigEnv?.storageBucket || "YOUR_STORAGE_BUCKET",
  messagingSenderId: window.firebaseConfigEnv?.messagingSenderId || "YOUR_MESSAGING_SENDER_ID",
  appId: window.firebaseConfigEnv?.appId || "YOUR_APP_ID",
  measurementId: window.firebaseConfigEnv?.measurementId || "YOUR_MEASUREMENT_ID"
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
      createUserWithEmailAndPassword: (email, password) => {
        return new Promise((resolve, reject) => {
          const accounts = JSON.parse(localStorage.getItem('rotagame_mock_email_accounts') || '{}');
          if (accounts[email]) {
            reject(new Error("Email already in use."));
            return;
          }
          const mockUid = `mock_user_${Date.now()}`;
          const mockUser = {
            uid: mockUid,
            displayName: "Rotaractor",
            email: email,
            photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${mockUid}`
          };
          accounts[email] = {
            uid: mockUid,
            email: email,
            password: password,
            displayName: "Rotaractor",
            photoURL: mockUser.photoURL
          };
          localStorage.setItem('rotagame_mock_email_accounts', JSON.stringify(accounts));
          
          this.currentUser = mockUser;
          sessionStorage.setItem('rotagame_mock_session', JSON.stringify(mockUser));
          fbAuth.currentUser = mockUser;

          this.authListeners.forEach(listener => listener(mockUser));
          
          const credential = {
            user: {
              ...mockUser,
              updateProfile: (profileData) => {
                return new Promise((res) => {
                  mockUser.displayName = profileData.displayName || mockUser.displayName;
                  if (profileData.photoURL) mockUser.photoURL = profileData.photoURL;
                  
                  // Update mock account storage
                  const accs = JSON.parse(localStorage.getItem('rotagame_mock_email_accounts') || '{}');
                  if (accs[email]) {
                    accs[email].displayName = mockUser.displayName;
                    accs[email].photoURL = mockUser.photoURL;
                    localStorage.setItem('rotagame_mock_email_accounts', JSON.stringify(accs));
                  }
                  
                  // Update current user
                  this.currentUser = mockUser;
                  sessionStorage.setItem('rotagame_mock_session', JSON.stringify(mockUser));
                  fbAuth.currentUser = mockUser;
                  this.authListeners.forEach(listener => listener(mockUser));
                  res();
                });
              }
            }
          };
          resolve(credential);
        });
      },
      signInWithEmailAndPassword: (email, password) => {
        return new Promise((resolve, reject) => {
          const accounts = JSON.parse(localStorage.getItem('rotagame_mock_email_accounts') || '{}');
          const acc = accounts[email];
          if (!acc) {
            reject(new Error("No user found with this email."));
            return;
          }
          if (acc.password !== password) {
            reject(new Error("Incorrect password."));
            return;
          }
          const mockUser = {
            uid: acc.uid,
            displayName: acc.displayName || "Rotaractor",
            email: acc.email,
            photoURL: acc.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${acc.uid}`
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
                empty: docs.length === 0,
                size: docs.length,
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
                empty: docs.length === 0,
                size: docs.length,
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
  // --- Mock Realtime Database (generic store supporting paths like rooms, onlinePlayers, invitations) ---
  setupMockRealtimeDB() {
    if (!localStorage.getItem('rotagame_mock_rtdb')) {
      localStorage.setItem('rotagame_mock_rtdb', JSON.stringify({
        rooms: {},
        onlinePlayers: {},
        invitations: {}
      }));
    }

    const getDb = () => JSON.parse(localStorage.getItem('rotagame_mock_rtdb')) || {};
    const setDb = (db) => localStorage.setItem('rotagame_mock_rtdb', JSON.stringify(db));

    const getValueByPath = (db, path) => {
      const parts = path.split('/').filter(p => p);
      let curr = db;
      for (const part of parts) {
        if (!curr || typeof curr !== 'object') return null;
        curr = curr[part];
      }
      return curr;
    };

    const setValueByPath = (db, path, val) => {
      const parts = path.split('/').filter(p => p);
      let curr = db;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!curr[part] || typeof curr[part] !== 'object') {
          curr[part] = {};
        }
        curr = curr[part];
      }
      if (parts.length > 0) {
        curr[parts[parts.length - 1]] = val;
      }
    };

    const removeValueByPath = (db, path) => {
      const parts = path.split('/').filter(p => p);
      let curr = db;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!curr[part]) return;
        curr = curr[part];
      }
      if (parts.length > 0) {
        delete curr[parts[parts.length - 1]];
      }
    };

    fbRtdb = {
      ref: (path) => {
        return {
          get: () => {
            return new Promise((resolve) => {
              const db = getDb();
              const val = getValueByPath(db, path);
              resolve({
                val: () => val,
                exists: () => val !== undefined && val !== null
              });
            });
          },
          set: (data) => {
            return new Promise((resolve) => {
              const db = getDb();
              setValueByPath(db, path, data);
              setDb(db);
              resolve();
            });
          },
          update: (updateData) => {
            return new Promise((resolve) => {
              const db = getDb();
              const val = getValueByPath(db, path) || {};
              const merged = { ...val, ...updateData };
              setValueByPath(db, path, merged);
              setDb(db);
              resolve();
            });
          },
          remove: () => {
            return new Promise((resolve) => {
              const db = getDb();
              removeValueByPath(db, path);
              setDb(db);
              resolve();
            });
          },
          push: () => {
            const key = `push_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const childPath = `${path}/${key}`;
            return {
              key: key,
              set: (data) => fbRtdb.ref(childPath).set(data),
              remove: () => fbRtdb.ref(childPath).remove()
            };
          },
          child: (childKey) => fbRtdb.ref(`${path}/${childKey}`),
          onDisconnect: () => {
            return {
              remove: () => Promise.resolve()
            };
          },
          on: (event, callback) => {
            const poll = () => {
              const db = getDb();
              const val = getValueByPath(db, path);
              
              callback({
                val: () => val,
                exists: () => val !== undefined && val !== null,
                key: path.split('/').filter(p => p).pop()
              });

              // --- BOT OPPONENT LOGIC FOR MULTIPLAYER DEMO ---
              if (path.startsWith('rooms/')) {
                const roomCode = path.split('/')[1];
                const rooms = db.rooms || {};
                const room = rooms[roomCode];

                if (room && room.status === "waiting" && !room.guestId) {
                  setTimeout(() => {
                    const currentDb = getDb();
                    const activeRoom = currentDb.rooms?.[roomCode];
                    if (activeRoom && activeRoom.status === "waiting" && !activeRoom.guestId) {
                      activeRoom.guestId = "bot_player";
                      activeRoom.guestName = "Mock Rotaract Bot 🤖";
                      activeRoom.guestReady = true;
                      activeRoom.guestClubName = "JP Nagar";
                      activeRoom.guestClubId = "c1";
                      setDb(currentDb);
                    }
                  }, 4000);
                }

                if (room && room.status === "playing" && room.guestId === "bot_player" && !room.result) {
                  setTimeout(() => {
                    const currentDb = getDb();
                    const activeRoom = currentDb.rooms?.[roomCode];
                    if (activeRoom && activeRoom.status === "playing" && !activeRoom.result) {
                      let botScore = 150;
                      if (activeRoom.game === 'quiz') botScore = 120 + Math.floor(Math.random() * 80);
                      if (activeRoom.game === 'word-scramble') botScore = 80 + Math.floor(Math.random() * 100);
                      if (activeRoom.game === 'tic-tac-toe') botScore = Math.random() > 0.5 ? 100 : 25;

                      activeRoom.status = "finished";
                      activeRoom.result = {
                        winnerId: activeRoom.hostId,
                        hostScore: activeRoom.gameState?.hostScore || 200,
                        guestScore: botScore
                      };
                      setDb(currentDb);
                    }
                  }, 8000);
                }
              }

              // --- ONLINE PLAYERS SIMULATION FOR DEMO ---
              if (path === 'onlinePlayers') {
                const onlinePlayers = db.onlinePlayers || {};
                const botUids = ['bot_1', 'bot_2'];
                const botNames = ['Abhishek Gowda', 'Sindhu Sharma'];
                const botClubs = ['RV Dental College', 'KLE Law College'];

                let updated = false;
                botUids.forEach((uid, index) => {
                  if (!onlinePlayers[uid]) {
                    onlinePlayers[uid] = {
                      uid: uid,
                      name: botNames[index],
                      clubName: botClubs[index],
                      status: 'idle',
                      lastActive: Date.now()
                    };
                    updated = true;
                  }
                });

                if (updated) {
                  db.onlinePlayers = onlinePlayers;
                  setDb(db);
                }
              }

              // --- CHALLENGE / INVITATION ACCEPT SIMULATION FOR DEMO ---
              if (path.startsWith('invitations/')) {
                const inviteeUid = path.split('/')[1];
                const invites = getValueByPath(db, path);
                if (invites && inviteeUid.startsWith('bot_')) {
                  const inviteList = Object.values(invites);
                  if (inviteList.length > 0) {
                    const firstInvite = inviteList[0];
                    setTimeout(() => {
                      const curDb = getDb();
                      const activeRoom = curDb.rooms?.[firstInvite.roomCode];
                      if (activeRoom && !activeRoom.guestId) {
                        activeRoom.guestId = inviteeUid;
                        activeRoom.guestName = inviteeUid === 'bot_1' ? 'Abhishek Gowda' : 'Sindhu Sharma';
                        activeRoom.guestClubName = inviteeUid === 'bot_1' ? 'RV Dental College' : 'KLE Law College';
                        activeRoom.guestReady = true;
                        setDb(curDb);
                      }
                      fbRtdb.ref(path).remove();
                    }, 3000);
                  }
                }
              }
            };

            poll();
            const interval = setInterval(poll, 1000);

            if (!this.activeIntervals[path]) {
              this.activeIntervals[path] = [];
            }
            this.activeIntervals[path].push(interval);

            return {
              off: () => clearInterval(interval)
            };
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
