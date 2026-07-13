/* ============================================
   RotaGame — Admin Panel Engine
   ============================================ */

class AdminManager {
  constructor() {
    this.currentSection = 'dashboard'; // 'dashboard', 'clubs', 'players'
    this.clubs = [];
    this.players = [];

    this.initEventListeners();
  }

  initEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      // Sidebar Navigation
      const sidebar = document.querySelector('.admin-sidebar');
      if (sidebar) {
        sidebar.addEventListener('click', (e) => {
          const btn = e.target.closest('.admin-sidebar-btn');
          if (!btn) return;

          sidebar.querySelectorAll('.admin-sidebar-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const section = btn.dataset.section;
          this.switchSection(section);
        });
      }

      // Modal Form Submission
      const form = document.getElementById('admin-club-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.submitClubForm();
        });
      }
    });
  }

  initView() {
    // Access control verification
    if (!auth.userProfile || !auth.userProfile.isAdmin) {
      app.navigateTo('dashboard');
      app.showToast("Unauthorized", "You do not have permission to view the Admin panel.", "error");
      return;
    }

    this.switchSection(this.currentSection);
  }

  switchSection(section) {
    this.currentSection = section;
    const contentArea = document.getElementById('admin-main-content');
    if (!contentArea) return;

    contentArea.innerHTML = '<div class="loading-screen"><div class="spinner"></div></div>';

    if (section === 'dashboard') {
      this.renderDashboard(contentArea);
    } else if (section === 'clubs') {
      this.renderClubsManager(contentArea);
    } else if (section === 'players') {
      this.renderPlayersManager(contentArea);
    }
  }

  // --- 1. Dashboard View ---
  async renderDashboard(container) {
    try {
      const usersSnapshot = await fbDb.collection('users').get();
      const clubsSnapshot = await fbDb.collection('clubs').get();
      const scoresSnapshot = await fbDb.collection('scores').get();

      const totalPlayers = usersSnapshot.size;
      const totalClubs = clubsSnapshot.size;
      const totalScores = scoresSnapshot.size;

      // Find most active club (highest aggregate points)
      let activeClub = "None";
      let maxPoints = -1;
      clubsSnapshot.forEach(doc => {
        const c = doc.data();
        if (c.totalPoints > maxPoints) {
          maxPoints = c.totalPoints;
          activeClub = c.name;
        }
      });

      container.innerHTML = `
        <h2>Admin Dashboard</h2>
        <p style="color:var(--text-muted);">Key engagement statistics for Rotaract District 3191.</p>

        <div class="admin-stats-grid">
          <div class="admin-stat-card">
            <span class="admin-stat-label">Total Players</span>
            <span class="admin-stat-value">${totalPlayers}</span>
          </div>
          <div class="admin-stat-card">
            <span class="admin-stat-label">Registered Clubs</span>
            <span class="admin-stat-value">${totalClubs}</span>
          </div>
          <div class="admin-stat-card">
            <span class="admin-stat-label">Submissions</span>
            <span class="admin-stat-value">${totalScores}</span>
          </div>
          <div class="admin-stat-card">
            <span class="admin-stat-label">Most Active Club</span>
            <span class="admin-stat-value" style="font-size:var(--text-lg); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:2px;">${activeClub.replace("Rotaract Club of ", "")}</span>
          </div>
        </div>

        <div class="card" style="margin-top: var(--space-4);">
          <h3>Platform Overview</h3>
          <p style="font-size: var(--text-sm); line-height: 1.6; margin-top: var(--space-2);">
            Welcome back, admin. You can manage the list of available Rotaract Clubs in the <strong>Clubs</strong> section. Any modifications will instantly update the registration dropdown and club leaderboard calculations.
          </p>
        </div>
      `;

    } catch (error) {
      console.error("Dashboard render error:", error);
      container.innerHTML = `<div class="text-center" style="color:var(--error);">Failed to load dashboard metrics.</div>`;
    }
  }

  // --- 2. Clubs CRUD Management ---
  async renderClubsManager(container) {
    try {
      const snapshot = await fbDb.collection('clubs').get();
      this.clubs = [];
      snapshot.forEach(doc => {
        this.clubs.push({ id: doc.id, ...doc.data() });
      });

      // Sort alphabetically
      this.clubs.sort((a, b) => a.name.localeCompare(b.name));

      container.innerHTML = `
        <div class="admin-toolbar">
          <div>
            <h2>Clubs Directory</h2>
            <p style="color:var(--text-muted); font-size:var(--text-sm);">Create, edit, or delete District 3191 clubs.</p>
          </div>
          <button class="btn btn-primary" onclick="admin.openClubModal()"><i data-lucide="plus-circle"></i> Add Club</button>
        </div>

        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Club Name</th>
                <th>Short Name</th>
                <th>City / Region</th>
                <th>Members</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.clubs.map(c => `
                <tr>
                  <td><strong>${c.name}</strong></td>
                  <td>${c.shortName}</td>
                  <td>${c.city}</td>
                  <td>${c.memberCount || 0}</td>
                  <td class="admin-table-actions">
                    <button class="btn btn-secondary btn-sm" onclick="admin.openClubModal('${c.id}')"><i data-lucide="edit" style="width:14px;height:14px;"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="admin.deleteClub('${c.id}')"><i data-lucide="trash" style="width:14px;height:14px;"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      lucide.createIcons();

    } catch (error) {
      console.error("Clubs manager error:", error);
      container.innerHTML = `<div class="text-center" style="color:var(--error);">Failed to load clubs registry.</div>`;
    }
  }

  openClubModal(id = '') {
    const modal = document.getElementById('admin-club-modal');
    const title = document.getElementById('admin-club-modal-title');
    const form = document.getElementById('admin-club-form');

    // Reset inputs
    document.getElementById('admin-club-id').value = id;
    document.getElementById('admin-club-name').value = '';
    document.getElementById('admin-club-short').value = '';
    document.getElementById('admin-club-city').value = '';

    if (id) {
      title.textContent = "Edit Club";
      const club = this.clubs.find(c => c.id === id);
      if (club) {
        document.getElementById('admin-club-name').value = club.name;
        document.getElementById('admin-club-short').value = club.shortName;
        document.getElementById('admin-club-city').value = club.city;
      }
    } else {
      title.textContent = "Add New Club";
    }

    modal.classList.add('active');
  }

  closeClubModal() {
    document.getElementById('admin-club-modal').classList.remove('active');
  }

  async submitClubForm() {
    const id = document.getElementById('admin-club-id').value;
    const name = document.getElementById('admin-club-name').value.trim();
    const shortName = document.getElementById('admin-club-short').value.trim();
    const city = document.getElementById('admin-club-city').value.trim();

    try {
      if (id) {
        // Edit update
        await fbDb.collection('clubs').doc(id).update({
          name,
          shortName,
          city
        });
        app.showToast("Updated", "Club details saved.", "success");
      } else {
        // Create new
        await fbDb.collection('clubs').add({
          name,
          shortName,
          city,
          memberCount: 0,
          totalPoints: 0,
          createdAt: isFirebaseMocked ? Date.now() : firebase.firestore.FieldValue.serverTimestamp()
        });
        app.showToast("Created", "New club added to district index.", "success");
      }
      this.closeClubModal();
      this.switchSection('clubs');
    } catch (error) {
      console.error("Submit club error:", error);
      app.showToast("Submit Error", error.message, "error");
    }
  }

  async deleteClub(id) {
    const club = this.clubs.find(c => c.id === id);
    if (!club) return;

    const confirmDel = confirm(`Are you sure you want to remove the "${club.name}" from the district roster?`);
    if (!confirmDel) return;

    try {
      await fbDb.collection('clubs').doc(id).delete();
      app.showToast("Deleted", "Club removed from district registry.", "info");
      this.switchSection('clubs');
    } catch (error) {
      console.error("Delete club error:", error);
      app.showToast("Delete Error", error.message, "error");
    }
  }

  // --- 3. Players Role Manager ---
  async renderPlayersManager(container) {
    try {
      const snapshot = await fbDb.collection('users').get();
      this.players = [];
      snapshot.forEach(doc => {
        this.players.push(doc.data());
      });

      this.players.sort((a, b) => a.displayName.localeCompare(b.displayName));

      container.innerHTML = `
        <h2>Players Directory</h2>
        <p style="color:var(--text-muted); font-size:var(--text-sm); margin-bottom: var(--space-4);">Manage user access roles across District 3191.</p>

        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Email</th>
                <th>Club Representing</th>
                <th>District Role</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.players.map(p => `
                <tr>
                  <td><strong>${p.displayName}</strong></td>
                  <td>${p.email}</td>
                  <td>${p.clubName || "None"}</td>
                  <td>
                    ${p.isAdmin ? '<span class="badge badge-cranberry">Admin 👑</span>' : '<span class="badge badge-gold">Player</span>'}
                  </td>
                  <td class="admin-table-actions">
                    <button class="btn btn-secondary btn-sm" style="font-size:11px;" onclick="admin.toggleUserAdmin('${p.uid}', ${p.isAdmin})">
                      ${p.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

    } catch (error) {
      console.error("Players manager error:", error);
      container.innerHTML = `<div class="text-center" style="color:var(--error);">Failed to load players roster.</div>`;
    }
  }

  async toggleUserAdmin(uid, isCurrentlyAdmin) {
    const nextRole = !isCurrentlyAdmin;
    const msg = nextRole ? "Promote this player to District Admin?" : "Revoke Admin access from this player?";
    
    const confirmRole = confirm(msg);
    if (!confirmRole) return;

    try {
      await fbDb.collection('users').doc(uid).update({ isAdmin: nextRole });
      app.showToast("Role Updated", "Player authority settings updated.", "success");
      this.switchSection('players');
    } catch (error) {
      console.error("Toggle admin role error:", error);
      app.showToast("Update Error", error.message, "error");
    }
  }
}

// Global Admin Instance
const admin = new AdminManager();
