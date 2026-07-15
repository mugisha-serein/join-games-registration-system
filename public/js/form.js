document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registration-step1-form');
  const joinTypeCards = document.querySelectorAll('.join-type-card');
  const toastContainer = document.getElementById('toast-container');

  // Load existing data from sessionStorage if available
  const existingData = sessionStorage.getItem('registrationData');
  if (existingData) {
    try {
      const data = JSON.parse(existingData);
      document.getElementById('fullName').value = data.fullName || '';
      document.getElementById('phoneNumber').value = data.phoneNumber || '';
      document.getElementById('shortComment').value = data.shortComment || '';
      if (data.joinType) {
        const radio = document.querySelector(`input[name="joinType"][value="${data.joinType}"]`);
        if (radio) {
          radio.checked = true;
          radio.closest('.join-type-card').classList.add('selected');
        }
      }
    } catch (e) {
      console.error('Error parsing stored registration data', e);
    }
  }

  // Handle Join Type Card clicks
  joinTypeCards.forEach(card => {
    card.addEventListener('click', () => {
      joinTypeCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
      }
    });
  });

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
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const fullName = document.getElementById('fullName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const shortComment = document.getElementById('shortComment').value.trim();
    const joinTypeInput = document.querySelector('input[name="joinType"]:checked');
    const joinType = joinTypeInput ? joinTypeInput.value : '';

    let hasErrors = false;

    // Browser-side Validation
    if (!fullName) {
      showError('fullName', 'Full name is required.');
      hasErrors = true;
    } else if (fullName.length < 2) {
      showError('fullName', 'Full name must be at least 2 characters.');
      hasErrors = true;
    }

    if (!phoneNumber) {
      showError('phoneNumber', 'Phone number is required.');
      hasErrors = true;
    } else {
      // Basic phone format validation: allow digits, spaces, dashes, parentheses and optional leading plus
      const cleaned = phoneNumber.replace(/[^\d+]/g, '').replace(/\D/g, '');
      if (cleaned.length < 7) {
        showError('phoneNumber', 'Invalid phone number. Must contain at least 7 digits.');
        hasErrors = true;
      }
    }

    if (!joinType) {
      showError('joinType', 'Please select a join type.');
      hasErrors = true;
    }

    if (hasErrors) {
      showToast('Validation Failed', 'Please fix the errors before continuing.', 'danger');
      return;
    }

    // Save step 1 data to sessionStorage
    sessionStorage.setItem('registrationData', JSON.stringify({
      fullName,
      phoneNumber,
      shortComment,
      joinType
    }));

    // Navigate to step 2
    window.location.href = '/terms.html';
  });
});
