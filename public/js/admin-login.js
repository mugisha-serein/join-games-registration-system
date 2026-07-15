document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admin-login-form');
  const btnLogin = document.getElementById('btn-login');
  const toastContainer = document.getElementById('toast-container');

  // Helper: Show validation error
  function showError(fieldId, message) {
    const errorSpan = document.getElementById(`${fieldId}-error`);
    if (errorSpan) {
      errorSpan.textContent = message;
    }
    const input = document.getElementById(fieldId);
    if (input) {
      input.classList.add('is-invalid');
    }
  }

  // Helper: Clear validation errors
  function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-invalid'));
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
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    let hasErrors = false;

    if (!email) {
      showError('email', 'Email is required.');
      hasErrors = true;
    }

    if (!password) {
      showError('password', 'Password is required.');
      hasErrors = true;
    }

    if (hasErrors) return;

    // Set loading state
    btnLogin.disabled = true;
    btnLogin.classList.add('loading');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Invalid email or password');
      }

      showToast('Login Successful', 'Welcome back, Commander!', 'success');
      
      // Redirect to admin dashboard
      setTimeout(() => {
        window.location.href = '/admin/dashboard.html';
      }, 1000);

    } catch (error) {
      console.error('Admin login error:', error);
      showToast('Login Failed', error.message || 'An error occurred during login.', 'danger');
      btnLogin.disabled = false;
      btnLogin.classList.remove('loading');
    }
  });
});
