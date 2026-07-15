/* ============================================
   RotaGame — Authentication Management
   ============================================ */

class AuthManager {
  constructor() {
    this.userProfile = null;
    this.authMode = 'signin';
    this.initAuthStateListener();
    this.initEventListeners();
  }

  initAuthStateListener() {
    fbAuth.onAuthStateChanged(async (user) => {
      console.log("Auth state updated:", user);
      if (user) {
        // Fetch or create user record in Firestore
        await this.syncUserProfile(user);
      } else {
        this.userProfile = null;
        this.updateUserNavbar(false);
        app.navigateTo('login');
      }
    });
  }

  initEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      // Google Login button click
      const loginBtn = document.getElementById('btn-login');
      if (loginBtn) {
        loginBtn.addEventListener('click', () => this.signIn());
      }

      // Logout button click
      const logoutBtn = document.getElementById('btn-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.signOut());
      }

      // Club selection form submit
      const clubForm = document.getElementById('form-club-select');
      if (clubForm) {
        clubForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.submitClubSelection();
        });
      }

      // Toggle Auth Mode (Sign In vs Sign Up)
      const toggleBtn = document.getElementById('toggle-auth-mode');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleAuthMode();
        });
      }

      // Email/Password login form submit
      const loginForm = document.getElementById('form-login');
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleEmailAuth();
        });
      }
    });
  }

  toggleAuthMode() {
    const isSignIn = this.authMode === 'signin';
    this.authMode = isSignIn ? 'signup' : 'signin';
    
    const nameGroup = document.getElementById('login-name-group');
    const nameInput = document.getElementById('login-name');
    const btnText = document.getElementById('email-btn-text');
    const toggleText = document.getElementById('toggle-auth-text');
    const toggleMode = document.getElementById('toggle-auth-mode');
    
    if (this.authMode === 'signup') {
      if (nameGroup) nameGroup.style.display = 'block';
      if (nameInput) nameInput.required = true;
      if (btnText) btnText.textContent = "Register & Play";
      if (toggleText) toggleText.textContent = "Already have an account?";
      if (toggleMode) toggleMode.textContent = "Sign In";
    } else {
      if (nameGroup) nameGroup.style.display = 'none';
      if (nameInput) {
        nameInput.required = false;
        nameInput.value = '';
      }
      if (btnText) btnText.textContent = "Sign In with Email";
      if (toggleText) toggleText.textContent = "Don't have an account?";
      if (toggleMode) toggleMode.textContent = "Sign Up";
    }
  }

  async handleEmailAuth() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const name = document.getElementById('login-name').value.trim();
    
    const submitBtn = document.getElementById('btn-email-submit');
    if (submitBtn) submitBtn.disabled = true;
    
    try {
      if (this.authMode === 'signup') {
        const userCredential = await fbAuth.createUserWithEmailAndPassword(email, password);
        if (name && userCredential.user) {
          if (typeof userCredential.user.updateProfile === 'function') {
            await userCredential.user.updateProfile({ displayName: name });
          } else {
            userCredential.user.displayName = name;
          }
        }
        app.showToast("Account Created", "Welcome! Let's select your club.", "success");
      } else {
        await fbAuth.signInWithEmailAndPassword(email, password);
        app.showToast("Signed In", "Welcome back to RotaGame!", "success");
      }
    } catch (error) {
      console.error("Email auth error:", error);
      app.showToast("Authentication Failed", error.message, "error");
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  // --- Auth Actions ---
  async signIn() {
    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) loginBtn.disabled = true;

    try {
      if (isFirebaseMocked) {
        // Uses Mock Popup Prompts
        await fbAuth.signInWithPopup();
      } else {
        // Real Google Sign In popup
        const provider = new firebase.auth.GoogleAuthProvider();
        await fbAuth.signInWithPopup(provider);
      }
      app.showToast("Success", "Welcome to District Gaming Zone!", "success");
    } catch (error) {
      console.error("Sign-in error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        app.showToast(
          "Domain Unauthorized", 
          `Please add '${window.location.hostname}' to your 'Authorized Domains' in the Firebase Console (Authentication -> Settings).`, 
          "error"
        );
      } else {
        app.showToast("Sign-in Failed", error.message, "error");
      }
      if (loginBtn) loginBtn.disabled = false;
    }
  }

  async signOut() {
    try {
      if (this.presenceRef) {
        await this.presenceRef.remove();
        this.presenceRef = null;
      }
      if (this.invitationListener && this.invitationRef) {
        this.invitationRef.off('child_added', this.invitationListener);
      }
      await fbAuth.signOut();
      app.showToast("Logged Out", "Goodbye!", "info");
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  }

  checkAuthState() {
    if (!fbAuth.currentUser) {
      app.navigateTo('login');
      app.showToast("Authentication Required", "Please sign in to play.", "warning");
      return false;
    }
    return true;
  }

  // --- Profile Sync & Setup ---
  async syncUserProfile(user) {
    document.getElementById('loading-status').innerText = "Loading player profile...";
    
    try {
      const userRef = fbDb.collection('users').doc(user.uid);
      const doc = await userRef.get();

      if (doc.exists) {
        this.userProfile = doc.data();
        
        // If club is not select, prompt for club selection
        if (!this.userProfile.club) {
          this.populateClubSelection();
          app.navigateTo('club-select');
        } else {
          this.updateUserNavbar(true);
          this.startPresenceTracking();
          app.navigateTo('dashboard');
        }
      } else {
        // New user registration
        const newProfile = {
          uid: user.uid,
          displayName: user.displayName || "Rotaractor",
          email: user.email,
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
          club: "",
          clubName: "",
          totalPoints: 0,
          gamesPlayed: 0,
          joinedAt: isFirebaseMocked ? Date.now() : firebase.firestore.FieldValue.serverTimestamp(),
          isAdmin: false
        };
        
        await userRef.set(newProfile);
        this.userProfile = newProfile;
        
        this.populateClubSelection();
        app.navigateTo('club-select');
      }
    } catch (error) {
      console.error("Sync user profile error:", error);
      app.showToast("Profile Sync Error", error.message, "error");
    }
  }

  // --- Populate Clubs ---
  async populateClubSelection() {
    const select = document.getElementById('club-selection');
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>Select a club...</option>';

    try {
      let snapshot = await fbDb.collection('clubs').get();
      
      // Auto-seed default clubs if database is completely empty
      if (snapshot.empty) {
        console.log("Seeding default Rotaract 3191 clubs to database...");
        const defaultClubs = [
          { name: 'Rotaract Club of Bangalore JP Nagar', shortName: 'JP Nagar', city: 'Bangalore', memberCount: 0, totalPoints: 0 },
          { name: 'Rotaract Club of Bangalore East', shortName: 'Bangalore East', city: 'Bangalore', memberCount: 0, totalPoints: 0 },
          { name: 'Rotaract Club of RV Dental College', shortName: 'RV Dental', city: 'Bangalore', memberCount: 0, totalPoints: 0 },
          { name: 'Rotaract Club of KLE Law College', shortName: 'KLE Law', city: 'Bangalore', memberCount: 0, totalPoints: 0 }
        ];

        for (const club of defaultClubs) {
          await fbDb.collection('clubs').add({
            ...club,
            createdAt: isFirebaseMocked ? Date.now() : firebase.firestore.FieldValue.serverTimestamp()
          });
        }

        // Re-fetch now that database has entries
        snapshot = await fbDb.collection('clubs').get();
      }

      snapshot.forEach(doc => {
        const club = doc.data();
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = `${club.name} (${club.city})`;
        select.appendChild(option);
      });
    } catch (error) {
      console.error("Load clubs error:", error);
    }
  }

  async submitClubSelection() {
    const select = document.getElementById('club-selection');
    if (!select || !select.value) return;

    const clubId = select.value;
    const clubText = select.options[select.selectedIndex].text.split(' (')[0];
    
    try {
      const user = fbAuth.currentUser;
      if (!user) return;

      const roleSelect = document.getElementById('role-selection');
      const role = roleSelect ? roleSelect.value : "Club Member";

      const userRef = fbDb.collection('users').doc(user.uid);
      await userRef.update({
        club: clubId,
        clubName: clubText,
        role: role
      });

      // Update club member count in background
      const clubRef = fbDb.collection('clubs').doc(clubId);
      const clubDoc = await clubRef.get();
      if (clubDoc.exists) {
        const count = (clubDoc.data().memberCount || 0) + 1;
        await clubRef.update({ memberCount: count });
      }

      this.userProfile.club = clubId;
      this.userProfile.clubName = clubText;
      this.userProfile.role = role;

      app.showToast("Club Affiliation Set", `You are now representing ${clubText}!`, "success");
      this.updateUserNavbar(true);
      this.startPresenceTracking();
      app.navigateTo('dashboard');
    } catch (error) {
      console.error("Update club error:", error);
      app.showToast("Error updating club", error.message, "error");
    }
  }

  // --- Navbar State Updates ---
  updateUserNavbar(loggedIn = false) {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    // The navbar itself should always be visible
    navbar.style.display = 'flex';

    const userPoints = navbar.querySelector('.user-points');
    const userAvatar = document.getElementById('nav-user-avatar');
    
    if (!loggedIn || !this.userProfile) {
      // Hide points and avatar if not logged in
      if (userPoints) userPoints.style.display = 'none';
      if (userAvatar) userAvatar.style.display = 'none';
      
      // Show login button in navbar if not already created
      let signInBtn = document.getElementById('nav-signin-btn');
      if (!signInBtn) {
        signInBtn = document.createElement('button');
        signInBtn.id = 'nav-signin-btn';
        signInBtn.className = 'btn btn-primary btn-sm';
        signInBtn.innerHTML = '<i data-lucide="log-in" style="width:12px;height:12px;"></i> Sign In';
        signInBtn.onclick = () => app.navigateTo('login');
        navbar.querySelector('.navbar-user').appendChild(signInBtn);
        lucide.createIcons();
      } else {
        signInBtn.style.display = 'flex';
      }
      
      // Hide admin link
      const navAdmin = document.getElementById('nav-admin');
      if (navAdmin) navAdmin.style.display = 'none';
      
      return;
    }

    // If logged in:
    if (userPoints) userPoints.style.display = 'flex';
    if (userAvatar) userAvatar.style.display = 'flex';
    
    const signInBtn = document.getElementById('nav-signin-btn');
    if (signInBtn) signInBtn.style.display = 'none';

    // Update Score
    const navScore = document.getElementById('nav-user-score');
    if (navScore) {
      navScore.textContent = `${this.userProfile.totalPoints || 0} pts`;
    }

    // Update Avatar (Letter based)
    const navAvatar = document.getElementById('nav-user-avatar');
    if (navAvatar) {
      const initial = this.userProfile.displayName ? this.userProfile.displayName.charAt(0).toUpperCase() : 'R';
      navAvatar.textContent = initial;
    }

    // Toggle Admin Panel Tab visibility
    const navAdmin = document.getElementById('nav-admin');
    if (navAdmin) {
      navAdmin.style.display = this.userProfile.isAdmin ? 'flex' : 'none';
    }
  }

  // --- Real-time Presence & Challenge Invite Tracking ---
  startPresenceTracking() {
    const user = fbAuth.currentUser;
    if (!user || !this.userProfile) return;

    this.presenceRef = fbRtdb.ref(`onlinePlayers/${user.uid}`);
    
    this.presenceRef.set({
      uid: user.uid,
      name: this.userProfile.displayName || user.displayName || "Rotaractor",
      clubName: this.userProfile.clubName || "District Player",
      photoURL: this.userProfile.photoURL || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      status: "idle", // idle, lobby, playing
      lastActive: Date.now()
    });

    this.presenceRef.onDisconnect().remove();

    // Listen for invitations sent to us
    this.invitationRef = fbRtdb.ref(`invitations/${user.uid}`);
    // Clear any stale invitations on login
    this.invitationRef.remove();

    this.invitationListener = this.invitationRef.on('child_added', (snapshot) => {
      const invite = snapshot.val();
      if (!invite) return;

      this.showChallengeReceived(snapshot.key, invite);
    });
  }

  updatePresenceStatus(status) {
    if (this.presenceRef) {
      this.presenceRef.update({ status: status, lastActive: Date.now() });
    }
  }

  showChallengeReceived(inviteId, invite) {
    const overlay = document.getElementById('challenge-overlay');
    const text = document.getElementById('challenge-text');
    const acceptBtn = document.getElementById('btn-accept-challenge');
    const declineBtn = document.getElementById('btn-decline-challenge');

    if (!overlay || !text || !acceptBtn || !declineBtn) return;

    const gameName = invite.gameId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    text.innerHTML = `<strong>${invite.fromName}</strong> has challenged you to a match of <strong>${gameName}</strong>!`;
    overlay.style.display = 'flex';

    app.showToast("Match Challenge", `${invite.fromName} sent you a challenge!`, "info");

    acceptBtn.onclick = async () => {
      overlay.style.display = 'none';
      
      this.updatePresenceStatus('lobby');
      this.invitationRef.child(inviteId).remove();

      app.navigateTo('lobby', { gameId: invite.gameId });

      await lobby.joinRoomDirectly(invite.roomCode);
    };

    declineBtn.onclick = () => {
      overlay.style.display = 'none';
      this.invitationRef.child(inviteId).remove();
      fbRtdb.ref(`rooms/${invite.roomCode}/decline`).set(true);
    };
  }
}

// Global Auth Instance
const auth = new AuthManager();
