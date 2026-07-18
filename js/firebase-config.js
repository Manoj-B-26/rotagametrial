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
        { id: 'c_1', name: "AMC Engineering College", shortName: "AMC Engineering College", zone: "Zone Mirage", memberCount: 0, totalPoints: 350 },
        { id: 'c_2', name: "Atria Institute of Technology", shortName: "Atria Institute of Technology", zone: "Zone Mirage", memberCount: 6, totalPoints: 450 },
        { id: 'c_3', name: "Bangalore Advaitha", shortName: "Bangalore Advaitha", zone: "Zone Mirage", memberCount: 7, totalPoints: 550 },
        { id: 'c_4', name: "Bangalore Southwest", shortName: "Bangalore Southwest", zone: "Zone Mirage", memberCount: 8, totalPoints: 650 },
        { id: 'c_5', name: "Bengaluru Harmony", shortName: "Bengaluru Harmony", zone: "Zone Mirage", memberCount: 9, totalPoints: 750 },
        { id: 'c_6', name: "Bengaluru HSR", shortName: "Bengaluru HSR", zone: "Zone Mirage", memberCount: 10, totalPoints: 850 },
        { id: 'c_7', name: "Bengaluru South End", shortName: "Bengaluru South End", zone: "Zone Mirage", memberCount: 11, totalPoints: 950 },
        { id: 'c_8', name: "DA Pandu RV Dental College", shortName: "DA Pandu RV Dental College", zone: "Zone Mirage", memberCount: 12, totalPoints: 1050 },
        { id: 'c_9', name: "Govt. Engg. College Ramanagara", shortName: "Govt. Engg. College Ramanagara", zone: "Zone Mirage", memberCount: 13, totalPoints: 1150 },
        { id: 'c_10', name: "KLE Law College", shortName: "KLE Law College", zone: "Zone Mirage", memberCount: 14, totalPoints: 1250 },
        { id: 'c_11', name: "Koramangala", shortName: "Koramangala", zone: "Zone Mirage", memberCount: 15, totalPoints: 1350 },
        { id: 'c_12', name: "NMIT-MBA", shortName: "NMIT-MBA", zone: "Zone Mirage", memberCount: 16, totalPoints: 1450 },
        { id: 'c_13', name: "NSB Bangalore", shortName: "NSB Bangalore", zone: "Zone Mirage", memberCount: 17, totalPoints: 50 },
        { id: 'c_14', name: "Padmashree Institute of Management and Sciences", shortName: "Padmashree Institute of Management and Sciences", zone: "Zone Mirage", memberCount: 18, totalPoints: 150 },
        { id: 'c_15', name: "R. V. University", shortName: "R. V. University", zone: "Zone Mirage", memberCount: 19, totalPoints: 250 },
        { id: 'c_16', name: "Sacred Heart Degree College for Women", shortName: "Sacred Heart Degree College for Women", zone: "Zone Mirage", memberCount: 20, totalPoints: 350 },
        { id: 'c_17', name: "Seshadripuram Academy of Business Studies", shortName: "Seshadripuram Academy of Business Studies", zone: "Zone Mirage", memberCount: 21, totalPoints: 450 },
        { id: 'c_18', name: "Shantiniketan", shortName: "Shantiniketan", zone: "Zone Mirage", memberCount: 22, totalPoints: 550 },
        { id: 'c_19', name: "Shishu Mandir", shortName: "Shishu Mandir", zone: "Zone Mirage", memberCount: 23, totalPoints: 650 },
        { id: 'c_20', name: "T.S.M.T", shortName: "T.S.M.T", zone: "Zone Mirage", memberCount: 24, totalPoints: 750 },
        { id: 'c_21', name: "Bangalore Aagneya", shortName: "Bangalore Aagneya", zone: "Zone Rafale", memberCount: 25, totalPoints: 850 },
        { id: 'c_22', name: "Bangalore Institute of Technology", shortName: "Bangalore Institute of Technology", zone: "Zone Rafale", memberCount: 26, totalPoints: 950 },
        { id: 'c_23', name: "Bangalore Prime", shortName: "Bangalore Prime", zone: "Zone Rafale", memberCount: 27, totalPoints: 1050 },
        { id: 'c_24', name: "Bangalore Revolution", shortName: "Bangalore Revolution", zone: "Zone Rafale", memberCount: 28, totalPoints: 1150 },
        { id: 'c_25', name: "Bangalore Vijayanagar", shortName: "Bangalore Vijayanagar", zone: "Zone Rafale", memberCount: 29, totalPoints: 1250 },
        { id: 'c_26', name: "Bishop Cotton Womens Christian College", shortName: "Bishop Cotton Womens Christian College", zone: "Zone Rafale", memberCount: 5, totalPoints: 1350 },
        { id: 'c_27', name: "BMSCE", shortName: "BMSCE", zone: "Zone Rafale", memberCount: 6, totalPoints: 1450 },
        { id: 'c_28', name: "BSVP First Grade College", shortName: "BSVP First Grade College", zone: "Zone Rafale", memberCount: 7, totalPoints: 50 },
        { id: 'c_29', name: "Jain Evening College", shortName: "Jain Evening College", zone: "Zone Rafale", memberCount: 8, totalPoints: 150 },
        { id: 'c_30', name: "K.G.F. Coummunity", shortName: "K.G.F. Coummunity", zone: "Zone Rafale", memberCount: 9, totalPoints: 250 },
        { id: 'c_31', name: "Krupanidhi Group of Institutions", shortName: "Krupanidhi Group of Institutions", zone: "Zone Rafale", memberCount: 10, totalPoints: 350 },
        { id: 'c_32', name: "Madanapalle Institute of Technology and Sciences", shortName: "Madanapalle Institute of Technology and Sciences", zone: "Zone Rafale", memberCount: 11, totalPoints: 450 },
        { id: 'c_33', name: "Medikardia", shortName: "Medikardia", zone: "Zone Rafale", memberCount: 12, totalPoints: 550 },
        { id: 'c_34', name: "Mount Carmel College", shortName: "Mount Carmel College", zone: "Zone Rafale", memberCount: 13, totalPoints: 650 },
        { id: 'c_35', name: "Palmville", shortName: "Palmville", zone: "Zone Rafale", memberCount: 14, totalPoints: 750 },
        { id: 'c_36', name: "R V College of Architecture", shortName: "R V College of Architecture", zone: "Zone Rafale", memberCount: 15, totalPoints: 850 },
        { id: 'c_37', name: "Ramaiah College of Law", shortName: "Ramaiah College of Law", zone: "Zone Rafale", memberCount: 16, totalPoints: 950 },
        { id: 'c_38', name: "Samarpane RC College", shortName: "Samarpane RC College", zone: "Zone Rafale", memberCount: 17, totalPoints: 1050 },
        { id: 'c_39', name: "Sri Saraswathi Vidyanikethana", shortName: "Sri Saraswathi Vidyanikethana", zone: "Zone Rafale", memberCount: 18, totalPoints: 1150 },
        { id: 'c_40', name: "V.E.T First Grade College JP Nagar", shortName: "V.E.T First Grade College JP Nagar", zone: "Zone Rafale", memberCount: 19, totalPoints: 1250 },
        { id: 'c_41', name: "Banashankari", shortName: "Banashankari", zone: "Zone Sukhoi", memberCount: 20, totalPoints: 1350 },
        { id: 'c_42', name: "Bangalore East", shortName: "Bangalore East", zone: "Zone Sukhoi", memberCount: 21, totalPoints: 1450 },
        { id: 'c_43', name: "Bangalore Jayanagar", shortName: "Bangalore Jayanagar", zone: "Zone Sukhoi", memberCount: 22, totalPoints: 50 },
        { id: 'c_44', name: "Bangalore Neo Minds", shortName: "Bangalore Neo Minds", zone: "Zone Sukhoi", memberCount: 23, totalPoints: 150 },
        { id: 'c_45', name: "Bangalore Orchards", shortName: "Bangalore Orchards", zone: "Zone Sukhoi", memberCount: 24, totalPoints: 250 },
        { id: 'c_46', name: "Dayananda Sagar College of Dental Sciences", shortName: "Dayananda Sagar College of Dental Sciences", zone: "Zone Sukhoi", memberCount: 25, totalPoints: 350 },
        { id: 'c_47', name: "Ghousia College of Engineering", shortName: "Ghousia College of Engineering", zone: "Zone Sukhoi", memberCount: 26, totalPoints: 450 },
        { id: 'c_48', name: "Govt. First Grade College, Ramanagara", shortName: "Govt. First Grade College, Ramanagara", zone: "Zone Sukhoi", memberCount: 27, totalPoints: 550 },
        { id: 'c_49', name: "Indian Institute of Fashion Technology", shortName: "Indian Institute of Fashion Technology", zone: "Zone Sukhoi", memberCount: 28, totalPoints: 650 },
        { id: 'c_50', name: "Maharani Lakshmi Ammanni College", shortName: "Maharani Lakshmi Ammanni College", zone: "Zone Sukhoi", memberCount: 29, totalPoints: 750 },
        { id: 'c_51', name: "Narsee Monjee Institute of Mangement Studies, Bangalore", shortName: "Narsee Monjee Institute of Mangement Studies, Bangalore", zone: "Zone Sukhoi", memberCount: 5, totalPoints: 850 },
        { id: 'c_52', name: "PES University", shortName: "PES University", zone: "Zone Sukhoi", memberCount: 6, totalPoints: 950 },
        { id: 'c_53', name: "PES University Electronic City", shortName: "PES University Electronic City", zone: "Zone Sukhoi", memberCount: 7, totalPoints: 1050 },
        { id: 'c_54', name: "Ramnagara", shortName: "Ramnagara", zone: "Zone Sukhoi", memberCount: 8, totalPoints: 1150 },
        { id: 'c_55', name: "S.S.M.R.V. College", shortName: "S.S.M.R.V. College", zone: "Zone Sukhoi", memberCount: 9, totalPoints: 1250 },
        { id: 'c_56', name: "Seshadripuram Institute of Commerce & Management", shortName: "Seshadripuram Institute of Commerce & Management", zone: "Zone Sukhoi", memberCount: 10, totalPoints: 1350 },
        { id: 'c_57', name: "Shri Gnanambica Degree College Madanapalle", shortName: "Shri Gnanambica Degree College Madanapalle", zone: "Zone Sukhoi", memberCount: 11, totalPoints: 1450 },
        { id: 'c_58', name: "Spandana", shortName: "Spandana", zone: "Zone Sukhoi", memberCount: 12, totalPoints: 50 },
        { id: 'c_59', name: "St. Francis de Sales College", shortName: "St. Francis de Sales College", zone: "Zone Sukhoi", memberCount: 13, totalPoints: 150 },
        { id: 'c_60', name: "St. Joseph's College Of Commerce", shortName: "St. Joseph's College Of Commerce", zone: "Zone Sukhoi", memberCount: 14, totalPoints: 250 },
        { id: 'c_61', name: "A P S College of Engineering", shortName: "A P S College of Engineering", zone: "Zone Tejas", memberCount: 15, totalPoints: 350 },
        { id: 'c_62', name: "Bangalore High Grounds", shortName: "Bangalore High Grounds", zone: "Zone Tejas", memberCount: 16, totalPoints: 450 },
        { id: 'c_63', name: "Bangalore JP Nagar", shortName: "Bangalore JP Nagar", zone: "Zone Tejas", memberCount: 17, totalPoints: 550 },
        { id: 'c_64', name: "Bangalore South Parade", shortName: "Bangalore South Parade", zone: "Zone Tejas", memberCount: 18, totalPoints: 650 },
        { id: 'c_65', name: "Bengaluru Avyanna", shortName: "Bengaluru Avyanna", zone: "Zone Tejas", memberCount: 19, totalPoints: 750 },
        { id: 'c_66', name: "Bengaluru BTM", shortName: "Bengaluru BTM", zone: "Zone Tejas", memberCount: 20, totalPoints: 850 },
        { id: 'c_67', name: "Bengaluru United", shortName: "Bengaluru United", zone: "Zone Tejas", memberCount: 21, totalPoints: 950 },
        { id: 'c_68', name: "Jyoti Nivas College", shortName: "Jyoti Nivas College", zone: "Zone Tejas", memberCount: 22, totalPoints: 1050 },
        { id: 'c_69', name: "Krupanidhi College of Commerce & Management", shortName: "Krupanidhi College of Commerce & Management", zone: "Zone Tejas", memberCount: 23, totalPoints: 1150 },
        { id: 'c_70', name: "KSSEM", shortName: "KSSEM", zone: "Zone Tejas", memberCount: 24, totalPoints: 1250 },
        { id: 'c_71', name: "Marathahalli", shortName: "Marathahalli", zone: "Zone Tejas", memberCount: 25, totalPoints: 1350 },
        { id: 'c_72', name: "New Horizon College", shortName: "New Horizon College", zone: "Zone Tejas", memberCount: 26, totalPoints: 1450 },
        { id: 'c_73', name: "Prestige Falcon City", shortName: "Prestige Falcon City", zone: "Zone Tejas", memberCount: 27, totalPoints: 50 },
        { id: 'c_74', name: "R.V.C.E.", shortName: "R.V.C.E.", zone: "Zone Tejas", memberCount: 28, totalPoints: 150 },
        { id: 'c_75', name: "RNS Institute of Technology", shortName: "RNS Institute of Technology", zone: "Zone Tejas", memberCount: 29, totalPoints: 250 },
        { id: 'c_76', name: "S-Vyasa", shortName: "S-Vyasa", zone: "Zone Tejas", memberCount: 5, totalPoints: 350 },
        { id: 'c_77', name: "SEI College Tejas", shortName: "SEI College Tejas", zone: "Zone Tejas", memberCount: 6, totalPoints: 450 },
        { id: 'c_78', name: "Sri Baghwan Mahaveer Jain College", shortName: "Sri Baghwan Mahaveer Jain College", zone: "Zone Tejas", memberCount: 7, totalPoints: 550 },
        { id: 'c_79', name: "SRNGS Boys Hostel", shortName: "SRNGS Boys Hostel", zone: "Zone Tejas", memberCount: 8, totalPoints: 650 },
        { id: 'c_80', name: "SVCE Tirupati", shortName: "SVCE Tirupati", zone: "Zone Tejas", memberCount: 9, totalPoints: 750 }
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
