/* ============================================
   RotaGame — Authentication Management
   ============================================ */

class AuthManager {
  constructor() {
    this.userProfile = null;
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
      // Login button click
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

      // Profile View: Change Club button click
      const changeClubBtn = document.getElementById('btn-change-club');
      if (changeClubBtn) {
        changeClubBtn.addEventListener('click', () => {
          this.populateClubSelection();
          app.navigateTo('club-select');
        });
      }
    });
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
      app.showToast("Success", "Welcome to RotaGame District 3191!", "success");
    } catch (error) {
      console.error("Sign-in error:", error);
      app.showToast("Sign-in Failed", error.message, "error");
      if (loginBtn) loginBtn.disabled = false;
    }
  }

  async signOut() {
    try {
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

      if (doc.exists()) {
        this.userProfile = doc.data();
        
        // If club is not select, prompt for club selection
        if (!this.userProfile.club) {
          this.populateClubSelection();
          app.navigateTo('club-select');
        } else {
          this.updateUserNavbar(true);
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

      const userRef = fbDb.collection('users').doc(user.uid);
      await userRef.update({
        club: clubId,
        clubName: clubText
      });

      // Update club member count in background
      const clubRef = fbDb.collection('clubs').doc(clubId);
      const clubDoc = await clubRef.get();
      if (clubDoc.exists()) {
        const count = (clubDoc.data().memberCount || 0) + 1;
        await clubRef.update({ memberCount: count });
      }

      this.userProfile.club = clubId;
      this.userProfile.clubName = clubText;

      app.showToast("Club Affiliation Set", `You are now representing ${clubText}!`, "success");
      this.updateUserNavbar(true);
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

    if (!loggedIn || !this.userProfile) {
      navbar.style.display = 'none';
      return;
    }

    navbar.style.display = 'flex';
    
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
}

// Global Auth Instance
const auth = new AuthManager();
