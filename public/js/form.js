document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registration-step1-form');
  const joinTypeCards = document.querySelectorAll('.join-type-card');
  const toastContainer = document.getElementById('toast-container');
  const storageKey = 'registrationData';
  const storageMaxAge = 30 * 60 * 1000;

  function readStoredRegistration() {
    const raw = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
    if (!raw) return null;

    try {
      const stored = JSON.parse(raw);
      if (stored.savedAt && Date.now() - stored.savedAt > storageMaxAge) {
        localStorage.removeItem(storageKey);
        sessionStorage.removeItem(storageKey);
        return null;
      }
      return stored;
    } catch (error) {
      console.error('Error parsing stored registration data', error);
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(storageKey);
      return null;
    }
  }

  const existingData = readStoredRegistration();
  if (existingData) {
    document.getElementById('fullName').value = existingData.fullName || '';
    document.getElementById('phoneNumber').value = existingData.phoneNumber || '';
    document.getElementById('shortComment').value = existingData.shortComment || '';

    if (existingData.joinType) {
      const radio = document.querySelector(
        `input[name="joinType"][value="${existingData.joinType}"]`
      );
      if (radio) {
        radio.checked = true;
        radio.closest('.join-type-card')?.classList.add('selected');
      }
    }
  }

  joinTypeCards.forEach((card) => {
    const radio = card.querySelector('input[type="radio"]');

    function selectCard() {
      joinTypeCards.forEach((item) => item.classList.remove('selected'));
      card.classList.add('selected');
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
      clearFieldError('joinType');
    }

    card.addEventListener('click', selectCard);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectCard();
      }
    });
  });

  function showError(fieldId, message) {
    const errorSpan = document.getElementById(`${fieldId}-error`);
    if (errorSpan) errorSpan.textContent = message;

    const input = document.getElementById(fieldId);
    if (input) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', `${fieldId}-error`);
    }
  }

  function clearFieldError(fieldId) {
    const errorSpan = document.getElementById(`${fieldId}-error`);
    if (errorSpan) errorSpan.textContent = '';

    const input = document.getElementById(fieldId);
    if (input) {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
    }
  }

  function clearErrors() {
    document.querySelectorAll('.error-msg').forEach((element) => {
      element.textContent = '';
    });
    document.querySelectorAll('.form-control').forEach((element) => {
      element.classList.remove('is-invalid');
      element.removeAttribute('aria-invalid');
    });
  }

  ['fullName', 'phoneNumber', 'shortComment'].forEach((fieldId) => {
    document.getElementById(fieldId)?.addEventListener('input', () => {
      clearFieldError(fieldId);
    });
  });

  function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-message">${escapeHtml(message)}</div>
      </div>
      <button type="button" class="toast-close" aria-label="Close notification">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    `;

    toastContainer.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 4000);
  }

  function escapeHtml(value) {
    return String(value).replace(
      /[&<>'"]/g,
      (tag) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[tag]
    );
  }

  function focusFirstError(firstErrorId) {
    const field = document.getElementById(firstErrorId);
    const target = field || document.querySelector('.join-type-group');
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => field?.focus({ preventScroll: true }), 250);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();

    const fullName = document.getElementById('fullName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const shortComment = document.getElementById('shortComment').value.trim();
    const joinTypeInput = document.querySelector('input[name="joinType"]:checked');
    const joinType = joinTypeInput ? joinTypeInput.value : '';
    let firstErrorId = null;

    if (!fullName) {
      showError('fullName', 'Full name is required.');
      firstErrorId = firstErrorId || 'fullName';
    } else if (fullName.length < 2) {
      showError('fullName', 'Full name must be at least 2 characters.');
      firstErrorId = firstErrorId || 'fullName';
    }

    if (!phoneNumber) {
      showError('phoneNumber', 'Phone number is required.');
      firstErrorId = firstErrorId || 'phoneNumber';
    } else {
      const digits = phoneNumber.replace(/\D/g, '');
      if (digits.length < 7) {
        showError('phoneNumber', 'Phone number must contain at least 7 digits.');
        firstErrorId = firstErrorId || 'phoneNumber';
      }
    }

    if (!joinType) {
      showError('joinType', 'Please select a join type.');
      firstErrorId = firstErrorId || 'joinType';
    }

    if (firstErrorId) {
      showToast('Validation Failed', 'Please correct the highlighted field.', 'danger');
      focusFirstError(firstErrorId);
      return;
    }

    const registrationData = {
      fullName,
      phoneNumber,
      shortComment,
      joinType,
      savedAt: Date.now()
    };

    localStorage.setItem(storageKey, JSON.stringify(registrationData));
    sessionStorage.setItem(storageKey, JSON.stringify(registrationData));
    window.location.href = '/terms.html';
  });
});
