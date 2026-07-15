document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registration-step2-form');
  const btnBack = document.getElementById('btn-back');
  const btnSubmit = document.getElementById('btn-submit');
  const agreeRadio = document.getElementById('agree');
  const disagreeRadio = document.getElementById('disagree');
  const agreeLabel = document.getElementById('label-agree');
  const disagreeLabel = document.getElementById('label-disagree');
  const disagreeAlert = document.getElementById('disagree-alert');
  const toastContainer = document.getElementById('toast-container');
  const storageKey = 'registrationData';
  const storageMaxAge = 30 * 60 * 1000;

  function getStoredRegistration() {
    const raw = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
    if (!raw) return null;

    try {
      const data = JSON.parse(raw);
      if (data.savedAt && Date.now() - data.savedAt > storageMaxAge) {
        localStorage.removeItem(storageKey);
        sessionStorage.removeItem(storageKey);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Invalid stored registration data', error);
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(storageKey);
      return null;
    }
  }

  const registrationData = getStoredRegistration();
  if (!registrationData) {
    showToast('Session Expired', 'Please enter your registration details again.', 'warning');
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 1500);
    return;
  }

  function updateAgreementState(value) {
    const agrees = value === 'agree';

    agreeRadio.checked = agrees;
    disagreeRadio.checked = !agrees;
    agreeLabel.classList.toggle('selected-agree', agrees);
    disagreeLabel.classList.toggle('selected-disagree', !agrees);
    disagreeAlert.hidden = agrees;
    disagreeAlert.classList.toggle('show', !agrees);
    btnSubmit.disabled = !agrees;
  }

  agreeRadio.addEventListener('change', () => updateAgreementState('agree'));
  disagreeRadio.addEventListener('change', () => updateAgreementState('disagree'));

  agreeLabel.addEventListener('click', () => updateAgreementState('agree'));
  disagreeLabel.addEventListener('click', () => updateAgreementState('disagree'));

  btnBack.addEventListener('click', () => {
    window.location.href = '/index.html';
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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!agreeRadio.checked) {
      showToast('Action Required', 'You must agree to the terms before submitting.', 'warning');
      agreeLabel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.classList.add('loading');
    btnSubmit.setAttribute('aria-busy', 'true');

    const payload = {
      fullName: registrationData.fullName,
      phoneNumber: registrationData.phoneNumber,
      shortComment: registrationData.shortComment,
      joinType: registrationData.joinType,
      termsAccepted: true,
      termsVersion: '1.0'
    };

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many attempts from this network. Please wait 15 minutes and try again.');
        }
        throw new Error(result.message || 'Failed to submit registration. Please try again.');
      }

      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(storageKey);
      window.location.href = '/success.html';
    } catch (error) {
      console.error('Registration submission error:', error);
      showToast('Registration Error', error.message || 'An error occurred during submission.', 'danger');
      btnSubmit.disabled = false;
      btnSubmit.classList.remove('loading');
      btnSubmit.removeAttribute('aria-busy');
      btnSubmit.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});
