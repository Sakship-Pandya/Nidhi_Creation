/* ══════════════════════════════
   NIDHI CREATION — login.js
   ══════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const form       = document.getElementById('loginForm');
  const submitBtn  = document.getElementById('submitBtn');
  const btnText    = submitBtn.querySelector('.btn-text');
  const formNote   = document.getElementById('formNote');

  const fields = {
    name:     { el: document.getElementById('name'),     err: document.getElementById('nameError') },
    phone:    { el: document.getElementById('phone'),    err: document.getElementById('phoneError') },
    business: { el: document.getElementById('business'), err: document.getElementById('businessError') },
  };

  /* ── Validation rules ── */
  function validate() {
    let valid = true;

    // Name — at least 2 chars
    const name = fields.name.el.value.trim();
    if (!name || name.length < 2) {
      setError('name', 'Please enter your full name.');
      valid = false;
    } else {
      clearError('name');
    }

    // Phone — 10 digits (Indian number)
    const phone = fields.phone.el.value.replace(/\s+/g, '');
    if (!/^\+?[6-9]\d{9}$/.test(phone)) {
      setError('phone', 'Enter a valid 10-digit mobile number.');
      valid = false;
    } else {
      clearError('phone');
    }

    // Business name — at least 2 chars
    const business = fields.business.el.value.trim();
    if (!business || business.length < 2) {
      setError('business', 'Please enter your business name.');
      valid = false;
    } else {
      clearError('business');
    }

    return valid;
  }

  function setError(field, msg) {
    fields[field].el.classList.add('invalid');
    fields[field].err.textContent = msg;
  }

  function clearError(field) {
    fields[field].el.classList.remove('invalid');
    fields[field].err.textContent = '';
  }

  /* ── Clear error on input ── */
  Object.keys(fields).forEach(key => {
    fields[key].el.addEventListener('input', () => clearError(key));
  });

  /* ── Form submit ── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formNote.textContent = '';
    formNote.className = 'form-note';

    if (!validate()) return;

    submitBtn.disabled = true;
    btnText.textContent = 'Please wait…';

    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)),
      });

      if (res.ok) {
        formNote.textContent = 'Logged in! Redirecting…';
        formNote.classList.add('success');
        // Redirect to homepage after short delay
        setTimeout(() => { window.location.href = '/home'; }, 800);
      } else if (res.status === 401) {
        formNote.textContent = 'Details not recognised. Please try again.';
        submitBtn.disabled = false;
        btnText.textContent = 'Continue';
      } else {
        throw new Error('Server error');
      }
    } catch {
      formNote.textContent = 'Something went wrong. Please try again.';
      submitBtn.disabled = false;
      btnText.textContent = 'Continue';
    }
  });

});