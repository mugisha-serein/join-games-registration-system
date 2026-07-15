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

  // Retrieve Step 1 data
  const rawData = sessionStorage.getItem('registrationData');
  if (!rawData) {
    showToast('Session Expired', 'No registration details found. Redirecting to Step 1...', 'warning');
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 2000);
    return;
  }

  let registrationData = {};
  try {
    registrationData = JSON.parse(rawData);
  } catch (e) {
    showToast('Session Error', 'Corrupted registration details. Redirecting to Step 1...', 'danger');
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 2000);
    return;
  }

  // Handle choice selectors visual highlights
  agreeRadio.addEventListener('change', () => {
    agreeLabel.classList.add('selected-agree');
    disagreeLabel.classList.remove('selected-disagree');
    disagreeAlert.classList.remove('show');
    btnSubmit.disabled = false;
  });

  disagreeRadio.addEventListener('change', () => {
    disagreeLabel.classList.add('selected-disagree');
    agreeLabel.classList.remove('selected-agree');
    disagreeAlert.classList.add('show');
    btnSubmit.disabled = true;
  });

  // Handle back button (preserves data automatically since we don't clear sessionStorage yet)
  btnBack.addEventListener('click', () => {
    window.location.href = '/index.html';
  });

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

    if (!agreeRadio.checked) {
      showToast('Action Required', 'You must agree to the terms to proceed.', 'warning');
      return;
    }

    // Set loading state
    btnSubmit.disabled = true;
    btnSubmit.classList.add('loading');

    const payload = {
      fullName: registrationData.fullName,
      phoneNumber: registrationData.phoneNumber,
      shortComment: registrationData.shortComment,
      joinType: registrationData.joinType,
      termsAccepted: true,
      termsVersion: '1.0' // Match backend schema requirements
    };

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit registration');
      }

      // Successful registration
      sessionStorage.removeItem('registrationData');
      window.location.href = '/success.html';
    } catch (error) {
      console.error('Registration submission error:', error);
      showToast('Registration Error', error.message || 'An error occurred during submission.', 'danger');
      btnSubmit.disabled = false;
      btnSubmit.classList.remove('loading');
    }
  });
});
