document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const connectionIndicator = document.getElementById('connection-indicator');
  const btnLogout = document.getElementById('btn-logout');
  
  const statTotal = document.getElementById('stat-total');
  const statPending = document.getElementById('stat-pending');
  const statApproved = document.getElementById('stat-approved');
  const statBanned = document.getElementById('stat-banned');
  const statRemoved = document.getElementById('stat-removed');
  const statJoinFamily = document.getElementById('stat-join-family');
  const statJoinTiktok = document.getElementById('stat-join-tiktok');

  const filterSearch = document.getElementById('filter-search');
  const filterStatus = document.getElementById('filter-status');
  const filterJoinType = document.getElementById('filter-join-type');
  const filterSort = document.getElementById('filter-sort');
  const filterOrder = document.getElementById('filter-order');

  const usersTable = document.getElementById('users-table');
  const tableBody = document.getElementById('table-body');
  
  const paginationInfo = document.getElementById('pagination-info');
  const btnPrevPage = document.getElementById('btn-prev-page');
  const btnNextPage = document.getElementById('btn-next-page');

  const detailsModal = document.getElementById('details-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const toastContainer = document.getElementById('toast-container');

  // Modal Fields
  const dId = document.getElementById('detail-id');
  const dStatus = document.getElementById('detail-status');
  const dFullName = document.getElementById('detail-fullName');
  const dPhoneNumber = document.getElementById('detail-phoneNumber');
  const dJoinType = document.getElementById('detail-joinType');
  const dCreatedAt = document.getElementById('detail-createdAt');
  const dTermsVersion = document.getElementById('detail-termsVersion');
  const dTermsAcceptedAt = document.getElementById('detail-termsAcceptedAt');
  const dShortComment = document.getElementById('detail-shortComment');

  // Pagination & Filters State
  let currentPage = 1;
  const itemsPerPage = 20;
  let searchTimeout = null;

  // Initialize Socket.IO connection
  const socket = io();

  // Socket connection lifecycle
  socket.on('connect', () => {
    // Authenticate socket using admin session
    socket.emit('join-admin', {}, (res) => {
      if (res && res.success) {
        setConnectionState(true);
        showToast('Socket Connected', 'Real-time synchronization active', 'info');
      } else {
        setConnectionState(false);
        showToast('Unauthorized Socket', 'Unauthorized dashboard access. Redirecting...', 'danger');
        setTimeout(() => { window.location.href = '/admin/login.html'; }, 2000);
      }
    });
  });

  socket.on('disconnect', () => {
    setConnectionState(false);
  });

  socket.on('connect_error', () => {
    setConnectionState(false);
  });

  // Real-time Socket.IO Listeners
  socket.on('new-user-joined', (data) => {
    showToast('New Registration', `${data.user.full_name} has registered!`, 'warning');
    loadStats();
    loadUsers();
  });

  socket.on('user-approved', (data) => {
    showToast('User Approved', `Registration ID ${data.userId} has been approved`, 'success');
    loadUsers();
  });

  socket.on('user-banned', (data) => {
    showToast('User Banned', `User ID ${data.userId} has been banned`, 'danger');
    loadUsers();
  });

  socket.on('user-removed', (data) => {
    showToast('User Removed', `User ID ${data.userId} was soft-deleted`, 'danger');
    loadUsers();
  });

  socket.on('user-restored', (data) => {
    showToast('User Restored', `User ID ${data.userId} was restored to pending`, 'info');
    loadUsers();
  });

  socket.on('stats-updated', (data) => {
    updateStatsUI(data.stats);
  });

  // Helper: Change connection indicator UI
  function setConnectionState(isConnected) {
    if (isConnected) {
      connectionIndicator.className = 'connection-status connected';
      connectionIndicator.querySelector('.status-text').textContent = 'Live Connected';
    } else {
      connectionIndicator.className = 'connection-status disconnected';
      connectionIndicator.querySelector('.status-text').textContent = 'Disconnected';
    }
  }

  // Helper: Show toast notification
  function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-message">${escapeHtml(message)}</div>
      </div>
      <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
    `;
    
    toastContainer.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Load User Stats from API
  async function loadStats() {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.status === 401) {
        window.location.href = '/admin/login.html';
        return;
      }
      const result = await response.json();
      if (result.success) {
        updateStatsUI(result.data);
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  }

  function updateStatsUI(stats) {
    if (!stats) return;
    statTotal.textContent = stats.total || 0;
    statPending.textContent = stats.pending || 0;
    statApproved.textContent = stats.approved || 0;
    statBanned.textContent = stats.banned || 0;
    statRemoved.textContent = stats.removed || 0;
    statJoinFamily.textContent = stats.ninja_region_family_count || 0;
    statJoinTiktok.textContent = stats.tiktok_game_count || 0;
  }

  // Load User list with filters & pagination
  async function loadUsers() {
    showTableLoading();
    
    const search = filterSearch.value.trim();
    const status = filterStatus.value;
    const joinType = filterJoinType.value;
    const sort = filterSort.value;
    const order = filterOrder.value;

    const url = `/api/admin/users?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(search)}&status=${status}&joinType=${joinType}&sort=${sort}&order=${order}`;

    try {
      const response = await fetch(url);
      if (response.status === 401) {
        window.location.href = '/admin/login.html';
        return;
      }
      const result = await response.json();
      
      if (result.success) {
        renderUserTable(result.data);
        renderPagination(result.pagination);
      } else {
        showTableError(result.message || 'Failed to query records');
      }
    } catch (err) {
      console.error('Error loading users:', err);
      showTableError('Server connection lost. Please try again.');
    }
  }

  // Table loading state UI
  function showTableLoading() {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="table-loading-state">
          <div class="loading-state-icon"><i class="fa-solid fa-circle-notch"></i></div>
          <p>Fetching matching registry entries...</p>
        </td>
      </tr>
    `;
  }

  // Table error state UI
  function showTableError(message) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="table-empty-state">
          <div class="empty-state-icon" style="color: var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <p>${escapeHtml(message)}</p>
        </td>
      </tr>
    `;
  }

  // Render User rows into table
  function renderUserTable(users) {
    if (!users || users.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="table-empty-state">
            <div class="empty-state-icon"><i class="fa-solid fa-folder-open"></i></div>
            <p>No matching ninja records found</p>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = '';
    
    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.id = `user-row-${user.id}`;
      
      const badgeClass = `badge ${user.status}`;
      const statusLabel = user.status.charAt(0).toUpperCase() + user.status.slice(1);
      const regDate = new Date(user.created_at).toLocaleDateString();

      // Moderation command logic check rules
      const canApprove = user.status === 'pending' || user.status === 'banned';
      const canBan = user.status !== 'removed';
      const canRemove = user.status !== 'removed';
      const canRestore = user.status === 'removed';

      tr.innerHTML = `
        <td>${user.id}</td>
        <td class="user-name-cell">${escapeHtml(user.full_name)}</td>
        <td class="phone-cell">${escapeHtml(user.phone_number)}</td>
        <td class="comment-cell" title="${escapeHtml(user.short_comment || '')}">${escapeHtml(user.short_comment || '-')}</td>
        <td>${user.join_type === 'ninja_region_family' ? 'Family Region' : 'TikTok Game'}</td>
        <td style="text-align: center;">${user.terms_accepted ? '<i class="fa-solid fa-circle-check" style="color: var(--success);"></i>' : '<i class="fa-solid fa-circle-xmark" style="color: var(--danger);"></i>'}</td>
        <td><span class="${badgeClass}">${statusLabel}</span></td>
        <td>${regDate}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon approve" title="Approve Member" data-id="${user.id}" ${canApprove ? '' : 'disabled'}>
              <i class="fa-solid fa-circle-check"></i>
            </button>
            <button class="btn-icon ban" title="Ban Account" data-id="${user.id}" ${canBan ? '' : 'disabled'}>
              <i class="fa-solid fa-ban"></i>
            </button>
            <button class="btn-icon remove" title="Remove Profile" data-id="${user.id}" ${canRemove ? '' : 'disabled'}>
              <i class="fa-solid fa-trash-can"></i>
            </button>
            <button class="btn-icon restore" title="Restore Member" data-id="${user.id}" ${canRestore ? '' : 'disabled'}>
              <i class="fa-solid fa-trash-arrow-up"></i>
            </button>
            <button class="btn-icon view" title="View Details" data-id="${user.id}">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Attach actions event listeners
    attachTableActionListeners();
  }

  // Handle command buttons clicks inside table
  function attachTableActionListeners() {
    // Approve Action
    tableBody.querySelectorAll('.btn-icon.approve').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        btn.disabled = true;
        try {
          const response = await fetch(`/api/admin/users/${id}/approve`, { method: 'PATCH' });
          const res = await response.json();
          if (!response.ok) throw new Error(res.message);
        } catch (err) {
          showToast('Approval Error', err.message, 'danger');
          btn.disabled = false;
        }
      });
    });

    // Ban Action with confirmation
    tableBody.querySelectorAll('.btn-icon.ban').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const row = document.getElementById(`user-row-${id}`);
        const name = row ? row.querySelector('.user-name-cell').textContent : 'this user';
        
        if (!confirm(`Are you absolutely sure you want to BAN ${name}? Banned users cannot re-register.`)) {
          return;
        }

        btn.disabled = true;
        try {
          const response = await fetch(`/api/admin/users/${id}/ban`, { method: 'PATCH' });
          const res = await response.json();
          if (!response.ok) throw new Error(res.message);
        } catch (err) {
          showToast('Ban Error', err.message, 'danger');
          btn.disabled = false;
        }
      });
    });

    // Remove (Soft-delete) Action with confirmation
    tableBody.querySelectorAll('.btn-icon.remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const row = document.getElementById(`user-row-${id}`);
        const name = row ? row.querySelector('.user-name-cell').textContent : 'this user';

        if (!confirm(`Are you sure you want to remove ${name}? You can restore them later.`)) {
          return;
        }

        btn.disabled = true;
        try {
          const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
          const res = await response.json();
          if (!response.ok) throw new Error(res.message);
        } catch (err) {
          showToast('Remove Error', err.message, 'danger');
          btn.disabled = false;
        }
      });
    });

    // Restore Action
    tableBody.querySelectorAll('.btn-icon.restore').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        btn.disabled = true;
        try {
          const response = await fetch(`/api/admin/users/${id}/restore`, { method: 'PATCH' });
          const res = await response.json();
          if (!response.ok) throw new Error(res.message);
        } catch (err) {
          showToast('Restore Error', err.message, 'danger');
          btn.disabled = false;
        }
      });
    });

    // View Details Modal Action
    tableBody.querySelectorAll('.btn-icon.view').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openDetailsModal(id);
      });
    });
  }

  // Render Pagination Info and set state
  function renderPagination(pagination) {
    if (!pagination) return;
    const { page, limit, total, totalPages } = pagination;
    
    paginationInfo.textContent = total > 0
      ? `Showing page ${page} of ${totalPages} (${total} total records)`
      : `Showing 0 of 0 records`;

    btnPrevPage.disabled = page <= 1;
    btnNextPage.disabled = page >= totalPages || totalPages === 0;
  }

  // Open Details Modal and fetch item from REST API
  async function openDetailsModal(id) {
    try {
      const response = await fetch(`/api/admin/users/${id}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      const user = result.data;
      dId.textContent = user.id;
      dStatus.className = `badge ${user.status}`;
      dStatus.textContent = user.status;
      dFullName.textContent = user.full_name;
      dPhoneNumber.textContent = user.phone_number;
      dJoinType.textContent = user.join_type === 'ninja_region_family' ? 'Family Ninja Region' : 'TikTok Game';
      dCreatedAt.textContent = new Date(user.created_at).toLocaleString();
      dTermsVersion.textContent = user.terms_version;
      dTermsAcceptedAt.textContent = new Date(user.terms_accepted_at).toLocaleString();
      dShortComment.textContent = user.short_comment || 'No comment provided.';

      detailsModal.classList.add('show');
    } catch (err) {
      showToast('Fetch Error', 'Failed to retrieve detailed profile: ' + err.message, 'danger');
    }
  }

  // Close Details Modal
  btnCloseModal.addEventListener('click', () => {
    detailsModal.classList.remove('show');
  });

  detailsModal.addEventListener('click', (e) => {
    if (e.target === detailsModal) {
      detailsModal.classList.remove('show');
    }
  });

  // Filters Event Listeners (Debounced Search)
  filterSearch.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 1;
      loadUsers();
    }, 400);
  });

  [filterStatus, filterJoinType, filterSort, filterOrder].forEach(select => {
    select.addEventListener('change', () => {
      currentPage = 1;
      loadUsers();
    });
  });

  // Pagination Clicks
  btnPrevPage.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadUsers();
    }
  });

  btnNextPage.addEventListener('click', () => {
    currentPage++;
    loadUsers();
  });

  // Handle Logout action
  btnLogout.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to log out?')) return;
    
    try {
      const response = await fetch('/api/admin/logout', { method: 'POST' });
      if (response.ok) {
        showToast('Logged Out', 'Session terminated successfully', 'success');
        setTimeout(() => { window.location.href = '/admin/login.html'; }, 1000);
      } else {
        throw new Error('Logout failed');
      }
    } catch (err) {
      showToast('Logout Error', 'Could not terminate session gracefully', 'danger');
    }
  });

  // Startup operations load initial data
  loadStats();
  loadUsers();
});
